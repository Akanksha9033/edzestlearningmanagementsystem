import React from "react";
import { motion } from "framer-motion";
import './Banner.css'; // Optional for custom styles
import LearnersBadge from "../components/LearnersBadge";
 
const Announcement = () => {
  return (
    <section className="bg-green-50 py-12 px-4 md:px-16 flex flex-col items-center justify-center text-center rounded-xl shadow-inner">
     
      {/* ✅ PMI Logo with bounce-in animation */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* <img
          src="/assets/pmi-logo.jpg"
          alt="PMI Authorized Training Partner"
          className="h-28 w-auto mx-auto drop-shadow-md"
        /> */}
      </motion.div>
 
      {/* ✅ Heading and paragraph */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Training Methodology
        </h2>
 
        <p className="text-gray-700 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-[sans-serif]">
          All our programs are designed for case-based <strong>practical learning</strong> to help
          you relate the theory with your practical work experience and practice
          the lessons in a simulated project setting.
        </p>
      </motion.div>
 
      {/* ✅ Animated LearnersBadge */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <LearnersBadge />
      </motion.div>
    </section>
  );
};
 
export default Announcement;