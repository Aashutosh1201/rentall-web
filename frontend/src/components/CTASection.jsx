import React from "react";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-indigo-600 text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Rent or Earn?
        </h2>
        <p className="text-lg md:text-xl mb-8">
          Join RentALL today and experience the smarter way to share, save, and earn.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button className="bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold shadow hover:bg-gray-100 transition">
            Explore Rentals
          </button>
          <button className="flex items-center gap-2 border border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition">
            List Your Product <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
