import React from "react";
import home from "../assets/images/home.jpeg";

const Hero = () => {
  return (
    <section
      className="relative py-20 bg-cover bg-center bg-no-repeat dark:bg-darkPrimary"
      style={{
        backgroundImage: `url(${home})`,
      }}
    >
      {/* Optional overlay to darken background image */}
      <div className="absolute inset-0 bg-black bg-opacity-30 dark:bg-opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center">
        <div className="text-center text-white dark:text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Welcome to SafeManager
          </h1>
          <p className="mt-4 text-xl md:text-2xl">
            Your Property Management Solution!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <a
              href="#"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Get Started
            </a>
            <a
              href="#"
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
