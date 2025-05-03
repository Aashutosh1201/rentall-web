import React, { useState } from 'react';

const faqs = [
  {
    question: "What is RentALL?",
    answer: "RentALL is a platform where you can rent or lend almost anything — from electronics to event gear, tools, and more.",
  },
  {
    question: "How do I rent a product?",
    answer: "Browse items, select rental dates, complete KYC, and confirm your order.",
  },
  {
    question: "Is KYC required for renting?",
    answer: "Yes, KYC is mandatory to ensure trust and safety on our platform.",
  },
  {
    question: "Who handles delivery?",
    answer: "You can choose between Pathao delivery, self-pickup, or owner delivery.",
  },
  {
    question: "How is the rental price decided?",
    answer: "Owners set the price. Longer rentals may get automatic discounts.",
  },
  {
    question: "What if the item is damaged during use?",
    answer: "You'll be responsible based on our rental policy. Damage fees may apply.",
  },
  {
    question: "How do I list my own item for rent?",
    answer: "Sign up, go to your dashboard, and add your product with details and photos.",
  },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg shadow-sm"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full text-left p-4 flex justify-between items-center focus:outline-none"
            >
              <span className="font-medium">{faq.question}</span>
              <span>{openIndex === index ? '-' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-gray-600">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqSection;
