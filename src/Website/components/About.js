import React from 'react';
import aboutimageImg from '../Assets/aboutimage.png';
import aboutimageImg2 from '../Assets/aboutimage2.png';
import aboutimageImg3 from '../Assets/aboutimage3.png';
import Footer from "./Footer";
import ImtiyazImg from "../Assets/Imtiyaz1.jpg";
import PatibhaImg from "../Assets/Patibha.jpg";
import AkankshaImg from "../Assets/Akanksha Kumari.jpeg";
import JavidImg from "../Assets/Javid.jpeg"

const teamMembers = [
  {
    name: "Akanksha Kumari",
    role: "Software Engineer",
    department: "Software Team",
    image: AkankshaImg ,
    linkedin: "https://www.linkedin.com/in/akanksha-kumari-a45826231/"
  },
  {
    name: "Imtiyaz Agasimani",
    role: "Software Engineer",
    department: "Software Team",
    image: ImtiyazImg,
    linkedin: "https://www.linkedin.com/in/imtiyaz-agasimani-52ab78266/"
  },
  {
    name: "Javid Ahammed",
    role: "Software Engineer",
    department: "Software Team",
    image: JavidImg,
    linkedin: "https://www.linkedin.com/in/javid-ahammed-43489a250/"
  },
  {
    name: "Pratibha Kumari",
    role: "Software Engineer",
    department: "Software Team",
    image: PatibhaImg,
    linkedin: "https://www.linkedin.com/in/pratibha-kumari-311515262/"
  },
];

const AboutEdzest = () => {
  return (
    <>
      {/* About Section */}
      <div className="container mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-center mb-8">About Edzest</h1>
        <div className="flex flex-col md:flex-row items-center mb-16">
          <div className="w-full md:w-1/2">
            <img src={aboutimageImg} alt="Edzest Overview" className="rounded-lg shadow-lg max-w-full h-auto" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Edzest Education Services is a leading PMP® training and software product-based company.
              As an authorized training partner of PMI, we specialize in certification training and
              provide innovative tech solutions through our talented in-house software team.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Since our founding in 2021, we've empowered 500+ professionals from 45+ countries and
              helped 156+ candidates achieve PMP® success. Alongside training, we develop digital tools,
              mock test platforms, dashboards, and learning portals for institutions and corporates.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto py-16 px-6 bg-gray-100">
        <h1 className="text-4xl font-bold text-center mb-8">Our Mission</h1>
        <div className="flex flex-col md:flex-row items-center mb-16">
          <div className="w-full md:w-1/2">
            <img src={aboutimageImg2} alt="Mission Image" className="rounded-lg shadow-lg max-w-full h-auto" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Our mission is to bridge the gap between education and technology. We aim to provide
              future-proof training programs while building smart, scalable software products that
              transform the way people learn, manage, and grow.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We combine project management expertise with software development excellence to
              deliver high-impact solutions.
            </p>
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="container mx-auto py-16 px-6">
        <h1 className="text-4xl font-bold text-center mb-8">Our Vision</h1>
        <div className="flex flex-col md:flex-row items-center mb-16">
          <div className="w-full md:w-1/2">
            <img src={aboutimageImg3} alt="Vision Image" className="rounded-lg shadow-lg max-w-full h-auto" />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Our vision is to be a globally recognized PMP® training partner and a trusted software
              solution provider. We aspire to empower individuals and businesses through continuous
              learning and robust digital platforms.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              We are driven by innovation, learning, and the belief that impactful technology can create
              lasting change.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto py-16 px-6 bg-blue-50">
        <h1 className="text-4xl font-bold text-center mb-12">Our Core Team</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 justify-items-center">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="flip-card">
              <div className="flip-card-inner">
                {/* Front */}
                <div className="flip-card-front">
                  <img src={member.image} alt={member.name} />
                  <h3 className="text-lg font-bold text-gray-800 mt-2">{member.name}</h3>
                  <p className="text-gray-600 text-sm">{member.role}</p>
                  <p className="text-gray-500 text-sm">{member.department}</p>
                </div>

                {/* Back */}
                <div className="flip-card-back">
                  <img
                      src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                      alt="LinkedIn"
                      className="linkedin-icon"
                    />

                    <br></br>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{member.name}</h3>
                  <p className="text-gray-600 text-sm text-center px-2">
                    
                    
                  </p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="connect-btn flex items-center gap-2"
                  >
                    
                    Know More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal CSS Styles */}
      <style>{`
        .flip-card {
          background-color: transparent;
          width: 100%;
          max-width: 260px;
          height: 320px;
          perspective: 1000px;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s;
          transform-style: preserve-3d;
          border-radius: 12px;
        }

        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }

        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          background-color: #fff;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .flip-card-front img {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          margin-bottom: 12px;
        }

        .flip-card-back {
          transform: rotateY(180deg);
          background-color: #f0f4f8;
        }

        .connect-btn {
          margin-top: 15px;
          padding: 8px 16px;
          background-color: #0a66c2;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.3s;
          text-decoration: none;
        }

        .connect-btn:hover {
          background-color: #004182;
        }

        .linkedin-icon {
  width: 40px;
  height: 60px;
  animation: spinPop 4.8s infinite ease-in-out;
  transform-origin: center;
}

@keyframes spinPop {
  0% {
    transform: scale(1) rotateY(0deg) translateZ(0px);
  }
  25% {
    transform: scale(1.2) rotateY(180deg) translateZ(10px);
  }
  50% {
    transform: scale(1.05) rotateY(360deg) translateZ(0px);
  }
 
}
.linkedin-icon {
  width: 40px;
  height: 40px;
  animation: glowSpin 6s infinite ease-in-out;
  transform-origin: center;
  filter: drop-shadow(0 0 6px rgba(10, 102, 194, 0.5));
  transition: transform 0.5s ease, filter 0.5s ease;
}

@keyframes glowSpin {
  0% {
    transform: scale(1) rotateY(0deg) rotateX(0deg);
    filter: drop-shadow(0 0 5px #0a66c2);
  }
  25% {
    transform: scale(1.15) rotateY(180deg) rotateX(10deg);
    filter: drop-shadow(0 0 12px #0a66c2);
  }
  50% {
    transform: scale(1.05) rotateY(360deg) rotateX(0deg);
    filter: drop-shadow(0 0 6px #0a66c2);
  }
  75% {
    transform: scale(1.2) rotateY(540deg) rotateX(5deg);
    filter: drop-shadow(0 0 16px #0a66c2);
  }
  100% {
    transform: scale(1) rotateY(720deg) rotateX(0deg);
    filter: drop-shadow(0 0 8px #0a66c2);
  }
}


        @keyframes bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @media (max-width: 768px) {
          .flip-card {
            height: 300px;
          }
        }
      `}</style>

      <Footer />
    </>
  );
};

export default AboutEdzest;
