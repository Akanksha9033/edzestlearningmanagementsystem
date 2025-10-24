import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Container
} from '@mui/material';

const pdfs = [
  {
    _id: '1',
    name: 'PMP exam prep Summary book',
    path: '/pdfs/pmp-exam-prep-summary-book.pdf',
    uploadDate: '2025-05-20',
    wallpaper: '/pdf-img/summery.jpeg'
  },
  {
    _id: '2',
    name: 'Examination Content Outline Summary',
    path: '/pdfs/examination-content-outline-summary.pdf',
    uploadDate: '2025-05-20',
    wallpaper: '/pdf-img/ECO.jpeg'
  },
  {
    _id: '3',
    name: 'Traditional approach overview',
    path: '/pdfs/traditional-approach-overview.pdf',
    uploadDate: '2025-05-20',
    wallpaper: '/pdf-img/Traditional.jpeg'
  },
  {
    _id: '4',
    name: 'Project Management Tools and Techniques',
    path: '/pdfs/project-management.pdf',
    uploadDate: '2025-05-20',
    wallpaper: '/pdf-img/Tools.jpeg'
  },
  {
    _id: '5',
    name: 'Agile approach overview',
    path: '/pdfs/agile-approach-overview.pdf',
    uploadDate: '2025-05-20',
    wallpaper: '/pdf-img/Agile.jpeg'
  },
  {
    _id: '6',
    name: 'PMP Exam Mindset Taskwise',
    path: '/pdfs/pmp-exam-mindset-taskwise.pdf',
    uploadDate: '2025-08-11',
    wallpaper: '/pdf-img/Mind.jpeg'
  },
  {
    _id: '7',
    name: 'Project Documents Overview',
    path: '/pdfs/project-documents-overview.pdf',
    uploadDate: '2025-08-21',
    wallpaper: '/pdf-img/Project.jpeg'
  }
];

const PdfDocs = () => {
  const handleDownload = (pdfPath) => {
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = pdfPath.split('/').pop();
    link.click();
  };

  const handleView = (pdfPath) => {
    window.open(pdfPath, '_blank');
  };

  return (
    <Container maxWidth="lg" style={{ padding: '3rem 1rem' }}>
      <Typography variant="h4" align="center" gutterBottom style={{ fontWeight: 700 }}>
        PDF Document Library
      </Typography>
      <Typography variant="subtitle1" align="center" color="textSecondary">
        Access learning resources instantly – anytime, anywhere.
      </Typography>

      <Grid container spacing={4} justifyContent="center" style={{ marginTop: '2rem' }}>
        {pdfs.map((pdf) => (
          <Grid item xs={12} sm={6} md={4} key={pdf._id}>
            <Card className="pdf-card">
              <div
                className="card-wallpaper"
                style={{
                  backgroundImage: `url(${pdf.wallpaper})`
                }}
              />
              <CardContent>
                <Typography className="pdf-name" variant="h6" gutterBottom>
                  {pdf.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Uploaded on: {new Date(pdf.uploadDate).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions style={{ justifyContent: 'space-between', padding: '1rem' }}>
                <Button className="custom-btn" onClick={() => handleView(pdf.path)}>
                  View
                </Button>
                <Button className="custom-btn" onClick={() => handleDownload(pdf.path)}>
                  Download
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Font Import + Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&display=swap');

        .pdf-name {
          color: black;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
        }

        .pdf-card {
          height: 100%;
          width: 360px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: white;
        }

        .pdf-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .card-wallpaper {
          height: 200px;
          width: 360px;
          background-size: cover;
          background-position: center;
        }

        .custom-btn {
          background-color: #4748ac;
          color: white;
          font-weight: 600;
          border-radius: 8px;
          padding: 8px 22px;
          font-size: 15px;
          text-transform: none;
          transition: all 0.3s ease;
        }

        .custom-btn:hover {
          background-color: #3737ac;
          transform: scale(1.05);
          box-shadow: 0 4px 10px rgba(55, 55, 172, 0.3);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 600px) {
          .pdf-card {
            margin-bottom: 1rem;
            height: auto;
          }

          .custom-btn {
            width: 48%;
            font-size: 14px;
            padding: 8px 0;
          }
        }
      `}</style>
    </Container>
  );
};

export default PdfDocs;
