import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const PrivateRoute = ({ children }) => {
  const { user, loading, authenticated } = useAuth();

  // ✅ Wait for loading to finish
  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ Ensure both token and user are ready
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
