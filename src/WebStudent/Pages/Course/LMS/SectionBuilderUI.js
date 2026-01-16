




import React, { useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DeleteEntityButton from "./DeleteSectionButton";
import ReactDOM from "react-dom";



const SectionBuilderUI = ({
  sections,
  onDragEnd,
  onToggleExpand,
  editingSectionId,
  editingTitle,
  setEditingSectionId,
  setEditingTitle,
  onSaveTitle,
  handleOpenDrawer,
  courseId,
  navigate,
  sectionRefs,
   onMoveLessonClick,   // ✅ ADD THIS
}) => {
  const [activeSectionMenu, setActiveSectionMenu] = React.useState(null);
const [moveSectionMode, setMoveSectionMode] = React.useState(false);
const [activeLessonMenu, setActiveLessonMenu] = React.useState(null);

const menuBtn = {
  width: "100%",
  padding: "10px 14px",
  background: "transparent",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 14,
};

  // Reusable glassy tokens
  const glassCard = {
    borderRadius: "16px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow:
      "0 6px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.4) inset",
    transition: "box-shadow 0.25s ease, transform 0.12s ease",
    color: "#212529",
  };

  const glassInner = {
    background: "rgba(255,255,255,0.9)",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
  };

  const hoverElevate = (target, up = true) => {
    target.style.boxShadow = up
      ? "0 10px 28px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.6) inset"
      : "0 6px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.4) inset";
    target.style.transform = up ? "translateY(-1px)" : "translateY(0)";
  };

  // ------- PERSIST/RESTORE OPEN STATE -------
  const OPEN_KEY = `course:${courseId}:openSectionId`;
  const LAST_LESSON_KEY = `course:${courseId}:lastLessonId`;

  useEffect(() => {
    if (!Array.isArray(sections) || sections.length === 0) return;

    const savedSectionId = sessionStorage.getItem(OPEN_KEY);
    if (!savedSectionId) return;

    const idx = sections.findIndex((s) => s._id === savedSectionId);
    if (idx === -1) return;

    if (!sections[idx].expanded) {
      onToggleExpand(idx);
    }

    setTimeout(() => {
      const secEl = sectionRefs?.current?.[savedSectionId];
      if (secEl?.scrollIntoView) {
        secEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const lastLessonId = sessionStorage.getItem(LAST_LESSON_KEY);
      if (lastLessonId) {
        const li = document.querySelector(`[data-lesson-id="${lastLessonId}"]`);
        if (li?.scrollIntoView) {
          li.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Helper: open one section and close all others
  const openOnlyThisSection = (indexToOpen) => {
    sections.forEach((s, i) => {
      if (i !== indexToOpen && s.expanded) onToggleExpand(i);
    });
    if (!sections[indexToOpen].expanded) onToggleExpand(indexToOpen);
  };

  // ===== Smooth collapse/expand (dynamic height) =====
  // One wrapper ref per section id
  const collapseRefs = useRef({});      // outer animated wrapper
  const contentRefs = useRef({});       // inner content for measuring

  // Ensure refs objects have keys
  const setCollapseRef = (id) => (el) => {
    collapseRefs.current[id] = el || undefined;
  };
  const setContentRef = (id) => (el) => {
    contentRefs.current[id] = el || undefined;
  };

  // Function to update a single section's max-height based on expanded state
  const syncSectionHeight = (sec) => {
    const wrap = collapseRefs.current[sec._id];
    const content = contentRefs.current[sec._id];
    if (!wrap || !content) return;

    // Always make sure transitions are present
    wrap.style.overflow = "hidden";
    wrap.style.transition = "max-height 320ms ease, opacity 200ms ease";
    wrap.style.willChange = "max-height, opacity";

    if (sec.expanded) {
      // Measure content and animate to that height
      const h = content.scrollHeight;
      // First, force a reflow if needed
      // eslint-disable-next-line no-unused-expressions
      wrap.offsetHeight;
      wrap.style.maxHeight = `${h}px`;
      wrap.style.opacity = "1";
      wrap.style.pointerEvents = "auto";
    } else {
      wrap.style.maxHeight = "0px";
      wrap.style.opacity = "0";
      wrap.style.pointerEvents = "none";
    }
  };

  // Sync all sections on change (expanded toggles, lessons load, etc.)
  useEffect(() => {
    if (!Array.isArray(sections)) return;
    // Use rAF to ensure DOM is painted before measuring
    const id = requestAnimationFrame(() => {
      sections.forEach(syncSectionHeight);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  // Also resync on window resize (content height changes)
  useEffect(() => {
    const onResize = () => {
      sections?.forEach((sec) => {
        if (sec.expanded) syncSectionHeight(sec);
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sections]);

  return (
   <DragDropContext
 onDragEnd={(result) => {
  console.log("🔥 DRAG FIRED (UI)", result);

  const { source, destination, type } = result;

  if (!destination) {
    console.log("❌ DROPPED OUTSIDE");
    return;
  }

  console.log("TYPE =", type);
  console.log("FROM =", source);
  console.log("TO   =", destination);

  // 🔴 VERY IMPORTANT DEBUG
  console.log("📤 FORWARDING DRAG EVENT TO PARENT");

  // parent handler call
  onDragEnd({
    ...result,
    _debugFromUI: true, // 👈 sirf debug ke liye
  });
}}

>

      <Droppable droppableId="sectionList" type="SECTION">

        {(provided) => (
          <ul
            className="list-group"
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{
              maxWidth: 1220,
              margin: "auto",
              padding: "8px",
              background:
                "linear-gradient(180deg, rgba(248,249,250,0.7), rgba(255,255,255,0.7))",
              borderRadius: "20px",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              scrollBehavior: "smooth",
            }}
          >
            {sections.length === 0 && (
              <li
                className="list-group-item text-center"
                style={{
                  ...glassCard,
                  padding: "16px",
                  fontWeight: 500,
                }}
              >
                No sections added yet.
              </li>
            )}

            {sections.map((sec, index) => (
              <Draggable
  key={sec._id}
  draggableId={sec._id}
  index={index}
  isDragDisabled={!moveSectionMode}
>

                {(provided) => (
                  <li
                    className="list-group-item p-0 mb-3"
                    ref={(el) => {
                      provided.innerRef(el);
                      sectionRefs.current[sec._id] = el;
                    }}
                    {...provided.draggableProps}


                    style={{
                      ...provided.draggableProps.style,
                      ...glassCard,
                      overflow: "visible",     // ✅ dropdown ko bahar nikalne dega
                       position: "relative",   // ✅ dropdown ka reference parent
                    }}
                    onMouseEnter={(e) => hoverElevate(e.currentTarget, true)}
                    onMouseLeave={(e) => hoverElevate(e.currentTarget, false)}
                  >
                    <div
                      className="p-3 d-flex justify-content-between align-items-center"
                      style={{
                        cursor: "pointer",
                        userSelect: "none",
                        overflow: "visible",   // ✅ ADD THIS LINE
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        borderTopLeftRadius: "16px",
                        borderTopRightRadius: "16px",
                        background: "rgba(255,255,255,0.92)",
                        transition: "background 180ms ease",
                      }}
                    >
                      <div
  onClick={() => {
    if (sec.expanded) {
      sessionStorage.removeItem(OPEN_KEY);
      onToggleExpand(index);
    } else {
      sessionStorage.setItem(OPEN_KEY, sec._id);
      openOnlyThisSection(index);
    }
  }}
  className="d-flex align-items-center"
>

                        <span
                          className="fs-5"
                          style={{
                            transition: "transform 200ms ease",
                            display: "inline-block",
                            transform: sec.expanded
                              ? "rotate(0deg)"
                              : "rotate(180deg)",
                            color: "rgba(33,37,41,0.7)",
                          }}
                        >
                          ▾
                        </span>

                        {editingSectionId === sec._id ? (
                          <>
                            <input
                              className="form-control d-inline w-auto"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              style={{
                                background: "rgba(255,255,255,0.95)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                color: "#212529",
                                height: 36,
                              }}
                            />
                            <button
                              className="btn btn-sm btn-success ms-2"
                              onClick={() => onSaveTitle(sec._id)}
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <strong
                            className="text-truncate"
                            style={{
                              color: "#212529",
                              fontSize: "1.05rem",
                              maxWidth: 420,
                            }}
                            title={sec.title}
                          >
                            {sec.title}
                          </strong>
                        )}
                      </div>

                      <div className="d-flex align-items-center">
                        <span className="me-3 text-muted">
                          {sec.lessons?.length || 0} Lessons • 0 Quizzes
                        </span>
                        <i
                          className="bi bi-pencil-square me-2 text-primary"
                          style={{ cursor: "pointer", fontSize: "1.1rem" }}
                          onClick={() => {
                            setEditingSectionId(sec._id);
                            setEditingTitle(sec.title);
                          }}
                          title="Edit title"
                        />
                        {/* ⠿ Drag Handle (always present) */}
<span
  {...provided.dragHandleProps}
  style={{
    cursor: moveSectionMode ? "grab" : "not-allowed",
    opacity: moveSectionMode ? 1 : 0.3,
    padding: "4px 6px",
    marginRight: 6,
    userSelect: "none",
    fontSize: 18,
  }}
  onClick={(e) => e.stopPropagation()}
  title={
    moveSectionMode
      ? "Drag to move section"
      : "Enable 'Move section' from menu"
  }
>
  ≡
</span>
<span
  style={{
    cursor: "pointer",
    fontSize: "16px",
    color: "#0d6efd",
    marginRight: 8,
    userSelect: "none",
  }}
  onClick={(e) => {
    e.stopPropagation(); // 🔥 very important (expand toggle se bachaata hai)
    setEditingSectionId(sec._id);
    setEditingTitle(sec.title);
  }}
  title="Edit section"
>
  ✏️
</span>


                        <DeleteEntityButton
  deleteType="section"
  courseId={courseId}
  sectionId={sec._id}
  className="btn btn-sm btn-outline-danger"
  onDeleted={() => navigate(0)}
/>

<div style={{ position: "relative", marginLeft: 8 }}>
 <button
  className="btn btn-sm btn-outline-secondary"
  onClick={(e) => {
    e.stopPropagation(); // 🔥 THIS IS THE KEY
    setActiveSectionMenu(
      activeSectionMenu === sec._id ? null : sec._id
    );
  }}
>
  ⋮
</button>


 {activeSectionMenu === sec._id &&
  ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top:
          sectionRefs.current[sec._id]
            ?.getBoundingClientRect().top + 42,
        right: 40,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 8,
        minWidth: 160,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        zIndex: 99999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
          style={{ ...menuBtn, color: "#dc3545" }}
        onClick={() => {
          setMoveSectionMode(true);
          setActiveSectionMenu(null);
        }}
      >
        🔀 Move section
      </button>

      {moveSectionMode && (
        <button
          style={{ ...menuBtn, color: "#dc3545" }}
          onClick={() => {
            setMoveSectionMode(false);
            setActiveSectionMenu(null);
          }}
        >
          ✖ Stop moving
        </button>
      )}
    </div>,
    document.body
  )}

</div>

                      </div>
                    </div>

                    {/* Smooth collapsing wrapper (ALWAYS rendered, animated) */}
                    <div
                      ref={setCollapseRef(sec._id)}
                      style={{
                        maxHeight: sec.expanded ? "0px" : "0px", // real value applied in syncSectionHeight
                        opacity: sec.expanded ? 1 : 0,
                        overflow: "hidden",
                        transition: "max-height 320ms ease, opacity 200ms ease",
                        willChange: "max-height, opacity",
                        pointerEvents: sec.expanded ? "auto" : "none",
                      }}
                    >
                      {/* CONTENT stays mounted for animation; measure this */}
                      <div ref={setContentRef(sec._id)}>
                       {sec.lessons?.length > 0 ? (
  <Droppable
    droppableId={`LESSON-${sec._id}`}
    type="LESSON"
    key={`LESSON-${sec._id}`}
  >
    {(provided) => (
      <ul
        ref={provided.innerRef}
        {...provided.droppableProps}
        className="list-group list-group-flush"
        style={{
          ...glassInner,
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
       {(sec.lessons || []).map((lesson, idx) => (

            <Draggable
              key={`LESSON-${lesson._id}`}
              draggableId={`LESSON-${lesson._id}`}
              index={idx}
            >
              {(dragProvided) => (
                <li
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  {...dragProvided.dragHandleProps}
                  className="list-group-item d-flex align-items-center"
                  data-lesson-id={lesson._id}
                  style={{
                    ...dragProvided.draggableProps.style,
                    cursor: "grab",
                    background: "rgba(255,255,255,0.85)",
                    color: "#212529",
                    transition:
                      "background 200ms ease, transform 120ms ease",
                    border: "1px solid rgba(0,0,0,0.04)",
                    margin: "6px 8px",
                    borderRadius: "10px",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.95)";
                    e.currentTarget.style.transform =
                      "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.85)";
                    e.currentTarget.style.transform =
                      "translateY(0)";
                  }}
                  onClick={() => {
                    sessionStorage.setItem(OPEN_KEY, sec._id);
                    sessionStorage.setItem(
                      LAST_LESSON_KEY,
                      lesson._id || ""
                    );
                    navigate(
                      `/course/${courseId}/section/${sec._id}/lesson/${lesson._id}`
                    );
                  }}
                >
                  <span className="me-2 text-muted">
                    {idx + 1}.
                  </span>
                  
                  {/* ⋮ Lesson menu */}


                 <span className="text-truncate flex-grow-1">
                    {lesson.title}
                  </span>
                

{/* ⋮ Lesson menu */}
<div
  className="me-2"
  onClick={(e) => e.stopPropagation()}
>
  <button
    className="btn btn-sm btn-outline-secondary"
    onClick={() =>
      setActiveLessonMenu(
        activeLessonMenu === lesson._id ? null : lesson._id
      )
    }
  >
    ⋮
  </button>
</div>


                  {/* ---- Lesson delete button ---- */}
                  <span
                    className="ms-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteEntityButton
                      deleteType="lesson"
                      courseId={courseId}
                      sectionId={sec._id}
                      lessonId={lesson._id}
                      className="btn btn-sm btn-outline-danger"
                      onDeleted={() => navigate(0)}
                    >
                      Delete
                    </DeleteEntityButton>
                  </span>
                  {activeLessonMenu === lesson._id &&
  ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: dragProvided.innerRef?.getBoundingClientRect?.().top ?? 200,
        right: 60,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 8,
        minWidth: 180,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        zIndex: 99999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        style={menuBtn}
        onClick={() => {
          onMoveLessonClick({
            lessonId: lesson._id,
            fromSectionId: sec._id,
          });
          setActiveLessonMenu(null);
        }}
      >
        🔀 Move lesson
      </button>
    </div>,
    document.body
  )}

                </li>
              )}
            </Draggable>
          ))}
        {provided.placeholder}
      </ul>
    )}
  </Droppable>
) : (
  <div
    className="list-group-item text-center text-muted"
    style={{
      ...glassInner,
      background: "rgba(255,255,255,0.85)",
    }}
  >
    No lessons
  </div>
)}


                        <div
                          className="text-center py-3 border-top fw-bold"
                          style={{
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.9)",
                            borderColor: "rgba(0,0,0,0.06)",
                            borderBottomLeftRadius: "16px",
                            borderBottomRightRadius: "16px",
                            transition: "background 200ms ease",
                            color: "#198754",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.96)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.9)")
                          }
                          onClick={() => {
                            sessionStorage.setItem(OPEN_KEY, sec._id);
                            handleOpenDrawer(sec._id);
                          }}
                        >
                          + Add lesson
                        </div>
                      </div>
                    </div>
                  </li>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default SectionBuilderUI;
