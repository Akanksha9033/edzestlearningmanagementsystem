// import React from "react";
// import { ListGroup, Card } from "react-bootstrap";
// import { Link } from "react-scroll";

// const InThisArticle = ({ sections }) => {
//   return (
//     <Card className="p-3">
//       <Card.Title>In This Article</Card.Title>
//       <ListGroup variant="flush" style = {{cursor : "pointer"}}>
//         {sections.map((section) => (
//           <ListGroup.Item key={section.id}>
//             <Link
//               to={section.id}
//               smooth={true}
//               duration={500}
//               containerId="content-scroll-container"
//               offset={-50}
//             >
//               {section.title}
//             </Link>
//           </ListGroup.Item>
//         ))}
//       </ListGroup>
//     </Card>
//   );
// };

// export default InThisArticle;


import React, { useEffect, useState } from "react";
import { ListGroup, Card } from "react-bootstrap";
import { scroller } from "react-scroll";

const InThisArticle = ({ sections }) => {
  const [currentSections, setCurrentSections] = useState([]);

  useEffect(() => {
    // Ensure sections is an array and filter out any invalid sections
    if (Array.isArray(sections)) {
      const validSections = sections.filter(
        (section) => section && section.id && section.title
      );
      setCurrentSections(validSections);
    } else {
      setCurrentSections([]);
    }
  }, [sections]);

  const handleScroll = (sectionId) => {
    if (!sectionId) return;

    const cleanId = sectionId.trim().replace(/[^a-zA-Z0-9_-]/g, "_"); // Ensure valid ID

    setTimeout(() => {
      scroller.scrollTo(cleanId, {
        duration: 500, // Smooth scroll duration (500ms)
        delay: 0,
        smooth: "easeInOutQuad", // Smooth scrolling effect
        offset: -50, // Adjust scroll position (prevent hiding behind navbar)
      });
    }, 300);
  };

  return (
    <Card
      className="p-3 d-flex flex-column bg-light border-end position-fixed"
      style={{
        width: "250px",
        right: "0",
        top: "140px",
        height: "calc(100vh - 140px)", // Ensures it fills the available space
        overflowY: "auto", // Enables scrolling if content overflows
        cursor: "pointer",
      }}
    >
      <Card.Title>In This Article</Card.Title>
      <ListGroup
        variant="flush"
        className="flex-grow-1 overflow-auto" // Ensures the list scrolls
        style={{ maxHeight: "100%" }}
      >
        {sections === undefined ? (
          <ListGroup.Item className="text-muted">Loading...</ListGroup.Item>
        ) : currentSections.length > 0 ? (
          currentSections.map((section, index) => (
            <ListGroup.Item key={section.id || index} onClick={() => handleScroll(section.id)}>
              {section.title}
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item className="text-muted">No sections available</ListGroup.Item>
        )}
      </ListGroup>
    </Card>
  );
};

export default InThisArticle;
