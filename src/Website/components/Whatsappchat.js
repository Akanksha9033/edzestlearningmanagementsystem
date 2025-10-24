import React, { useState, useEffect, useRef } from "react";

const WhatsAppChat = () => {
  const [showOptions, setShowOptions] = useState(false);
  const containerRef = useRef(null);

const whatsappNumber = "919673332684"; // ✅ no space, includes country code
const message = "Hi! I want to discuss Edzest's Training Program";
const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


  const phoneLink = `tel:${whatsappNumber}`;
  const linkedinLink = "https://www.linkedin.com/company/edzest/";
  
  const instagramLink =
    "https://www.instagram.com/edzest.project.academy?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center justify-center p-3 rounded-full shadow-lg bg-white hover:scale-105 transition-transform duration-300"
      >
        {showOptions ? (
          <span className="text-xl font-bold text-red-500 animate-spin-slow">×</span>
        ) : (
          <img
            src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png"
            alt="WhatsApp"
            className="w-12 h-12 sm:w-14 sm:h-14"
          />
        )}
      </button>

      {/* Dropdown */}
      {showOptions && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 items-center animate-fadeUp">
          {/* Phone */}
          <a
            href={phoneLink}
            className="bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
            title="Call Us"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/597/597177.png"
              alt="Phone"
              className="w-8 h-8"
            />
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
            title="Chat on WhatsApp"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png"
              alt="WhatsApp"
              className="w-8 h-8"
            />
          </a>

          {/* LinkedIn */}
          <a
            href={linkedinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
            title="Message on LinkedIn"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
              alt="LinkedIn"
              className="w-8 h-8"
            />
          </a>

          {/* Instagram */}
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
            title="Instagram"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
              alt="Instagram"
              className="w-8 h-8"
            />
          </a>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeUp {
          animation: fadeUp 0.3s ease-out;
        }

        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }

        .animate-spin-slow {
          animation: spinSlow 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WhatsAppChat;
