
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Image } from "react-bootstrap";
import { Element } from "react-scroll";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import InThisArticle from "../inThisArticle";
import ProjectSidebar from "../ProjectSidebar";
import useWindowSize from "../useWindowSize";
import "./content.css";
import ProjectNavBar from "../ProjectNavbar";

const Content = ({ contentData = [] }) => {
  const { chapterId, subChapterId } = useParams();
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  const screenWidth = useWindowSize();
  const isMobile = screenWidth < 992;
  const [showSidebar, setShowSidebar] = useState(!isMobile);


  const toggleSidebar = () => setShowSidebar((prev) => !prev); // Toggle sidebar

  useEffect(() => {
    if (selectedSubChapter) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedSubChapter]);

  useEffect(() => {
    setLoading(true);

    if (!contentData || contentData.length === 0) {
      setLoading(false);
      return;
    }

    const chapter = contentData.find(
      (ch) => ch.id?.toLowerCase().trim() === chapterId?.toLowerCase().trim()
    );

    if (!chapter) {
      console.log("Chapter not found:", chapterId);
      setSelectedSubChapter(null);
      setLoading(false);
      return;
    }

    if (!Array.isArray(chapter.subChapters)) {
      console.log("Subchapters are undefined for chapter:", chapterId);
      setSelectedSubChapter(null);
      setLoading(false);
      return;
    }

    const subChapter = chapter.subChapters.find(
      (sub) => sub.id?.toLowerCase().trim() === subChapterId?.toLowerCase().trim()
    );

    setSelectedSubChapter(subChapter || null);
    setLoading(false);
  }, [chapterId, subChapterId, contentData]);

  useEffect(() => {
    if (selectedSubChapter?.sections?.length > 0) {
      const firstSectionId = selectedSubChapter.sections[0].id.trim();
      const element = document.getElementById(firstSectionId);
  
      if (element) {
        element.focus({ preventScroll: true });
      }
    }
  }, [selectedSubChapter]);

  return (
    <>
       
       <ProjectNavBar toggleSidebar={toggleSidebar} />
      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={3} lg={3} className="sidebar-container">
            <div style={{ maxHeight: "80vh", overflowY: "auto", paddingRight: "5px" }}>
              <ProjectSidebar
                show={showSidebar}
                handleClose={() => setShowSidebar(false)}
                contentData={contentData}
              />
            </div>
          </Col>

          {/* Main Content */}
          <Col md={6} lg={7} style={{ padding: "20px 15px" }}>
            <div key={selectedSubChapter?.id}>
              {loading ? (
                <div className="text-center mt-4">
                  <h4>Loading...</h4>
                </div>
              ) : !selectedSubChapter ? (
                <Container className="text-center mt-4">
                  <h3 className="text-center mt-4 mb-4">Project Management Documentation</h3>
        <p>
          This documentation serves as a comprehensive guide to project management principles, methodologies,
          frameworks, and best practices. It is designed to help project managers, teams, and stakeholders understand
          the essential components of successful project execution.
        </p>
        <h4>Who Is This Documentation For?</h4>
        <p>
          <h5>This guide is beneficial for:</h5>
          <br />
          <strong>Aspiring & Experienced Project Managers</strong> – To refine skills and adopt industry best
          practices.<br />
          <strong>Business Leaders & Stakeholders</strong> – To understand project workflows and governance.<br />
          <strong>Team Members & Contributors</strong> – To align with project goals and methodologies.<br />
          <strong>Students & Researchers</strong> – To learn about project management concepts and frameworks.
        </p>
        <h4 style={{ marginTop: "10px" }}>--Select a topic from left-hand side</h4>

                </Container>
              ) : (
                <>
                  <h2 className="mb-4">{selectedSubChapter.title}</h2>
                  {selectedSubChapter.sections?.map((section, index) => {
                    if (!section.id) section.id = `section_${index}`;
                    const sectionId = section.id.trim().replace(/[^a-zA-Z0-9_-]/g, "_");

                    return (
                      <Element name={sectionId} key={sectionId} id={sectionId}>
                        <Card className="p-3">
                          <Card.Body>
                            <Card.Title>{section.title}</Card.Title>
                            
                            {/* 🔹 Render Image if Exists */}
                            {section.image && (
                              <div className="text-center my-3">
                                <Image
                                  src={section.image}
                                  alt={section.title}
                                  fluid
                                  style={{ maxHeight: "300px", width: "auto" }}
                                />
                              </div>
                            )}
                            
                            <ReactMarkdown>{section.content}</ReactMarkdown>
                          </Card.Body>
                        </Card>
                      </Element>
                    );
                  })}
                </>
              )}
            </div>
          </Col>

          {/* "In This Article" */}
          <Col md={3} lg={2} className="d-none d-md-block">
            {selectedSubChapter?.sections?.length > 0 && (
              <InThisArticle sections={selectedSubChapter.sections} />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Content;
