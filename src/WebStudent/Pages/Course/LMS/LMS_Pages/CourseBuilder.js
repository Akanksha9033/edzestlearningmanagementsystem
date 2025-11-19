// // pages/CourseBuilder.js
// import React, { useEffect, useState, useContext } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { AuthContext } from "../../../context/AuthContext";
// import CourseHeader from "../CourseHeader";
// import SectionList from "../SectionList";
// import AddSectionDrawer from "../AddSectionDrawer";
// import { isAdminRole } from "../../../../utils/roleCheck";
// // pages/CourseBuilder.js
// import API from "../../../../api/axios";  // instead of axios


// const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// const CourseBuilder = () => {
//   const { user } = useContext(AuthContext);
//   const { courseId } = useParams();
//   const navigate = useNavigate();
//   const [course, setCourse] = useState(null);
//   const [sections, setSections] = useState([]);
//   const [sectionTitle, setSectionTitle] = useState("");

//   useEffect(() => {
//     const fetchCourse = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get(`${REACT_APP_API_URL}/api/courses/${courseId}/full`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setCourse(res.data);
//         setSections(res.data.sections || []);
//       } catch (err) {
//         console.error("Failed to fetch course:", err);
//       }
//     };
//     fetchCourse();
//   }, [courseId]);

//   const handleSaveSection = async () => {
//     if (!sectionTitle.trim()) return;

//     if (sections.some(s => s.title.trim().toLowerCase() === sectionTitle.trim().toLowerCase())) {
//       alert("Section with this title already exists.");
//       return;
//     }

//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.post(
//         `${REACT_APP_API_URL}/api/courses/${courseId}/add-section`,
//         { title: sectionTitle },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const newSection = res.data.section;
//       setSections([...sections, newSection]);
//       setSectionTitle("");
//       document.getElementById("closeDrawerBtn").click();
//       setTimeout(() => navigate(`/course/${courseId}/section/${newSection._id}`), 300);
//     } catch (err) {
//       console.error("Failed to add section:", err);
//     }
//   };

//   if (!isAdminRole(user?.role)) {
//     return <p className="text-danger text-center">Access Denied</p>;
//   }

//   if (!course) {
//     return (
//       <div className="d-flex justify-content-center mt-5">
//         <div className="spinner-border text-primary" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container py-4">
//       <CourseHeader course={course} />
//       <SectionList sections={sections} courseId={courseId} />
//       <AddSectionDrawer
//         sectionTitle={sectionTitle}
//         setSectionTitle={setSectionTitle}
//         handleSaveSection={handleSaveSection}
//       />
//     </div>
//   );
// };

// export default CourseBuilder;



// ⬇️ React hooks जो फाइल में यूज़ हो रहे हैं
import React, { useEffect, useState, useMemo, useCallback } from "react";

// ⬇️ react-router-dom से useParams (और अगर navigate या Link यूज़ हो रहा हो)
import { useParams, useNavigate, Link } from "react-router-dom";


import { useAuth } from "../../../../../LoginSystem/context/AuthContext";
 import API from "../../../../../LoginSystem/axios";

import CourseHeader from "../CourseHeader";
import SectionList from "../SectionList";
import AddSectionDrawer from "../AddSectionDrawer";

// ✅ Use centralized axios instance


const CourseBuilder = () => {
  const { user, ready } = useAuth(); // ✅ context now provides ready + user
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionTitle, setSectionTitle] = useState("");

  // fetch full course once auth is ready
  useEffect(() => {
    if (!ready) return; // ✅ wait for bootstrap
    const fetchCourse = async () => {
      try {
        const res = await API.get(`/api/courses/${courseId}/full`);
        const c = res.data?.course || res.data; // handle both shapes
        setCourse(c);
        setSections(c.sections || []);
      } catch (err) {
        console.error("Failed to fetch course:", err);
      }
    };
    fetchCourse();
  }, [courseId, ready]);

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) return;

    // prevent duplicates
    if (
      sections.some(
        (s) =>
          s.title.trim().toLowerCase() === sectionTitle.trim().toLowerCase()
      )
    ) {
      alert("Section with this title already exists.");
      return;
    }

    try {
      const res = await API.post(`/api/courses/${courseId}/add-section`, {
        title: sectionTitle,
      });
      const newSection = res.data.section;
      setSections([...sections, newSection]);
      setSectionTitle("");
      document.getElementById("closeDrawerBtn")?.click();
      setTimeout(
        () => navigate(`/course/${courseId}/section/${newSection._id}`),
        300
      );
    } catch (err) {
      console.error("Failed to add section:", err);
    }
  };

  // ✅ wait for auth readiness
  if (!ready) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading auth…</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading course…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
       {/* 🔙 Back Button */}
    <button
      className="btn btn-outline-secondary mb-3"
      onClick={() => navigate(-1)}
    >
      ← Back
    </button>

      <CourseHeader course={course} />
      <SectionList sections={sections} courseId={courseId} />
      <AddSectionDrawer
        sectionTitle={sectionTitle}
        setSectionTitle={setSectionTitle}
        handleSaveSection={handleSaveSection}
      />
    </div>
  );
};

export default CourseBuilder;
