import React from "react";

export default function PreparationOptions() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 text-center transition-all duration-300">
        Learning Options
      </h1>
      <p
        className="text-lg sm:text-xl text-gray-700 mb-12 text-center max-w-3xl mx-auto"
        style={{ fontFamily: "sans-serif", lineHeight: "1.8" }}
      >
        Empower your certification journey with our comprehensive preparation options.
        Choose from expert-led training, and real exam-like mock tests to achieve exam
        success confidently.
      </p>

      {/* Centered Card Section */}
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center">
          {/* Card 1: Live Online Training */}
          <div className="animated-card bg-gradient-to-br from-purple-200 via-indigo-100 to-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center flex flex-col items-center justify-between transition-transform duration-500 hover:scale-105 hover:shadow-purple-400">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-5 tracking-wide animate-title">
              Live Online Training
            </h2>
            <ul className="text-gray-700 text-left text-base sm:text-lg list-disc mb-6 space-y-2 px-4 animate-fade">
              <li>Live, Online, Zoom (Sat & Sun)</li>
              <li>7 weeks (6 hrs/week) – 42 hrs (35 contact hours)</li>
              <li>Practical Project Practitioner course (48 hrs recorded)</li>
              <li>Weekly Tests (7 × 60) = 420 questions</li>
              <li>Mock Exam Simulators (5 × 180) = 900 questions</li>
              <li>1:1 Discussion Support till your exam</li>
            </ul>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-auto w-full animate-fade">
              <a href="https://exams.edzest.org/learn/PMP-Training-Bundle-14th-June" target="_blank" rel="noopener noreferrer" className="w-full sm:w-1/2">
                <button className="bg-[#4748ac] hover:bg-[#3737ac] transition-all duration-300 text-white font-semibold py-3 rounded-lg w-full">
                  Learn More
                </button>
              </a>
            </div>
          </div>

          {/* Card 2: Self-paced Online Training */}
         <div className="animated-card bg-gradient-to-br from-green-200 via-teal-100 to-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center flex flex-col items-center justify-between transition-transform duration-500 hover:scale-105 hover:shadow-teal-400">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-5 tracking-wide animate-title">
              Self-paced Online Training
            </h2>
            <ul className="text-gray-700 text-left text-base sm:text-lg list-disc mb-6 space-y-2 px-4 animate-fade">
              <li>48 hrs. of recorded video lessons</li>
              <li>6 months access to course content</li>
              <li>Practical hands-on exercises and quizzes</li>
              <li>Mock Exams to test your progress</li>
            </ul>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-auto w-full animate-fade">
              <a href="https://exams.edzest.org/learn/PMP-Training-Self-study-bundle" target="_blank" rel="noopener noreferrer" className="w-full sm:w-1/2">
                <button className="bg-[#4748ac] hover:bg-[#3737ac] transition-all duration-300 text-white font-semibold py-3 rounded-lg w-full">
                  Learn More
                </button>
              </a>
            </div>
          </div>
        
          {/* Card 3: Mock Exam */}
          <div className="animated-card bg-gradient-to-br from-yellow-200 via-orange-100 to-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center flex flex-col items-center justify-between transition-transform duration-500 hover:scale-105 hover:shadow-orange-400">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-5 tracking-wide animate-title">
              Mock Exam
            </h2>
            <ul className="text-gray-700 text-left text-base sm:text-lg list-disc mb-6 space-y-2 px-4 animate-fade">
              <li>Real exam-like simulated environment</li>
              <li>5 mock exams with 900+ questions</li>
              <li>6 mini mock exams with 60 questions each</li>
              <li>Timed tests to simulate real exam conditions</li>
              <li>Instant feedback and scoring</li>
              <li>Detailed performance report</li>
            </ul>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-auto w-full animate-fade">
              <a href="https://exams.edzest.org/learn/PMP-mock-exams" target="_blank" rel="noopener noreferrer" className="w-full sm:w-1/2">
                <button className="bg-[#4748ac] hover:bg-[#3737ac] transition-all duration-300 text-white font-semibold py-3 rounded-lg w-full">
                  Learn More
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
