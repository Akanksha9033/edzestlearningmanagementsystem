import React from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaBookOpen,
  FaSchool,
  FaChartBar,
  FaSignOutAlt,
  FaCog,
} from "react-icons/fa";
import { useAuth } from "../../LoginSystem/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

/* ======================================================
   ✅ Menu configuration — just add 'path' fields
====================================================== */
const menuItems = [
  { id: "dashboard", icon: <FaTachometerAlt />, label: "Dashboard", path: "/admin/dashboard" },
  { id: "mocktest", icon: <FaBookOpen />, label: "MockTest", path: "/admin/mocktests" },
  { id: "q-bank", icon: <FaSchool />, label: "Q-Bank", path: "/admin/qbank/list" },
  // { id: "e-book", icon: <FaSchool />, label: "E-Book", path: "/admin/ebooks" },
  { id: "course", icon: <FaSchool />, label: "Courses", path: "/courses" },

  
];

export default function AdminSidebar({ isCollapsed, toggleSidebar }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* ------------------ Logout Handler ------------------ */
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* ------------------ Render ------------------ */
  return (
    <div className="bg-dark text-white d-flex flex-column justify-content-between vh-100 position-sticky top-0">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary">
        {!isCollapsed && <h5 className="mb-0 fw-bold">Admin</h5>}
        <button
          className="btn btn-sm btn-outline-light d-none d-md-inline-flex"
          onClick={toggleSidebar}
          type="button"
        >
          {isCollapsed ? "➤" : "◀"}
        </button>
      </div>

      {/* Menu */}
      <div className="flex-grow-1 overflow-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.id}
              className={`btn w-100 text-start d-flex align-items-center px-3 py-2 ${
                isActive ? "btn-primary" : "btn-dark"
              }`}
              type="button"
              onClick={() => navigate(item.path)} // ✅ navigate to path
            >
              <span className="fs-5 me-3">{item.icon}</span>
              <span
                className={`${isCollapsed ? "d-none d-md-none" : "d-inline"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="btn btn-dark w-100 text-start d-flex align-items-center px-3 py-2 border-top border-secondary text-danger"
        type="button"
      >
        <FaSignOutAlt className="fs-5 me-3" />
        <span className={`${isCollapsed ? "d-none d-md-none" : "d-inline"}`}>
          Logout
        </span>
      </button>
    </div>
  );
}
