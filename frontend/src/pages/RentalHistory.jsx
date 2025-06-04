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
      const url =
        filter === "all"
          ? "http://localhost:8000/api/rentals"
          : `http://localhost:8000/api/rentals?status=${filter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRentals(data.rentals || []);

        // Calculate stats
        const active =
          data.rentals?.filter((r) => r.status === "active").length || 0;
        const returned =
          data.rentals?.filter((r) => r.status === "returned").length || 0;
        const overdue = data.rentals?.filter((r) => r.isOverdue).length || 0;
        setStats({
          active,
          returned,
          overdue,
          total: data.rentals?.length || 0,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch rentals");
      }
    } catch (err) {
      setError("Failed to fetch rentals");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateRentalStatus = async (rentalId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/rentals/${rentalId}/status`,
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
        fetchRentals(); // Refresh list
      } else {
        const errorData = await response.json();
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

  const formatDate = (date) => new Date(date).toLocaleDateString();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-10 bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRentals}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rentals.map((rental) => (
              <div key={rental._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={
                        rental.product.imageUrl
                          ? `http://localhost:8000${rental.product.imageUrl}`
                          : "/no-image.jpg"
                      }
                      alt={rental.product.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {rental.product.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {rental.product.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              {formatDate(rental.startDate)} -{" "}
                              {formatDate(rental.endDate)}
                            </span>
                            <span>{rental.rentalDays} days</span>
                            <span>Rs. {rental.totalAmount}</span>
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
                          <span>
                            Payment: {rental.paymentMethod?.toUpperCase()}
                          </span>
                          <span className="mx-2">•</span>
                          <span>Order: {rental.purchaseOrderId}</span>
                        </div>
                        <div className="space-x-2">
                          {rental.status === "active" && (
                            <button
                              onClick={() =>
                                updateRentalStatus(rental._id, "returned")
                              }
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Mark Returned
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/rentals/${rental._id}`)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
