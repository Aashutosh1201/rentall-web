import React from "react";
import { ShieldCheck, Clock, Wallet, Star } from "lucide-react";

const benefits = [
  {
    icon: <ShieldCheck className="w-10 h-10 text-blue-600" />,
    title: "Verified Users",
    description: "Every user must go through KYC before borrowing or lending.",
  },
  {
    icon: <Clock className="w-10 h-10 text-blue-600" />,
    title: "Flexible Rentals",
    description: "Rent for a day or a month — choose what fits your needs.",
  },
  {
    icon: <Wallet className="w-10 h-10 text-blue-600" />,
    title: "Affordable Options",
    description: "Why buy when you can rent for a fraction of the price?",
  },
  {
    icon: <Star className="w-10 h-10 text-blue-600" />,
    title: "Rated Listings",
    description: "Real user ratings and reviews help you make better choices.",
  },
];

const WhyRentAll = () => {
  return (
    <section className="py-20 bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
          Why Choose RentALL?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-md transition text-gray-800 dark:text-gray-100"
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRentAll;
