/* global gtag */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../Assets/Logo.png";
import { Dropdown, Container, Row, Col } from "react-bootstrap";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [showMobileResources, setShowMobileResources] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  const handleNavClick = (path) => {
    window.scrollTo(0, 0);
    closeMenu();
    closeDropdown();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const closeDropdown = () => {
    setShow(false);
    closeMenu();
  };

  const trackEvent = (eventName, label) => {
    if (typeof gtag === "function") {
      gtag("event", eventName, {
        event_category: "resources_menu",
        event_label: label,
      });
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center border-0">
          <Link to="/">
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

          {/* <Link
            to="/events"
            onClick={() => handleNavClick("/events")}
            className="text-gray-800 text-decoration-none hover:text-[#4748ac]"
          >
            Events
          </Link> */}

          <Dropdown show={show} onToggle={(isOpen) => setShow(isOpen)}>
            <Dropdown.Toggle
              as="button"
              className="bg-transparent border-0 text-dark p-0 m-0 shadow-none hover:text-primary"
            >
              Resources
            </Dropdown.Toggle>

            <Dropdown.Menu
              className="p-2 shadow-lg bg-white rounded border"
              style={{ minWidth: "220px" }}
            >
              <Container>
                <Row>
                  <Col className="d-flex flex-column">
                    <Link
                      to="/docs"
                      onClick={() => {
                        trackEvent("project_docs_click", "Project Docs");
                        handleNavClick("/docs");
                      }}
                      className="text-dark text-decoration-none py-2 px-3 rounded hover-bg-light"
                    >
                      Project Docs
                    </Link>

                    <Link
                      to="/flashcards"
                      onClick={() => {
                        trackEvent("flashcards_click", "Flashcards");
                        handleNavClick("/flashcards");
                      }}
                      className="text-dark text-decoration-none py-2 px-3 rounded hover-bg-light"
                    >
                      Flashcards
                    </Link>

                    <Link
                      to="/PdfDocs"
                      onClick={() => {
                        trackEvent("pdf_docs_click", "PDF Docs");
                        handleNavClick("/PdfDocs");
                      }}
                      className="text-dark text-decoration-none py-2 px-3 rounded hover-bg-light"
                    >
                      Pdf Docs
                    </Link>
                  </Col>
                </Row>
              </Container>
            </Dropdown.Menu>
          </Dropdown>

          <Link
            to="/about"
            onClick={() => handleNavClick("/about")}
            className="text-gray-800 text-decoration-none hover:text-[#4748ac]"
          >
            About us
          </Link>

           <Link
                to="/contact"
                onClick={() => handleNavClick("/contact")}
                className="d-block text-gray-700 text-center py-1 text-decoration-none hover:bg-[#4748ac] hover:text-white"
              >
                Contact us
              </Link>

          <a
            href="https://exams.edzest.org/learn/account/signin"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded text-white text-decoration-none bg-[#4748ac] hover:bg-[#37378c]"
            style={{ marginTop: "-7px" }}
          >
            Log in
          </a>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="d-md-none">
          <button onClick={toggleMenu} className="btn text-gray-700">
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="position-fixed top-0 pt-4 end-0 h-100 bg-light shadow-lg d-md-none"
            style={{ width: "80%", maxWidth: "300px", zIndex: 1050 }}
          >
            <button
              onClick={closeMenu}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Close"
            ></button>

            <nav className="p-4">
              <a
                href="https://exams.edzest.org/learn/PMP-training-23rd-Aug-batch"
                target="_blank"
                rel="noopener noreferrer"
                className="d-block text-gray-700 text-center py-1 text-decoration-none hover:bg-[#4748ac] hover:text-white"
              >
                Training
              </a>

              <a
                href="https://exams.edzest.org/learn/PMP-mock-exams"
                target="_blank"
                rel="noopener noreferrer"
                className="d-block text-gray-700 text-center py-1 text-decoration-none hover:bg-[#4748ac] hover:text-white"
              >
                Mock Exams
              </a>

              {/* <Link
                to="/events"
                onClick={() => handleNavClick("/events")}
                className="d-block text-gray-700 text-center py-1 text-decoration-none hover:bg-[#4748ac] hover:text-white"
              >
                Events
              </Link> */}

              <div className="d-flex flex-column align-items-center">
                <button
                  onClick={() => setShowMobileResources(!showMobileResources)}
                  className="text-dark bg-transparent border-0 py-1 w-100 text-center"
                >
                  Resources ▼
                </button>
                {showMobileResources && (
                  <div className="d-flex bg-white flex-column align-items-center w-100">
                    <Link
                      to="/docs"
                      onClick={() => {
                        trackEvent("project_docs_click", "Project Docs");
                        handleNavClick("/docs");
                      }}
                      className="text-gray-800 py-1 text-decoration-none hover:text-white hover:bg-[#4748ac]"
                    >
                      Project Docs
                    </Link>

                    <Link
                      to="/flashcards"
                      onClick={() => {
                        trackEvent("flashcards_click", "Flashcards");
                        handleNavClick("/flashcards");
                      }}
                      className="text-gray-700 text-center py-1 text-decoration-none hover:bg-[#4748ac] hover:text-white"
                    >
                      Flashcards
                    </Link>

                    <Link
                      to="/PdfDocs"
                      onClick={() => {
                        trackEvent("pdf_docs_click", "PDF Docs");
                        handleNavClick("/PdfDocs");
                      }}
                      className="text-dark text-decoration-none py-2 px-3 rounded hover-bg-light"
                    >
                      Pdf Docs
                    </Link>
                  </div>
                )}

                <div></div>
              </div>

              <Link
                to="/about"
                onClick={() => handleNavClick("/about")}
                className="d-block text-gray-700 text-center py-1 text-decoration-none hover:bg-[#4748ac] hover:text-white"
              >
                About us
              </Link>

               <Link
                to="/contact"
                onClick={() => handleNavClick("/contact")}
                className="d-block text-gray-700 text-center py-1 text-decoration-none hover:bg-[#4748ac] hover:text-white"
              >
                Contact us
              </Link>

              <a
                href="https://exams.edzest.org/learn/account/signin"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded text-decoration-none text-white text-center bg-[#4748ac] hover:bg-[#37378c] d-block mt-3"
                onClick={closeMenu}
              >
                Log in
              </a>
            </nav>
          </div>
        )}
      </div>
      <style>{`
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .mobile-menu {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    background: #ffffff;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
    width: 80%;
    max-width: 300px;
    z-index: 1050;
    animation: slideInRight 0.4s ease forwards;
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1rem;
    overflow-y: auto;
  }

  .mobile-menu button.btn-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    font-size: 1.5rem;
  }

  .mobile-menu nav a,
  .mobile-menu nav button {
    font-size: 1rem;
    padding: 0.6rem;
    color: #333;
    text-align: center;
    text-decoration: none;
    border-radius: 5px;
    transition: all 0.3s ease;
    width: 100%;
  }

  .mobile-menu nav a:hover,
  .mobile-menu nav button:hover {
    background-color: #4748ac;
    color: white;
  }

  .mobile-menu .sub-links a {
    font-size: 0.95rem;
    padding: 0.5rem;
    color: #444;
  }

  .mobile-menu .sub-links a:hover {
    background-color: #eee;
    color: #4748ac;
  }

  .login-button {
    background-color: #4748ac;
    color: white;
    padding: 0.7rem;
    border-radius: 8px;
    text-align: center;
    text-decoration: none;
    margin-top: 1.2rem;
    font-weight: bold;
  }

  .login-button:hover {
    background-color: #37378c;
  }

  @media (min-width: 768px) {
    .mobile-menu {
      display: none !important;
    }
  }
`}</style>
    </header>
  );
};

export default Navbar;
