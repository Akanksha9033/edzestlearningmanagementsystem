import React from "react";
import { Card, Button } from "react-bootstrap";

const WorkshopTrainingCard = ({ title, description, link }) => {
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <h4 style={{ color: "#4748ac" }}>{title}</h4>
        <Card.Text>{description}</Card.Text>
        <Button 
          variant="primary" 
          href={link} 
          target="_blank"
          style={{ backgroundColor: "#4748ac", borderColor: "#4748ac" }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#37378c")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4748ac")}
        >
          Learn More
        </Button>
      </Card.Body>
    </Card>
  );
};

export default WorkshopTrainingCard;
