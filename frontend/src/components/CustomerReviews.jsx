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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-6">
          What Our Users Say
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
          Hear directly from the renters and lenders who trust RentALL.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-3 text-yellow-400">
                {Array(review.rating)
                  .fill()
                  .map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5"
                      fill="currentColor"
                      strokeWidth={1}
                    />
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
