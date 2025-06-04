import React from "react";
import { ShoppingBag, CalendarCheck, Award } from "lucide-react";

const steps = [
  {
    icon: <ShoppingBag className="w-10 h-10 text-blue-600" />,
    title: "Browse & Choose",
    desc: "Search from a variety of categories and pick what you need.",
  },
  {
    icon: <CalendarCheck className="w-10 h-10 text-blue-600" />,
    title: "Select Date & Book",
    desc: "Choose available dates, add to cart, and confirm your rental.",
  },
  {
    icon: <Award className="w-10 h-10 text-blue-600" />,
    title: "Pickup or Get Delivered",
    desc: "Coordinate pickup or get it delivered to your doorstep.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          How RentALL Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl shadow-md"
            >
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
