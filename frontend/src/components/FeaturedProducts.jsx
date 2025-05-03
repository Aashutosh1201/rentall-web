import React from "react";
import { Link } from "react-router-dom";

const products = [
  {
    name: "Mountain Bike",
    image:
      "https://images.unsplash.com/photo-1605719123029-40f30f89a755?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    price: "Rs. 700/day",
  },
  {
    name: "DSLR Camera",
    image:
      "https://images.unsplash.com/photo-1549921296-3a4b1b7042da?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    price: "Rs. 1,200/day",
  },
  {
    name: "Projector",
    image:
      "https://images.unsplash.com/photo-1618477388954-c632dbb9e2f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    price: "Rs. 900/day",
  },
  {
    name: "Camping Tent",
    image:
      "https://images.unsplash.com/photo-1509988892867-8e8d76276de1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
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
            to="/products"
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
