import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
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
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";

// API service functions
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = {
  // Get auth token from localStorage
  getAuthToken: () => localStorage.getItem("token"),

  // Common headers for authenticated requests
  getHeaders: () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }),

  // Dashboard stats
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
      headers: api.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch dashboard stats");
    return response.json();
  },

  // Get orders
  getOrders: async () => {
    const response = await fetch(`${API_BASE}/api/dashboard/orders`, {
      headers: api.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  },

  // Get products
  getProducts: async () => {
    const response = await fetch(`${API_BASE}/api/dashboard/products`, {
      headers: api.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  // Get recent activities
  getRecentActivities: async () => {
    const response = await fetch(
      `${API_BASE}/api/dashboard/recent-activities`,
      {
        headers: api.getHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to fetch recent activities");
    return response.json();
  },

  // Update rental status
  updateRentalStatus: async (rentalId, status) => {
    const response = await fetch(
      `${API_BASE}/api/dashboard/rental/${rentalId}/status`,
      {
        method: "PATCH",
        headers: api.getHeaders(),
        body: JSON.stringify({ status }),
      }
    );
    if (!response.ok) throw new Error("Failed to update rental status");
    return response.json();
  },

  // Delete product
  deleteProduct: async (productId) => {
    const response = await fetch(
      `${API_BASE}/api/dashboard/product/${productId}`,
      {
        method: "DELETE",
        headers: api.getHeaders(),
      }
    );
    if (!response.ok) throw new Error("Failed to delete product");
    return response.json();
  },

  // Get user profile
  getUserProfile: async () => {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      headers: api.getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return response.json();
  },
};

// Utility functions
const formatCurrency = (amount) => {
  return `Rs. ${amount?.toLocaleString() || 0}`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// Loading Component
const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
    <FiLoader className="animate-spin text-4xl text-blue-600" />
    <p className="text-gray-500">{text}</p>
  </div>
);

// Error Component
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

// Stats Card Component
const StatsCard = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-500",
      iconBg: "bg-blue-100",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-500",
      iconBg: "bg-green-100",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-600",
      border: "border-yellow-500",
      iconBg: "bg-yellow-100",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-500",
      iconBg: "bg-purple-100",
    },
  };

  return (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${colorClasses[color].border} hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color].iconBg} ${colorClasses[color].text}`}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold ${colorClasses[color].text}`}>
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-1">{change}</p>
      </div>
    </div>
  );
};

// Dashboard Home Component
const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout, isAuthenticated } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, activitiesData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentActivities(),
      ]);

      setStats(statsData);
      setRecentActivities(activitiesData);
    } catch (err) {
      setError(err.message);
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard data..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchDashboardData} />;
  }

  const statsConfig = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      change: `${stats?.totalProducts || 0} products listed`,
      icon: <FiShoppingBag className="text-xl" />,
      color: "blue",
    },
    {
      title: "Active Orders",
      value: stats?.activeOrders || 0,
      change: `${stats?.activeOrders || 0} currently rented`,
      icon: <FiPackage className="text-xl" />,
      color: "green",
    },
    {
      title: "Pending Reviews",
      value: stats?.pendingReviews || 0,
      change: "Reviews needed",
      icon: <FiEdit2 className="text-xl" />,
      color: "yellow",
    },
    {
      title: "Total Earnings",
      value: formatCurrency(stats?.totalEarnings),
      change: "From completed rentals",
      icon: <FiDollarSign className="text-xl" />,
      color: "purple",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Welcome back! 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your rentals today.
          </p>
        </div>
        <button
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          onClick={() => navigate("/create")}
        >
          <FiPlus className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Recent Activities
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 group"
                >
                  <div className="mt-1 mr-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
                      <FiClock className="text-sm" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-800">
                      {activity.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {getTimeAgo(activity.time)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiClock className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>No recent activities</p>
                <button
                  onClick={fetchDashboardData}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/create")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-100">
                  <FiPlus className="text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Add New Product
                </span>
              </div>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button
              onClick={() => navigate("/products")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mr-3 group-hover:bg-green-100">
                  <FiShoppingBag className="text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Manage Products
                </span>
              </div>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button
              onClick={() => navigate("/earnings")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3 group-hover:bg-purple-100">
                  <FiDollarSign className="text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  View Earnings
                </span>
              </div>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center mr-3 group-hover:bg-yellow-100">
                  <FiSettings className="text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Account Settings
                </span>
              </div>
              <FiChevronRight className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// My Orders Component
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await api.getOrders();
      setOrders(ordersData);
    } catch (err) {
      setError(err.message);
      console.error("Orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (rentalId, newStatus) => {
    try {
      await api.updateRentalStatus(rentalId, newStatus);
      // Refresh orders
      await fetchOrders();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "blue";
      case "completed":
        return "green";
      case "pending":
        return "yellow";
      case "cancelled":
        return "red";
      default:
        return "gray";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.renter?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      order.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchOrders} />;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            My Orders
          </h2>
          <p className="text-gray-500 mt-1">
            Manage all your rental orders in one place.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Renter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="flex items-center cursor-pointer hover:text-blue-600"
                        onClick={() =>
                          navigate(`/product/${order.product?._id}`)
                        }
                      >
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={
                              order.product?.images?.[0] ||
                              "https://via.placeholder.com/40"
                            }
                            alt={order.product?.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.product?.name || "Unknown Product"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.product?.category || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.renter?.name || "Unknown Renter"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.renter?.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="mr-2 text-gray-400" />
                        <div>
                          <div>{formatDate(order.startDate)}</div>
                          <div className="text-xs text-gray-400">to</div>
                          <div>{formatDate(order.endDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount || order.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(order.status) === "blue"
                            ? "bg-blue-100 text-blue-800"
                            : getStatusColor(order.status) === "green"
                              ? "bg-green-100 text-green-800"
                              : getStatusColor(order.status) === "yellow"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {order.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(order._id, "active")
                            }
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Accept"
                          >
                            <FiCheck className="mr-1" /> Accept
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(order._id, "cancelled")
                            }
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Reject"
                          >
                            <FiX className="mr-1" /> Reject
                          </button>
                        </>
                      )}
                      {order.status === "active" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "completed")
                          }
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Mark as Completed"
                        >
                          <FiCheckCircle className="mr-1" /> Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FiPackage className="mx-auto text-4xl mb-4 text-gray-300" />
                    <p>No orders found matching your criteria</p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// My Products Component
const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await api.getProducts();
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
      console.error("Products fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.deleteProduct(productId);
      // Refresh products
      await fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Failed to delete product");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && product.isAvailable) ||
      (availabilityFilter === "rented" && !product.isAvailable);

    return matchesSearch && matchesAvailability;
  });

  const availabilityOptions = [
    { value: "all", label: "All Products" },
    { value: "available", label: "Available" },
    { value: "rented", label: "Rented" },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading products..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={fetchProducts} />;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            My Products
          </h2>
          <p className="text-gray-500 mt-1">
            Manage all the products you're renting out.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <FiPlus className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="flex items-center cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/product/${product._id}`)}
                      >
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={
                              product.images?.[0] ||
                              "https://via.placeholder.com/40"
                            }
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.rating ? (
                              <div className="flex items-center">
                                <FiStar className="text-yellow-400 mr-1" />
                                {product.rating.toFixed(1)}
                              </div>
                            ) : (
                              "No ratings"
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(product.pricePerDay)}/day
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {product.isAvailable ? "Available" : "Rented"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/edit-product/${product._id}`)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiEdit2 className="mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FiTrash2 className="mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FiShoppingBag className="mx-auto text-4xl mb-4 text-gray-300" />
                    <p>No products found matching your criteria</p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setAvailabilityFilter("all");
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Profile Component
const Profile = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await api.getUserProfile();
      setUser(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
      });
    } catch (err) {
      console.error("User profile fetch error:", err);
      // Use fallback data if API fails
      const fallbackData = {
        name: "User",
        email: "user@example.com",
        phone: "",
        address: "",
      };
      setUser(fallbackData);
      setFormData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // In a real app, you would call an API to update the profile
      // await api.updateUserProfile(formData);
      setUser(formData);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setErrors({
        ...errors,
        server: "Failed to update profile. Please try again.",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            My Profile
          </h2>
          <p className="text-gray-500 mt-1">
            Manage your personal information and account settings.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <FiEdit2 className="mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <FiCheckCircle className="text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {errors.server && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <FiAlertCircle className="text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800">{errors.server}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.name ? "border-red-300" : "border-gray-300"
                        } rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.email ? "border-red-300" : "border-gray-300"
                        } rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${
                          errors.phone ? "border-red-300" : "border-gray-300"
                        } rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Address
                  </h3>
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Street Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setErrors({});
                      setFormData({
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        address: user.address || "",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-gray-800 font-medium mt-1">
                      {user.name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="text-gray-800 font-medium mt-1">
                      {user.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-gray-800 font-medium mt-1">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Address
                </h3>
                <div>
                  <p className="text-sm text-gray-500">Street Address</p>
                  <p className="text-gray-800 font-medium mt-1">
                    {user.address || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Account Security
            </h3>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-100">
                  <FiUser className="text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Change Password
                </span>
              </div>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group mt-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center mr-3 group-hover:bg-yellow-100">
                  <FiBell className="text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Notification Settings
                </span>
              </div>
              <FiChevronRight className="text-gray-400" />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Danger Zone
            </h3>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  logout();
                }
              }}
              className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 group"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3 group-hover:bg-red-100">
                  <FiLogOut className="text-sm" />
                </div>
                <span className="text-sm font-medium text-red-600">
                  Log Out
                </span>
              </div>
              <FiChevronRight className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Layout
const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated()) {
    navigate("/login");
    return null;
  }

  const navLinks = [
    { path: "/dashboard", icon: <FiHome />, label: "Dashboard" },
    { path: "/dashboard/orders", icon: <FiPackage />, label: "My Orders" },
    {
      path: "/dashboard/products",
      icon: <FiShoppingBag />,
      label: "My Products",
    },
    { path: "/dashboard/profile", icon: <FiUser />, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className="lg:hidden fixed inset-0 z-40">
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <nav className="px-2 py-4">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to log out?")) {
                      logout();
                    }
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-3">
                    <FiLogOut />
                  </span>
                  Log Out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-sm border-r fixed h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">
              Rental Dashboard
            </h1>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to log out?")) {
                      logout();
                    }
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-3">
                    <FiLogOut />
                  </span>
                  Log Out
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 lg:ml-64">
          {/* Top navbar */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
                >
                  <FiMenu className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold text-gray-800">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                  <FiBell className="h-5 w-5" />
                </button>
                <div className="relative">
                  <button className="flex items-center space-x-2 focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {user?.fullName?.charAt(0) || "U"}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export { DashboardHome, MyOrders, MyProducts, Profile, DashboardLayout };
export default DashboardLayout;
