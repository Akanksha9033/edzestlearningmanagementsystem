




import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Content from "./Content";

const loadContentData = async () => {
  const files = [
    "Chapter1.js", "Chapter2.js", "Chapter3.js", "Chapter4.js", "Chapter5.js",
    "Chapter6.js", "Chapter7.js", "Chapter8.js", "Chapter9.js", "Chapter10.js",
  ];

  try {
    const allData = await Promise.all(
      files.map((file) => import(`../data/${file}`).then((module) => module.default))
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
    setLoading(true);
    loadContentData().then((data) => {
      setContentData(data || []);
      setLoading(false);
    }).catch((error) => console.error("❌ Error loading content data:", error));
  }, []);

  return loading ? <div>Loading...</div> : <Content contentData={contentData} />;
};

export default Docs;
