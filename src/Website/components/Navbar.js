




import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../Assets/Logo.png";
import { AuthContext } from "../../LoginSystem/context/AuthContext";
import { Dropdown, Container, Row, Col } from "react-bootstrap";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [showMobileResources, setShowMobileResources] = useState(false);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);
  const closeDropdown = () => { setShow(false); closeMenu(); };

  const handleNavClick = () => {
    window.scrollTo(0, 0);
    closeMenu();
    closeDropdown();
  };

  const handleLogout = async () => { await logout(); navigate("/"); };
  const handleMobileLogout = async () => { await logout(); closeMenu(); navigate("/"); };

  const trackEvent = (eventName, label) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, { event_category: "resources_menu", event_label: label });
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2 d-flex justify-content-between align-items-center">
        {/* Logo */}
        <div className="d-flex align-items-center border-0">
          <Link to="/" onClick={closeMenu}>
            <img
              src={Logo}
              alt="Logo"
              className="h-18 w-18 ml-4 object-contain border-0"
              style={{ height: "70px", width: "99px" }}
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="d-none d-md-flex gap-4 text-gray-700 font-medium align-items-center">
          <a
            href="https://exams.edzest.org/learn/PMP-Oct25"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 text-decoration-none hover:text-[#4748ac]"
          >
            Training
          </a>

          <a
            href="https://exams.edzest.org/learn/PMP-mock-exams"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 text-decoration-none hover:text-[#4748ac]"
          >
            Mock Exams
          </a>

          <Dropdown show={show} onToggle={(isOpen) => setShow(isOpen)}>
            <Dropdown.Toggle
              as="button"
              className="bg-transparent border-0 text-dark p-0 m-0 shadow-none hover:text-primary"
            >
              Resources
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-2 shadow-lg bg-white rounded border" style={{ minWidth: "220px" }}>
              <Container>
                <Row>
                  <Col className="d-flex flex-column">
                    <Link
                      to="/docs"
                      onClick={() => { trackEvent("project_docs_click", "Project Docs"); handleNavClick(); }}
                      className="text-dark text-decoration-none py-2 px-3 rounded hover-bg-light"
                    >
                      Project Docs
                    </Link>
                    <Link
                      to="/flashcards"
                      onClick={() => { trackEvent("flashcards_click", "Flashcards"); handleNavClick(); }}
                      className="text-dark text-decoration-none py-2 px-3 rounded hover-bg-light"
                    >
                      Flashcards
                    </Link>
                    <Link
                      to="/PdfDocs"
                      onClick={() => { trackEvent("pdf_docs_click", "PDF Docs"); handleNavClick(); }}
                      className="text-dark text-decoration-none py-2 px-3 rounded hover-bg-light"
                    >
                      Pdf Docs
                    </Link>
                  </Col>
                </Row>
              </Container>
            </Dropdown.Menu>
          </Dropdown>

          {/* <Link to="/blogs" onClick={handleNavClick} className="text-gray-800 text-decoration-none hover:text-[#4748ac]">
            Blogs
          </Link> */}

          <Link to="/about" onClick={handleNavClick} className="text-gray-800 text-decoration-none hover:text-[#4748ac]">
            About us
          </Link>

          <Link to="/contact" onClick={handleNavClick} className="text-gray-800 text-decoration-none hover:text-[#4748ac]">
            Contact us
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded text-white text-decoration-none bg-danger hover:bg-dark"
              style={{ marginTop: "-7px" }}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-3 py-2 rounded text-white text-decoration-none bg-[#4748ac] hover:bg-[#37378c]"
              style={{ marginTop: "-7px" }}
            >
              Log in
            </button>
          )}
        </nav>

        {/* Hamburger (mobile only) */}
        <div className="d-md-none">
          <button
            onClick={toggleMenu}
            className="btn btn-hamburger text-gray-700"
            aria-label="Open menu"
            aria-expanded={isMenuOpen ? "true" : "false"}
            aria-controls="mobile-menu"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              width="28"
              height="28"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop overlay */}
      {isMenuOpen && <div className="mobile-overlay d-md-none" onClick={closeMenu} aria-hidden="true" />}

      {/* Mobile Drawer */}
      {/* Mobile Menu */}
{isMenuOpen && (
  <div id="mobile-menu" className="mobile-menu d-md-none" role="dialog" aria-modal="true">
    <button onClick={closeMenu} className="btn-close position-absolute top-0 end-0 m-3" aria-label="Close" />

    {/* header (logo optional) */}
    <div className="mobile-menu__header">
      <img src={Logo} alt="Edzest" className="mobile-menu__logo" />
    </div>

    <nav className="mobile-nav">
      <a
        href="https://exams.edzest.org/learn/PMP-Oct25"
        target="_blank"
        rel="noopener noreferrer"
        className="mobile-link"
      >
        Training
      </a>

      <a
        href="https://exams.edzest.org/learn/PMP-mock-exams"
        target="_blank"
        rel="noopener noreferrer"
        className="mobile-link"
      >
        Mock Exams
      </a>

      <button
        type="button"
        onClick={() => setShowMobileResources(!showMobileResources)}
        className="mobile-link mobile-link--button"
        aria-expanded={showMobileResources ? "true" : "false"}
      >
        Resources <span className={`caret ${showMobileResources ? "open" : ""}`}>▼</span>
      </button>

      {showMobileResources && (
        <div className="sub-links">
          <Link
            to="/docs"
            onClick={() => { trackEvent("project_docs_click", "Project Docs"); handleNavClick("/docs"); }}
            className="mobile-sublink"
          >
            Project Docs
          </Link>
          <Link
            to="/flashcards"
            onClick={() => { trackEvent("flashcards_click", "Flashcards"); handleNavClick("/flashcards"); }}
            className="mobile-sublink"
          >
            Flashcards
          </Link>
          <Link
            to="/PdfDocs"
            onClick={() => { trackEvent("pdf_docs_click", "PDF Docs"); handleNavClick("/PdfDocs"); }}
            className="mobile-sublink"
          >
            Pdf Docs
          </Link>
        </div>
      )}

      {/* <Link to="/blogs" onClick={() => handleNavClick("/blogs")} className="mobile-link">
        Blogs
      </Link> */}

      <Link to="/about" onClick={() => handleNavClick("/about")} className="mobile-link">
        About us
      </Link>

      <Link to="/contact" onClick={() => handleNavClick("/contact")} className="mobile-link">
        Contact us
      </Link>

      {user ? (
        <button onClick={handleMobileLogout} className="mobile-primary-btn">
          Logout
        </button>
      ) : (
        <button
          onClick={() => { navigate("/login"); closeMenu(); }}
          className="mobile-primary-btn"
        >
          Log in
        </button>
      )}
    </nav>
  </div>
)}


      {/* Scoped CSS */}
      <style>{`
      @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Overlay */
.mobile-overlay{
  position:fixed; inset:0;
  background:rgba(0,0,0,.35);
  backdrop-filter:blur(1px);
  z-index:1049;
}

/* Drawer */
.mobile-menu{
  position:fixed; top:0; right:0;
  height:100vh; width:86%; max-width:360px;
  background:#fff; box-shadow:-4px 0 20px rgba(0,0,0,.15);
  z-index:1050; animation:slideInRight .25s ease forwards;
  display:flex; flex-direction:column; -webkit-overflow-scrolling:touch;
}

.mobile-menu__header{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px; border-bottom:1px solid #eee;
}
.mobile-menu__logo{ height:42px; width:auto; }

/* Nav container */
.mobile-nav{
  display:flex; flex-direction:column; gap:8px;
  padding:14px 12px 18px;
  overflow-y:auto;
}

/* Primary links – CENTERED */
.mobile-link{
  display:flex; align-items:center; justify-content:center;
  text-align:center;
  width:100%; padding:12px 14px; color:#333;
  border-radius:8px; text-decoration:none; background:transparent;
  transition:background-color .18s ease, color .18s ease;
}
.mobile-link:hover, .mobile-link:focus-visible{
  background-color:#f4f5ff; color:#4748ac; outline:none;
}
.mobile-link--button{ border:none; background:transparent; }

/* caret for Resources */
.caret{ margin-left:8px; font-size:.9rem; transform:translateY(1px); }
.caret.open{ transform:rotate(180deg) translateY(-1px); }

/* Sub-links – CENTERED */
.sub-links{
  display:flex; flex-direction:column; gap:6px;
  margin:4px 0 8px;
  padding-left:0; border-left:0;
}
.mobile-sublink{
  text-decoration:none; color:#444;
  padding:10px 12px; border-radius:8px;
  text-align:center;
  transition:background-color .18s ease, color .18s ease;
}
.mobile-sublink:hover, .mobile-sublink:focus-visible{
  background:#f8f8f8; color:#4748ac; outline:none;
}

/* Smaller primary buttons and centered */
.mobile-primary-btn{
  width:72%;
  max-width:240px;
  padding:10px 12px;
  font-size:.95rem;
  border-radius:8px;
  background-color:#4748ac; color:#fff; border:none;
  margin:12px auto 0;     /* centers horizontally */
  font-weight:600;
}
.mobile-primary-btn:hover, .mobile-primary-btn:focus-visible{
  background-color:#37378c; outline:none;
}

/* Hamburger target */
.btn-hamburger{ padding:.4rem .6rem; line-height:1; border-radius:8px; }

/* Kill Bootstrap nav paddings when inside drawer, if any sneak in */
.mobile-menu .nav-link{ padding-left:0 !important; padding-right:0 !important; text-align:center !important; }

@media (min-width:768px){
  .mobile-menu, .mobile-overlay{ display:none !important; }
}


      `}</style>
    </header>
  );
};

export default Navbar;
