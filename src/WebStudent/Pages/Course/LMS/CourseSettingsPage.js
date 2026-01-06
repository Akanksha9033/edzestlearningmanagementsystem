// // pages/CourseSettingsPage.js
// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";

// const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// const CourseSettingsPage = () => {
//   const { courseId } = useParams();
//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState(false);

//   const fetchCourse = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(`${REACT_APP_API_URL}/api/courses/${courseId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCourse(res.data.course);
//     } catch (err) {
//       console.error("Failed to load course:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCourse();
//   }, [courseId]);

//   const togglePublish = async () => {
//     setUpdating(true);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.patch(
//         `${REACT_APP_API_URL}/api/courses/${courseId}/publish`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log("Full response:", res.data);

//       console.log("Updated course publish state:", res.data.course.status);


//       setCourse(res.data.course);
//     } catch (err) {
//       console.error("Error toggling publish:", err);
//     } finally {
//       setUpdating(false);
//     }
//   };

//   if (loading) return <p className="text-center mt-5">Loading course...</p>;
//   if (!course) return <p className="text-danger text-center mt-5">Course not found</p>;

//   return (
//     <div className="container py-5">
//       <h3>⚙️ Course Settings</h3>
//       <p><strong>Title:</strong> {course.title}</p>
//      <p><strong>Status:</strong> {course.status === "published" ? "Published ✅" : "Unpublished ❌"}</p>



//       <button
//   className={`btn ${course.status === "published" ? "btn-danger" : "btn-success"}`}
//   onClick={togglePublish}
//   disabled={updating}
// >
//   {updating
//     ? "Updating..."
//     : course.status === "published"
//     ? "Unpublish Course"
//     : "Publish Course"}
// </button>

//     </div>
//   );
// };

// export default CourseSettingsPage;



// pages/CourseSettingsPage.js
// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import CourseMetaForm from "./CourseMetaForm"; // ← adjust path if needed

// const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// const CourseSettingsPage = () => {
//   const { courseId } = useParams();
//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState(false);

//   const fetchCourse = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(`${REACT_APP_API_URL}/api/courses/${courseId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCourse(res.data.course);
//     } catch (err) {
//       console.error("Failed to load course:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCourse();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [courseId]);

//   const togglePublish = async () => {
//     setUpdating(true);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.patch(
//         `${REACT_APP_API_URL}/api/courses/${courseId}/publish`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log("Full response:", res.data);
//       console.log("Updated course publish state:", res.data.course.status);
//       setCourse(res.data.course);
//     } catch (err) {
//       console.error("Error toggling publish:", err);
//     } finally {
//       setUpdating(false);
//     }
//   };

//   if (loading) return <p className="text-center mt-5">Loading course...</p>;
//   if (!course) return <p className="text-danger text-center mt-5">Course not found</p>;

//   return (
//     <div className="container py-5">
//       <h3>⚙️ Course Settings</h3>
//       <p><strong>Title:</strong> {course.title}</p>
//       <p><strong>Status:</strong> {course.status === "published" ? "Published ✅" : "Unpublished ❌"}</p>

//       <button
//         className={`btn ${course.status === "published" ? "btn-danger" : "btn-success"}`}
//         onClick={togglePublish}
//         disabled={updating}
//       >
//         {updating
//           ? "Updating..."
//           : course.status === "published"
//           ? "Unpublish Course"
//           : "Publish Course"}
//       </button>

//       {/* --- New: Metadata + Schedule (non-breaking, additive) --- */}
//       <div className="mt-4">
//         <CourseMetaForm
//           course={course}
//           onUpdated={(updated) => {
//             // keep state in sync if metadata/schedule changes
//             setCourse(updated);
//           }}
//         />
//       </div>
//     </div>
//   );
// };

// export default CourseSettingsPage;





import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from '../../../../LoginSystem/axios';
import CourseMetaForm from "./CourseMetaForm"; // ← keep your path
import DeleteEntityButton from "./DeleteSectionButton"; // ← import your unified delete button

// ✅ use centralized API wrapper


const CourseSettingsPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchCourse = async () => {
    try {
       const res = await API.get(`/api/courses/${courseId}`);
      setCourse(res.data.course);
    } catch (err) {
      console.error("Failed to load course:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const togglePublish = async () => {
    setUpdating(true);
    try {
      const res = await API.patch(`/api/courses/${courseId}/publish`, {});
      setCourse(res.data.course);
    } catch (err) {
      console.error("Error toggling publish:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-center mt-5">Loading course...</p>;
  if (!course) return <p className="text-danger text-center mt-5">Course not found</p>;

  return (
    <div className="container py-5">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
  <button
    type="button"
    onClick={() => window.history.back()}
    style={{ padding: "4px 10px", cursor: "pointer" }}
  >
    ← Back
  </button>

  <h3 style={{ margin: 0 }}>⚙️ Course Settings</h3>
</div>

      <p><strong>Title:</strong> {course.title}</p>
      <p><strong>Status:</strong> {course.status === "published" ? "Published ✅" : "Unpublished ❌"}</p>

      <div className="d-flex flex-wrap gap-2">
        
        {/* 🗑️ Delete Course via your unified delete component */}
        <DeleteEntityButton
          deleteType="course"
          courseId={courseId}
          // onDeleted is optional; if omitted, the component will navigate to "/courses" itself.
          // onDeleted={() => {/* e.g., custom refresh or redirect */}}
          className="btn btn-outline-danger"
        />
      </div>

      {/* --- Metadata + Schedule (unchanged) --- */}
      <div className="mt-4">
        <CourseMetaForm
          course={course}
          onUpdated={(updated) => setCourse(updated)}
        />
      </div>
    </div>
  );
};

export default CourseSettingsPage;
