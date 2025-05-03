import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  LogOut,
  Home,
} from "lucide-react";

const Sidebar = ({ onLogoutClick }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/products", label: "My Products", icon: Package },
    { path: "/dashboard/orders", label: "My Orders", icon: ShoppingCart },
    { path: "/dashboard/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b">
        <Link to="/" className="flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">RentALL</h2>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t mt-auto">
        <button
          onClick={onLogoutClick}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
