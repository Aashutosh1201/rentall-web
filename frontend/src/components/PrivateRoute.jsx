import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Dashboard from "../pages/Dashboard";

const PrivateRoute = () => {
  const { user } = useAuth();

  return user ? <Dashboard /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
