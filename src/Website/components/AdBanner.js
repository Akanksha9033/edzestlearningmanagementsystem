/* global gtag */ // ✅ Add this to avoid ESLint error

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const AdBanner = () => {
  const [ads, setAds] = useState([
    {
      id: 1,
      text: "📢 New PMP® Exam Batch Starts on 5th July",
      link: "https://exams.edzest.org/learn/PMP-training-5thJuly",
    },
  ]);

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const currentAd = ads[currentAdIndex];

  const handleEnrollClick = () => {
    if (typeof gtag === "function") {
      gtag("event", "enroll_now_click", {
        event_category: "ad_banner",
        event_label: currentAd.text,
        value: currentAd.id,
      });
    }
  };

  return (
    isVisible && (
      <div className="w-full bg-[#4748ac] text-white text-center py-3 font-semibold relative flex flex-wrap justify-start sm:justify-center items-center gap-2 sm:gap-4 transition-opacity duration-500 text-sm sm:text-base md:text-lg pr-10">
        <span className="text-white">{currentAd.text}</span>

        <div className="w-full sm:w-auto flex sm:inline-flex justify-center sm:justify-start">
          <a
            href={currentAd.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleEnrollClick}
            className="bg-white text-[#4748ac] font-bold py-2 px-4 rounded-lg text-sm sm:text-base hover:bg-gray-200 transition duration-300"
          >
            Enroll Now
          </a>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 sm:right-6 top-3 -translate-y-1/2 text-white hover:text-gray-300 transition duration-300"
          aria-label="Close banner"
        >
          <X size={16} />
        </button>
      </div>
    )
  );
};

export default AdBanner;
