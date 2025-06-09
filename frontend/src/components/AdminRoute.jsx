import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;

  if (loading) {
    return <div>Loading...</div>; // Show loading state while user info is being fetched
  }

  // Redirect to home if the user is not logged in or their email doesn't match the admin email
  if (!user || user.email !== adminEmail) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
