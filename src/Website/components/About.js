import React from 'react';
import aboutimageImg from '../Assets/aboutimage.png';
import aboutimageImg2 from '../Assets/aboutimage2.png';
import aboutimageImg3 from '../Assets/aboutimage3.png';
import Footer from "./Footer"; // Assuming Footer.js is a valid component

const AboutEdzest = () => {
  return (
    <>
      {/* First Container */}
      <div className="container mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-center mb-8">About Edzest</h1>
        
        <div className="flex flex-col md:flex-row items-center mb-16">
          <div className="w-full md:w-1/2">
            <img src={aboutimageImg} alt="Edzest Team" className="rounded-lg shadow-lg max-w-full h-auto" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Edzest Education Services is your trusted partner in mastering project management. 
              As an authorized training partner of PMI, we specialize in providing comprehensive 
              training solutions for certifications like PMP®. Our goal is simple: to help 
              professionals and organizations manage projects better by equipping them with the 
              skills, tools, and confidence to thrive in a dynamic global marketplace.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              With a commitment to quality, innovation, and personalized guidance, we create impactful 
              learning experiences that bridge the gap between theory and practice. Whether you’re a 
              seasoned professional or a beginner, our tailored programs ensure you’re equipped to 
              face real-world challenges and excel in your career.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Founded in June 2021, Edzest has quickly become a trusted name in PMP® certification 
              training. Over the past few years, we have trained 500 participants, from 45 countries, 
              guiding them through every step of their project management journey. Out of these, 
              156 participants have successfully earned their PMP certification, with an impressive 
              88% passing on their first attempt.
            </p>
          </div>
        </div>
      </div>

      {/* Second Container */}
      <div className="container mx-auto py-16 px-6 bg-gray-100">
        <h1 className="text-4xl font-bold text-center mb-8">Our Mission</h1>
        
        <div className="flex flex-col md:flex-row items-center mb-16">
          <div className="w-full md:w-1/2">
            <img src={aboutimageImg2} alt="Why Choose Edzest" className="rounded-lg shadow-lg max-w-full h-auto" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              At Edzest, we believe in empowering professionals to achieve their dreams through 
              top-quality training programs. Our unique approach combines real-world case studies, 
              interactive workshops, and practical exercises to create a truly immersive learning experience.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Our expert trainers are industry veterans with years of project management experience. 
              They bring invaluable insights to our training programs, helping you connect theoretical 
              concepts with real-life applications.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Join the Edzest family and gain access to a network of like-minded professionals. 
              Start your journey toward mastering project management with Edzest today!
            </p>
          </div>
        </div>
      </div>

      {/* Third Container */}
      <div className="container mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-center mb-8">Our Vision</h1>
        
        <div className="flex flex-col md:flex-row items-center mb-16">
          <div className="w-full md:w-1/2">
            <img src={aboutimageImg3} alt="Our Vision" className="rounded-lg shadow-lg max-w-full h-auto" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Our vision is to be the most trusted and innovative provider of project management 
              education worldwide. By fostering a community of excellence, we aim to inspire 
              individuals to unleash their full potential and make a meaningful impact in their organizations.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              With a focus on continuous improvement and growth, Edzest strives to be a guiding 
              light for those who aspire to lead with confidence and deliver extraordinary results.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutEdzest;
