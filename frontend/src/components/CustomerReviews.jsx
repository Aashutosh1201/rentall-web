import React from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Pratik S.",
    rating: 5,
    comment:
      "I rented a DSLR for my trip — super affordable and hassle-free. Love RentALL!",
  },
  {
    name: "Sita R.",
    rating: 4,
    comment:
      "The delivery was quick and the lender was very helpful. Great experience!",
  },
  {
    name: "Binod K.",
    rating: 5,
    comment:
      "I’ve made extra money renting out my unused guitar. This platform is genius!",
  },
];

const CustomerReviews = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          What Our Users Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-md transition"
            >
              <div className="flex items-center mb-3">
                {Array(review.rating)
                  .fill()
                  .map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  ))}
              </div>
              <p className="text-gray-700 italic mb-4">“{review.comment}”</p>
              <p className="text-gray-900 font-semibold">{review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
