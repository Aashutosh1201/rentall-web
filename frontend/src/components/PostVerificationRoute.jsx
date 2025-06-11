import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PostVerificationRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null; // or a spinner if preferred

  // ✅ Fully authenticated users can access
  if (isAuthenticated && user) return children;

  // ✅ OR if they just completed verification
  const justVerified = sessionStorage.getItem("justVerified") === "true";
  const pendingVerificationEmail = localStorage.getItem(
    "pendingVerificationEmail"
  );

  if (justVerified && pendingVerificationEmail) return children;

  return <Navigate to="/register" replace />;
};

export default PostVerificationRoute;
