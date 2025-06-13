import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
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

const LogoutConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Confirm Logout
        </h3>
        <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 rounded-md text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [kycSelfie, setKycSelfie] = useState(null);
  const navigate = useNavigate();

  // Fetch KYC data to get the selfie
  useEffect(() => {
    if (!user?.email) return;

    const fetchKYCSelfie = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/kyc/status/${user.email}`
        );
        const data = await res.json();
        if (data.exists) {
          const kycDetails = await fetch(
            `http://localhost:8000/api/kyc/detail/${user.email}`
          );
          const detail = await kycDetails.json();
          if (detail.kyc?.selfiePath) {
            setKycSelfie(detail.kyc.selfiePath);
          }
        }
      } catch (err) {
        console.error("Failed to fetch KYC selfie:", err);
      }
    };

    fetchKYCSelfie();
  }, [user?.email]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    setMobileMenuOpen(false);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Function to get the profile image source
  const getProfileImageSrc = () => {
    // First check for KYC selfie, then fallback to user selfie from auth context
    return kycSelfie || user?.selfiePath;
  };

  // Function to get user initial
  const getUserInitial = () => {
    return user?.fullName?.charAt(0).toUpperCase() || "U";
  };

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
                <span className="mr-1 hidden sm:inline">🏠</span>
                <span className="sm:ml-1">RentALL</span>
              </Link>

              {/* Primary navigation */}
              <div className="hidden lg:ml-10 lg:flex lg:items-center lg:space-x-6">
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
            <div className="flex items-center space-x-4">
              {/* Search bar */}
              <div className="hidden lg:block relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-40 xl:w-56 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {isAuthenticated() ? (
                <div className="flex items-center space-x-4">
                  {/* Notification bell */}
                  <div className="hidden lg:block relative">
                    <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="sr-only">View notifications</span>
                      <FiBell className="h-6 w-6" />
                    </button>
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                  </div>

                  {/* Dashboard Link */}
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `hidden xl:flex items-center px-3 py-2 text-sm font-medium ${
                        isActive
                          ? "text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`
                    }
                  >
                    <FiUser className="mr-1.5" /> Dashboard
                  </NavLink>

                  {/* Profile avatar - now shows KYC selfie if available */}
                  <button
                    onClick={handleProfileClick}
                    className="flex rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Open profile</span>
                    {getProfileImageSrc() ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover border-2 border-blue-200"
                        src={getProfileImageSrc()}
                        alt="User profile"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {getUserInitial()}
                      </div>
                    )}
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogoutClick}
                    className="hidden xl:flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <FiLogOut className="h-5 w-5" />
                    <span className="ml-1">Logout</span>
                  </button>
                </div>
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
                    <FiPlus className="mr-1" />
                    <span>Sign up</span>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <div className="lg:hidden flex items-center">
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
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:hidden`}
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
            {/* Mobile Profile Section */}
            {isAuthenticated() && (
              <div className="flex items-center p-3 mb-4 bg-gray-50 rounded-lg">
                {getProfileImageSrc() ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
                    src={getProfileImageSrc()}
                    alt="User profile"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {getUserInitial()}
                  </div>
                )}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            )}

            <div className="relative mb-4">
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

            {isAuthenticated() && (
              <>
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
                <NavLink
                  to="/profile"
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
                    <FiUser className="mr-2" /> Profile
                  </div>
                </NavLink>
              </>
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
              <button
                onClick={handleLogoutClick}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center"
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
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

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutConfirmationModal
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </>
  );
};

export default Navbar;
