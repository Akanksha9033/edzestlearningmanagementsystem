import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import WorkshopTrainingCard from "./WorkshopTrainingCard";

const Workshop = () => {
  return (
    <Container className="py-5">
      <h2 className="text-center mb-4" style={{ color: "#4748ac" }}>Available Trainings</h2>
      
      {/* Online Trainings */}
      <h3 className="text-center mb-3" style={{ color: "#37378c" }}>Online Trainings</h3>
      <Row>
        <Col md={4}>
          <WorkshopTrainingCard 
            title="Managing Risk - Online" 
            description="Learn risk management techniques from anywhere in the world." 
            link="https://example.com/risk-management-online"
          />
        </Col>
        <Col md={4}>
          <WorkshopTrainingCard 
            title="Agile Approach - Online" 
            description="Understand Agile methodologies in a virtual setting." 
            link="https://example.com/agile-approach-online"
          />
        </Col>
        <Col md={4}>
          <WorkshopTrainingCard 
            title="Traditional Project Management - Online" 
            description="Structured project management training online." 
            link="https://example.com/traditional-pm-online"
          />
        </Col>
      </Row>

      {/* Offline Trainings */}
      <h3 className="text-center mt-5 mb-3" style={{ color: "#37378c" }}>Offline Trainings</h3>
      <Row>
        <Col md={4}>
          <WorkshopTrainingCard 
            title="Managing Risk - Offline" 
            description="Join hands-on risk management workshops in your city." 
            link="https://example.com/risk-management-offline"
          />
        </Col>
        <Col md={4}>
          <WorkshopTrainingCard 
            title="Agile Approach - Offline" 
            description="Engage in interactive Agile training sessions." 
            link="https://example.com/agile-approach-offline"
          />
        </Col>
        <Col md={4}>
          <WorkshopTrainingCard 
            title="Traditional Project Management - Offline" 
            description="Learn traditional project management in a classroom setting." 
            link="https://example.com/traditional-pm-offline"
          />
        </Col>
      </Row>

      {/* Final Learn More Button */}
      <div className="text-center mt-5">
        <Button 
          variant="primary" 
          href="https://example.com/all-trainings" 
          target="_blank"
          style={{ backgroundColor: "#4748ac", borderColor: "#4748ac" }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#37378c")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4748ac")}
        >
          Learn More About All Trainings
        </Button>
      </div>
    </Container>
  );
};

export default Workshop;
