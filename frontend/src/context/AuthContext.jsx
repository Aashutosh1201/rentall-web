import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // Corrected import

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin email fetched from environment variables
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

  // Validate token and check expiration
  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        localStorage.removeItem("token"); // Remove expired token
        return null;
      }
      return decoded;
    } catch {
      localStorage.removeItem("token"); // Remove invalid token
      return null;
    }
  };

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedUser = validateToken(token);
      setUser(decodedUser ? { ...decodedUser, token } : null);
    } else {
      setUser(null); // Explicitly set to null if no token
    }
    setLoading(false);
  }, []);

  const login = async (token) => {
    try {
      const decodedUser = validateToken(token);
      if (decodedUser) {
        localStorage.setItem("token", token);
        setUser({ ...decodedUser, token });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  };

  // Check if the user is admin based on email
  const isAdmin = () => {
    return user?.email === ADMIN_EMAIL; // Compare user email with admin email
  };

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};