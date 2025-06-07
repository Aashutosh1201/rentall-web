import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiGrid,
  FiCalendar,
  FiHelpCircle,
  FiUser,
  FiLogOut,
  FiPlus,
  FiBell,
  FiSearch,
  FiMenu,
  FiX,
} from "react-icons/fi";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="w-full bg-white shadow-sm fixed top-0 left-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section - Logo and main nav */}
            <div className="flex items-center">
              <Link
                to="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center"
              >
                <span className="mr-1">🏠</span> RentALL
              </Link>

              {/* Primary navigation */}
              <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`
                  }
                >
                  <FiHome className="mr-1.5" /> Home
                </NavLink>
                <NavLink
                  to="/categories"
                  className={({ isActive }) =>
                    `flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`
                  }
                >
                  <FiGrid className="mr-1.5" /> Categories
                </NavLink>

                {/* Only show My Rentals when authenticated */}
                {isAuthenticated() && (
                  <NavLink
                    to="/rentals"
                    className={({ isActive }) =>
                      `flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`
                    }
                  >
                    <FiCalendar className="mr-1.5" /> My Rentals
                  </NavLink>
                )}

                <NavLink
                  to="/how-it-works"
                  className={({ isActive }) =>
                    `flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`
                  }
                >
                  <FiHelpCircle className="mr-1.5" /> How It Works
                </NavLink>
              </div>
            </div>

            {/* Right section - Search, user, etc. */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Search bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {isAuthenticated() ? (
                <>
                  <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="sr-only">View notifications</span>
                    <FiBell className="h-6 w-6" />
                    <span className="absolute top-3 right-28 h-2 w-2 rounded-full bg-red-500"></span>
                  </button>

                  <div className="ml-4 flex items-center md:ml-6">
                    {/* Dashboard Link - Only shown when authenticated */}
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium ${
                          isActive
                            ? "text-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`
                      }
                    >
                      <FiUser className="mr-1.5" /> Dashboard
                    </NavLink>

                    {/* Profile dropdown */}
                    <div className="ml-3 relative">
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <span className="sr-only">Open user menu</span>
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium">
                            {user?.name?.charAt(0) || "U"}
                          </div>
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                          {user?.name || "User"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={logout}
                      className="ml-4 flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <FiLogOut className="mr-1" /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center"
                  >
                    <FiPlus className="mr-1" /> Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <FiMenu className="block h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        <div className="relative max-w-xs w-full bg-white h-full shadow-xl">
          <div className="p-4 flex justify-between items-center border-b border-gray-200">
            <Link
              to="/"
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
              onClick={() => setMobileMenuOpen(false)}
            >
              RentALL
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close menu</span>
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-6 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiHome className="mr-2" /> Home
              </div>
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiGrid className="mr-2" /> Categories
              </div>
            </NavLink>

            {/* Only show My Rentals when authenticated */}
            {isAuthenticated() && (
              <NavLink
                to="/rentals"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <FiCalendar className="mr-2" /> My Rentals
                </div>
              </NavLink>
            )}

            <NavLink
              to="/how-it-works"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <FiHelpCircle className="mr-2" /> How It Works
              </div>
            </NavLink>

            {isAuthenticated() ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <FiUser className="mr-2" /> Dashboard
                  </div>
                </NavLink>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <div className="flex items-center">
                    <FiLogOut className="mr-2" /> Logout
                  </div>
                </button>
              </>
            ) : (
              <div className="pt-4 space-y-2">
                <Link
                  to="/login"
                  className="block w-full px-4 py-2 text-center rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="block w-full px-4 py-2 text-center rounded-md bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium hover:shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
