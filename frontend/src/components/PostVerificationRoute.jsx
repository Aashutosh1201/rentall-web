import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PostVerificationRoute = ({ children, requireFullAuth = false }) => {
  const { user, isAuthenticated } = useAuth();

  // If full authentication is required, use standard auth check
  if (requireFullAuth) {
    return user ? children : <Navigate to="/login" replace />;
  }

  // For post-verification routes (like KYC), allow access if:
  // 1. User is fully authenticated (logged in)
  if (user) {
    return children;
  }

  // 2. OR user just completed verification AND has verification data
  const justVerified = sessionStorage.getItem("justVerified") === "true";
  const pendingVerificationEmail = localStorage.getItem(
    "pendingVerificationEmail"
  );

  // Only allow access if both conditions are met:
  // - User has the justVerified flag (came from verification process)
  // - User has pending verification email (proves they went through verification)
  const hasValidVerificationState = justVerified && pendingVerificationEmail;

  if (hasValidVerificationState) {
    return children;
  }

  // If none of the conditions are met, redirect to register
  // (not login, because they need to complete the full registration flow first)
  return <Navigate to="/register" replace />;
};

export default PostVerificationRoute;
