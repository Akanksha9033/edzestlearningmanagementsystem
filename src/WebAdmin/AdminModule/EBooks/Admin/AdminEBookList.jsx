import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as ebooksApiModule from "../api/ebooksApi";
import LoadingAnimation from "../../../../Website/json_files/LoadingAnimation"


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
    return () => {
      mounted = false;
    };
  }, []);

  // 🎨 Inline styles (matching your approach)
  const styles = {
    page: {
      padding: "24px",
      fontFamily:
        "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      color: "#222",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    title: {
      fontSize: "22px",
      fontWeight: 700,
      color: "#4748ac",
    },
    // Keep only layout basics here; columns handled by CSS below
    grid: {
      display: "grid",
      gap: "20px",
    },
    card: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "box-shadow .2s ease, transform .2s ease",
    },
    cover: {
      width: "100%",
      height: "180px",
      objectFit: "cover",
      background: "#EEF0FF",
      display: "grid",
      placeItems: "center",
      color: "#4748ac",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer", // 👈 so it feels clickable
    },
    body: {
      padding: "14px 16px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      flexGrow: 1,
    },
    bookTitle: { fontWeight: 600, lineHeight: 1.3 },
    slug: { fontSize: "12px", color: "#6b7280" },
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
      fontWeight: 600,
      transition: "filter .15s ease, transform .15s ease",
    },
    btnBlue: { background: "#2563eb", color: "#fff" },
    btnGreen: { background: "#16a34a", color: "#fff" },
    statusBadge: (status) => ({
      alignSelf: "flex-start",
      marginTop: "4px",
      padding: "5px 10px",
      borderRadius: "999px",
      fontWeight: 700,
      fontSize: "11px",
      backgroundColor: status === "PUBLISHED" ? "#d4edda" : "#fff3cd",
      color: status === "PUBLISHED" ? "#155724" : "#856404",
    }),
    loading: { textAlign: "center", color: "#555", padding: "20px" },
    empty: {
      textAlign: "center",
      color: "#666",
      fontStyle: "italic",
      padding: "20px",
    },
  };

  // Make the grid side-by-side via CSS (not inline)
  const styleTag = `
    /* Base: 2 columns side-by-side */
    .ebook-grid { display: grid; gap: 20px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    /* Larger screens: more columns */
    @media (min-width: 1024px){ .ebook-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (min-width: 1536px){ .ebook-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .ebook-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .ebook-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
  `;

  if (loading) return (
    // <div style={styles.loading}>⏳ Loading e-books...</div>;
    <div>
      <LoadingAnimation/>
    </div>
  );
  if (error) return <div style={styles.loading}>❌ Error: {error}</div>;
  if (!ebooks.length) return <div style={styles.empty}>No e-books found.</div>;

  return (
    <div style={styles.page}>
      <style>{styleTag}</style>

      <div style={styles.header}>
        <h2 style={styles.title}>E-Books Management</h2>
        {/* Create button is on the Admin Dashboard; nothing here */}
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

          return (
            <div key={ebook.ebookid} className="ebook-card" style={styles.card}>
              {/* Cover — now clickable to open Preview */}
              {hasCover ? (
                <Link to={`/ebooks/read/${ebook.ebookid}`} style={{ display: "block" }}>
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
                >
                  <div style={styles.cover}>E-Book Cover</div>
                </Link>
              )}

              {/* Body */}
              <div style={styles.body}>
                <div style={styles.bookTitle}>{ebook.title}</div>
                {ebook.slug ? <div style={styles.slug}>/{ebook.slug}</div> : null}

                <div style={styles.metaWrap}>
                  {chips.map((c) => (
                    <span key={c} style={styles.chip}>
                      {c}
                    </span>
                  ))}
                </div>

                {/* Status */}
                <span style={styles.statusBadge(ebook.status)}>
                  {ebook.status}
                </span>

                {/* Actions */}
                <div style={styles.footer}>
                  {/* Edit (go to editor where Settings page has actions) */}
                  <Link to={`/admin/ebooks/edit/${ebook.ebookid}`}>
                    <button className="ebook-btn" style={{ ...styles.btn, ...styles.btnGreen }}>
                      Edit
                    </button>
                  </Link>

                  {/* Preview / Read by ID */}
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
