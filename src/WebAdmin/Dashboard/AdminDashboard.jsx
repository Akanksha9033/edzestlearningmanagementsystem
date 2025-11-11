import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import DashboardHeader from "../../Shared/DashboardHeader";
import CreateMenuButton from "../../Shared/CreateMenuButton";


export default function AdminDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);
 

  const sidebarCols = isCollapsed ? "col-md-1 col-lg-1" : "col-md-3 col-lg-2";
  const contentCols = isCollapsed ? "col-12 col-md-11 col-lg-11" : "col-12 col-md-9 col-lg-10";

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar (md+) */}
        <div className={`d-none d-md-block bg-dark ${sidebarCols}`}>
          <AdminSidebar
            isCollapsed={isCollapsed}
            toggleSidebar={() => setIsCollapsed((prev) => !prev)}
          />
        </div>

        {/* Offcanvas (mobile) */}
        <div
          className="offcanvas offcanvas-start bg-dark text-white d-md-none"
          tabIndex="-1"
          id="mobileSidebar"
          aria-labelledby="mobileSidebarLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="mobileSidebarLabel">Admin</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body p-0">
            <AdminSidebar isCollapsed={false} toggleSidebar={() => { }} />
          </div>
        </div>

        {/* Content */}
        <div className={`${contentCols} d-flex flex-column min-vh-100 bg-light`}>
          <DashboardHeader />

          <div className="container-fluid py-4 flex-grow-1 overflow-auto">
            {/* Header row with Create button on the far right */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="fw-bold text-dark mb-1">Admin Dashboard</h2>
                <p className="text-muted mb-0">Manage users, courses, reporting, and institute settings.</p>
              </div>

              <div className="ms-auto">
                <CreateMenuButton
                  label="Create"
                  items={[
                    { label: "Question Bank", to: "/admin/qbank/upload" },
                    { label: "MockTest", to: "/admin/mocktests" },
                    // { label: "Course", to: "/admin/courses/create" },
                    // { label: "E-Book", to: "/admin/ebooks/create/title" },
                  ]}
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-sm-6 col-lg-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h5 className="card-title fw-semibold">Users</h5>
                    <p className="card-text text-muted">Create, assign roles, and manage access.</p>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h5 className="card-title fw-semibold">Courses</h5>
                    <p className="card-text text-muted">Publish and organize institute courses.</p>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-lg-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h5 className="card-title fw-semibold">Reports</h5>
                    <p className="card-text text-muted">Track enrollments, completions, and usage.</p>                   
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
