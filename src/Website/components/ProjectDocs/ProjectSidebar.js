import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ListGroup } from "react-bootstrap";

const ProjectSidebar = ({ contentData, show, handleClose }) => {
  const { chapterId, subChapterId } = useParams();
  const [expandedChapter, setExpandedChapter] = useState(chapterId || null);
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close sidebar when clicking outside (only on mobile)
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isMobile && show && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMobile, show, handleClose]);

  // Prevent rendering if sidebar is closed on mobile
  if (isMobile && !show) return null;

  const toggleChapter = (id) => {
    setExpandedChapter(expandedChapter === id ? null : id);
  };

  const handleSubchapterClick = () => {
    if (isMobile) {
      handleClose(); // Close sidebar on mobile
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={`sidebar ${show ? "show" : ""} d-flex flex-column bg-light border-end vh-100 position-fixed`}
      style={{
        width: "250px",
        left: "0",
        top: "100",
        maxHeight: "80vh",
        overflowY: "auto",
        paddingRight: "10px",
        zIndex: "1050",
      }}
    >
      <ListGroup className="fw-bold">
        {contentData.map((chapter) => (
          <div key={chapter.id}>
            {/* Chapter Title - Expandable */}
            <ListGroup.Item
              action
              className={`chapter-title ${expandedChapter === chapter.id ? "active" : ""}bg-light fw-bold py-2 border-bottom`}
              onClick={() => toggleChapter(chapter.id)}
            >
              {chapter.title}
            </ListGroup.Item>

            {/* Subchapters - Show if chapter is expanded */}
            {expandedChapter === chapter.id && (
              <ListGroup className="subchapter-list">
                {chapter.subChapters.map((sub) => (
                  <ListGroup.Item
                    as={Link}
                    to={`/docs/${chapter.id}/${sub.id}`}
                    key={sub.id}
                    action
                    onClick={handleSubchapterClick} // ✅ Closes sidebar only on mobile
                    className={`subchapter-item text-secondary fs-6 ps-4 ${sub.id === subChapterId ? "selected" : ""}`}
                  >
                    {sub.title}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        ))}
      </ListGroup>
    </div>
  );
};
export default ProjectSidebar;



