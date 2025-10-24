import React from "react";

export default function PreparationOptions() {
  return (
    <div className="container mx-auto px-4 py-20">
      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-6">
        Learning Options
      </h1>
      <p
        className="text-lg sm:text-xl text-gray-700 mb-12 text-center max-w-3xl mx-auto leading-relaxed"
        style={{ fontFamily: "sans-serif" }}
      >
        Empower your certification journey with our comprehensive preparation options.
        Learn from PMI Authorised Training Partner instructors and prepare with exam-like
        practice questions and mock exams to achieve success confidently.
      </p>

      {/* Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto">
        {/* Card 1 */}
        <div className="bg-gradient-to-br from-purple-200 via-indigo-100 to-white rounded-3xl shadow-xl p-8 flex flex-col justify-between hover:scale-105 transition-transform duration-500 hover:shadow-purple-400">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-5 text-center">
            Live Online Training
          </h2>
          <ul className="text-gray-700 text-left text-base sm:text-lg list-disc mb-6 space-y-2 px-4">
            <li>PMI® official content and 35 contact hours</li>
            <li>Live, Online, Zoom (Sat & Sun)</li>
            <li>5 weeks (8 hrs/week) – 40 hrs</li>
            <li>Free access to project management course</li>
            <li>1 year access to mock exam simulators</li>
            <li>Application writing support</li>
            <li>1:1 discussion and guidance till your exam</li>
          </ul>
          <a
            href="https://exams.edzest.org/learn/PMP-Oct25"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-auto"
          >
            <button className="bg-[#4748ac] hover:bg-[#3737ac] text-white font-semibold py-3 px-6 rounded-lg w-full">
              Learn More
            </button>
          </a>
        </div>

        {/* Card 2 */}
        <div className="bg-gradient-to-br from-yellow-200 via-orange-100 to-white rounded-3xl shadow-xl p-8 flex flex-col justify-between hover:scale-105 transition-transform duration-500 hover:shadow-orange-400">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-5 text-center">
            Exam Simulator
          </h2>
          <ul className="text-gray-700 text-left text-base sm:text-lg list-disc mb-6 space-y-2 px-4">
            <li>Real exam-like simulated environment</li>
            <li>5 mock exams with 900+ questions</li>
            <li>6 ECO domain wise tests</li>
            <li>5 topic-wise mini mock exams</li>
            <li>Detailed explanation for every question</li>
            <li>Instant feedback and scoring</li>
            <li>Performance analytics & report</li>
          </ul>
          <a
            href="https://exams.edzest.org/learn/PMP-mock-exams"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-auto"
          >
            <button className="bg-[#4748ac] hover:bg-[#3737ac] text-white font-semibold py-3 px-6 rounded-lg w-full">
              Learn More
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
