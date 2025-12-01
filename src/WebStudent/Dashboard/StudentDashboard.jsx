


// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import StudentSidebar from "./StudentSidebar";
// import DashboardHeader from "../../Shared/DashboardHeader";

// export default function StudentDashboard() {
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
//   const contentCols = isCollapsed ? "col-12 col-md-11 col-lg-11" : "col-12 col-md-9 col-lg-10";

//   return (
//     <div className="container-fluid p-0">
//       {/* 🎨 Scoped styles only (no logic changes) */}
//       <style>{`
//         :root {
//           --brand: #4748ac;
//           --brand-2: #6f70ff;
//           --ink: #1f2142;
//           --muted: #6b7280;
//           --card-bg: rgba(255,255,255,0.85);
//         }

//         /* page bg shimmer */
//         .ez-bg {
//           background:
//             radial-gradient(1200px 400px at 120% -10%, rgba(111,112,255,0.10), transparent 60%),
//             radial-gradient(1000px 500px at -10% 120%, rgba(148,163,255,0.10), transparent 55%),
//             linear-gradient(180deg, #f7f8ff 0%, #f9fbff 70%, #ffffff 100%);
//         }

//         .ez-grid { row-gap: 1rem; }

//         .ez-card {
//           position: relative;
//           border: 0;
//           border-radius: 20px;
//           overflow: hidden;
//           background: var(--card-bg);
//           box-shadow: 0 12px 30px rgba(31,33,66,0.08);
//           backdrop-filter: blur(8px);
//           transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
//           min-height: 180px;
//           isolation: isolate; /* keep inner effects contained */
//         }

//         /* subtle dot pattern */
//         .ez-card::before {
//           content: "";
//           position: absolute; inset: 0;
//           background-image:
//             radial-gradient(rgba(71,72,172,0.08) 1px, transparent 1px);
//           background-size: 14px 14px;
//           opacity: .55;
//           pointer-events: none;
//           mask-image: linear-gradient(180deg, rgba(0,0,0,.4), rgba(0,0,0,.1));
//           z-index: 0;
//         }

//         /* gradient ribbon */
//         .ez-ribbon {
//           position: absolute; top: 0; left: 0; right: 0; height: 7px;
//           background: linear-gradient(90deg, var(--brand), var(--brand-2) 55%, #aab0ff);
//           z-index: 2;
//         }

//         /* glow blob */
//         .ez-blob {
//           position: absolute; right: -60px; top: -60px;
//           width: 180px; height: 180px; border-radius: 50%;
//           background: radial-gradient(circle at 30% 30%, rgba(111,112,255,.22), rgba(71,72,172,.10) 60%, transparent 70%);
//           filter: blur(12px);
//           z-index: 1; pointer-events: none;
//           transform: translateZ(0);
//         }

//         .ez-body {
//           position: relative; z-index: 3;
//           padding: 1.25rem 1.25rem 1.3rem 1.25rem;
//         }

//         .ez-title {
//           color: var(--ink);
//           font-weight: 800;
//           letter-spacing: .2px;
//           margin: .4rem 0 .35rem;
//         }

//         .ez-text { color: var(--muted); margin: 0; }

//         .ez-icon {
//           width: 52px; height: 52px;
//           display: grid; place-items: center;
//           border-radius: 14px;
//           background: linear-gradient(180deg, rgba(71,72,172,.14), rgba(111,112,255,.10));
//           border: 1px solid rgba(71,72,172,.22);
//           box-shadow: inset 0 1px 0 rgba(255,255,255,.4);
//         }
//         .ez-icon svg { width: 24px; height: 24px; }

//         /* CTA arrow */
//         .ez-cta {
//           display: inline-flex; align-items: center; gap: 6px;
//           font-weight: 600; color: var(--brand); margin-top: .65rem;
//           opacity: .95;
//         }
//         .ez-cta .ez-arrow { transform: translateX(0); transition: transform .2s ease; }

//         .ez-card:hover {
//           background: rgba(255,255,255,0.92);
//           transform: translateY(-4px);
//           box-shadow: 0 18px 44px rgba(31,33,66,0.13);
//         }
//         .ez-card:hover .ez-cta .ez-arrow { transform: translateX(2px); }

//         .ez-link { position: absolute; inset: 0; }

//         /* Tap feedback */
//         .ez-card:active { transform: translateY(-1px) scale(.998); }

//         /* Mobile tweaks */
//         @media (max-width: 576px) {
//           .ez-body { padding: 1rem 1rem 1.05rem 1rem; }
//           .ez-card { min-height: 165px; }
//         }

//         /* Motion respect */
//         @media (prefers-reduced-motion: reduce) {
//           .ez-card, .ez-cta .ez-arrow { transition: none; }
//         }
//       `}</style>

//       <div className="row g-0 ez-bg">
//         {/* Sidebar column (md and up) */}
//         <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
//           <StudentSidebar
//             isCollapsed={isCollapsed}
//             toggleSidebar={() => setIsCollapsed((prev) => !prev)}
//           />
//         </div>

//         {/* Offcanvas sidebar for mobile */}
//         <div
//           className="offcanvas offcanvas-start bg-dark text-white d-md-none"
//           tabIndex="-1"
//           id="mobileSidebar"
//           aria-labelledby="mobileSidebarLabel"
//         >
//           <div className="offcanvas-header">
//             <h5 className="offcanvas-title" id="mobileSidebarLabel">Student</h5>
//             <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
//           </div>
//           <div className="offcanvas-body p-0">
//             <StudentSidebar isCollapsed={false} toggleSidebar={() => {}} />
//           </div>
//         </div>

//         {/* Main content column */}
//         <div className={`${contentCols} d-flex flex-column min-vh-100`} style={{background:"transparent"}}>
//           <DashboardHeader />

//           <div className="container-fluid py-4 flex-grow-1 overflow-auto">
//             <h2 className="fw-bold text-dark mb-2">Welcome to Your Dashboard</h2>
//             <p className="text-muted mb-4">Quick links to your E-Books, Q-Bank, and Mock Tests.</p>

//             <div className="row ez-grid">
//               {/* E-Books */}
//               <div className="col-12 col-sm-6 col-lg-4">
//                 <div className="ez-card">
//                   <div className="ez-ribbon" />
//                   <div className="ez-blob" />
//                   <div className="ez-body">
//                     <div className="ez-icon" aria-hidden="true">
//                       <svg viewBox="0 0 24 24" fill="none">
//                         <path d="M6 4h9a3 3 0 0 1 3 3v12H8a2 2 0 0 1-2-2V4z" stroke="var(--brand)" strokeWidth="1.7" />
//                         <path d="M6 18h12" stroke="var(--brand)" strokeWidth="1.4" />
//                       </svg>
//                     </div>
//                     <h5 className="ez-title">E-Books</h5>
//                     <p className="ez-text">Open your interactive e-books and continue reading.</p>
//                     <span className="ez-cta">Open <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
//                     <Link to="/ebooks" className="ez-link" aria-label="Go to E-Books" />
//                   </div>
//                 </div>
//               </div>

//               {/* Q-Bank */}
//               <div className="col-12 col-sm-6 col-lg-4">
//                 <div className="ez-card">
//                   <div className="ez-ribbon" />
//                   <div className="ez-blob" />
//                   <div className="ez-body">
//                     <div className="ez-icon" aria-hidden="true">
//                       <svg viewBox="0 0 24 24" fill="none">
//                         <path d="M5 7h10M5 12h10M5 17h6" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" />
//                         <path d="M18 14l-2 2 4 4 3-4" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
//                       </svg>
//                     </div>
//                     <h5 className="ez-title">Q-Bank</h5>
//                     <p className="ez-text">Practice from available banks with smart filters.</p>
//                     <span className="ez-cta">Practice <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
//                     <Link to="/student/qbank" className="ez-link" aria-label="Go to Q-Bank" />
//                   </div>
//                 </div>
//               </div>

//               {/* Mock Tests */}
//               <div className="col-12 col-sm-6 col-lg-4">
//                 <div className="ez-card">
//                   <div className="ez-ribbon" />
//                   <div className="ez-blob" />
//                   <div className="ez-body">
//                     <div className="ez-icon" aria-hidden="true">
//                       <svg viewBox="0 0 24 24" fill="none">
//                         <circle cx="12" cy="12" r="7.5" stroke="var(--brand)" strokeWidth="1.7" />
//                         <path d="M12 8v4l3 2" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" />
//                       </svg>
//                     </div>
//                     <h5 className="ez-title">Mock Tests</h5>
//                     <p className="ez-text">View published tests and track your attempts.</p>
//                     <span className="ez-cta">Start <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
//                     <Link to="/student/mocktests" className="ez-link" aria-label="Go to Mock Tests" />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div> {/* /content */}
//       </div>
//     </div>
//   );
// }


import React, { useState } from "react"; 
import { Link } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import DashboardHeader from "../../Shared/DashboardHeader";

export default function StudentDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
  const contentCols = isCollapsed ? "col-12 col-md-11 col-lg-11" : "col-12 col-md-9 col-lg-10";

  return (
    <div className="container-fluid p-0">
      {/* 🎨 Scoped styles only (no logic changes) */}
      <style>{`
        :root {
          --brand: #4748ac;
          --brand-2: #6f70ff;
          --ink: #1f2142;
          --muted: #6b7280;
          --card-bg: rgba(255,255,255,0.85);
        }

        .ez-bg {
          background:
            radial-gradient(1200px 400px at 120% -10%, rgba(111,112,255,0.10), transparent 60%),
            radial-gradient(1000px 500px at -10% 120%, rgba(148,163,255,0.10), transparent 55%),
            linear-gradient(180deg, #f7f8ff 0%, #f9fbff 70%, #ffffff 100%);
        }

        .ez-grid { row-gap: 1rem; }

        .ez-card {
          position: relative;
          border: 0;
          border-radius: 20px;
          overflow: hidden;
          background: var(--card-bg);
          box-shadow: 0 12px 30px rgba(31,33,66,0.08);
          backdrop-filter: blur(8px);
          transition: transform .22s ease, box-shadow .22s ease, background .22s ease;
          min-height: 180px;
          isolation: isolate;
        }

        .ez-card::before {
          content: "";
          position: absolute; inset: 0;
          background-image:
            radial-gradient(rgba(71,72,172,0.08) 1px, transparent 1px);
          background-size: 14px 14px;
          opacity: .55;
          pointer-events: none;
          mask-image: linear-gradient(180deg, rgba(0,0,0,.4), rgba(0,0,0,.1));
          z-index: 0;
        }

        .ez-ribbon {
          position: absolute; top: 0; left: 0; right: 0; height: 7px;
          background: linear-gradient(90deg, var(--brand), var(--brand-2) 55%, #aab0ff);
          z-index: 2;
        }

        .ez-blob {
          position: absolute; right: -60px; top: -60px;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(111,112,255,.22), rgba(71,72,172,.10) 60%, transparent 70%);
          filter: blur(12px);
          z-index: 1; pointer-events: none;
          transform: translateZ(0);
        }

        .ez-body { position: relative; z-index: 3; padding: 1.25rem; }
        .ez-title { color: var(--ink); font-weight: 800; margin: .4rem 0 .35rem; }
        .ez-text { color: var(--muted); margin: 0; }
        .ez-icon {
          width: 52px; height: 52px; display: grid; place-items: center;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(71,72,172,.14), rgba(111,112,255,.10));
          border: 1px solid rgba(71,72,172,.22);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.4);
        }
        .ez-icon svg { width: 24px; height: 24px; }

        .ez-cta {
          display: inline-flex; align-items: center; gap: 6px;
          font-weight: 600; color: var(--brand); margin-top: .65rem;
          opacity: .95;
        }
        .ez-cta .ez-arrow { transform: translateX(0); transition: transform .2s ease; }

        .ez-card:hover {
          background: rgba(255,255,255,0.92);
          transform: translateY(-4px);
          box-shadow: 0 18px 44px rgba(31,33,66,0.13);
        }
        .ez-card:hover .ez-cta .ez-arrow { transform: translateX(2px); }

        .ez-link { position: absolute; inset: 0; }
      `}</style>

      <div className="row g-0 ez-bg">
        {/* Sidebar */}
        <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
          <StudentSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={() => setIsCollapsed((prev) => !prev)}
          />
        </div>

        {/* Main content */}
        <div className={`${contentCols} d-flex flex-column min-vh-100`} style={{background:"transparent"}}>
          <DashboardHeader />

          <div className="container-fluid py-4 flex-grow-1 overflow-auto">
            <h2 className="fw-bold text-dark mb-2">Welcome to Your Dashboard</h2>
            <p className="text-muted mb-4">Quick links to your E-Books, Q-Bank, and Mock Tests.</p>

            <div className="row ez-grid">
              
              {/* ---------------- E-Books (commented out) ---------------- */}
            
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <div className="ez-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M6 4h9a3 3 0 0 1 3 3v12H8a2 2 0 0 1-2-2V4z" stroke="var(--brand)" strokeWidth="1.7" />
                        <path d="M6 18h12" stroke="var(--brand)" strokeWidth="1.4" />
                      </svg>
                    </div>
                    <h5 className="ez-title">E-Books</h5>
                    <p className="ez-text">Open your interactive e-books and continue reading.</p>
                    <span className="ez-cta">Open <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <Link to="/ebooks" className="ez-link" />
                  </div>
                </div>
              </div>
              

              {/* Q-Bank (kept active) */}
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <div className="ez-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 7h10M5 12h10M5 17h6" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M18 14l-2 2 4 4 3-4" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h5 className="ez-title">Q-Bank</h5>
                    <p className="ez-text">Practice from available banks with smart filters.</p>
                    <span className="ez-cta">Practice <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <Link to="/student/qbank" className="ez-link" />
                  </div>
                </div>
              </div>

              {/* ---------------- Mock Tests (commented out) ---------------- */}
              
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <div className="ez-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="7.5" stroke="var(--brand)" strokeWidth="1.7" />
                        <path d="M12 8v4l3 2" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h5 className="ez-title">Mock Tests</h5>
                    <p className="ez-text">View published tests and track your attempts.</p>
                    <span className="ez-cta">Start <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <Link to="/student/mocktests" className="ez-link" />
                  </div>
                </div>
              </div>
             
{/* ----------------courses (commented out) ---------------- */}

             <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <div className="ez-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="7.5" stroke="var(--brand)" strokeWidth="1.7" />
                        <path d="M12 8v4l3 2" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h5 className="ez-title">courses</h5>
                    <p className="ez-text">View published courses.</p>
                    <span className="ez-cta">Start <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <Link to="/student/courses" className="ez-link" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
