import React, { useEffect } from "react";

const PDUs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.hero}>
        <h1 style={styles.title}>Professional Development Units (PDUs)</h1>
        <p style={styles.subtitle}>
          Unlock your potential with industry-recognized PDUs at Edzest.
        </p>
      </div>

      {/* What are PDUs */}
      <section style={styles.section}>
        <h2 style={styles.heading}>What are PDUs?</h2>
        <p style={styles.paragraph}>
          PDUs (Professional Development Units) are the measuring units used by
          organizations like PMI® to quantify approved learning and professional
          service activities. Earning PDUs helps professionals maintain their
          certifications and continuously grow their skills.
        </p>
      </section>

      {/* Benefits */}
      <section style={styles.section}>
        <h2 style={styles.heading}>Why Earn PDUs with Edzest?</h2>
        <div className="card-container">
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="pdu-card fadeUp"
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              <h4 style={styles.cardTitle}>{item.title}</h4>
              <p style={styles.cardDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={styles.section}>
        <h2 style={styles.heading}>How It Works</h2>
        <ul className="steps-list">
          {steps.map((step, idx) => (
            <li key={idx} className="step-item fadeUp" style={{ animationDelay: `${idx * 0.3}s` }}>
              <span className="step-number">{idx + 1}</span>
              <span className="step-text">{step}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Edzest Education Services. All rights reserved.</p>
      </footer>

      {/* Responsive + Animation CSS */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fadeUp {
          opacity: 0;
          animation: fadeInUp 0.8s ease forwards;
        }

        .card-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
        }

        .pdu-card {
          background: #fff;
          border-radius: 12px;
          padding: 25px;
          width: 300px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s;
        }

        .pdu-card:hover {
          transform: translateY(-5px);
        }

        .steps-list {
          list-style: none;
          padding: 0;
          max-width: 700px;
          margin: 0 auto;
        }

        .step-item {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          font-size: 17px;
          line-height: 1.6;
        }

        .step-number {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #4748ac, #6365d3);
          border-radius: 50%;
          color: white;
          font-weight: bold;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 15px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .step-item:hover .step-number {
          transform: scale(1.1);
        }

        .step-text {
          flex: 1;
        }

        @media (max-width: 768px) {
          .pdu-card {
            width: 100%;
          }

          .steps-list {
            padding: 0 10px;
          }

          .step-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .step-number {
            margin-bottom: 10px;
            margin-right: 0;
          }

          .fadeUp {
            animation-duration: 1s;
          }
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 28px !important;
          }

          .pdu-card {
            padding: 20px;
          }

          .step-item {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

const benefits = [
  {
    title: "Globally Recognized",
    desc: "Our PDUs are aligned with international certification bodies like PMI®.",
  },
  {
    title: "Career Growth",
    desc: "Stay competitive by keeping your credentials up to date.",
  },
  {
    title: "Flexible Learning",
    desc: "Earn PDUs at your pace through self-paced or live courses.",
  },
];

const steps = [
  "Choose a relevant Edzest course or program.",
  "Complete the course activities and assessments.",
  "Download your certificate with credited PDUs.",
  "Report your PDUs to PMI® or relevant authority.",
];

const styles = {
  wrapper: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f5f7fa",
    color: "#333",
    paddingBottom: "50px",
    animation: "fadeIn 1s ease-in",
  },
  hero: {
    backgroundColor: "#4748ac",
    color: "#fff",
    textAlign: "center",
    padding: "60px 20px 40px",
    animation: "fadeInUp 1s ease",
  },
  title: {
    fontSize: "38px",
    margin: "0 0 15px",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: "18px",
    fontWeight: "400",
    maxWidth: "600px",
    margin: "0 auto",
  },
  section: {
    padding: "60px 20px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "28px",
    color: "#4748ac",
    marginBottom: "20px",
    fontWeight: "600",
    textAlign: "center",
  },
  paragraph: {
    fontSize: "18px",
    lineHeight: "1.7",
    textAlign: "center",
    maxWidth: "800px",
    margin: "0 auto",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#4748ac",
    marginBottom: "10px",
  },
  cardDesc: {
    fontSize: "16px",
    lineHeight: "1.6",
  },
  footer: {
    textAlign: "center",
    marginTop: "60px",
    fontSize: "14px",
    color: "#888",
  },
};

export default PDUs;
