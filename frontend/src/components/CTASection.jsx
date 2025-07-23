import React from "react";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Ready to Rent or Earn?
        </h2>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 opacity-90">
          Join <span className="font-semibold text-white">RentALL</span> and unlock the smarter way to share your items,
          save on costs, and earn effortlessly.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-100 transition-all text-base">
            Explore Rentals
          </button>
          <button className="flex items-center gap-2 border border-white px-8 py-3 rounded-full font-semibold text-white hover:bg-white hover:text-indigo-600 transition-all text-base">
            List Your Product <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
