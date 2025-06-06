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
} from "react-icons/fi";

// Mock Auth Context (replace with your actual implementation)
const useAuth = () => ({
  isAuthenticated: () => true,
  logout: () => console.log("Logout clicked"),
});

// Navbar Component (integrated from Navbar.jsx)
const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="w-full bg-white shadow-sm fixed top-0 left-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="/"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
        >
          RentALL
        </a>

        <ul className="hidden md:flex space-x-8 text-gray-600 font-medium">
          <li>
            <a
              href="/"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="/categories"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Categories
            </a>
          </li>
          <li>
            <a
              href="/rentals"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              My Rentals
            </a>
          </li>
          <li>
            <a
              href="/how-it-works"
              className="hover:text-blue-600 transition-colors duration-200"
            >
              How It Works
            </a>
          </li>
          {!isAuthenticated() ? (
            <>
              <li>
                <a
                  href="/login"
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                  Login
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Sign Up
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a
                  href="/dashboard"
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <button
                  onClick={logout}
                  className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center"
                >
                  <FiLogOut className="mr-1" /> Logout
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="md:hidden flex items-center">
          <button className="text-2xl text-gray-600 hover:text-gray-800 transition-colors duration-200">
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
};

// Dashboard Home Component
const DashboardHome = () => {
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        Welcome back, Aashutosh! 👋
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Total Products
            </h3>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <FiShoppingBag className="text-blue-600 text-xl" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-600">12</p>
          <p className="text-sm text-gray-500 mt-2">+2 from last month</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Active Orders
            </h3>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <FiPackage className="text-green-600 text-xl" />
            </div>
          </div>
          <p className="text-4xl font-bold text-green-600">4</p>
          <p className="text-sm text-gray-500 mt-2">2 pending approval</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Pending Reviews
            </h3>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <FiEdit2 className="text-yellow-600 text-xl" />
            </div>
          </div>
          <p className="text-4xl font-bold text-yellow-600">2</p>
          <p className="text-sm text-gray-500 mt-2">Due this week</p>
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
      renter: "Ramesh K.",
      dates: "April 25 - April 28",
      total: "Rs. 1500",
      status: "Active",
    },
    {
      id: 102,
      product: "Camping Tent",
      renter: "Sita M.",
      dates: "April 20 - April 22",
      total: "Rs. 600",
      status: "Completed",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">My Orders</h2>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          New Order
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Renter
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Rental Dates
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.product}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.renter}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.dates}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {order.total}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "Active"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <FiEdit2 className="inline-block" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <FiTrash2 className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      category: "Electronics",
      price: "Rs. 500/day",
      status: "Available",
    },
    {
      id: 2,
      name: "Camping Tent",
      category: "Outdoor",
      price: "Rs. 300/day",
      status: "Rented",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">My Products</h2>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {product.price}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <FiEdit2 className="inline-block" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <FiTrash2 className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">My Profile</h2>

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="text-xl font-semibold text-center text-gray-800">
              {user.name}
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={user.name}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user.email}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={user.phone}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={user.address}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled
              />
            </div>

            <div className="pt-4">
              <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Edit Profile
              </button>
            </div>
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
    <div className="w-72 bg-white shadow-sm border-r border-gray-100 min-h-screen pt-4">
      <div className="px-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800">Dashboard Menu</h2>
      </div>

      <nav className="px-4">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-4 py-3 mb-2 text-left rounded-xl transition-all duration-200 ${
              activeTab === item.id
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {activeTab === item.id && (
              <FiChevronRight className="ml-auto text-blue-600" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

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
        <main className="flex-1 overflow-x-hidden">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
