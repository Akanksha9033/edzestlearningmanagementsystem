import React, { useState } from "react";
import BlockSidebar from "./BlockSidebar";
import BlockRenderer from "./BlockRenderer";

/**
 * ChapterManager.jsx
 * Allows admin to manage multiple chapters inside an e-book.
 * Each chapter can contain blocks (text, image, quiz, etc.)
 */
export default function ChapterManager({ chapters, setChapters }) {
  const [activeChapter, setActiveChapter] = useState(
    chapters?.[0]?.chapterId || null
  );

  // Add a new chapter
  const addChapter = () => {
    const newChapter = {
      chapterId: "ch-" + Date.now(),
      title: "New Chapter",
      blocks: [],
    };
    setChapters([...chapters, newChapter]);
    setActiveChapter(newChapter.chapterId);
  };

  // Update a specific chapter
  const updateChapter = (chapterId, updatedData) => {
    setChapters(
      chapters.map((ch) =>
        ch.chapterId === chapterId ? { ...ch, ...updatedData } : ch
      )
    );
  };

  // Delete a chapter
  const deleteChapter = (chapterId) => {
    const updated = chapters.filter((ch) => ch.chapterId !== chapterId);
    setChapters(updated);
    if (updated.length) setActiveChapter(updated[0].chapterId);
    else setActiveChapter(null);
  };

  // Add new block to the current chapter
  const addBlock = (type) => {
    if (!activeChapter) return;
    setChapters(
      chapters.map((ch) =>
        ch.chapterId === activeChapter
          ? {
              ...ch,
              blocks: [
                ...(ch.blocks || []),
                { id: Date.now(), type, content: "", url: "" },
              ],
            }
          : ch
      )
    );
  };

  // Update block inside chapter
  const updateBlock = (blockId, newBlock) => {
    setChapters(
      chapters.map((ch) =>
        ch.chapterId === activeChapter
          ? {
              ...ch,
              blocks: ch.blocks.map((b) =>
                b.id === blockId ? newBlock : b
              ),
            }
          : ch
      )
    );
  };

  // Remove a block
  const removeBlock = (blockId) => {
    setChapters(
      chapters.map((ch) =>
        ch.chapterId === activeChapter
          ? {
              ...ch,
              blocks: ch.blocks.filter((b) => b.id !== blockId),
            }
          : ch
      )
    );
  };

  const currentChapter = chapters.find(
    (ch) => ch.chapterId === activeChapter
  );

  return (
    <div className="flex h-[calc(100vh-120px)] border rounded-md overflow-hidden">
      {/* Left: Chapter list */}
      <div className="w-56 border-r bg-gray-50 p-2">
        <h3 className="font-bold mb-2">Chapters</h3>
        {chapters.map((ch) => (
          <div
            key={ch.chapterId}
            onClick={() => setActiveChapter(ch.chapterId)}
            className={`cursor-pointer p-2 mb-1 rounded ${
              activeChapter === ch.chapterId
                ? "bg-blue-100 border-l-4 border-blue-500"
                : "hover:bg-gray-100"
            }`}
          >
            <input
              className="w-full border-b bg-transparent text-sm"
              value={ch.title}
              onChange={(e) =>
                updateChapter(ch.chapterId, { title: e.target.value })
              }
            />
          </div>
        ))}

        <button
          onClick={addChapter}
          className="w-full bg-blue-600 text-white text-sm py-1 rounded mt-2 hover:bg-blue-700"
        >
          + Add Chapter
        </button>

        {activeChapter && (
          <button
            onClick={() => deleteChapter(activeChapter)}
            className="w-full bg-red-600 text-white text-sm py-1 rounded mt-2 hover:bg-red-700"
          >
            🗑 Delete Chapter
          </button>
        )}
      </div>

      {/* Middle: Block sidebar */}
      <BlockSidebar onAdd={addBlock} />

      {/* Right: Editor area */}
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        {currentChapter ? (
          <>
            <h2 className="text-lg font-semibold mb-3">
              {currentChapter.title}
            </h2>
            {(currentChapter.blocks || []).map((block) => (
              <div
                key={block.id}
                className="border rounded p-2 mb-3 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm capitalize">
                    {block.type}
                  </span>
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="text-red-500 text-xs"
                  >
                    ✕ Remove
                  </button>
                </div>
                <BlockRenderer
                  block={block}
                  onChange={(b) => updateBlock(block.id, b)}
                />
              </div>
            ))}
          </>
        ) : (
          <p className="text-gray-500 italic">
            No chapter selected. Create one to begin.
          </p>
        )}
      </div>
    </div>
  );
}
