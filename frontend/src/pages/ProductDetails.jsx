import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
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

  const renderStars = (ratingValue) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-2xl cursor-pointer ${
            i <= (hoverRating || ratingValue)
              ? "text-yellow-400"
              : "text-gray-300"
          }`}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
        >
          {i <= (hoverRating || ratingValue) ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    return stars;
  };

  const renderStaticStars = (ratingValue) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 1; i <= fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }

    return stars;
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
                    className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition transform hover:scale-105"
                  >
                    {authLoading ? "Loading..." : "Rent Now"}
                  </button>
                  <button
                    onClick={handleAddToCartClick}
                    disabled={authLoading}
                    className="w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 transition transform hover:scale-105"
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
                          className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-gray-800">
                              {review.user?.fullName || "Anonymous"}
                            </p>
                            <div className="flex items-center space-x-1">
                              {renderStaticStars(review.rating)}
                              <span className="text-gray-500 ml-1">
                                ({review.rating.toFixed(1)})
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-2">{review.comment}</p>
                          <p className="text-gray-400 text-sm mt-3">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No reviews yet.</p>
                  )}
                </div>

                {/* Review Form */}
                {user && (
                  <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Leave a Review
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Rating
                        </label>
                        <div className="flex items-center space-x-2">
                          {renderStars(rating)}
                          <span className="ml-2 text-gray-600">
                            ({rating} star{rating !== 1 ? "s" : ""})
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Comment
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows="4"
                          className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Share your experience with this product..."
                        />
                      </div>
                      <button
                        onClick={submitReview}
                        disabled={!comment.trim()}
                        className={`px-6 py-3 rounded-lg font-medium transition ${
                          comment.trim()
                            ? "bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
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
