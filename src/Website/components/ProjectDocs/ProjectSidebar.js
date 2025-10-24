// import React, { useState } from "react";
// import { ListGroup, Offcanvas, Col } from "react-bootstrap";
// import useWindowSize from "./useWindowSize";
// import { useNavigate } from "react-router-dom";


// const ProjectSidebar = ({ show, handleClose, contentData, onSelectChapter, onSelectSection }) => {
//   const screenWidth = useWindowSize();
//   const isMobile = screenWidth < 992;

//   const [expandedChapters, setExpandedChapters] = useState({});
//   const [selectedChapter, setSelectedChapter] = useState(null);
//   const [selectedSection, setSelectedSection] = useState(null);
//   const navigate = useNavigate(); // Initialize useNavigate

//   const handleChapterClick = (chapter) => {
//     setSelectedChapter(chapter);
//     onSelectChapter(chapter.id);

//     // Toggle expand/collapse state
//     setExpandedChapters((prev) => ({
//       ...prev,
//       [chapter.id]: !prev[chapter.id],
//     }));
//   };

//   const handleSectionClick = (chapter, section) => {
//     console.log("Clicked Section:", { chapter, section }); // ✅ Debugging Log
  
//     setSelectedChapter(chapter);
//     setSelectedSection(section);
//     onSelectChapter(chapter.id);
  
//     if (onSelectSection) {
//       onSelectSection(section);
//     }
  
//     // ✅ Ensure URL updates correctly
//     if (section.id) {
//       navigate(`/docs/${chapter.id}/${section.id}`);
//     } else {
//       navigate(`/docs/${chapter.id}`);
//     }
    
//   };
  
//   return (
//     <>
//       {!isMobile ? (
//         <Col lg={3} md={4} className="border-end sidebar pt-6 d-flex flex-column vh-100">
//           <ListGroup className="overflow-auto" style={{ fontWeight: "500" }}>
//             {contentData.map((chapter) => (
//               <div key={chapter.id}>
//                 <ListGroup.Item
//                   action
//                   active={selectedChapter?.id === chapter.id}
//                   onClick={() => handleChapterClick(chapter)}
//                   style={{ cursor: "pointer" }}
//                 >
//                   {chapter.title}
//                 </ListGroup.Item>

//                 {expandedChapters[chapter.id] && chapter.sections && (
//                   <ListGroup className="ms-3">
//                     {chapter.sections.map((section) => (
//                       <ListGroup.Item
//                         key={section.id}
//                         action
//                         active={selectedSection?.id === section.id}
//                         onClick={() => handleSectionClick(chapter, section)}
//                         style={{ fontSize: "14px", paddingLeft: "20px" }}
//                       >
//                         {section.title}
//                       </ListGroup.Item>
//                     ))}
//                   </ListGroup>
//                 )}
//               </div>
//             ))}
//           </ListGroup>
//         </Col>
//       ) : (
//         <Offcanvas show={show} style={{ width: "80%" }} onHide={handleClose}>
//           <Offcanvas.Body>
//             <ListGroup>
//               {contentData.map((chapter) => (
//                 <div key={chapter.id}>
//                   <ListGroup.Item action onClick={() => handleChapterClick(chapter)}>
//                     {chapter.title}
//                   </ListGroup.Item>
//                   {expandedChapters[chapter.id] && chapter.sections && (
//                     <ListGroup className="ms-3">
//                       {chapter.sections.map((section) => (
//                         <ListGroup.Item
//                           key={section.id}
//                           action
//                           active={selectedSection?.id === section.id}
//                           onClick={() => handleSectionClick(chapter, section)}
//                         >
//                           {section.title}
//                         </ListGroup.Item>
//                       ))}
//                     </ListGroup>
//                   )}
//                 </div>
//               ))}
//             </ListGroup>
//           </Offcanvas.Body>
//         </Offcanvas>
//       )}
//     </>
//   );
// };

// export default ProjectSidebar;


// import React, { useState } from "react";
// import { ListGroup, Offcanvas, Col } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import useWindowSize from "./useWindowSize";

// const ProjectSidebar = ({ show, handleClose, contentData, onSelectChapter, onSelectSection }) => {
//   const screenWidth = useWindowSize();
//   const isMobile = screenWidth < 992;
//   const navigate = useNavigate();

//   const [expandedChapters, setExpandedChapters] = useState({});
//   const [expandedSubChapters, setExpandedSubChapters] = useState({});
//   const [selectedChapter, setSelectedChapter] = useState(null);
//   const [selectedSubChapter, setSelectedSubChapter] = useState(null);
//   const [selectedSection, setSelectedSection] = useState(null);

//   const handleChapterClick = (chapter) => {
//     setSelectedChapter(chapter);
//     onSelectChapter(chapter); // Pass entire chapter

//     setExpandedChapters((prev) => ({
//       ...prev,
//       [chapter.id]: !prev[chapter.id],
//     }));
//   };

//   const handleSubChapterClick = (chapter, subChapter) => {
//     setSelectedSubChapter(subChapter);
//     onSelectChapter(chapter); // Pass entire chapter
//     onSelectSection(subChapter); // Ensure content updates

//     setExpandedSubChapters((prev) => ({
//       ...prev,
//       [subChapter.id]: !prev[subChapter.id],
//     }));
//   };

//   const handleSectionClick = (chapter, subChapter, section) => {
//     setSelectedChapter(chapter);
//     setSelectedSubChapter(subChapter);
//     setSelectedSection(section);
  
//     onSelectChapter(chapter); 
//     onSelectSection(section);
  
//     // Ensure the navigation path is correctly formatted
//     const formattedChapterId = chapter.id.toLowerCase();
//     const formattedSubChapterId = subChapter.id.toLowerCase();
//     const formattedSectionId = section.id.toLowerCase();
  
//     navigate(`/docs/${formattedChapterId}/${formattedSubChapterId}/${formattedSectionId}`);
//   };
  
  

//   const renderChapters = () => {
//     return (
//       <ListGroup className="overflow-auto" style={{ fontWeight: "500" }}>
//         {contentData.map((chapter) => (
//           <div key={chapter.id}>
//             <ListGroup.Item
//               action
//               active={selectedChapter?.id === chapter.id}
//               onClick={() => handleChapterClick(chapter)}
//               style={{ cursor: "pointer" }}
//             >
//               {chapter.title}
//             </ListGroup.Item>

//             {expandedChapters[chapter.id] &&
//               chapter.subChapters?.length > 0 && (
//                 <ListGroup className="ms-3">
//                   {chapter.subChapters.map((subChapter) => (
//                     <div key={subChapter.id}>
//                       <ListGroup.Item
//                         action
//                         active={selectedSubChapter?.id === subChapter.id}
//                         onClick={() => handleSubChapterClick(chapter, subChapter)}
//                         style={{ cursor: "pointer", fontWeight: "500" }}
//                       >
//                         {subChapter.title}
//                       </ListGroup.Item>

//                       {expandedSubChapters[subChapter.id] &&
//                         subChapter.sections?.length > 0 && (
//                           <ListGroup className="ms-3">
//                             {subChapter.sections.map((section) => (
//                               <ListGroup.Item
//                                 key={section.id}
//                                 action
//                                 active={selectedSection?.id === section.id}
//                                 onClick={() => handleSectionClick(chapter, subChapter, section)}
//                                 style={{ fontSize: "14px", paddingLeft: "20px" }}
//                               >
//                                 {section.title}
//                               </ListGroup.Item>
//                             ))}
//                           </ListGroup>
//                         )}
//                     </div>
//                   ))}
//                 </ListGroup>
//               )}
//           </div>
//         ))}
//       </ListGroup>
//     );
//   };

//   return (
//     <>
//       {!isMobile ? (
//         <Col lg={3} md={4} className="border-end sidebar pt-6 d-flex flex-column vh-100">
//           {renderChapters()}
//         </Col>
//       ) : (
//         <Offcanvas show={show} style={{ width: "80%" }} onHide={handleClose}>
//           <Offcanvas.Body>{renderChapters()}</Offcanvas.Body>
//         </Offcanvas>
//       )}
//     </>
//   );
// };

// export default ProjectSidebar;



// import React, { useState } from "react";
// import { ListGroup, Offcanvas, Col } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import useWindowSize from './useWindowSize'

// const ProjectSidebar = ({ show, handleClose, contentData, onSelectChapter, onSelectSection }) => {
//   const screenWidth = useWindowSize();
//   const isMobile = screenWidth < 992;
//   const navigate = useNavigate();

//   const [expandedChapters, setExpandedChapters] = useState({});
//   const [expandedSubChapters, setExpandedSubChapters] = useState({});

//   const handleChapterClick = (chapter) => {
//     onSelectChapter(chapter);
//     setExpandedChapters((prev) => ({ ...prev, [chapter.id]: !prev[chapter.id] }));
//   };

//   const handleSubChapterClick = (chapter, subChapter) => {
//     onSelectChapter(chapter);
//     onSelectSection(subChapter);

//     setExpandedSubChapters((prev) => ({ ...prev, [subChapter.id]: !prev[subChapter.id] }));
//   };

//   const handleSectionClick = (chapter, subChapter, section) => {
//     onSelectChapter(chapter);
//     onSelectSection(section);

//     navigate(`/docs/${chapter.id.toLowerCase()}/${subChapter.id.toLowerCase()}/${section.id.toLowerCase()}`);
//   };

//   const renderChapters = () => (
//     <ListGroup className="overflow-auto" style={{ fontWeight: "500" }}>
//       {contentData.map((chapter) => (
//         <div key={chapter.id}>
//           <ListGroup.Item action onClick={() => handleChapterClick(chapter)}>
//             {chapter.title}
//           </ListGroup.Item>

//           {expandedChapters[chapter.id] &&
//             chapter.subChapters?.map((subChapter) => (
//               <div key={subChapter.id}>
//                 <ListGroup.Item action onClick={() => handleSubChapterClick(chapter, subChapter)}>
//                   {subChapter.title}
//                 </ListGroup.Item>

//                 {expandedSubChapters[subChapter.id] &&
//                   subChapter.sections?.map((section) => (
//                     <ListGroup.Item key={section.id} action onClick={() => handleSectionClick(chapter, subChapter, section)}>
//                       {section.title}
//                     </ListGroup.Item>
//                   ))}
//               </div>
//             ))}
//         </div>
//       ))}
//     </ListGroup>
//   );

//   return (
//     <>
//       {!isMobile ? (
//         <Col lg={3} md={4} className="border-end sidebar pt-6 d-flex flex-column vh-100">
//           {renderChapters()}
//         </Col>
//       ) : (
//         <Offcanvas show={show} style={{ width: "80%" }} onHide={handleClose}>
//           <Offcanvas.Body>{renderChapters()}</Offcanvas.Body>
//         </Offcanvas>
//       )}
//     </>
//   );
// };

// export default ProjectSidebar;



// import React, { useState } from "react";
// import { ListGroup, Offcanvas, Col } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import useWindowSize from "./useWindowSize";

// const ProjectSidebar = ({ show, handleClose, contentData, onSelectChapter, onSelectSection }) => {
//   const screenWidth = useWindowSize();
//   const isMobile = screenWidth < 992;
//   const navigate = useNavigate();

//   const [expandedChapters, setExpandedChapters] = useState({});
//   const [expandedSubChapters, setExpandedSubChapters] = useState({});
//   const [selectedChapter, setSelectedChapter] = useState(null);
//   const [selectedSubChapter, setSelectedSubChapter] = useState(null);
//   const [selectedSection, setSelectedSection] = useState(null);

//   const handleChapterClick = (chapter) => {
//     setSelectedChapter(chapter);
//     onSelectChapter(chapter); // Pass entire chapter

//     setExpandedChapters((prev) => ({
//       ...prev,
//       [chapter.id]: !prev[chapter.id],
//     }));
//   };

//   const handleSubChapterClick = (chapter, subChapter) => {
//     setSelectedSubChapter(subChapter);
//     onSelectChapter(chapter); // Pass entire chapter
//     onSelectSection(subChapter); // Ensure content updates

//     setExpandedSubChapters((prev) => ({
//       ...prev,
//       [subChapter.id]: !prev[subChapter.id],
//     }));
//   };

//   const handleSectionClick = (chapter, subChapter, section) => {
//   setSelectedChapter(chapter);
//   setSelectedSubChapter(subChapter);
//   setSelectedSection(section);

//   onSelectChapter(chapter);
//   onSelectSection(section);

//   // ✅ Navigate to the new page
//   const formattedChapterId = chapter.id.toLowerCase();
//   const formattedSubChapterId = subChapter.id.toLowerCase();
//   const formattedSectionId = section.id.toLowerCase();

//   navigate(`/docs/${formattedChapterId}/${formattedSubChapterId}/${formattedSectionId}`);
  
//   // ✅ Enable scrolling when clicking a sidebar item
//   setTimeout(() => {
//     const contentContainer = document.getElementById("content-scroll-container");
//     if (contentContainer) {
//       contentContainer.scrollTop = 0; // Scroll to top when navigating
//     }
//   }, 100);
// };
  

//   const renderChapters = () => {
//     return (
//       <ListGroup className="overflow-auto w-100" style={{ fontWeight: "500" }}>
//         {contentData.map((chapter) => (
//           <div key={chapter.id}>
//             <ListGroup.Item
//               action
//               active={selectedChapter?.id === chapter.id}
//               onClick={() => handleChapterClick(chapter)}
//               style={{ cursor: "pointer" }}
//             >
//               {chapter.title}
//             </ListGroup.Item>

//             {expandedChapters[chapter.id] &&
//               chapter.subChapters?.length > 0 && (
//                 <ListGroup className="ms-3">
//                   {chapter.subChapters.map((subChapter) => (
//                     <div key={subChapter.id}>
//                       <ListGroup.Item
//                         action
//                         active={selectedSubChapter?.id === subChapter.id}
//                         onClick={() => handleSubChapterClick(chapter, subChapter)}
//                         style={{ cursor: "pointer", fontWeight: "500" }}
//                       >
//                         {subChapter.title}
//                       </ListGroup.Item>

//                       {expandedSubChapters[subChapter.id] &&
//                         subChapter.sections?.length > 0 && (
//                           <ListGroup className="ms-3">
//                             {subChapter.sections.map((section) => (
//                               <ListGroup.Item
//                                 key={section.id}
//                                 action
//                                 active={selectedSection?.id === section.id}
//                                 onClick={() => handleSectionClick(chapter, subChapter, section)}
//                                 style={{ fontSize: "14px", paddingLeft: "20px" }}
//                               >
//                                 {section.title}
//                               </ListGroup.Item>
//                             ))}
//                           </ListGroup>
//                         )}
//                     </div>
//                   ))}
//                 </ListGroup>
//               )}
//           </div>
//         ))}
//       </ListGroup>
//     );
//   };

//   return (
//     <>
//       {!isMobile ? (
//         <Col lg={12} md={4} className=" sidebar pt-12 d-flex flex-column vh-100" >
//           {renderChapters()}
//         </Col>
//       ) : (
//         <Offcanvas show={show} style={{ width: "70%" }} onHide={handleClose}>
//           <Offcanvas.Body>{renderChapters()}</Offcanvas.Body>
//         </Offcanvas>
//       )}
//     </>
//   );
// };

// export default ProjectSidebar;


// import React, { useState } from "react";
// import { ListGroup, Offcanvas, Col } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import useWindowSize from "./useWindowSize";

// const ProjectSidebar = ({
//   show,
//   handleClose,
//   contentData,
//   onSelectChapter,
//   onSelectSubChapter,
// }) => {
//   const screenWidth = useWindowSize();
//   const isMobile = screenWidth < 992;
//   const navigate = useNavigate();

//   const [expandedChapters, setExpandedChapters] = useState({});
//   const [selectedChapter, setSelectedChapter] = useState(null);
//   const [selectedSubChapter, setSelectedSubChapter] = useState(null);

//   const handleChapterClick = (chapter) => {
//     setSelectedChapter(chapter);
//     onSelectChapter(chapter);

//     // Expand/collapse chapters
//     setExpandedChapters((prev) => ({
//       ...prev,
//       [chapter.id]: !prev[chapter.id],
//     }));
//   };

//   const handleSubChapterClick = (chapter, subChapter) => {
//     if (!subChapter) return;

//     setSelectedSubChapter(subChapter);
//     onSelectSubChapter(subChapter);

//     // Navigate to the content URL
//     navigate(`/content/${chapter.id}/${subChapter.id}`);
//   };

//   return (
//     <>
//       {!isMobile ? (
//         <Col lg={12} md={4} className="sidebar vh-100 pt-3 d-flex flex-column">
//           <ListGroup className="overflow-auto w-100">
//             {contentData.map((chapter) => (
//               <div key={chapter.id}>
//                 {/* Chapter */}
//                 <ListGroup.Item
//                   action
//                   active={selectedChapter?.id === chapter.id}
//                   onClick={() => handleChapterClick(chapter)}
//                   style={{ fontWeight: "bold" }}
//                 >
//                   {chapter.title}
//                 </ListGroup.Item>

//                 {/* SubChapters */}
//                 {expandedChapters[chapter.id] && chapter.subChapters?.length > 0 && (
//                   <ListGroup className="ms-3">
//                     {chapter.subChapters.map((subChapter) => (
//                       <ListGroup.Item
//                         key={subChapter.id}
//                         action
//                         active={selectedSubChapter?.id === subChapter.id}
//                         onClick={() => handleSubChapterClick(chapter, subChapter)}
//                       >
//                         {subChapter.title}
//                       </ListGroup.Item>
//                     ))}
//                   </ListGroup>
//                 )}
//               </div>
//             ))}
//           </ListGroup>
//         </Col>
//       ) : (
//         <Offcanvas show={show} style={{ width: "70%" }} onHide={handleClose}>
//           <Offcanvas.Body>
//             <ListGroup className="overflow-auto w-100">
//               {contentData.map((chapter) => (
//                 <div key={chapter.id}>
//                   {/* Chapter */}
//                   <ListGroup.Item
//                     action
//                     active={selectedChapter?.id === chapter.id}
//                     onClick={() => handleChapterClick(chapter)}
//                   >
//                     {chapter.title}
//                   </ListGroup.Item>

//                   {/* SubChapters */}
//                   {expandedChapters[chapter.id] && chapter.subChapters?.length > 0 && (
//                     <ListGroup className="ms-3">
//                       {chapter.subChapters.map((subChapter) => (
//                         <ListGroup.Item
//                           key={subChapter.id}
//                           action
//                           active={selectedSubChapter?.id === subChapter.id}
//                           onClick={() => handleSubChapterClick(chapter, subChapter)}
//                         >
//                           {subChapter.title}
//                         </ListGroup.Item>
//                       ))}
//                     </ListGroup>
//                   )}
//                 </div>
//               ))}
//             </ListGroup>
//           </Offcanvas.Body>
//         </Offcanvas>
//       )}
//     </>
//   );
// };

// export default ProjectSidebar;


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