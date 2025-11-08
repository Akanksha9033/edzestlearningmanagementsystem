
// import React from "react";
// import ImageBlock from "../Blocks/ImageBlock";
// import QuizBlock from "../Blocks/QuizBlock";           // ✅ Admin quiz editor
// import QuizBlockStudent from "../Blocks/QuizBlockStudent"; // ✅ Student quiz player
// import TextBlock from "../Blocks/TextBlock";           // ✅ NEW — Rich Text Block

// export default function BlockRenderer({ block, onChange, isStudent = false }) {
//   switch (block.type) {
//     /* 📝 TEXT BLOCK (Enhanced with Rich Text Editor) */
//     case "text":
//       return (
//         <TextBlock block={block} onChange={onChange} />
//       );

//     /* 🖼️ IMAGE BLOCK (Upload + URL + Resize Supported) */
//     case "image":
//       return <ImageBlock block={block} onChange={onChange} />;

//     /* 📊 TABLE BLOCK */
//     // case "table":
//     //   return (
//     //     <textarea
//     //       className="w-full border p-2 my-2 rounded"
//     //       placeholder="Enter table as CSV (comma-separated rows)"
//     //       value={block.content || ""}
//     //       onChange={(e) => onChange({ ...block, content: e.target.value })}
//     //     />
//     //   );

//     /* ❓ QUIZ BLOCK */
//     case "quiz":
//       // ✅ If student is viewing, render interactive quiz view
//       if (isStudent) {
//         return <QuizBlockStudent block={block} />;
//       }

//       // ✅ Admin editor version
//       return <QuizBlock block={block} onChange={onChange} />;
      


//     /* ⚠️ UNKNOWN BLOCK TYPE */
//     default:
//       return (
//         <div className="text-red-500">
//           ⚠️ Unknown block type: {block.type || "undefined"}
//         </div>
//       );
//   }
// }






// import React from "react";
// import ImageBlock from "../Blocks/ImageBlock";
// import QuizBlock from "../Blocks/QuizBlock";
// import QuizBlockStudent from "../Blocks/QuizBlockStudent";
// import TextBlock from "../Blocks/TextBlock";
// import DividerBlock from "../Blocks/DividerBlock"; // ← create this file (below)

// export default function BlockRenderer({ block, onChange, isStudent = false }) {
//   // ✅ read type from both places
//   const type = String(block?.type || block?.data?.type || "").toLowerCase();

//   switch (type) {
//     case "text":
//       return <TextBlock block={block} onChange={onChange} />;

//     case "image":
//       return <ImageBlock block={block} onChange={onChange} />;

//     case "quiz":
//       return isStudent ? (
//         <QuizBlockStudent block={block} />
//       ) : (
//         <QuizBlock block={block} onChange={onChange} />
//       );

//     // ✅ Divider variants
//     case "divider":
//     case "page-divider":
//     case "hr":
//       return <DividerBlock />;

//     default:
//       return (
//         <div className="text-gray-500 italic border rounded px-3 py-2">
//           Unknown block type: {type || "undefined"}
//         </div>
//       );
//   }
// }


// src/components/BlockRenderer.jsx
import React from "react";

// ✅ All imports expect default exports from each file
import ImageBlock from "../Blocks/ImageBlock";
import QuizBlock from "../Blocks/QuizBlock";
import QuizBlockStudent from "../Blocks/QuizBlockStudent";
import TextBlock from "../Blocks/TextBlock";
import DividerBlock from "../Blocks/DividerBlock";
import TableBlock from "../Blocks/TableBlock";
import InfoBoxBlock from "../Blocks/InfoBoxBlock"; // ✅ NEW

export default function BlockRenderer({ block, onChange, isStudent = false }) {
  // Guard against null/undefined blocks to avoid runtime crashes
  if (!block) {
    return (
      <div className="text-gray-500 italic border rounded px-3 py-2">
        Empty block
      </div>
    );
  }

  // ✅ read type from both places, normalize to lowercase string
  const type = String(block?.type || block?.data?.type || "").toLowerCase();

  switch (type) {
    case "text":
      return <TextBlock block={block} onChange={onChange} />;

    case "image":
      return <ImageBlock block={block} onChange={onChange} />;

    case "quiz":
      return isStudent ? (
        <QuizBlockStudent block={block} />
      ) : (
        <QuizBlock block={block} onChange={onChange} />
      );

    case "table":
      return (
        <TableBlock block={block} onChange={onChange} isStudent={isStudent} />
      );

    case "infobox": // ✅ NEW: Info Box
      // Admin editing happens inside InfoBoxBlock; student display is handled in ChapterViewer.
      return (
        <InfoBoxBlock
          block={block}
          onChange={onChange}
          isStudent={isStudent}
        />
      );

    // ✅ Divider variants
    case "divider":
    case "page-divider":
    case "hr":
      return <DividerBlock />;

    default:
      return (
        <div className="text-gray-500 italic border rounded px-3 py-2">
          Unknown block type: {type || "undefined"}
        </div>
      );
  }
}
