import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-10 pb-6">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Brand & About */}
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">RentALL</h2>
          <p className="text-sm mt-2 leading-relaxed">
            Rent Anything. Anytime. Anywhere. 🇳🇵 <br />
            Connecting people with shared resources — smart, affordable, and sustainable.
          </p>
        </div>

        {/* Navigation Links */}
        <nav
          className="flex flex-col items-center gap-3 md:items-start text-sm"
          aria-label="Footer navigation"
        >
          <Link to="/" className="hover:text-white transition">Home</Link>
          <Link to="/#how-it-works" className="hover:text-white transition">How it Works</Link>
          <Link to="/#faqs" className="hover:text-white transition">FAQs</Link>
          <Link to="/contact" className="hover:text-white transition">Contact</Link>
        </nav>

        {/* Social Media */}
        <div className="flex justify-center md:justify-end gap-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition"
            aria-label="Facebook"
          >
            <FaFacebookF size={18} />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition"
            aria-label="Instagram"
          >
            <FaInstagram size={18} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition"
            aria-label="Twitter"
          >
            <FaTwitter size={18} />
          </a>
        </div>
      </div>

      {/* Divider & Bottom Text */}
      <div className="border-t border-gray-700 mt-10 pt-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} RentALL. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
