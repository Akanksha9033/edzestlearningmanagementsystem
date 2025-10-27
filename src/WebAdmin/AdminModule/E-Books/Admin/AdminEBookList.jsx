import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as ebooksApiModule from "../api/ebooksApi";
// import LoadingAnimation from "../../../../json_files/LoadingAnimation";

const api = ebooksApiModule.default || ebooksApiModule;

export default function AdminEBookList() {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const instituteId = "0z2w1ep"; // later from logged-in user

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.listEBooks(instituteId);
        if (!mounted) return;
        setEbooks(res.data.items || []);
      } catch (e) {
        console.error("[AdminEBookList] fetch error:", e);
        setError(e.message || "Failed to fetch e-books");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 🎨 Inline styles (kept) — layout tweaks only
  const styles = {
    page: {
      padding: "20px",
      fontFamily:
        "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      color: "#222",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
      gap: "12px",
      flexWrap: "wrap",
    },
    title: {
      fontSize: "22px",
      fontWeight: 700,
      color: "#4748ac",
      lineHeight: 1.2,
    },
    grid: {
      display: "grid",
      gap: "16px",
    },
    card: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "box-shadow .18s ease, transform .12s ease",
    },

    // We’ll rely on aspect-ratio for consistent covers; height acts as fallback
    cover: {
      width: "100%",
      height: "180px",                // fallback for older browsers
      aspectRatio: "16 / 9",          // preferred
      objectFit: "cover",
      background: "#EEF0FF",
      display: "grid",
      placeItems: "center",
      color: "#4748ac",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      userSelect: "none",
    },

    body: {
      padding: "12px 14px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      flexGrow: 1,
      minHeight: 0,
    },
    bookTitle: {
      fontWeight: 700,
      lineHeight: 1.25,
      fontSize: "clamp(14px, 1.4vw, 16px)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    slug: {
      fontSize: "12px",
      color: "#6b7280",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "100%",
    },
    metaWrap: {
      marginTop: "2px",
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
    },
    chip: {
      fontSize: "11px",
      padding: "3px 8px",
      borderRadius: "999px",
      background: "#F3F4F6",
      color: "#4b5563",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    status: {
      alignSelf: "flex-start",
      marginTop: "4px",
      padding: "5px 10px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "11px",
    },

    footer: {
      marginTop: "10px",
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    btn: {
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 700,
      transition: "filter .15s ease, transform .15s ease",
      flex: "1 1 140px",
    },
    btnBlue: { background: "#2563eb", color: "#fff" },
    btnGreen: { background: "#16a34a", color: "#fff" },

    loading: { textAlign: "center", color: "#555", padding: "20px" },
    empty: {
      textAlign: "center",
      color: "#666",
      fontStyle: "italic",
      padding: "20px",
    },
  };

  // Responsive grid & small visual polish via CSS
  const styleTag = `
    .ebook-grid { display:grid; gap:16px; grid-template-columns: 1fr; }
    @media (min-width: 640px){ .ebook-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap:18px; } }
    @media (min-width: 1024px){ .ebook-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap:20px; } }
    @media (min-width: 1440px){ .ebook-grid { grid-template-columns: repeat(4, minmax(0,1fr)); } }

    .ebook-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    .ebook-btn:hover { filter: brightness(1.07); transform: translateY(-1px); }

    /* Mobile buttons: stack cleanly */
    @media (max-width: 479px){
      .ebook-actions { display:grid; grid-template-columns: 1fr; gap:8px; }
    }
    @media (min-width: 480px){
      .ebook-actions { display:flex; flex-wrap:wrap; gap:8px; }
    }

    /* Reduced motion preference */
    @media (prefers-reduced-motion: reduce){
      .ebook-card:hover, .ebook-btn:hover { transform:none !important; }
    }
  `;

  if (loading) {
    return (
      <div>
        {/* <LoadingAnimation/> */}
      </div>
    );
  }
  if (error) return <div style={styles.loading}>❌ Error: {error}</div>;
  if (!ebooks.length) return <div style={styles.empty}>No e-books found.</div>;

  return (
    <div style={styles.page}>
      <style>{styleTag}</style>

      <div style={styles.header}>
        <h2 style={styles.title}>E-Books Management</h2>
        {/* Create button lives on Admin Dashboard */}
      </div>

      <div className="ebook-grid" style={styles.grid}>
        {ebooks.map((ebook) => {
          const hasCover = !!ebook.coverImage;
          const chips = [];
          if (Array.isArray(ebook.tags) && ebook.tags.length) {
            chips.push(...ebook.tags.slice(0, 3));
          }
          if (ebook.chaptersCount) {
            chips.push(`${ebook.chaptersCount} chapters`);
          }

          const statusBg =
            ebook.status === "PUBLISHED" ? "#d4edda" : "#fff3cd";
          const statusFg =
            ebook.status === "PUBLISHED" ? "#155724" : "#856404";

          return (
            <div key={ebook.ebookid} className="ebook-card" style={styles.card}>
              {/* Cover (clickable) */}
              {hasCover ? (
                <Link to={`/ebooks/read/${ebook.ebookid}`} style={{ display: "block" }} aria-label={`Open ${ebook.title || "E-Book"}`}>
                  <img
                    src={ebook.coverImage}
                    alt={ebook.title || "E-Book cover"}
                    style={styles.cover}
                    loading="lazy"
                  />
                </Link>
              ) : (
                <Link
                  to={`/ebooks/read/${ebook.ebookid}`}
                  style={{ display: "block", textDecoration: "none", color: "inherit" }}
                  aria-label={`Open ${ebook.title || "E-Book"}`}
                >
                  <div style={styles.cover}>E-Book Cover</div>
                </Link>
              )}

              {/* Body */}
              <div style={styles.body}>
                <div style={styles.bookTitle} title={ebook.title || ""}>
                  {ebook.title}
                </div>
                {ebook.slug ? (
                  <div style={styles.slug} title={`/${ebook.slug}`}>/{ebook.slug}</div>
                ) : null}

                <div style={styles.metaWrap}>
                  {chips.map((c) => (
                    <span key={c} style={styles.chip} title={c}>
                      {c}
                    </span>
                  ))}
                </div>

                {/* Status */}
                <span style={{ ...styles.status, backgroundColor: statusBg, color: statusFg }}>
                  {ebook.status}
                </span>

                {/* Actions */}
                <div className="ebook-actions" style={styles.footer}>
                  <Link to={`/admin/ebooks/edit/${ebook.ebookid}`}>
                    <button className="ebook-btn" style={{ ...styles.btn, ...styles.btnGreen }}>
                      Edit
                    </button>
                  </Link>

                  <Link to={`/ebooks/read/${ebook.ebookid}`}>
                    <button className="ebook-btn" style={{ ...styles.btn, ...styles.btnBlue }}>
                      Preview
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
