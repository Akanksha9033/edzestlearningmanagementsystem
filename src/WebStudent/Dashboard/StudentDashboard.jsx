// import React, { useState } from "react";
// import StudentSidebar from "./StudentSidebar";
// import DashboardHeader from "../../Shared/DashboardHeader";

// export default function StudentDashboard() {
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   // Dynamic classes so sidebar + content always add up to 12
//   const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
//   const contentCols = isCollapsed ? "col-12 col-md-11 col-lg-11" : "col-12 col-md-9 col-lg-10";

//   return (
//     <div className="container-fluid p-0">
//       <div className="row g-0">
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
//             <button
//               type="button"
//               className="btn-close btn-close-white"
//               data-bs-dismiss="offcanvas"
//               aria-label="Close"
//             ></button>
//           </div>
//           <div className="offcanvas-body p-0">
//             {/* Show full labels inside offcanvas */}
//             <StudentSidebar isCollapsed={false} toggleSidebar={() => {}} />
//           </div>
//         </div>

//         {/* Main content column */}
//         <div className={`${contentCols} d-flex flex-column min-vh-100 bg-light`}>
//           <DashboardHeader />

//           <div className="container-fluid py-4 flex-grow-1 overflow-auto">
//             <h2 className="fw-bold text-dark mb-3">Welcome to Your Dashboard</h2>
//             <p className="text-muted mb-4">
//               Here you’ll see your course progress, enrolled lessons, mock tests, and more.
//             </p>

//             <div className="row g-3">
//               <div className="col-12 col-sm-6 col-lg-4">
//                 <div className="card shadow-sm border-0 h-100">
//                   <div className="card-body">
//                     <h5 className="card-title fw-semibold">My Courses</h5>
//                     <p className="card-text text-muted">View and continue your courses.</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="col-12 col-sm-6 col-lg-4">
//                 <div className="card shadow-sm border-0 h-100">
//                   <div className="card-body">
//                     <h5 className="card-title fw-semibold">Mock Tests</h5>
//                     <p className="card-text text-muted">Attempt PMP mock exams and track performance.</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="col-12 col-sm-6 col-lg-4">
//                 <div className="card shadow-sm border-0 h-100">
//                   <div className="card-body">
//                     <h5 className="card-title fw-semibold">Performance</h5>
//                     <p className="card-text text-muted">Check your scores, weak areas, and reports.</p>
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





// // src/WebStudent/StudentModule/Dashboard/StudentDashboard.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import StudentSidebar from "./StudentSidebar";
// import DashboardHeader from "../../Shared/DashboardHeader";

// /* MUI + Recharts just for the widgets inside the content area */
// import {
//   Box,
//   Grid,
//   Typography,
//   Chip,
//   Card,
//   CardContent,
//   Button,
//   LinearProgress,
//   Avatar,
//   Divider,
//   CircularProgress,
//   IconButton,
//   Tooltip as MuiTooltip,
// } from "@mui/material";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// import { useAuth } from "../../LoginSystem/context/AuthContext";
// import {
//   resolveContinueItem,
//   buildScoreTrendFromAttempts,
//   computeWeakAreasFromQBank,
//   buildDomainTimeDonut,
//   fetchMockTestsCatalog,
//   fetchMyQBankSessions,
//   fetchMockAttempts,
// } from "./data";

// const brand = "#4748ac";

// /* ---------------- Route helpers (adjust here if your paths differ) ---------------- */
// const routes = {
//   mockAttempt: (attemptId) => `/student/mocktests/attempt/${attemptId}`,
//   mockStart:   (mockTestId) => `/student/mocktests/start/${mockTestId}`,


//   qbankHome:   () => `/student/qbank`,
//   qbankSession:(id) => `/student/qbank/session/${id}`,
//   qbankTag:    (tag) => `/student/qbank?tag=${encodeURIComponent(tag)}`,

//   ebooksHome:  () => `/student/ebooks`,
// };

// /* ---------- Small presentational atoms ---------- */
// function CardShell({ title, subtitle, loading, children, actions }) {
//   return (
//     <Card sx={{ borderRadius: 3, height: "100%", position: "relative" }}>
//       {/* tiny spinner in the top-right while this card is loading */}
//       {loading && (
//         <Box sx={{ position: "absolute", top: 10, right: 12 }}>
//           <CircularProgress size={18} />
//         </Box>
//       )}
//       <CardContent>
//         <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
//         {subtitle && (
//           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//             {subtitle}
//           </Typography>
//         )}
//         {children}
//         {actions}
//       </CardContent>
//     </Card>
//   );
// }

// function StatRow({ label, value, hint }) {
//   return (
//     <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
//       <Typography variant="body2">{label}</Typography>
//       <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
//       {hint && (
//         <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
//           {hint}
//         </Typography>
//       )}
//     </Box>
//   );
// }

// /* ---------- Widgets ---------- */
// function ContinueLearning({ item, loading, onResume }) {
//   if (loading) {
//     return (
//       <CardShell title="Continue Learning" loading>
//         <Box sx={{ height: 64 }} />
//       </CardShell>
//     );
//   }
//   if (!item) {
//     return (
//       <CardShell title="Continue Learning">
//         <Typography color="text.secondary">No recent activity yet.</Typography>
//       </CardShell>
//     );
//   }
//   return (
//     <CardShell title="Continue Learning" subtitle={item.label} loading={loading}
//       actions={
//         <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
//           {item.deepLink && (
//             <Button variant="contained" sx={{ bgcolor: brand }} onClick={onResume}>
//               Resume
//             </Button>
//           )}
//         </Box>
//       }
//     >
//       <LinearProgress
//         variant="determinate"
//         value={item.percent || 0}
//         sx={{
//           height: 8,
//           borderRadius: 8,
//           mb: 1,
//           "& .MuiLinearProgress-bar": { bgcolor: brand },
//         }}
//       />
//       <Typography variant="caption">{item.percent || 0}% complete</Typography>
//     </CardShell>
//   );
// }

// function MockAttempts({ attempts, catalog, loading, onOpenAttempt, onStartFull }) {
//   return (
//     <CardShell title="Mock Tests — Attempts" subtitle="Your latest exam & mini-test runs" loading={loading}>
//       {!loading && !attempts?.length && (
//         <Typography color="text.secondary" sx={{ mb: 1 }}>
//           You have no attempts yet.
//         </Typography>
//       )}
//       {!loading && attempts?.slice(0, 5).map((a, i) => (
//         <Box key={a.attemptId || i} sx={{ display: "flex", alignItems: "center", gap: 1, mb: .75 }}>
//           <Avatar sx={{ width: 28, height: 28, bgcolor: brand }}>{i + 1}</Avatar>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="body2" sx={{ fontWeight: 600 }}>
//               {a.title || "Mock Attempt"}
//             </Typography>
//             <Typography variant="caption" color="text.secondary">
//               {a.status || "IN_PROGRESS"} • {a.totalQuestions || 0} Qs
//             </Typography>
//           </Box>
//           <Button size="small" onClick={() => onOpenAttempt(a.attemptId)}>Open</Button>
//         </Box>
//       ))}
//       <Divider sx={{ my: 1.25 }} />
//       <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
//         <Button variant="contained" sx={{ bgcolor: brand }} onClick={() => onStartFull(catalog)}>
//           Start Full Exam
//         </Button>
//       </Box>
//     </CardShell>
//   );
// }

// function MockPerformance({ trend, loading }) {
//   return (
//     <CardShell title="Mock Tests — Performance" subtitle="Recent scores trend" loading={loading}>
//       <ResponsiveContainer width="100%" height={140}>
//         <LineChart data={trend}>
//           <XAxis dataKey="name" hide />
//           <YAxis domain={[0, 100]} hide />
//           <Tooltip />
//           <Line type="monotone" dataKey="score" stroke={brand} strokeWidth={3} dot />
//         </LineChart>
//       </ResponsiveContainer>
//       <Typography variant="caption">Aim for ≥ 85% to be ready.</Typography>
//     </CardShell>
//   );
// }

// function QBankAttempts({ sessions, loading, onOpenSession, onStartPractice }) {
//   return (
//     <CardShell title="Q-Bank — Attempts" subtitle="Recent practice sessions" loading={loading}>
//       {!loading && !sessions?.length && <Typography color="text.secondary">No sessions yet.</Typography>}
//       {!loading && sessions?.slice(0, 5).map((s, i) => (
//         <Box key={s.sessionId || s.id || i} sx={{ mb: 1 }}>
//           <StatRow label={s.title || s.bankName || `Session ${i + 1}`} value={`${s.progressPct ?? 0}%`} />
//           <LinearProgress
//             variant="determinate"
//             value={s.progressPct ?? 0}
//             sx={{ height: 6, borderRadius: 8, "& .MuiLinearProgress-bar": { bgcolor: brand } }}
//           />
//           <Button size="small" sx={{ mt: .5 }} onClick={() => onOpenSession(s.sessionId || s.id)}>
//             Open
//           </Button>
//         </Box>
//       ))}
//       <Divider sx={{ my: 1.25 }} />
//       <Button variant="outlined" onClick={onStartPractice}>
//         Start New Practice
//       </Button>
//     </CardShell>
//   );
// }

// function QBankPerformance({ weak, domain, loading, onPracticeTag }) {
//   return (
//     <CardShell title="Q-Bank — Performance" subtitle="Weak areas & time by domain" loading={loading}>
//       {/* Weak areas */}
//       {!loading && (!weak || !weak.length) && <Typography color="text.secondary">Not enough data yet.</Typography>}
//       {!loading && weak?.map((w) => (
//         <Box key={w.tag} sx={{ mb: 1.25 }}>
//           <Box sx={{ display: "flex", justifyContent: "space-between" }}>
//             <Typography variant="body2">{w.tag}</Typography>
//             <Typography variant="caption">{w.your}% correct</Typography>
//           </Box>
//           <LinearProgress
//             variant="determinate"
//             value={w.your}
//             sx={{ height: 6, borderRadius: 8, "& .MuiLinearProgress-bar": { bgcolor: brand } }}
//           />
//           <Button size="small" sx={{ mt: .5 }} onClick={() => onPracticeTag(w.tag)}>
//             Practice {w.tag}
//           </Button>
//         </Box>
//       ))}

//       <Divider sx={{ my: 1.25 }} />

//       {/* Time by domain donut */}
//       <ResponsiveContainer width="100%" height={160}>
//         <PieChart>
//           <Pie data={domain} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
//             {domain?.map((_, i) => <Cell key={i} fill={i === 0 ? brand : undefined} />)}
//           </Pie>
//           <Tooltip />
//         </PieChart>
//       </ResponsiveContainer>
//       <Typography variant="caption">Focus next on the smallest slices.</Typography>
//     </CardShell>
//   );
// }

// function EBookAttempts({ recent = [], loading, onOpenEBooks }) {
//   return (
//     <CardShell title="E-Book — Reading Sessions" subtitle="Recent chapters you opened" loading={loading}>
//       {!loading && !recent.length && <Typography color="text.secondary">No reading yet.</Typography>}
//       {!loading && recent.slice(0, 5).map((r, i) => (
//         <Box key={r.id || i} sx={{ display: "flex", alignItems: "center", gap: 1, mb: .75 }}>
//           <Avatar sx={{ width: 28, height: 28, bgcolor: brand }}>{i + 1}</Avatar>
//           <Typography variant="body2">{r.text || r.title || "Chapter"}</Typography>
//         </Box>
//       ))}
//       <Divider sx={{ my: 1.25 }} />
//       <Button variant="outlined" onClick={onOpenEBooks}>
//         Open E-Books
//       </Button>
//     </CardShell>
//   );
// }

// function EBookPerformance({ progressPct = 0, loading }) {
//   return (
//     <CardShell title="E-Book — Performance" subtitle="Overall reading progress" loading={loading}>
//       <LinearProgress
//         variant="determinate"
//         value={progressPct}
//         sx={{ height: 12, borderRadius: 12, "& .MuiLinearProgress-bar": { bgcolor: brand } }}
//       />
//       <Typography variant="caption">{progressPct}% of assigned chapters read</Typography>
//     </CardShell>
//   );
// }

// /* ======================= PAGE (keeps your outer layout) ======================= */
// export default function StudentDashboard() {
//   const navigate = useNavigate();

//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
//   const contentCols = isCollapsed ? "col-12 col-md-11 col-lg-11" : "col-12 col-md-9 col-lg-10";

//   const { user, ready } = useAuth();

//   /* Data state */
//   const [greet, setGreet] = useState("Welcome");
//   const [continueItem, setContinueItem] = useState(null);

//   // Mock
//   const [mockAttempts, setMockAttempts] = useState([]);
//   const [mockTrend, setMockTrend] = useState([]);
//   const [mockCatalog, setMockCatalog] = useState([]);

//   // Q-Bank
//   const [qSessions, setQSessions] = useState([]);
//   const [weakAreas, setWeakAreas] = useState([]);
//   const [domainTime, setDomainTime] = useState([]);

//   // E-Book
//   const [ebookRecent, setEbookRecent] = useState([]);
//   const [ebookProgressPct, setEbookProgressPct] = useState(0);

//   /* Loading flags (per card) */
//   const [loadingContinue, setLoadingContinue] = useState(true);
//   const [loadingMock, setLoadingMock] = useState(true);
//   const [loadingQBank, setLoadingQBank] = useState(true);
//   const [loadingEBook, setLoadingEBook] = useState(true);

//   /* Greeting */
//   useEffect(() => {
//     const h = new Date().getHours();
//     setGreet(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
//   }, []);

//   /* Load data once auth is ready */
//   useEffect(() => {
//     if (!ready) return;

//     // Continue
//     (async () => {
//       try {
//         setLoadingContinue(true);
//         const cont = await resolveContinueItem(user);
//         setContinueItem(cont);
//       } finally {
//         setLoadingContinue(false);
//       }
//     })();

//     // Mock — attempts + trend + catalog
//     (async () => {
//       try {
//         setLoadingMock(true);
//         setMockAttempts(await fetchMockAttempts(5));
//         setMockTrend(await buildScoreTrendFromAttempts(8));
//         setMockCatalog(await fetchMockTestsCatalog());
//       } finally {
//         setLoadingMock(false);
//       }
//     })();

//     // Q-Bank — sessions + analytics
//     (async () => {
//       try {
//         setLoadingQBank(true);
//         const uid = user?.id || user?._id;
//         const sessions = await fetchMyQBankSessions();
//         setQSessions(sessions);
//         setWeakAreas(await computeWeakAreasFromQBank(uid, 3));
//         setDomainTime(await buildDomainTimeDonut(uid));

//         // E-Book feed (reusing sessions for now)
//         setEbookRecent(
//           sessions.slice(0, 5).map((s) => ({
//             id: s.sessionId || s.id,
//             text: s.title || s.bankName || "Reading",
//           }))
//         );
//       } finally {
//         setLoadingQBank(false);
//       }
//     })();

//     // E-Book performance (if you expose a real % later, set it here)
//     (async () => {
//       try {
//         setLoadingEBook(true);
//         setEbookProgressPct(0);
//       } finally {
//         setLoadingEBook(false);
//       }
//     })();
//   }, [ready, user]);

//   const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "Student");

//   /* ---------------------- Navigation handlers ---------------------- */
//   const goResume = () => {
//     if (continueItem?.deepLink) navigate(continueItem.deepLink);
//   };
//   const openAttempt = (attemptId) => navigate(routes.mockAttempt(attemptId));
//   const startFullExam = (catalog) => {
//     const full = catalog?.[0];
//     if (full?.mockTestId) navigate(routes.mockStart(full.mockTestId));
//   };
 

//   const openSession = (id) => navigate(routes.qbankSession(id));
//   const startPractice = () => navigate(routes.qbankHome());
//   const practiceTag = (tag) => navigate(routes.qbankTag(tag));

//   const openEBooks = () => navigate(routes.ebooksHome());

//   return (
//     <div className="container-fluid p-0">
//       <div className="row g-0">
//         {/* Sidebar (unchanged logic) */}
//         <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
//           <StudentSidebar
//             isCollapsed={isCollapsed}
//             toggleSidebar={() => setIsCollapsed((prev) => !prev)}
//           />
//         </div>

//         {/* Offcanvas for mobile (unchanged) */}
//         <div
//           className="offcanvas offcanvas-start bg-dark text-white d-md-none"
//           tabIndex="-1"
//           id="mobileSidebar"
//           aria-labelledby="mobileSidebarLabel"
//         >
//           <div className="offcanvas-header">
//             <h5 className="offcanvas-title" id="mobileSidebarLabel">Student</h5>
//             <button
//               type="button"
//               className="btn-close btn-close-white"
//               data-bs-dismiss="offcanvas"
//               aria-label="Close"
//             ></button>
//           </div>
//           <div className="offcanvas-body p-0">
//             <StudentSidebar isCollapsed={false} toggleSidebar={() => {}} />
//           </div>
//         </div>

//         {/* Main content */}
//         <div className={`${contentCols} d-flex flex-column min-vh-100 bg-light`}>
//           <DashboardHeader />

//           <div className="container-fluid py-4 flex-grow-1 overflow-auto">
//             {/* Greeting (Bootstrap outside, MUI inside) */}
//             <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//               <Box>
//                 <Typography variant="h5" sx={{ fontWeight: 700 }}>
//                   {greet}, {displayName}
//                 </Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   {user?.email || ""}
//                 </Typography>
//               </Box>
//               <Chip color="primary" sx={{ bgcolor: brand }} label="🔥 Keep your streak!" />
//             </Box>

//             <Grid container spacing={2}>
//               {/* CONTINUE */}
//               <Grid item xs={12} md={6}>
//                 <ContinueLearning item={continueItem} loading={loadingContinue} onResume={goResume} />
//               </Grid>

//               {/* MOCK: Attempts vs Performance */}
//               <Grid item xs={12} md={3}>
//                 <MockAttempts
//                   attempts={mockAttempts}
//                   catalog={mockCatalog}
//                   loading={loadingMock}
//                   onOpenAttempt={openAttempt}
//                   onStartFull={startFullExam}
                  
//                 />
//               </Grid>
//               <Grid item xs={12} md={3}>
//                 <MockPerformance trend={mockTrend} loading={loadingMock} />
//               </Grid>

//               {/* Q-BANK: Attempts vs Performance */}
//               <Grid item xs={12} md={6}>
//                 <QBankAttempts
//                   sessions={qSessions}
//                   loading={loadingQBank}
//                   onOpenSession={openSession}
//                   onStartPractice={startPractice}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <QBankPerformance
//                   weak={weakAreas}
//                   domain={domainTime}
//                   loading={loadingQBank}
//                   onPracticeTag={practiceTag}
//                 />
//               </Grid>

//               {/* E-BOOK: Reading vs Performance */}
//               <Grid item xs={12} md={6}>
//                 <EBookAttempts
//                   recent={ebookRecent}
//                   loading={loadingEBook}
//                   onOpenEBooks={openEBooks}
//                 />
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <EBookPerformance progressPct={ebookProgressPct} loading={loadingEBook} />
//               </Grid>
//             </Grid>
//           </div>
//         </div>
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

        /* page bg shimmer */
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
          isolation: isolate; /* keep inner effects contained */
        }

        /* subtle dot pattern */
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

        /* gradient ribbon */
        .ez-ribbon {
          position: absolute; top: 0; left: 0; right: 0; height: 7px;
          background: linear-gradient(90deg, var(--brand), var(--brand-2) 55%, #aab0ff);
          z-index: 2;
        }

        /* glow blob */
        .ez-blob {
          position: absolute; right: -60px; top: -60px;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(111,112,255,.22), rgba(71,72,172,.10) 60%, transparent 70%);
          filter: blur(12px);
          z-index: 1; pointer-events: none;
          transform: translateZ(0);
        }

        .ez-body {
          position: relative; z-index: 3;
          padding: 1.25rem 1.25rem 1.3rem 1.25rem;
        }

        .ez-title {
          color: var(--ink);
          font-weight: 800;
          letter-spacing: .2px;
          margin: .4rem 0 .35rem;
        }

        .ez-text { color: var(--muted); margin: 0; }

        .ez-icon {
          width: 52px; height: 52px;
          display: grid; place-items: center;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(71,72,172,.14), rgba(111,112,255,.10));
          border: 1px solid rgba(71,72,172,.22);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.4);
        }
        .ez-icon svg { width: 24px; height: 24px; }

        /* CTA arrow */
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

        /* Tap feedback */
        .ez-card:active { transform: translateY(-1px) scale(.998); }

        /* Mobile tweaks */
        @media (max-width: 576px) {
          .ez-body { padding: 1rem 1rem 1.05rem 1rem; }
          .ez-card { min-height: 165px; }
        }

        /* Motion respect */
        @media (prefers-reduced-motion: reduce) {
          .ez-card, .ez-cta .ez-arrow { transition: none; }
        }
      `}</style>

      <div className="row g-0 ez-bg">
        {/* Sidebar column (md and up) */}
        <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
          <StudentSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={() => setIsCollapsed((prev) => !prev)}
          />
        </div>

        {/* Offcanvas sidebar for mobile */}
        <div
          className="offcanvas offcanvas-start bg-dark text-white d-md-none"
          tabIndex="-1"
          id="mobileSidebar"
          aria-labelledby="mobileSidebarLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="mobileSidebarLabel">Student</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body p-0">
            <StudentSidebar isCollapsed={false} toggleSidebar={() => {}} />
          </div>
        </div>

        {/* Main content column */}
        <div className={`${contentCols} d-flex flex-column min-vh-100`} style={{background:"transparent"}}>
          <DashboardHeader />

          <div className="container-fluid py-4 flex-grow-1 overflow-auto">
            <h2 className="fw-bold text-dark mb-2">Welcome to Your Dashboard</h2>
            <p className="text-muted mb-4">Quick links to your E-Books, Q-Bank, and Mock Tests.</p>

            <div className="row ez-grid">
              {/* E-Books */}
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
                    <span className="ez-cta">Open <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <Link to="/ebooks" className="ez-link" aria-label="Go to E-Books" />
                  </div>
                </div>
              </div>

              {/* Q-Bank */}
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
                    <span className="ez-cta">Practice <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <Link to="/student/qbank" className="ez-link" aria-label="Go to Q-Bank" />
                  </div>
                </div>
              </div>

              {/* Mock Tests */}
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
                    <span className="ez-cta">Start <svg className="ez-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <Link to="/student/mocktests" className="ez-link" aria-label="Go to Mock Tests" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> {/* /content */}
      </div>
    </div>
  );
}
