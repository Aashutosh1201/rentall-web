import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What is RentALL?",
    answer:
      "RentALL is a platform where you can rent or lend almost anything — from electronics to event gear, tools, and more.",
  },
  {
    question: "How do I rent a product?",
    answer:
      "Browse items, select rental dates, complete KYC, and confirm your order.",
  },
  {
    question: "Is KYC required for renting?",
    answer: "Yes, KYC is mandatory to ensure trust and safety on our platform.",
  },
  {
    question: "Who handles delivery?",
    answer:
      "You can choose between Pathao delivery, self-pickup, or owner delivery.",
  },
  {
    question: "How is the rental price decided?",
    answer:
      "Owners set the price. Longer rentals may get automatic discounts.",
  },
  {
    question: "What if the item is damaged during use?",
    answer:
      "You'll be responsible based on our rental policy. Damage fees may apply.",
  },
  {
    question: "How do I list my own item for rent?",
    answer:
      "Sign up, go to your dashboard, and add your product with details and photos.",
  },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center px-6 py-4 focus:outline-none text-left"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {faq.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="text-gray-500 dark:text-gray-400" />
                )}
              </button>
              {isOpen && (
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FaqSection;
