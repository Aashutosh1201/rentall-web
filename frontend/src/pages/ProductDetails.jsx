import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaTag } from "react-icons/fa";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data);
        } else {
          console.error("Failed to load product:", data.message);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-10 text-red-500 bg-red-50 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600">
            The product you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="relative h-[500px] md:h-full">
              <img
                src={
                  product.imageUrl
                    ? `http://localhost:8000${product.imageUrl}`
                    : "/no-image.jpg"
                }
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-md">
                <span className="text-green-600 font-bold text-xl">
                  Rs. {product.pricePerDay}
                </span>
                <span className="text-gray-500 text-sm">/day</span>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-6">
                {product.title}
              </h1>

              <div className="space-y-6">
                {/* Location */}
                <div className="flex items-center space-x-3 text-gray-700">
                  <FaMapMarkerAlt className="text-blue-500 text-xl" />
                  <div>
                    <h3 className="font-semibold">Location</h3>
                    <p className="text-gray-600">
                      {typeof product.location === "string"
                        ? product.location
                        : Array.isArray(product.location)
                        ? product.location.join(", ")
                        : typeof product.location === "object" &&
                          product.location.lat
                        ? `${product.location.lat}, ${product.location.lng}`
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Available Dates */}
                <div className="flex items-center space-x-3 text-gray-700">
                  <FaCalendarAlt className="text-green-500 text-xl" />
                  <div>
                    <h3 className="font-semibold">Available Dates</h3>
                    <p className="text-gray-600">
                      {(product.availableDates || []).join(", ") ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description || "No description provided."}
                  </p>
                </div>

                {/* Rent Button */}
                <div className="mt-8">
                  <button className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                    Rent Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
