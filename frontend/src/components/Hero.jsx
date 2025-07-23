import React from "react";
import heroImage from "./hero.jpeg";

const Hero = () => {
  return (
    <section className="pt-24 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 flex flex-col-reverse md:flex-row items-center justify-between gap-10">
        {/* Text Content */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-4">
            Rent Anything. Anytime. Anywhere.
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            RentALL connects lenders and borrowers — from bikes to cameras, tools to tents. Save money. Make money. Live smart.
          </p>
          <a
            href="/register"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </a>
        </div>

        {/* Image */}
        <div className="w-full md:w-1/2">
          <img
            src={heroImage}
            alt="People renting items on RentALL"
            className="rounded-xl shadow-xl w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
