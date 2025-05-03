import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Brand */}
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-white">RentALL</h2>
          <p className="text-sm mt-2">Rent Anything. Anytime. Anywhere. 🇳🇵</p>
        </div>

        {/* Links */}
        <nav className="flex gap-6 text-sm" aria-label="Footer navigation">
          <Link to="/" className="hover:text-white transition">
            Home
          </Link>
          <Link to="/#how-it-works" className="hover:text-white transition">
            How it works
          </Link>
          <Link to="/#faqs" className="hover:text-white transition">
            FAQs
          </Link>
          <Link to="/contact" className="hover:text-white transition">
            Contact
          </Link>
        </nav>

        {/* Socials */}
        <div className="flex gap-4" aria-label="Social media links">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Bottom */}
      <div className="text-center text-xs text-gray-500 mt-6">
        © {new Date().getFullYear()} RentALL. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
