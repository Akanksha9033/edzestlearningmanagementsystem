// import React, { useEffect, useState } from "react";
// import API from "../../LoginSystem/axios"; // apne project path ke according adjust
// import { useNavigate } from "react-router-dom";

// export default function AdminAddUser() {
//   const navigate = useNavigate();

//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");

//   // products
//   const [enableQBank, setEnableQBank] = useState(false);
//   const [enableMocktest, setEnableMocktest] = useState(false);
//   const [enableEbooks, setEnableEbooks] = useState(false);

//   // courses list + selected
//   const [allCourses, setAllCourses] = useState([]);
//   const [selectedCourseIds, setSelectedCourseIds] = useState([]);

//   const [loading, setLoading] = useState(false);

//   // load courses (published/all)
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await API.get("/api/courses");
//         setAllCourses(res.data?.courses || []);
//       } catch (e) {
//         console.error("Courses load failed", e);
//         setAllCourses([]);
//       }
//     })();
//   }, []);

//   const toggleCourse = (courseId) => {
//     setSelectedCourseIds((prev) =>
//       prev.includes(courseId)
//         ? prev.filter((x) => x !== courseId)
//         : [...prev, courseId]
//     );
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const payload = {
//         name,
//         email,
//         role: "Student",
//         access: {
//           courses: selectedCourseIds,
//           qbank: enableQBank,
//           mocktest: enableMocktest,
//           ebooks: enableEbooks,
//         },
//       };

//       await API.post("/api/admin/users/students", payload);
//       alert("✅ Student invited successfully!");
//       navigate("/admin/dashboard");
//     } catch (err) {
//       console.error(err);
//       alert(err?.response?.data?.message || "❌ Failed to add user");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container py-4">

//       {/* 🔙 HEADER WITH BACK BUTTON */}
//       <div className="d-flex align-items-center justify-content-between mb-3">
//         <h3 className="fw-bold mb-0">Add User</h3>

//         <button
//           type="button"
//           className="btn btn-outline-secondary"
//           onClick={() => navigate(-1)}
//         >
//           ← Back
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
//         <div className="mb-3">
//           <label className="form-label">Name</label>
//           <input
//             className="form-control"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             required
//           />
//         </div>

//         <div className="mb-3">
//           <label className="form-label">Email</label>
//           <input
//             className="form-control"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//         </div>

//         <hr />

//         <h6 className="fw-bold">Product Access</h6>

//         <div className="form-check">
//           <input
//             className="form-check-input"
//             type="checkbox"
//             checked={enableQBank}
//             onChange={(e) => setEnableQBank(e.target.checked)}
//           />
//           <label className="form-check-label">Q-Bank</label>
//         </div>

//         <div className="form-check">
//           <input
//             className="form-check-input"
//             type="checkbox"
//             checked={enableMocktest}
//             onChange={(e) => setEnableMocktest(e.target.checked)}
//           />
//           <label className="form-check-label">MockTests</label>
//         </div>

//         <div className="form-check mb-3">
//           <input
//             className="form-check-input"
//             type="checkbox"
//             checked={enableEbooks}
//             onChange={(e) => setEnableEbooks(e.target.checked)}
//           />
//           <label className="form-check-label">E-Books</label>
//         </div>

//         <hr />

//         <h6 className="fw-bold">Course Access</h6>

//         <div className="row">
//           {(allCourses || []).map((c) => (
//             <div key={c._id} className="col-12 col-md-6">
//               <div className="form-check">
//                 <input
//                   className="form-check-input"
//                   type="checkbox"
//                   checked={selectedCourseIds.includes(String(c._id))}
//                   onChange={() => toggleCourse(String(c._id))}
//                 />
//                 <label className="form-check-label">{c.title}</label>
//               </div>
//             </div>
//           ))}
//         </div>

//         <button disabled={loading} className="btn btn-primary mt-3">
//           {loading ? "Adding..." : "Add User"}
//         </button>
//       </form>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import API from "../../LoginSystem/axios"; // apne project path ke according adjust
import { useNavigate } from "react-router-dom";

export default function AdminAddUser() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // products
  const [enableQBank, setEnableQBank] = useState(false);
  const [enableMocktest, setEnableMocktest] = useState(false);
  const [enableEbooks, setEnableEbooks] = useState(false);

  // courses list + selected
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  const [loading, setLoading] = useState(false);

  /* ---------------------------------------
     Load courses
  --------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/api/courses");
        setAllCourses(res.data?.courses || []);
      } catch (e) {
        console.error("Courses load failed", e);
        setAllCourses([]);
      }
    })();
  }, []);

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((x) => x !== courseId)
        : [...prev, courseId]
    );
  };

  /* ---------------------------------------
     Submit handler
  --------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        role: "Student",
        access: {
          courses: selectedCourseIds,
          qbank: enableQBank,
          mocktest: enableMocktest,
          ebooks: enableEbooks,
        },
      };

      await API.post("/api/admin/users/students", payload);

      alert("✅ Student invited successfully!");
      navigate("/admin/dashboard");

    } catch (err) {
      console.error("ADD USER ERROR =", err);

      const apiStatus = err?.response?.status;
      const apiCode = err?.response?.data?.code;
      const apiMessage = err?.response?.data?.message;

      // ✅ USER ALREADY EXISTS
      if (
        apiCode === "USER_ALREADY_EXISTS" ||
        apiMessage === "User already exists"
      ) {
        alert("⚠️ User already exists");
        return;
      }

      // ✅ SESSION / AUTH ISSUE
      if (apiStatus === 401) {
        alert("⚠️ Session expired. Please login again.");
        return;
      }

      // ❌ FALLBACK
      alert(apiMessage || "❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------
     UI
  --------------------------------------- */
  return (
    <div className="container py-4">

      {/* 🔙 HEADER WITH BACK BUTTON */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="fw-bold mb-0">Add User</h3>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <hr />

        <h6 className="fw-bold">Product Access</h6>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={enableQBank}
            onChange={(e) => setEnableQBank(e.target.checked)}
          />
          <label className="form-check-label">Q-Bank</label>
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={enableMocktest}
            onChange={(e) => setEnableMocktest(e.target.checked)}
          />
          <label className="form-check-label">MockTests</label>
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={enableEbooks}
            onChange={(e) => setEnableEbooks(e.target.checked)}
          />
          <label className="form-check-label">E-Books</label>
        </div>

        <hr />

        <h6 className="fw-bold">Course Access</h6>

        <div className="row">
          {(allCourses || []).map((c) => (
            <div key={c._id} className="col-12 col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={selectedCourseIds.includes(String(c._id))}
                  onChange={() => toggleCourse(String(c._id))}
                />
                <label className="form-check-label">{c.title}</label>
              </div>
            </div>
          ))}
        </div>

        <button disabled={loading} className="btn btn-primary mt-3">
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>
    </div>
  );
}
