import React from "react";
import { Link } from "react-router-dom";
import { BadgePercent } from "lucide-react";

const products = [
  {
    name: "Mountain Bike",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/9/96/Orbea_Occam_2020.jpg",
    price: "Rs. 700/day",
  },
  {
    name: "DSLR Camera",
    image:
      "https://www.adorama.com/images/cms/4228ica5dm4k1_3%5B1%5D.jpg",
    price: "Rs. 1,200/day",
  },
  {
    name: "Projector",
    image:
      "https://m.media-amazon.com/images/I/61pKMIi0AfL._AC_SL1500_.jpg",
    price: "Rs. 900/day",
  },
  {
    name: "Camping Tent",
    image:
      "https://m.media-amazon.com/images/I/81DaQhY+yRL._AC_SL1500_.jpg",
    price: "Rs. 500/day",
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 dark:text-white mb-14">
          Featured Products
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border border-gray-200 dark:border-gray-700"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shadow flex items-center gap-1">
                  <BadgePercent size={14} /> Hot
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">
                  {product.name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {product.price}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            to="/categories"
            className="inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow hover:bg-indigo-700 transition"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
