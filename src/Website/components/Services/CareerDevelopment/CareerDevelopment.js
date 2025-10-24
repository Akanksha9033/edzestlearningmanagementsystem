import React, { useState, useRef } from "react";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import './careerdevelopment.css'

const CareerForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    experience: "",
    linkedin: "",
    careerAspiration: "",
    resume: null,
    interviewAssistance: "" 
  });

  const [isSubmitting, setIsSubmitting] = useState(false); 
  const fileInputRef = useRef(null); // Reference to the file input

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, resume: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Clear the file input after submission
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("experience", formData.experience);
    formDataToSend.append("linkedin", formData.linkedin);
    formDataToSend.append("careerAspiration", formData.careerAspiration);
    formDataToSend.append("resume", formData.resume);
    formDataToSend.append("interviewAssistance", formData.interviewAssistance);

    try {
      const response = await fetch("https://edzestweb-6.onrender.com/submit-career-form", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();
      alert(result.message);
      setFormData({
        name: "",
        email: "",
        experience: "",
        linkedin: "",
        careerAspiration: "",
        resume: null,
        interviewAssistance: "" 
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center vh-150 px-3 mb-8">
      <div className="w-70">
        <h2 className="text-center mb-3" style={{ color: "#4748ac" }}>
          Advance Your Project Management Career
        </h2>
        <p className="text-center mb-4">
          If you are looking for professional guidance or career development, please let us know.
        </p>

        <Form onSubmit={handleSubmit} className="shadow p-4 bg-light rounded">
          {/* Name Field */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4} >Full Name:</Form.Label>
            <Col sm={8}>
              <Form.Control  type="text" name="name" placeholder="Enter your Name" value={formData.name} onChange={handleChange} required className="custom-placeholder"/>
            </Col>
          </Form.Group>

          {/* Email Field */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Email:</Form.Label>
            <Col sm={8}>
              <Form.Control type="email" name="email" placeholder="Enter your Email" value={formData.email} onChange={handleChange} required className="custom-placeholder"/>
            </Col>
          </Form.Group>

          {/* Experience Dropdown */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Experience:</Form.Label>
            <Col sm={8}>
              <Form.Select name="experience" value={formData.experience} onChange={handleChange} required>
                <option value="">Select Experience Level</option>
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="10+">10+ years</option>
              </Form.Select>
            </Col>
          </Form.Group>

          {/* LinkedIn Profile Field */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>LinkedIn:</Form.Label>
            <Col sm={8}>
              <Form.Control type="url" name="linkedin" placeholder="Enter your LinkedIn link" value={formData.linkedin} onChange={handleChange}  className="custom-placeholder"/>
            </Col>
          </Form.Group>

          {/* Career Aspiration Field */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Career Aspiration:</Form.Label>
            <Col sm={8}>
              <Form.Control
                as="textarea"
                rows={3}
                name="careerAspiration"
                placeholder="What you want to achieve in life in 2-3 sentences..."
                value={formData.careerAspiration}
                onChange={handleChange}
                required
                className="custom-placeholder"
              />
            </Col>
          </Form.Group>

          {/* Interview Assistance Dropdown */}
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Interview Assistance:</Form.Label>
            <Col sm={8}>
              <Form.Select name="interviewAssistance" value={formData.interviewAssistance} onChange={handleChange} required>
                <option value="">Select an option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Select>
            </Col>
          </Form.Group>

          {/* Resume Upload */}
          <Form.Group as={Row} className="mb-3">
        <Form.Label column sm={4}>Upload Resume:</Form.Label>
        <Col sm={8}>
          <Form.Control
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            ref={fileInputRef} // Assign ref to file input
            required
          />
        </Col>
      </Form.Group>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              variant="primary"
              style={{ backgroundColor: "#4748ac", borderColor: "#4748ac" }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#37378c")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#4748ac")}
              disabled={isSubmitting}
              className="w-30"
            >
              {isSubmitting ? "Submitted..." : "Submit Application"}
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
};

export default CareerForm;