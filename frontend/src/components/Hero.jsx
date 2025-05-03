import React from "react";
import heroImage from './hero.jpeg';
const Hero = () => {
  return (
    <section className="pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 flex flex-col-reverse md:flex-row items-center justify-between gap-10">
        
        {/* Text Content */}
        <div className="w-full md:w-1/2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-4">
            Rent Anything. Anytime. Anywhere.
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            RentALL connects lenders and borrowers — from bikes to cameras, tools to tents. Save money. Make money. Live smart.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">
            Get Started
          </button>
        </div>

        {/* Image or Illustration */}
        <div className="w-full md:w-1/2">
          <img
            src={heroImage}
            alt="RentALL Hero"
            className="rounded-xl shadow-lg w-full"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
