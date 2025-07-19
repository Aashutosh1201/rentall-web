import React, { useState, useEffect, Suspense } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  FiHome,
  FiPackage,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiPlus,
  FiBell,
  FiSearch,
  FiSettings,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMenu,
  FiX,
  FiAlertCircle,
  FiInfo,
  FiCheck,
  FiStar,
  FiTruck,
  FiCreditCard,
} from "react-icons/fi";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
// My Orders Component
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [extensionMessage, setExtensionMessage] = useState("");
  const [selectedRentalId, setSelectedRentalId] = useState(null);

  const navigate = useNavigate();

  const ErrorMessage = ({ error, onRetry }) => (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <FiAlertCircle className="text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-800">Error: {error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/api/rentals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch rentals");
      const data = await response.json();
      const rentals = data.rentals || [];
      const now = new Date();
      const enhancedRentals = rentals.map((rental) => {
        const end = new Date(rental.endDate);
        const now = new Date();
        const diffInMs = end - now;
        const hoursRemaining = diffInMs / (1000 * 60 * 60);
        const daysRemaining = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        return {
          ...rental,
          isOverdue: now > end,
          hoursRemaining,
          daysRemaining: Math.ceil((end - now) / (1000 * 60 * 60 * 24)),
        };
      });

      setOrders(enhancedRentals);
    } catch (err) {
      console.error("MyOrders fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isExtensionAllowed = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffHours = (end - now) / (1000 * 60 * 60);
    return diffHours > 12;
  };

  const handleExtensionRequest = async (rentalId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/rentals/${rentalId}/request-extension`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newEndDate, message: extensionMessage }),
        }
      );

      if (res.ok) {
        toast.success("Extension request sent!");
        setShowExtensionModal(false);
        fetchOrders();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to request extension");
      }
    } catch (err) {
      toast.error("Server error.");
    }
  };

  const handleDeliveryProofUpload = async (rentalId, file) => {
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(
        `${API_BASE}/api/rentals/${rentalId}/upload-delivery-proof`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        }
      );

      if (res.ok) {
        toast.success("Delivery photo uploaded!");
        fetchOrders();
      } else {
        toast.error("Failed to upload delivery photo");
      }
    } catch (err) {
      toast.error("Upload failed");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const productName = order.product?.title || order.product?.name || "";
    const matchesSearch = productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      order.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const formatCurrency = (amount) => `Rs. ${amount?.toLocaleString() || 0}`;
  const formatDate = (date) => new Date(date).toLocaleDateString("en-US");

  if (loading) return <LoadingSpinner text="Loading your orders..." />;
  if (error) return <ErrorMessage error={error} onRetry={fetchOrders} />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">My Orders</h2>
        <p className="text-gray-500">
          These are the products you've rented from others.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-md w-full md:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded-md w-full md:w-48"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <FiPackage className="text-4xl mx-auto mb-4 text-gray-300" />
          <p>No orders match your filter</p>
          <button
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          order.product?.imageUrl ||
                          "https://via.placeholder.com/40"
                        }
                        alt="Product"
                        className="w-10 h-10 object-cover rounded-md"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.product?.title || order.product?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.product?.category || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(order.startDate)} – {formatDate(order.endDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : order.isOverdue
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.isOverdue ? "Overdue" : order.status}
                    </span>
                    {order.status === "active" && (
                      <div className="text-xs mt-1">
                        {order.isOverdue ? (
                          <span className="text-red-600">
                            {Math.abs(order.daysRemaining)} day(s) overdue
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {order.daysRemaining} day(s) left
                          </span>
                        )}
                      </div>
                    )}

                    {order.status === "active" && (
                      <div className="text-sm mt-2 text-blue-700">
                        📍 Pickup Hub:{" "}
                        <span className="font-medium">
                          Maitidevi, Kathmandu
                        </span>
                      </div>
                    )}

                    {/* ✅ Extension request button (only within 12h of due) */}
                    {order.status === "active" &&
                      order.hoursRemaining <= 12 &&
                      !order.isOverdue &&
                      !order.extensionRequest?.status && (
                        <button
                          onClick={() => {
                            setSelectedRentalId(order._id);
                            setShowExtensionModal(true);
                          }}
                          className="block text-blue-600 hover:underline text-xs mt-1"
                        >
                          📅 Request Extension
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              Request Extension
            </h2>

            <label className="block mb-2 text-sm font-medium">
              New End Date:
            </label>
            <input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full border p-2 rounded mb-4"
              min={new Date().toISOString().split("T")[0]}
            />

            <label className="block mb-2 text-sm font-medium">
              Message (optional):
            </label>
            <textarea
              rows={3}
              className="w-full border p-2 rounded mb-4"
              placeholder="Reason or any note..."
              value={extensionMessage}
              onChange={(e) => setExtensionMessage(e.target.value)}
            />

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowExtensionModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExtensionRequest(selectedRentalId)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
