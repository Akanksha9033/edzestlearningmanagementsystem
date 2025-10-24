import React from "react";
import { motion } from "framer-motion";
 
const Benefits = () => {
  const benefits = [
    {
      title: "Engaging Learning",
      description: "Reduces monotony and makes learning enjoyable.",
      icon: "https://cdn-icons-png.freepik.com/256/3686/3686057.png?ga=GA1.1.194110493.1747371900&semt=ais_hybrid",
    },
    {
      title: "Immersive Learning",
      description: "Engages multiple senses making learning active and effective.",
      icon: "https://cdn-icons-png.freepik.com/256/18251/18251285.png?ga=GA1.1.194110493.1747371900&semt=ais_hybrid",
    },
    {
      title: "Accelerated Learning",
      description: "Helps grasp concepts faster and retain information longer.",
      icon: "https://cdn-icons-png.freepik.com/256/8132/8132630.png?ga=GA1.1.194110493.1747371900&semt=ais_hybrid",
    },
    {
      title: "Developing Critical Thinking",
      description: "Encourages critical thinking, decision making, and problem solving skills.",
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
        Benefits of Practical Learning
      </motion.h2>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-start bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl border border-gray-100"
            initial={{ opacity: 0, scale: 0.7, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{  }}
            transition={{
              duration: 0.6,
              delay: index * 0.2,
              type: "spring",
              stiffness: 120,
            }}
          >
            <img src={benefit.icon} alt={benefit.title} className="w-16 h-16 mb-4" />
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