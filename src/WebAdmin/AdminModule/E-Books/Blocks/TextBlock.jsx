import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // ✅ Quill default theme
import "./TextBlock.css";

export default function TextBlock({ block, onChange }) {
  const [content, setContent] = useState(block.content || "");

  useEffect(() => {
    onChange({ ...block, content });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // ✅ Custom toolbar options
  const modules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ header: "1" }, { header: "2" }, "blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "header",
    "blockquote",
    "code-block",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
  ];

  return (
    <div className="text-block">
      <h4 className="text-block-title">📝 Text Editor</h4>

      <ReactQuill
        theme="snow"
        modules={modules}
        formats={formats}
        value={content}
        onChange={setContent}
        placeholder="Start writing here..."
        className="custom-editor"
      />
    </div>
  );
}
