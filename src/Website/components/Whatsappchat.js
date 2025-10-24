import React from "react";
 
const WhatsAppChat = () => {
  const whatsappNumber = "919673332684";
  const message = "Hi! I want to discuss Edzest's Training Program";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
 
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center p-2 sm:p-3 rounded-full shadow-lg bg-white hover:scale-105 transition-transform duration-300"
      >
        <img
          src="https://cdn-icons-png.flaticon.com/512/3670/3670051.png"
          alt="WhatsApp"
          className="w-12 h-12 sm:w-14 sm:h-14"
        />
      </a>
    </div>
  );
};
 
export default WhatsAppChat;