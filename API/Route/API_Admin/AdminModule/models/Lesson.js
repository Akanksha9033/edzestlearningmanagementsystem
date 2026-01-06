// backend/models/Lesson.js (DynamoDB only)
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// --- Env + IAM safe
const REGION = process.env.AWS_REGION || "ap-south-1";

// ⭐ FIX: REMOVE accessKeyId/secretAccessKey (Lambda auto-provides them)
const client = new DynamoDBClient({
  region: REGION,
  // No credentials → Lambda IAM Role will sign requests automatically
});

const ddb = DynamoDBDocumentClient.from(client);

// --- Table + key attribute names
const TABLE = process.env.DDD_TABLE || process.env.DDB_TABLE || "edzest_lms";
const PK = process.env.DDB_PK_ATTR || "pk";
const SK = process.env.DDB_SK_ATTR || "sk";

const ALLOWED_TYPES = new Set([
  "video",
  "pdf",
  "doc",
  "ppt",
  "audio",
  "slides",
  "assignment",
  "scorm/tincan",
  "article",
  "live",
  "external link",
  "quiz",
]);
const normalizeType = (t) => {
  const v = String(t || "").toLowerCase();

  if (v.includes("quiz")) return "quiz"; // ← FORCE QUIZ
  return ALLOWED_TYPES.has(v) ? v : "video";
};

class Lesson {
  static async create(obj = {}) {
    const _id = obj._id || uuidv4();
    const courseId = String(obj.courseId || "");
    const sectionId = String(obj.sectionId || "");
    if (!courseId) throw new Error("courseId required");
    if (!sectionId) throw new Error("sectionId required");
    if (!obj.title) throw new Error("title required");

    const type = normalizeType(obj.type);

    // Skip validation for quiz lessons
    if (type === "quiz") {
      // quiz save allowed without video or file
    } else if (
      type === "video" &&
      !(obj.videoKey || obj.videoUrl || obj.fileUrl)
    ) {
      throw new Error(
        "Video lessons must have a videoKey, videoUrl, or fileUrl."
      );
    }

    const now = new Date().toISOString();
    const item = {
      [PK]: `COURSE#${courseId}`,
      [SK]: `LESSON#${_id}`,
      entity: "lesson",

      _id,
      courseId,
      sectionId,
      title: String(obj.title).trim(),
      type,

      // ⭐ FOR QUIZ
      questions: obj.questions || [],
      explanation: obj.explanation || "",
       parentVideoId: obj.parentVideoId || null, // ✅ ADD THIS LINE
      // ⭐ For other lessons
      videoKey: obj.videoKey || "",
      fileKey: obj.fileKey || "",
      fileUrl: obj.fileUrl || "",
      videoUrl: obj.videoUrl || "",

      duration: Number(obj.duration) || 0,
      isFree: !!obj.isFree,
      status: obj.status || "published",
      mockTestId: obj.mockTestId || null,

      createdAt: obj.createdAt || now,
      updatedAt: now,
    };

    console.log("[Lesson#create] put", {
      TABLE,
      PK,
      SK,
      _id: item._id,
      pk: item[PK],
      sk: item[SK],
      type: item.type,
    });
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  }

  static async findById(id) {
    if (!id) return null;
    console.log("[Lesson#findById] start", { id, TABLE, PK, SK });

    // helper: scan pages until match
    async function scanUntilMatch(params, predicate) {
      let LastEvaluatedKey;
      do {
        const out = await ddb.send(
          new ScanCommand({
            ...params,
            ExclusiveStartKey: LastEvaluatedKey,
            ConsistentRead: true,
          })
        );
        const items = out.Items || [];
        const hit = items.find(predicate);
        if (hit) return hit;
        LastEvaluatedKey = out.LastEvaluatedKey;
      } while (LastEvaluatedKey);
      return null;
    }

    // 1) try by `_id`
    try {
      const byId = await scanUntilMatch(
        {
          TableName: TABLE,
          FilterExpression: "#e = :e AND attribute_exists(#id)",
          ExpressionAttributeNames: { "#e": "entity", "#id": "_id" },
          ExpressionAttributeValues: { ":e": "lesson" },
        },
        (x) => String(x._id) === String(id)
      );
      if (byId) {
        console.log("[Lesson#findById] found via _id");
        return byId;
      }
    } catch (e1) {
      console.warn("[Lesson#findById] scan by _id failed", e1?.message);
    }

    // 2) fallback by sk/SK
    try {
      const bySk = await scanUntilMatch(
        {
          TableName: TABLE,
          FilterExpression:
            "#e = :e AND (attribute_exists(#sk) OR attribute_exists(#SK))",
          ExpressionAttributeNames: {
            "#e": "entity",
            "#sk": "sk",
            "#SK": "SK",
          },
          ExpressionAttributeValues: { ":e": "lesson" },
        },
        (x) => String(x.sk || x.SK) === `LESSON#${id}`
      );
      if (bySk) {
        console.log("[Lesson#findById] found via sk/SK");
        return bySk;
      }
    } catch (e2) {
      console.warn("[Lesson#findById] scan by sk/SK failed", e2?.message);
    }

    console.log("[Lesson#findById] not found", { id });
    return null;
  }

  static async find(query = {}) {
    if (query.courseId) {
      try {
        console.log("[Lesson#find] query by partition", {
          TABLE,
          PK,
          SK,
          courseId: query.courseId,
          sectionId: query.sectionId,
        });
        const out = await ddb.send(
          new QueryCommand({
            TableName: TABLE,
            KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :ls)",
            ExpressionAttributeNames: { "#pk": PK, "#sk": SK },
            ExpressionAttributeValues: {
              ":pk": `COURSE#${query.courseId}`,
              ":ls": "LESSON#",
            },
          })
        );
        let items = out.Items || [];
        if (query.sectionId) {
          const sid = String(query.sectionId);
          items = items.filter((x) => String(x.sectionId) === sid);
        }
        items.lean = () => items;
        console.log("[Lesson#find] query result", { count: items.length });
        return items;
      } catch (e) {
        console.warn(
          "[Lesson#find] partition query failed; scanning fallback",
          e?.message
        );
        const out = await ddb.send(
          new ScanCommand({
            TableName: TABLE,
            FilterExpression: "#e = :e AND #cid = :cid",
            ExpressionAttributeNames: { "#e": "entity", "#cid": "courseId" },
            ExpressionAttributeValues: {
              ":e": "lesson",
              ":cid": String(query.courseId),
            },
          })
        );
        let items = out.Items || [];
        if (query.sectionId) {
          const sid = String(query.sectionId);
          items = items.filter((x) => String(x.sectionId) === sid);
        }
        items.lean = () => items;
        console.log("[Lesson#find] scan fallback result", {
          count: items.length,
        });
        return items;
      }
    }

    const out = await ddb.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "#e = :e",
        ExpressionAttributeNames: { "#e": "entity" },
        ExpressionAttributeValues: { ":e": "lesson" },
      })
    );
    const items = out.Items || [];
    items.lean = () => items;
    console.log("[Lesson#find] scan all lessons", { count: items.length });
    return items;
  }

  static async findByIdAndUpdate(id, update = {}) {
    const found = await this.findById(id);
    if (!found) return null;

    const toSet = update.$set || update || {};
    if (toSet.type) toSet.type = normalizeType(toSet.type);
    toSet.updatedAt = new Date().toISOString();

    const names = {};
    const values = {};
    const sets = [];
    let i = 0;
    for (const [k, v] of Object.entries(toSet)) {
      names[`#k${i}`] = k;
      values[`:v${i}`] = v;
      sets.push(`#k${i} = :v${i}`);
      i++;
    }
    if (!sets.length) return found;

    console.log("[Lesson#findByIdAndUpdate] update", {
      id,
      keys: Object.keys(toSet),
    });
    const out = await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { [PK]: found[PK], [SK]: found[SK] },
        UpdateExpression: "SET " + sets.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return out.Attributes || null;
  }

  static async findByIdAndDelete(id) {
    const found = await this.findById(id);
    if (!found) return null;
    console.log("[Lesson#findByIdAndDelete] delete", {
      id,
      pk: found[PK],
      sk: found[SK],
    });
    const out = await ddb.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { [PK]: found[PK], [SK]: found[SK] },
        ReturnValues: "ALL_OLD",
      })
    );
    return out.Attributes || null;
  }

  static async distinct(field, query = {}) {
    const docs = await this.find(query);
    const set = new Set(
      docs
        .map((d) => d[field])
        .filter(Boolean)
        .map(String)
    );
    return Array.from(set);
  }
}

module.exports = Lesson;
