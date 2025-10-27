import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaKey, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { BsChatDots } from "react-icons/bs";
import axios from "axios";
// import notificationSound from "./notification.mp3";
 
const aiOptions = [
  { label: "Reset Password", key: "password" },
  { label: "Mock Tests", key: "mock test" },
  { label: "LMS / Courses", key: "course" },
  { label: "Documentation", key: "docs" },
  { label: "Career Opportunities", key: "career" },
  { label: "Events & Webinars", key: "event" },
  { label: "Contact Support", key: "contact" },
  { label: "Chat with Us", key: "chat" },
  { label: "Type the Question", key: "type-question" }
];
 
const UserTopBar = ({ user }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [query, setQuery] = useState("");
  const audioRef = useRef();
  const menuRef = useRef();
  const chatRef = useRef();
  const messagesEndRef = useRef();
 
  useEffect(() => {
    if (chatOpen) {
      setAiMessages([
        {
          sender: "bot",
          text: "👋 Hi, I'm <strong>Edzest AI Assistant</strong>. How can I help you...!"
        }
      ]);
    }
  }, [chatOpen]);
 
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, typing]);
 
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Sound error:", err));
    }
  };
 
  const saveMessage = async (sender, text) => {
    try {
      await axios.post("http://localhost:5000/api/chat/save", {
        userId: user?.id,
        sender,
        text
      });
    } catch (err) {
      console.error("Chat save error:", err);
    }
  };
 
  const handleBotResponse = async (text) => {
    setTyping(true);
    setAiMessages(prev => [...prev, { sender: "user", text }]);
    await saveMessage("user", text);
 
    if (text === "type-question") {
      setTyping(false);
      setShowInput(true);
      return;
    }
 
    handleKeywordResponse(text);
  };
 
  const handleKeywordResponse = (text) => {
    setTimeout(() => {
      let botReply = `🙏 I'm sorry, I couldn't find an exact answer for "<strong>${text}</strong>".<br/>
      Please <a href="https://www.edzest.org/contact" target="_self">contact the Edzest Support Team</a> — we're here to help you!`;
 
      if (text.includes("reset") || text.includes("password")) {
        botReply = `<a href="/forgot-password" target="_self">Click here to reset your password</a>`;
      } else if (text.includes("mock test") || text.includes("exam")) {
        botReply = `You can take mock tests here: <a href="/mock-tests" target="_self">Mock Tests</a>.`;
      } else if (text.includes("profile")) {
        botReply = `You can view your profile here: <a href="/profile" target="_self">Profile</a>.`;
      } else if (text.includes("report") || text.includes("result")) {
        botReply = `You can check your reports here: <a href="/student-dashboard" target="_self">Student Dashboard</a>.`;
      } else if (text.includes("course") || text.includes("lms")) {
        botReply = `Access your courses here: <a href="/lms-dashboard" target="_self">LMS Dashboard</a>.`;
      } else if (text.includes("contact") || text.includes("support")) {
        botReply = `<a href="https://www.edzest.org/contact" target="_self">Contact our support team</a>.`;
      } else if (text.includes("event")) {
        botReply = `<a href="/eve
        nts" target="_self">View upcoming events</a>.`;
      }
 
      setAiMessages(prev => [...prev, { sender: "bot", text: botReply }]);
      saveMessage("bot", botReply);
      playSound();
      setTyping(false);
    }, 1000);
  };
 
  const handleSearch = async () => {
    if (!query.trim()) return;
    setTyping(true);
    setAiMessages(prev => [...prev, { sender: "user", text: query }]);
    await saveMessage("user", query);
 
    handleKeywordResponse(query);
    setShowInput(false);
    setQuery("");
  };
 
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
 
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        (chatRef.current && !chatRef.current.contains(e.target)) &&
        (menuRef.current && !menuRef.current.contains(e.target))
      ) {
        setChatOpen(false);
        setMenuOpen(false);
        setShowInput(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
 
  return (
    <>
      {/* <audio ref={audioRef} src={notificationSound} /> */}
 
      <div style={styles.topBar}>
        <img src="https://www.edzest.org/static/media/Logo.b5ab27785cac0246ac83.png" alt="Edzest Logo" style={styles.logo} />
        <div style={styles.right}>
          <span style={{
            ...styles.role,
            boxShadow: chatOpen ? "0 0 10px 2px #007bff" : "none",
            backgroundColor: chatOpen ? "#e0f0ff" : styles.role.backgroundColor
          }}>
            {user?.role}
          </span>
          <div ref={menuRef} style={{ position: "relative" }}>
            <div style={styles.avatar} onClick={() => setMenuOpen(prev => !prev)}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {menuOpen && (
              <div style={styles.dropdown}>
                {[{ label: "Profile", icon: <FaUser />, action: () => navigate("/profile") },
                  { label: "Reset Password", icon: <FaKey />, action: () => navigate("/forgot-password") },
                  { label: "Logout", icon: <FaSignOutAlt />, action: handleLogout }
                ].map((item, i) => (
                  <div key={i} onClick={item.action} style={styles.dropdownItem}>
                    <span style={{ marginRight: "8px" }}>{item.icon}</span> {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
 
      {!chatOpen && (
        <div onClick={() => setChatOpen(true)} style={styles.chatIcon}>
          <BsChatDots size={26} />
        </div>
      )}
 
      {chatOpen && (
        <div style={styles.chatBox} ref={chatRef}>
          <FaTimes onClick={() => setChatOpen(false)} style={styles.closeIcon} />
          <h4 style={{ marginBottom: "10px", fontWeight: 600, color: "#333" }}>Ask Edzest AI</h4>
          <div style={styles.messages}>
            {aiMessages.map((msg, i) => (
              <div key={i} style={{
                ...styles.message,
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                backgroundColor: msg.sender === "user" ? "#dcf8c6" : "#f0f2f5"
              }} dangerouslySetInnerHTML={{ __html: msg.text }} />
            ))}
            {typing && <p style={styles.typing}>Edzest AI is typing...</p>}
            <div ref={messagesEndRef} />
          </div>
 
          {showInput ? (
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your question..."
                style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
              <button onClick={handleSearch} style={{ padding: "6px 12px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "6px" }}>
                Ask
              </button>
            </div>
          ) : (
            <div style={styles.options}>
              {aiOptions.map((opt, idx) => (
                <button key={idx} onClick={() => handleBotResponse(opt.key)} style={styles.optionBtn}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
 
const styles = {
  topBar: {
    width: "100%",
    padding: "10px 20px",
    background: "linear-gradient(90deg, #fff, #f0f0f0)",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    zIndex: 1100
  },
  logo: { height: "36px" },
  right: { display: "flex", alignItems: "center", gap: "12px" },
  role: {
    backgroundColor: "#efefef",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#555"
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(45deg, #ff4d6d, #ff6f61)",
    color: "#fff",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  },
  dropdown: {
    position: "absolute",
    top: "40px",
    right: 0,
    backgroundColor: "#fff",
    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
    borderRadius: "6px",
    overflow: "hidden",
    zIndex: 2000,
    minWidth: "180px"
  },
  dropdownItem: {
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center"
  },
  chatIcon: {
    position: "fixed",
    bottom: "25px",
    right: "25px",
    background: "linear-gradient(135deg, #007bff, #00d4ff)",
    color: "#fff",
    padding: "16px",
    borderRadius: "50%",
    cursor: "pointer",
    zIndex: 10000,
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
  },
  chatBox: {
    position: "fixed",
    bottom: "100px",
    right: "20px",
    width: "350px",
    backgroundColor: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
    padding: "16px",
    zIndex: 9999
  },
  closeIcon: {
    position: "absolute",
    top: "10px",
    right: "12px",
    cursor: "pointer",
    color: "#888"
  },
  messages: {
    maxHeight: "240px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "10px",
    marginBottom: "10px"
  },
  message: {
    padding: "10px 14px",
    borderRadius: "18px",
    maxWidth: "80%",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    wordBreak: "break-word"
  },
  typing: {
    fontStyle: "italic",
    fontSize: "13px",
    color: "#999"
  },
  options: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  optionBtn: {
    padding: "6px 10px",
    fontSize: "13px",
    border: "1px solid #007bff",
    backgroundColor: "#fff",
    color: "#007bff",
    borderRadius: "20px",
    cursor: "pointer"
  }
};
 
export default UserTopBar;