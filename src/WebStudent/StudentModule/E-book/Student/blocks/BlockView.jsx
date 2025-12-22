// import React from "react";
// import QuizBlock from "./QuizBlock";

// export default function BlockView({ block }) {
//   switch (block.type) {
//     case "text":
//       return (
//         <div className="prose max-w-none">
//           {(block.content || "").split("\n").map((p, i) => (
//             <p key={i}>{p}</p>
//           ))}
//         </div>
//       );

//     case "image":
//       return (
//         <div className="border rounded p-3 bg-white">
//           {block.url ? (
//             <img src={block.url} alt="" className="max-w-full rounded" />
//           ) : (
//             <div className="text-gray-500 italic">No image URL</div>
//           )}
//           {block.caption && (
//             <div className="text-sm text-gray-600 mt-2">{block.caption}</div>
//           )}
//         </div>
//       );

//     case "table": {
//       // Expect CSV lines in block.content e.g. "A,B,C\n1,2,3"
//       const rows = (block.content || "").split("\n").map(r => r.split(",").map(c => c.trim()));
//       if (!rows.length) return <div className="text-gray-500 italic">Empty table</div>;
//       return (
//         <div className="overflow-auto">
//           <table className="min-w-[480px] border">
//             <tbody>
//               {rows.map((r, i) => (
//                 <tr key={i} className="odd:bg-gray-50">
//                   {r.map((c, j) => (
//                     <td key={j} className="border px-3 py-1">{c}</td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       );
//     }

//     case "chart":
//       // Placeholder for now (later: plug Recharts/Chart.js)
//       return (
//         <div className="border rounded p-3 bg-white">
//           <div className="text-sm text-gray-500 mb-2">Chart (preview)</div>
//           <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
//             {JSON.stringify({ chartType: block.chartType, data: block.data }, null, 2)}
//           </pre>
//         </div>
//       );

//     case "quiz":
//       return <QuizBlock block={block} />;

//     default:
//       return <div className="text-red-500">Unknown block type: {block.type}</div>;
//   }
// }



// import React from "react";
// import QuizBlock from "./QuizBlock";

// export default function BlockView({ block }) {
//   switch (block.type) {
//     /* 📝 TEXT BLOCK (Rich text from ReactQuill) */
//     case "text":
//       return (
//         <div
//           className="prose max-w-none bg-white p-3 rounded shadow-sm leading-relaxed"
//           style={{
//             textAlign: block.align || "left",
//             lineHeight: "1.7",
//           }}
//           dangerouslySetInnerHTML={{ __html: block.content || "" }}
//         />
//       );

//     /* 🖼️ IMAGE BLOCK */
//     case "image":
//       return (
//         <div className="border rounded p-3 bg-white">
//           {block.url ? (
//             <img
//               src={block.url}
//               alt=""
//               className="max-w-full rounded mx-auto"
//               style={{
//                 width: `${block.width || 100}%`,
//                 display: "block",
//                 objectFit: "contain",
//               }}
//             />
//           ) : (
//             <div className="text-gray-500 italic">No image URL</div>
//           )}
//           {block.caption && (
//             <div className="text-sm text-gray-600 mt-2 text-center">
//               {block.caption}
//             </div>
//           )}
//         </div>
//       );

//     /* 📊 TABLE BLOCK */
//     // case "table": {
//     //   const rows = (block.content || "")
//     //     .split("\n")
//     //     .map((r) => r.split(",").map((c) => c.trim()));
//     //   if (!rows.length)
//     //     return <div className="text-gray-500 italic">Empty table</div>;
//     //   return (
//     //     <div className="overflow-auto">
//     //       <table className="min-w-[480px] border">
//     //         <tbody>
//     //           {rows.map((r, i) => (
//     //             <tr key={i} className="odd:bg-gray-50">
//     //               {r.map((c, j) => (
//     //                 <td key={j} className="border px-3 py-1">
//     //                   {c}
//     //                 </td>
//     //               ))}
//     //             </tr>
//     //           ))}
//     //         </tbody>
//     //       </table>
//     //     </div>
//     //   );
//     // }

//     /* 📈 CHART BLOCK */
//     // case "chart":
//     //   return (
//     //     <div className="border rounded p-3 bg-white">
//     //       <div className="text-sm text-gray-500 mb-2">Chart (preview)</div>
//     //       <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
//     //         {JSON.stringify(
//     //           { chartType: block.chartType, data: block.data },
//     //           null,
//     //           2
//     //         )}
//     //       </pre>
//     //     </div>
//     //   );

//     /* ❓ QUIZ BLOCK */
//     case "quiz":
//       return <QuizBlock block={block} />;

//     /* ⚠️ UNKNOWN TYPE */
//     default:
//       return (
//         <div className="text-red-500">
//           Unknown block type: {block.type}
//         </div>
//       );
//   }
// }



// src/components/Blocks/BlockView.jsx
import React from "react";
import QuizBlock from "./QuizBlock";

export default function BlockView({ block }) {
  // Normalize type so we also support data.type and case/alias variants
  const type = String(block.type || block.data?.type || "").toLowerCase();

  switch (type) {
    /* 📝 TEXT BLOCK (Rich text from ReactQuill) */
    case "text":
      return (
        <div
          className="prose max-w-none bg-white p-3 rounded shadow-sm leading-relaxed"
          style={{
            textAlign: block.align || "left",
            lineHeight: "1.7",
          }}
          dangerouslySetInnerHTML={{ __html: block.content || "" }}
        />
      );

    /* 🖼️ IMAGE BLOCK */
    case "image":
      return (
        <div className="border rounded p-3 bg-white">
          {block.url ? (
            <img
              src={block.url}
              alt=""
              className="max-w-full rounded mx-auto"
              style={{
                width: `${block.width || 100}%`,
                display: "block",
                objectFit: "contain",
              }}
            />
          ) : (
            <div className="text-gray-500 italic">No image URL</div>
          )}
          {block.caption && (
            <div className="text-sm text-gray-600 mt-2 text-center">
              {block.caption}
            </div>
          )}
        </div>
      );

    /* ——— PAGE DIVIDER / HR ——— */
    case "divider":
    case "page-divider":
    case "hr":
      return (
        <div className="my-6">
          <hr
            style={{
              border: 0,
              height: 1,
              width: "100%",
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(17,24,39,.18) 12%, rgba(17,24,39,.32) 50%, rgba(17,24,39,.18) 88%, rgba(0,0,0,0) 100%)",
              borderRadius: 999,
            }}
          />
        </div>
      );

    /* 📊 TABLE BLOCK (example kept commented)
    case "table": { ... }
    */

    /* 📈 CHART BLOCK (example kept commented)
    case "chart": { ... }
    */

    /* ❓ QUIZ BLOCK */
    case "quiz":
      return <QuizBlock block={block} />;

    /* ⚠️ UNKNOWN TYPE */
    default:
      // if someone saved a custom name like "horizontal-divider", still catch it
      if (type.includes("divider")) {
        return (
          <div className="my-6">
            <hr
              style={{
                border: 0,
                height: 1,
                width: "100%",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(17,24,39,.18) 12%, rgba(17,24,39,.32) 50%, rgba(17,24,39,.18) 88%, rgba(0,0,0,0) 100%)",
                borderRadius: 999,
              }}
            />
          </div>
        );
      }
      return (
        <div className="text-red-500">
          Unknown block type: {block.type || block.data?.type || "—"}
        </div>
      );
  }
}
