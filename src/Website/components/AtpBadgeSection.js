import React from "react";

// Since the logo is in /public, just use "/pmi-atp-2025.png"
const LOGO_SRC = "/pmi-atp-2025.png";

export default function AtpBadgeSection() {
  return (
    <section
      style={{
        padding: "60px 20px",
        background: "#f4f6fb",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <img
          src={LOGO_SRC}
          alt="PMI® Authorized Training Partner 2025"
          style={{
            maxWidth: "180px",
            marginBottom: "20px",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
        <h2
          style={{
            fontWeight: "800",
            fontSize: "1.9rem",
            marginBottom: "12px",
            color: "#151a33",
          }}
        >
          PMI<sup>®</sup> Authorized Training Partner (ATP)
        </h2>
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: "1.7",
            color: "#444",
            margin: 0,
          }}
        >
          We are officially recognized by PMI as an Authorized Training Partner
          (ATP 2025). Train with confidence in our PMP<sup>®</sup> programs.
        </p>
      </div>
    </section>
  );
}
