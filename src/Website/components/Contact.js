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
 await axios.post("https://edzestweb-6.onrender.com/api/contact", formData);
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
    <div className="flex items-center justify-center bg-gradient-to-r from-[#f8f9fc] to-[#e4e6f8] min-h-screen p-4">
      <div className="bg-white p-8 w-full max-w-lg rounded-2xl shadow-xl">
        <h2 className="text-4xl font-bold text-center text-[#4748ac] mb-2">Get In Touch</h2>
        <p className="text-center text-gray-600 text-sm mb-6">📞 +91 9673332684 | ✉️ contact@edzest.org</p>

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
              className={`w-full sm:w-1/2 bg-[#4748ac] text-white py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isSent ? "opacity-50 cursor-not-allowed" : "hover:bg-[#3737ac]"
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
    </div>
  );
};

export default Contact;


