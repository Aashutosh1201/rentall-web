import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const userToken = localStorage.getItem("token");

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

  const submitReview = async () => {
    try {
      await axios.post(
        `http://localhost:8000/api/products/${product._id}/reviews`,
        { rating, comment },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setRating(5);
      setComment("");
      // Refresh reviews
      const updated = await axios.get(
        `http://localhost:8000/api/products/${product._id}`
      );
      setProduct(updated.data);
    } catch (error) {
      console.error("Error submitting review:", error.response?.data || error);
    }
  };

  const handleAddToCartClick = () => {
    if (authLoading) return;
    if (!user) {
      localStorage.setItem("redirectAfterLogin", `/rent/${id}?action=cart`);
      navigate("/login");
    } else {
      navigate(`/rent/${id}?action=cart`);
    }
  };

  const handleRentClick = () => {
    if (authLoading) return;
    if (!user) {
      localStorage.setItem("redirectAfterLogin", `/rent/${id}`);
      navigate("/login");
    } else {
      navigate(`/rent/${id}`);
    }
  };

  if (loading || authLoading)
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
                      {product.location || "Not specified"}
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

                {/* Rent & Cart Buttons */}
                <div className="mt-8 space-y-4">
                  <button
                    onClick={handleRentClick}
                    disabled={authLoading}
                    className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
                  >
                    {authLoading ? "Loading..." : "Rent Now"}
                  </button>
                  <button
                    onClick={handleAddToCartClick}
                    disabled={authLoading}
                    className="w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 transition"
                  >
                    {authLoading ? "Loading..." : "Add to Cart"}
                  </button>
                </div>

                {/* Reviews Section */}
                <div className="mt-12">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Customer Reviews
                  </h2>
                  {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {product.reviews.map((review) => (
                        <div
                          key={review._id}
                          className="bg-white p-4 rounded-lg shadow-sm border"
                        >
                          <p className="font-semibold text-gray-800">
                            {review.user?.fullName || "Anonymous"}
                          </p>
                          <p className="text-yellow-500">
                            {`★`.repeat(review.rating)}
                          </p>
                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No reviews yet.</p>
                  )}
                </div>

                {/* Review Form */}
                {user && (
                  <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Leave a Review
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium">
                          Rating
                        </label>
                        <select
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        >
                          {[5, 4, 3, 2, 1].map((val) => (
                            <option key={val} value={val}>
                              {val} Star{val > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium">
                          Comment
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows="4"
                          className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        />
                      </div>
                      <button
                        onClick={submitReview}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                      >
                        Submit Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
