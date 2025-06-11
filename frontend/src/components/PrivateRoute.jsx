import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner"; // Adjust path as needed

const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Debug logging
  console.log("PrivateRoute Debug:", {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    hasToken: !!localStorage.getItem("token"),
  });

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Use isAuthenticated() method instead of just checking user
  // This provides more reliable authentication checking
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
