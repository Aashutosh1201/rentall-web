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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const Sidebar = ({ onLogoutClick }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/products", label: "My Products", icon: Package },
    { path: "/dashboard/orders", label: "My Orders", icon: ShoppingCart },
    { path: "/dashboard/profile", label: "Profile", icon: User },
  ];

  return (
    <aside className="w-64 h-screen border-r bg-background text-foreground shadow-md flex flex-col">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <Link to="/" className="flex items-center gap-3">
          <Home className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">RentALL</h1>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-1">
          {menuItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <Button
                variant={isActive(path) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 rounded-md px-4 py-2 text-sm transition",
                  isActive(path)
                    ? "text-blue-700 bg-blue-100 dark:bg-blue-950"
                    : "text-muted-foreground hover:text-blue-600"
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          onClick={onLogoutClick}
          variant="destructive"
          className="w-full flex gap-3 justify-start"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
