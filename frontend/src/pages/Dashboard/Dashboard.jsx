import React, { useState } from "react";
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
} from "react-icons/fi";
import { Outlet } from "react-router-dom"; // For nested routing if needed
import Navbar from "../../components/Navbar";

// Mock Auth Context
const useAuth = () => ({
  isAuthenticated: () => true,
  logout: () => console.log("Logout clicked"),
});

// Dashboard Home Component
const DashboardHome = () => {
  const stats = [
    {
      title: "Total Products",
      value: "12",
      change: "+2 from last month",
      icon: <FiShoppingBag className="text-xl" />,
      color: "blue",
    },
    {
      title: "Active Orders",
      value: "4",
      change: "2 pending approval",
      icon: <FiPackage className="text-xl" />,
      color: "green",
    },
    {
      title: "Pending Reviews",
      value: "2",
      change: "Due this week",
      icon: <FiEdit2 className="text-xl" />,
      color: "yellow",
    },
    {
      title: "Total Earnings",
      value: "Rs. 8,500",
      change: "+Rs. 1,200 this month",
      icon: <FiDollarSign className="text-xl" />,
      color: "purple",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "order",
      title: "New rental request",
      description: "Canon DSLR Camera requested by Ramesh K.",
      time: "2 hours ago",
      icon: <FiClock className="text-blue-500" />,
    },
    {
      id: 2,
      type: "payment",
      title: "Payment received",
      description: "Rs. 1,500 for Camping Tent rental",
      time: "1 day ago",
      icon: <FiDollarSign className="text-green-500" />,
    },
    {
      id: 3,
      type: "product",
      title: "Product approved",
      description: "Your DSLR Camera is now live",
      time: "3 days ago",
      icon: <FiCheckCircle className="text-purple-500" />,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome back, Aashutosh! 👋
        </h2>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          <FiPlus className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl p-6 shadow-xs border-l-4 ${
              stat.color === "blue"
                ? "border-blue-500"
                : stat.color === "green"
                  ? "border-green-500"
                  : stat.color === "yellow"
                    ? "border-yellow-500"
                    : "border-purple-500"
            } hover:shadow-sm transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                {stat.title}
              </h3>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === "blue"
                    ? "bg-blue-50 text-blue-600"
                    : stat.color === "green"
                      ? "bg-green-50 text-green-600"
                      : stat.color === "yellow"
                        ? "bg-yellow-50 text-yellow-600"
                        : "bg-purple-50 text-purple-600"
                }`}
              >
                {stat.icon}
              </div>
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  stat.color === "blue"
                    ? "text-blue-600"
                    : stat.color === "green"
                      ? "text-green-600"
                      : stat.color === "yellow"
                        ? "text-yellow-600"
                        : "text-purple-600"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Recent Activities
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <div className="mt-1 mr-4">{activity.icon}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">
                    {activity.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">
                Create New Rental
              </span>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">
                Manage Products
              </span>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">
                View Earnings
              </span>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">
                Account Settings
              </span>
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
  const orders = [
    {
      id: 101,
      product: "Canon DSLR Camera",
      image: "https://via.placeholder.com/40",
      renter: "Ramesh K.",
      dates: "April 25 - April 28",
      total: "Rs. 1500",
      status: "Active",
      statusColor: "blue",
    },
    {
      id: 102,
      product: "Camping Tent",
      image: "https://via.placeholder.com/40",
      renter: "Sita M.",
      dates: "April 20 - April 22",
      total: "Rs. 600",
      status: "Completed",
      statusColor: "green",
    },
    {
      id: 103,
      product: "DJI Drone",
      image: "https://via.placeholder.com/40",
      renter: "Hari P.",
      dates: "May 5 - May 7",
      total: "Rs. 2500",
      status: "Pending",
      statusColor: "yellow",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          My Orders
        </h2>
        <div className="flex space-x-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <FiPlus className="mr-2" />
            New Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs overflow-hidden">
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
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={order.image}
                          alt={order.product}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.product}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.renter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 text-gray-400" />
                      {order.dates}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.statusColor === "blue"
                          ? "bg-blue-100 text-blue-800"
                          : order.statusColor === "green"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      <FiEdit2 className="inline-block" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <FiTrash2 className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to{" "}
            <span className="font-medium">3</span> of{" "}
            <span className="font-medium">3</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// My Products Component
const MyProducts = () => {
  const products = [
    {
      id: 1,
      name: "Canon DSLR Camera",
      image: "https://via.placeholder.com/40",
      category: "Electronics",
      price: "Rs. 500/day",
      status: "Available",
      statusColor: "green",
    },
    {
      id: 2,
      name: "Camping Tent",
      image: "https://via.placeholder.com/40",
      category: "Outdoor",
      price: "Rs. 300/day",
      status: "Rented",
      statusColor: "yellow",
    },
    {
      id: 3,
      name: "DJI Drone",
      image: "https://via.placeholder.com/40",
      category: "Electronics",
      price: "Rs. 800/day",
      status: "Available",
      statusColor: "green",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          My Products
        </h2>
        <div className="flex space-x-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
          <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <FiPlus className="mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs overflow-hidden">
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
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.image}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.statusColor === "green"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">
                      <FiEdit2 className="inline-block" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <FiTrash2 className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to{" "}
            <span className="font-medium">3</span> of{" "}
            <span className="font-medium">3</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Component
const Profile = () => {
  const user = {
    name: "Aashutosh Karki",
    email: "aashutosh@example.com",
    phone: "9800000000",
    address: "Kathmandu, Nepal",
  };

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          My Profile
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          {isEditing ? (
            <>
              <FiCheckCircle className="mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <FiEdit2 className="mr-2" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-xs p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                AK
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200">
                  <FiEdit2 className="text-blue-600 text-sm" />
                </button>
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={user.name}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    : "border-gray-200 bg-gray-50"
                } transition-all duration-200`}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user.email}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    : "border-gray-200 bg-gray-50"
                } transition-all duration-200`}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={user.phone}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    : "border-gray-200 bg-gray-50"
                } transition-all duration-200`}
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={user.address}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isEditing
                    ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    : "border-gray-200 bg-gray-50"
                } transition-all duration-200`}
                disabled={!isEditing}
                rows="3"
              />
            </div>

            {isEditing && (
              <div className="pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200 mr-4"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs p-8 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Account Settings
          </h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">
                Change Password
              </span>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">
                Notification Preferences
              </span>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium text-gray-700">
                Payment Methods
              </span>
              <FiChevronRight className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
              <span className="text-sm font-medium">Delete Account</span>
              <FiChevronRight className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab }) => {
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: <FiHome /> },
    { id: "orders", label: "My Orders", icon: <FiPackage /> },
    { id: "products", label: "My Products", icon: <FiShoppingBag /> },
    { id: "profile", label: "Profile", icon: <FiUser /> },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-100 min-h-screen pt-4 hidden md:block">
      <div className="px-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800">Dashboard Menu</h2>
      </div>

      <nav className="px-4">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-4 py-3 mb-1 text-left rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span
              className={`mr-3 text-lg ${
                activeTab === item.id ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
            {activeTab === item.id && (
              <FiChevronRight className="ml-auto text-blue-600" />
            )}
          </button>
        ))}
      </nav>

      <div className="px-4 mt-8">
        <div className="border-t border-gray-200 pt-4">
          <button className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
            <FiSettings className="mr-3 text-lg text-gray-500" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Sidebar Component
const MobileSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: <FiHome /> },
    { id: "orders", label: "My Orders", icon: <FiPackage /> },
    { id: "products", label: "My Products", icon: <FiShoppingBag /> },
    { id: "profile", label: "Profile", icon: <FiUser /> },
  ];

  return (
    <div
      className={`fixed inset-0 z-40 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out md:hidden`}
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setIsOpen(false)}
      ></div>
      <div className="relative w-72 bg-white h-full shadow-xl">
        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">Dashboard Menu</h2>
        </div>

        <nav className="px-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 mb-1 text-left rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span
                className={`mr-3 text-lg ${
                  activeTab === item.id ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {activeTab === item.id && (
                <FiChevronRight className="ml-auto text-blue-600" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-8">
          <div className="border-t border-gray-200 pt-4">
            <button className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
              <FiSettings className="mr-3 text-lg text-gray-500" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200">
              <FiLogOut className="mr-3 text-lg text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome />;
      case "orders":
        return <MyOrders />;
      case "products":
        return <MyProducts />;
      case "profile":
        return <Profile />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={mobileSidebarOpen}
          setIsOpen={setMobileSidebarOpen}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
