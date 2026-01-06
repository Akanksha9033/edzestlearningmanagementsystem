// // pages/CreateCourse.js
// import React, { useState, useContext } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { AuthContext } from "../../../context/AuthContext";
// import { isAdminRole } from "../../../../utils/roleCheck";

// const CreateCourse = () => {
//   const [title, setTitle] = useState("");
//   const [price, setPrice] = useState("");
//   const [isFree, setIsFree] = useState(false);
//   const [status, setStatus] = useState("");

//   const navigate = useNavigate();
//   const { user } = useContext(AuthContext);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const token = localStorage.getItem("token");

//     if (!token || !user) {
//       alert("Unauthorized. Please log in first.");
//       return;
//     }

//     if (!isAdminRole(user.role)) {
//       alert("Access denied. Only Admins and Teachers can create courses.");
//       return;
//     }

//     const courseData = {
//       title,
//       price: isFree ? 0 : price,
//       isFree,
//       status: "unpublished",
//       createdBy: user.id,
//       instituteId: user.instituteId || null,
//     };

//     try {
//       const res = await axios.post(
//         "http://localhost:5000/api/courses/create-course",
//         courseData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       navigate(`/course-builder/${res.data.course._id}`);
//       setStatus("Course created successfully!");
//       setTitle("");
//       setPrice("");
//       setIsFree(false);
//     } catch (error) {
//       console.error("Course creation failed:", error);
//       if (error.response?.status === 401) {
//         setStatus("Unauthorized. Please log in again.");
//       } else if (
//         error.response?.status === 400 &&
//         error.response.data?.message?.includes("already exists")
//       ) {
//         setStatus("⚠️ A course with this title already exists. Please choose a different title.");
//       } else {
//         setStatus("Error creating course");
//       }
//     }
//   };

//   return (
//     <div style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
//       <h2>Create Course</h2>
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: "1rem" }}>
//           <label>Title*</label>
//           <input
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             required
//             placeholder="Enter course title"
//             style={{ width: "100%", padding: "0.5rem" }}
//           />
//         </div>

//         <div style={{ marginBottom: "1rem" }}>
//           <label>Price</label>
//           <input
//             type="number"
//             value={price}
//             onChange={(e) => setPrice(e.target.value)}
//             disabled={isFree}
//             placeholder="Enter course price"
//             style={{ width: "100%", padding: "0.5rem" }}
//           />
//         </div>

//         <div style={{ marginBottom: "1rem" }}>
//           <label>
//             <input
//               type="checkbox"
//               checked={isFree}
//               onChange={() => setIsFree(!isFree)}
//             />{" "}
//             Make this a free course
//           </label>
//         </div>

//         <div style={{ display: "flex", gap: "1rem" }}>
//           <button type="submit" style={{ padding: "0.5rem 1rem" }}>Create</button>
//           <button type="button" style={{ padding: "0.5rem 1rem" }} onClick={() => window.history.back()}>Cancel</button>
//         </div>

//         {status && (
//           <p style={{ marginTop: "1rem", color: status.includes("⚠️") ? "red" : "green" }}>
//             {status}
//           </p>
//         )}
//       </form>
//     </div>
//   );
// };

// export default CreateCourse;




// pages/CreateCourse.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../LoginSystem/context/AuthContext";
 import API from "../../../../../LoginSystem/axios";
// ✅ centralized axios wrapper (already handles Bearer + refresh cookie)


const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const CreateCourse = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [status, setStatus] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  // helper: convert File -> data URL
  const toDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Unauthorized. Please log in first.");
      return;
    }

    // ✅ Allow only admin and teacher (roles normalized to lowercase)
    if (!(user.role === "admin" || user.role === "teacher")) {
      alert("Access denied. Only admins and teachers can create courses.");
      return;
    }

    // convert image (if any) to data URL
    let imageBase64 = null;
    if (imageFile) {
      try {
        imageBase64 = await toDataURL(imageFile);
      } catch (err) {
        console.error("Image read error:", err);
        setStatus("Error reading the image. Please try another file.");
        return;
      }
    }

    const courseData = {
      title,
      price: isFree ? 0 : price,
      isFree,
      status: "unpublished",
      createdBy: user.id,
      instituteId: user.instituteId || null,
      ...(imageBase64 ? { imageBase64 } : {}),
    };

    try {
      const res = await API.post("/api/courses/create-course", courseData);
      navigate(`/course-builder/${res.data.course._id}`);
      setStatus("Course created successfully!");
      setTitle("");
      setPrice("");
      setIsFree(false);
      setImageFile(null);
    } catch (error) {
      console.error("Course creation failed:", error);
      if (error.response?.status === 401) {
        setStatus("Unauthorized. Please log in again.");
      } else if (
        error.response?.status === 400 &&
        error.response.data?.message?.includes("already exists")
      ) {
        setStatus("⚠️ A course with this title already exists. Please choose a different title.");
      } else {
        setStatus("Error creating course");
      }
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h2>Create Course</h2>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
  <button
    type="button"
    onClick={() => navigate(-1)}
    style={{
      padding: "4px 10px",
      cursor: "pointer"
    }}
  >
    ← Back
  </button>

  <h2 style={{ margin: 0 }}>Create Course</h2>
</div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Title*</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter course title"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isFree}
            placeholder="Enter course price"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>
            <input
              type="checkbox"
              checked={isFree}
              onChange={() => setIsFree(!isFree)}
            />{" "}
            Make this a free course
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Course Image (optional)</label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button type="submit" style={{ padding: "0.5rem 1rem" }}>
            Create
          </button>
          <button
            type="button"
            style={{ padding: "0.5rem 1rem" }}
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
        </div>

        {status && (
          <p
            style={{
              marginTop: "1rem",
              color: status.includes("⚠️") ? "red" : "green",
            }}
          >
            {status}
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateCourse;
