import React from 'react';
import { Container } from 'react-bootstrap';

function Interview() {
  return (
    <Container fluid className="bg-white w-100 h-50 d-flex align-items-center justify-content-center mt-10 mb-10">
      <div className="text-center p-4 border rounded shadow">
        <div className="bg-danger text-white p-3 rounded">
          Any interview help needed? Contact
        </div>
        <div className="mt-3 fw-bold">contact@edzest.org</div>
      </div>
    </Container>
  );
}

export default Interview;
