import React from "react";
import { Navbar, Container, Button } from "react-bootstrap";
import useWindowSize from "./useWindowSize"; // Custom hook to detect screen size

const ProjectNavBar = ({ toggleSidebar }) => {
  const screenWidth = useWindowSize();
  const isMobile = screenWidth < 992;

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="px-3">
      {isMobile && (
        <Button variant="outline-light" onClick={toggleSidebar} className="me-3">
          ☰
        </Button>
      )}
      <Navbar.Brand href="/docs/:chapterId/:subChapterId">PM Docs</Navbar.Brand>
    </Navbar>
  );
};

export default ProjectNavBar;
