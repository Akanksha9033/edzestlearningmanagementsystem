import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Content from "./Content";
import InThisArticle from "../components/inThisArticle";   // <-- ADD THIS

const loadContentData = async () => {
  const files = [
    "Chapter1.js",
    "Chapter2.js",
    "Chapter3.js",
    "Chapter4.js",
    "Chapter5.js",
    "Chapter6.js",
    "Chapter7.js",
    "Chapter8.js",
    "Chapter9.js",
    "Chapter10.js",
  ];

  try {
    const allData = await Promise.all(
      files.map((file) =>
        import(`../data/${file}`).then((module) => module.default)
      )
    );
    return allData.flat();
  } catch (error) {
    console.error("❌ Error loading content:", error);
    return [];
  }
};

const Docs = () => {
  const { chapterId, subChapterId, sectionId } = useParams();
  const [contentData, setContentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContentData()
      .then((data) => {
        setContentData(data || []);
        setLoading(false);
      })
      .catch((error) =>
        console.error("❌ Error loading content data:", error)
      );
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* MAIN CONTENT AREA */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 40px 20px 40px",
        }}
      >
        <Content contentData={contentData} />
      </div>

      {/* RIGHT SIDEBAR FIXED */}
      <div
        style={{
          width: "250px",
          position: "fixed",
          right: 0,
          top: "140px",
          height: "calc(100vh - 140px)",
          overflowY: "auto",
          background: "white",
          borderLeft: "1px solid #ddd",
          padding: "10px",
        }}
      >
        <InThisArticle sections={contentData} />
      </div>
    </div>
  );
};

export default Docs;
