import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdBanner from './AdBanner';

import teacher from "../Assets/teacher.png";

const Hero = () => {
  return (
    <>
      {/* Dynamic Ad Banner */}
      <AdBanner />

      <section className="relative h-auto lg:h-[100vh] flex flex-col-reverse lg:flex-row items-center justify-between px-4 sm:px-6 overflow-hidden bg-white">
        {/* Left Text Section */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center lg:text-left p-4 sm:p-6 flex-1"
        >
          <h1 className="font-openSansBold font-extrabold leading-tight text-gray-800 text-[40px] sm:text-[50px] lg:text-[70px]">
            <span className="block">Learn.</span>
            <span className="block">Apply.</span>
            <span className="block text-[#4748ac]">Deliver Successful Projects.</span>
          </h1>

          <motion.p
            className="text-gray-700 mt-4 max-w-3xl mx-auto lg:mx-0 text-center lg:text-left"
            style={{ fontFamily: "sans-serif", fontSize: "18px", lineHeight: "1.8" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            At Edzest Project Academy, we deliver training that goes beyond theory empowering project professionals with real-world skills, recognized certifications, and the confidence to deliver successful projects.
          </motion.p>

          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-6 mt-5 sm:mt-10">
            <Link
  to="/training"
  onClick={() => {
    if (window.gtag) {
      window.gtag('event', 'explore_click', {
        event_category: 'hero_section',
        event_label: 'Explore Button',
      });
    }
  }}
  className="bg-[#4748ac] hover:bg-[#37378c] text-white font-semibold 
  py-3 px-6 sm:py-3 sm:px-6 lg:py-4 lg:px-8 
  w-[150px] lg:w-[180px] 
  rounded-lg transition duration-300 text-center text-lg"
>
  Explore
</Link>

          </div>
        </motion.div>

        {/* Right Image Section */}
        <motion.div
          className="flex-1 flex justify-center lg:justify-end mt-6 lg:mt-0 px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <img
            src={teacher} // Use your own image path
            alt="Right side visual"
            className="w-full max-w-[500px] sm:max-w-[600px] md:max-w-[700px] h-auto object-contain"
            style={{ border: 'none' }}
          />
        </motion.div>
      </section>
    </>
  );
};

export default Hero;
