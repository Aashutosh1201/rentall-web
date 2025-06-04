import React from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          RentALL
        </Link>

        {/* Menu */}
        <ul className="hidden md:flex space-x-8 text-gray-700 font-medium">
          <li>
            <Link to="/" className="hover:text-blue-600 transition">
              Home
            </Link>
          </li>
          <li>
            <Link to="/categories" className="hover:text-blue-600 transition">
              Categories
            </Link>
          </li>
          <li>
            <NavLink to="/rentals">My Rentals</NavLink>
          </li>
          <li>
            <Link to="/how-it-works" className="hover:text-blue-600 transition">
              How It Works
            </Link>
          </li>
          {!isAuthenticated() ? (
            <>
              <li>
                <Link to="/login" className="hover:text-blue-600 transition">
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-blue-600 transition"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <button
                  onClick={logout}
                  className="text-red-600 hover:text-red-700 transition"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Hamburger */}
        <div className="md:hidden flex items-center">
          <button className="text-2xl text-gray-700">☰</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
