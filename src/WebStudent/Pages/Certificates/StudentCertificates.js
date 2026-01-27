

// import React, { useEffect, useState } from "react";
// import API from "../../../LoginSystem/axios";
// import StudentSidebar from "../../Dashboard/StudentSidebar";
// import DashboardHeader from "../../../Shared/DashboardHeader";

// /* ================= CERTIFICATE CARD STYLES ================= */
// const certCardStyle = {
//   background: "#ffffff",
//   border: "1px solid #e5e7eb",
//   borderRadius: "10px",
//   padding: "24px",
//   textAlign: "center",
//   position: "relative",
//   minHeight: "260px",
// };

// const sealStyle = {
//   width: 64,
//   height: 64,
//   borderRadius: "50%",
//   background:
//     "radial-gradient(circle at top left, #ffe08a, #d4af37)",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   margin: "0 auto 16px auto",
//   boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
//   fontSize: 28,
// };

// const titleStyle = {
//   fontSize: 14,
//   letterSpacing: "2px",
//   fontWeight: 600,
//   color: "#6b7280",
//   marginBottom: 12,
// };

// const courseStyle = {
//   fontSize: 20,
//   fontWeight: 700,
//   marginBottom: 12,
// };

// const issuedStyle = {
//   fontSize: 14,
//   color: "#6b7280",
//   marginBottom: 20,
// };

// export default function StudentCertificates() {
//   const [certificates, setCertificates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCertificates = async () => {
//       console.log("🧾 [CERT UI] Fetching certificates...");
//       try {
//         const res = await API.get("/api/student/certificates");
//         console.log("🧾 [CERT UI] API response:", res.data);
//         setCertificates(res.data?.items || []);
//       } catch (err) {
//         console.error("❌ [CERT UI] Certificates fetch failed", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCertificates();
//   }, []);

//   const handleDownload = (cert) => {
//     console.log("⬇️ [CERT UI] Download clicked:", {
//       courseTitle: cert.courseTitle,
//       downloadUrl: cert.downloadUrl,
//     });
//   };

//   return (
//     <div className="container-fluid p-0">
//       <div className="row g-0">
//         <div className="col-md-3 col-lg-2 d-none d-md-block bg-dark">
//           <StudentSidebar />
//         </div>

//         <div className="col-12 col-md-9 col-lg-10 min-vh-100">
//           <DashboardHeader />

//           <div className="container py-4">
//             <h3 className="fw-bold mb-4">My Certificates</h3>

//             {loading && <p>Loading certificates...</p>}

//             {!loading && certificates.length === 0 && (
//               <div className="alert alert-info">
//                 No certificates available yet.
//               </div>
//             )}

//             <div className="row">
//               {certificates.map((cert) => (
//                 <div className="col-md-6 col-lg-4 mb-4" key={cert.sk}>
//                   <div style={certCardStyle} className="shadow-sm">
//                     {/* Gold Seal */}
//                     <div style={sealStyle}>🏅</div>

//                     <div style={titleStyle}>
//                       CERTIFICATE OF COMPLETION
//                     </div>

//                     <div style={courseStyle}>
//                       {cert.courseTitle}
//                     </div>

//                     <div style={issuedStyle}>
//                       Issued on:{" "}
//                       {new Date(cert.issuedAt).toLocaleDateString()}
//                     </div>

//                     {cert.downloadUrl ? (
//                       <a
//                         href={cert.downloadUrl}
//                         download
//                         onClick={() => handleDownload(cert)}
//                         className="btn btn-primary w-100"
//                       >
//                         Download Certificate
//                       </a>
//                     ) : (
//                       <button
//                         className="btn btn-secondary w-100"
//                         disabled
//                       >
//                         Certificate not ready
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState } from "react";
import API from "../../../LoginSystem/axios";
import StudentSidebar from "../../Dashboard/StudentSidebar";
import DashboardHeader from "../../../Shared/DashboardHeader";

/* ================= CERTIFICATE CARD STYLES ================= */
const certCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "24px",
  textAlign: "center",
  position: "relative",
  minHeight: "260px",
};

const sealStyle = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  background:
    "radial-gradient(circle at top left, #ffe08a, #d4af37)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px auto",
  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  fontSize: 28,
};

const titleStyle = {
  fontSize: 14,
  letterSpacing: "2px",
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: 12,
};

const courseStyle = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 12,
};

const issuedStyle = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 20,
};

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      console.log("🧾 [CERT UI] Fetching certificates...");
      try {
        const res = await API.get("/api/student/certificates");
        console.log("🧾 [CERT UI] API response:", res.data);
        setCertificates(res.data?.items || []);
      } catch (err) {
        console.error("❌ [CERT UI] Certificates fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleDownload = (cert) => {
    console.log("⬇️ [CERT UI] Download clicked:", {
      courseTitle: cert.courseTitle,
      downloadUrl: cert.downloadUrl,
    });
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        <div className="col-md-3 col-lg-2 d-none d-md-block bg-dark">
          <StudentSidebar />
        </div>

        <div className="col-12 col-md-9 col-lg-10 min-vh-100">
          <DashboardHeader />

          <div className="container py-4">
            <h3 className="fw-bold mb-4">My Certificates</h3>

            {loading && <p>Loading certificates...</p>}

            {!loading && certificates.length === 0 && (
              <div className="alert alert-info">
                No certificates available yet.
              </div>
            )}

            <div className="row">
              {certificates.map((cert) => (
                <div className="col-md-6 col-lg-4 mb-4" key={cert.sk}>
                  <div style={certCardStyle} className="shadow-sm">
                    {/* Gold Seal */}
                    <div style={sealStyle}>🏅</div>

                    <div style={titleStyle}>
                      CERTIFICATE OF COMPLETION
                    </div>

                    <div style={courseStyle}>
                      {cert.courseTitle}
                    </div>

                    <div style={issuedStyle}>
                      Issued on:{" "}
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </div>

                    {cert.downloadUrl ? (
                      <button
  className="btn btn-primary w-100"
  onClick={() => {
    window.location.href =
      `/api/student/certificate/${cert.userId}/${cert.courseSlug}`;
  }}
>
  Download Certificate
</button>

                    ) : (
                      <button
                        className="btn btn-secondary w-100"
                        disabled
                      >
                        Certificate not ready
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
