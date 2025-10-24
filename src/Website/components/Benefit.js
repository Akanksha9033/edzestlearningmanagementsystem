import React from "react";
import { motion } from "framer-motion";
import personToPersonIcon from '../Assets/person-to-person.png';

const Benefits = () => {
  const benefits = [
    {
      title: "Personalized Attention",
      description: "We work with you individually to understand your experience and aspirations so that we can guide you every step of the way till the exam",
      icon: personToPersonIcon,
    },
    {
      title: "Comprehensive Resources",
      description: "You will have the access to all the study resources needed to prepare for the exam: Live classes, recorded videos, texts, mock exams etc.",
      icon: "https://cdn-icons-png.freepik.com/256/18251/18251285.png?ga=GA1.1.194110493.1747371900&semt=ais_hybrid",
    },
    {
      title: "Accelerated Learning",
      description: "Interact with the trainer real time to grasp concepts faster and retain information longer with concept building exercises shared every week.",
      icon: "https://cdn-icons-png.freepik.com/256/8132/8132630.png?ga=GA1.1.194110493.1747371900&semt=ais_hybrid",
    },
    {
      title: "Developing Critical Thinking",
      description: "The trainer encourages critical thinking, decision making, and problem solving skills that are essential for success in the exam.",
      icon: "https://cdn-icons-png.freepik.com/256/17555/17555271.png?ga=GA1.1.194110493.1747371900&semt=ais_hybrid",
    },
  ];

  return (
    <section className="container mx-auto px-6 py-16">
      <motion.h2
        className="text-3xl font-bold text-center text-gray-900 mb-10"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Benefits of Learning with us
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-start bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl border border-gray-100"
            initial={{ opacity: 0, scale: 0.7, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: index * 0.2,
              type: "spring",
              stiffness: 120,
            }}
          >
            <img
              src={benefit.icon}
              alt={benefit.title}
              className={`${index === 0 ? "w-22 h-24" : "w-16 h-16"} mb-4 object-contain`}
            />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {benefit.title}
            </h3>
            <p
              className="text-gray-600"
              style={{ fontFamily: "sans-serif", fontSize: "17px", lineHeight: "1.6" }}
            >
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Benefits;
