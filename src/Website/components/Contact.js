import React, { useState } from "react";
import axios from "axios";

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    setIsSent(true);

    try {
      await axios.post("https://ocrc062kj5.execute-api.ap-south-1.amazonaws.com/api/contact", formData);
      setStatus("✅ Thank you! We will get back to you soon.");
      setFormData({ fullName: "", email: "", phoneNumber: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("❌ Error submitting the form. Please try again.");
    } finally {
      setIsSent(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#4748ac] to-[#6b6ccf] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold md:text-5xl">We'd love to hear from you.</h1>
        <p className="mt-4 text-lg">
          📞+91 9673332684 | ✉️ contact@edzest.org

 <span className="text-[#fbbf24] font-semibold"> 

</span>
        </p>
      </section>

      {/* Contact Form Section */}
      <section className="relative z-10 -mt-20 mb-10 flex justify-center px-4">
        <div className="bg-white shadow-2xl p-8 md:p-12 rounded-xl w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Get In Touch</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={isSent}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4748ac] transition"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSent}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4748ac] transition"
                placeholder="Enter your email"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={isSent}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4748ac] transition"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                required
                disabled={isSent}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4748ac] transition"
                placeholder="Your message"
              ></textarea>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSent}
                className={`w-full bg-[#4748ac] text-white py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  isSent ? "opacity-50 cursor-not-allowed" : "hover:bg-[#3c3d99]"
                }`}
              >
                {isSent ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>

          {/* Status Message */}
          {status && (
            <p className={`text-sm mt-4 text-center ${status.includes("Error") ? "text-red-500" : "text-green-600"}`}>
              {status}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Contact; 
