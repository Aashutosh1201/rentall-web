import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

// Image component with proper fallback handling
const ImageWithFallback = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K"
      );
    }
  };

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img src={imgSrc} alt={alt} className={className} onError={handleError} />
  );
};

export default function RentalHistory() {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({
    active: 0,
    returned: 0,
    overdue: 0,
    total: 0,
  });

  // Get the correct API base URL
  const getApiUrl = () => {
    const currentUrl = window.location.origin;
    if (currentUrl.includes("localhost:3000")) {
      return "http://localhost:8000";
    }
    return currentUrl;
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchRentals();
  }, [user, navigate, filter]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      setError("");

      const baseUrl = getApiUrl();
      const url =
        filter === "all"
          ? `${baseUrl}/api/rentals`
          : `${baseUrl}/api/rentals?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const rentalsArray = data.rentals || data.data || data || [];

        setRentals(rentalsArray);

        // Calculate stats
        const active = rentalsArray.filter((r) => r.status === "active").length;
        const returned = rentalsArray.filter(
          (r) => r.status === "returned"
        ).length;
        const overdue = rentalsArray.filter((r) => r.isOverdue).length;

        setStats({
          active,
          returned,
          overdue,
          total: rentalsArray.length,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        setError(errorMessage);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRentalStatus = async (rentalId, newStatus) => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        `${baseUrl}/api/rentals/${rentalId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchRentals();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to update status");
      }
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const getStatusBadge = (rental) => {
    const isOverdue = rental.isOverdue;
    const status = isOverdue ? "overdue" : rental.status;

    const badges = {
      active: {
        icon: FaClock,
        class: "bg-blue-100 text-blue-800",
        text: "Active",
      },
      returned: {
        icon: FaCheckCircle,
        class: "bg-green-100 text-green-800",
        text: "Returned",
      },
      overdue: {
        icon: FaExclamationTriangle,
        class: "bg-red-100 text-red-800",
        text: "Overdue",
      },
      cancelled: {
        icon: FaTimesCircle,
        class: "bg-gray-100 text-gray-800",
        text: "Cancelled",
      },
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}
      >
        <Icon className="mr-1" size={10} />
        {badge.text}
      </span>
    );
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch (err) {
      return "Invalid date";
    }
  };

  // Helper function to get product info - handles different data structures
  const getProductInfo = (rental) => {
    if (rental.product && typeof rental.product === "object") {
      return {
        title: rental.product.title || rental.product.name || "Unknown Product",
        description: rental.product.description || "No description available",
        imageUrl: rental.product.imageUrl || rental.product.image || null,
      };
    }

    if (rental.productTitle || rental.productName) {
      return {
        title: rental.productTitle || rental.productName || "Unknown Product",
        description: rental.productDescription || "No description available",
        imageUrl: rental.productImage || rental.imageUrl || null,
      };
    }

    return {
      title: `Product ${rental.productId || "Unknown"}`,
      description: "Product details not available",
      imageUrl: null,
    };
  };

  // Helper function to get payment status
  const getPaymentStatus = (rental) => {
    if (rental.paymentStatus) {
      return rental.paymentStatus;
    }
    if (rental.payment && rental.payment.status) {
      return rental.payment.status;
    }
    if (rental.paid === true) {
      return "paid";
    }
    if (rental.paid === false) {
      return "pending";
    }
    return "unknown";
  };

  // Helper function to get payment method
  const getPaymentMethod = (rental) => {
    if (rental.paymentMethod) {
      return rental.paymentMethod;
    }
    if (rental.payment && rental.payment.method) {
      return rental.payment.method;
    }
    return "N/A";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your rentals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-10 bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={fetchRentals}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Rentals</h1>
          <p className="text-gray-600">
            Manage your rental history and active rentals
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active", value: stats.active, color: "blue" },
            { label: "Returned", value: stats.returned, color: "green" },
            { label: "Overdue", value: stats.overdue, color: "red" },
            { label: "Total", value: stats.total, color: "gray" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-600`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b">
          <nav className="flex space-x-8">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "returned", label: "Returned" },
              { key: "overdue", label: "Overdue" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Rentals List */}
        {rentals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaCalendarAlt size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No rentals found
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === "all"
                ? "You haven't rented anything yet."
                : `No ${filter} rentals.`}
            </p>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
            >
              Browse Products
            </button>
            <button
              onClick={fetchRentals}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rentals.map((rental) => {
              const productInfo = getProductInfo(rental);
              const paymentStatus = getPaymentStatus(rental);
              const paymentMethod = getPaymentMethod(rental);

              return (
                <div
                  key={rental._id || rental.id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <ImageWithFallback
                        src={
                          productInfo.imageUrl
                            ? productInfo.imageUrl.startsWith("http")
                              ? productInfo.imageUrl
                              : `${getApiUrl()}${productInfo.imageUrl}`
                            : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K"
                        }
                        alt={productInfo.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {productInfo.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {productInfo.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>
                                {formatDate(rental.startDate)} -{" "}
                                {formatDate(rental.endDate)}
                              </span>
                              <span>
                                {rental.rentalDays || rental.duration || 0} days
                              </span>
                              <span>
                                Rs.{" "}
                                {rental.totalAmount ||
                                  rental.total ||
                                  rental.amount ||
                                  0}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(rental)}
                            {rental.daysRemaining !== undefined &&
                              rental.status === "active" && (
                                <p
                                  className={`text-xs mt-1 ${rental.isOverdue ? "text-red-600" : "text-gray-500"}`}
                                >
                                  {rental.isOverdue
                                    ? `${Math.abs(rental.daysRemaining)} days overdue`
                                    : `${rental.daysRemaining} days left`}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <div className="text-xs text-gray-500">
                            <span>Payment: {paymentMethod.toUpperCase()}</span>
                            <span className="mx-2">•</span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : paymentStatus === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {paymentStatus.toUpperCase()}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              Order:{" "}
                              {rental.purchaseOrderId ||
                                rental.orderId ||
                                rental._id?.slice(-8) ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="space-x-2">
                            {rental.status === "active" && (
                              <button
                                onClick={() =>
                                  updateRentalStatus(
                                    rental._id || rental.id,
                                    "returned"
                                  )
                                }
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Mark Returned
                              </button>
                            )}
                            <button
                              onClick={() =>
                                navigate(`/rentals/${rental._id || rental.id}`)
                              }
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
