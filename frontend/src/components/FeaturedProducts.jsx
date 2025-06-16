import React from "react";
import { Link } from "react-router-dom";

const products = [
  {
    name: "Mountain Bike",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/9/96/Orbea_Occam_2020.jpg",
    price: "Rs. 700/day",
  },
  {
    name: "DSLR Camera",
    image: "https://www.adorama.com/images/cms/4228ica5dm4k1_3%5B1%5D.jpg",
    price: "Rs. 1,200/day",
  },
  {
    name: "Projector",
    image: "https://m.media-amazon.com/images/I/61pKMIi0AfL._AC_SL1500_.jpg",
    price: "Rs. 900/day",
  },
  {
    name: "Camping Tent",
    image: "https://m.media-amazon.com/images/I/81DaQhY+yRL._AC_SL1500_.jpg",
    price: "Rs. 500/day",
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Featured Products
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {products.map((product, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-xl overflow-hidden shadow hover:shadow-lg transition"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {product.name}
                </h3>
                <p className="text-blue-600 font-medium">{product.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 👇 View All Products Button */}
        <div className="text-center">
          <Link
            to="/categories"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
