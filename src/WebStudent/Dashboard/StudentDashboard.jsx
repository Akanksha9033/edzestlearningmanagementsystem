import React, { useState } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import DashboardHeader from "../../Shared/DashboardHeader";

export default function StudentDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
  const contentCols = isCollapsed
    ? "col-12 col-md-11 col-lg-11"
    : "col-12 col-md-9 col-lg-10";

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
          z-index: 1;
        }
        .ez-body { position: relative; z-index: 3; padding: 1.25rem; }
        .ez-title { color: var(--ink); font-weight: 800; margin: .4rem 0 .35rem; }
        .ez-text { color: var(--muted); margin: 0; }
        .ez-cta {
          display: inline-flex; align-items: center; gap: 6px;
          font-weight: 600; color: var(--brand); margin-top: .65rem;
        }
        .ez-link { position: absolute; inset: 0; }
      `}</style>

      <div className="row g-0 ez-bg">
        <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
          <StudentSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={() => setIsCollapsed((p) => !p)}
          />
        </div>

        <div className={`${contentCols} d-flex flex-column min-vh-100`}>
          <DashboardHeader />

          <div className="container-fluid py-4 flex-grow-1 overflow-auto">
            <h2 className="fw-bold text-dark mb-2">Welcome to Your Dashboard</h2>
            <p className="text-muted mb-4">
              Quick links to your Q-Bank and Mock Tests.
            </p>

            <div className="row ez-grid">
              {/* E-Books */}
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <h5 className="ez-title">E-Books</h5>
                    <p className="ez-text">Open your interactive e-books.</p>
                    <span className="ez-cta">Open →</span>
                    <Link to="/ebooks" className="ez-link" />
                  </div>
                </div>
              </div>

              {/* Q-Bank */}
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <h5 className="ez-title">Q-Bank</h5>
                    <p className="ez-text">Practice from question banks.</p>
                    <span className="ez-cta">Practice →</span>
                    <Link to="/student/qbank" className="ez-link" />
                  </div>
                </div>
              </div>

              {/* Mock Tests */}
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <h5 className="ez-title">Mock Tests</h5>
                    <p className="ez-text">Track your mock test attempts.</p>
                    <span className="ez-cta">Start →</span>
                    <Link to="/student/mocktests" className="ez-link" />
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="ez-card">
                  <div className="ez-ribbon" />
                  <div className="ez-blob" />
                  <div className="ez-body">
                    <h5 className="ez-title">Courses</h5>
                    <p className="ez-text">View available courses.</p>
                    <span className="ez-cta">View →</span>
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
