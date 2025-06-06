import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate token and check expiration
  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.error("Token expired");
        localStorage.removeItem("token");
        return null;
      }
      return decoded;
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token");
      return null;
    }
  };

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedUser = validateToken(token);
      if (decodedUser) {
        setUser({ ...decodedUser, token });
      } else {
        setUser(null); // Explicitly set to null if token is invalid
      }
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
    } catch (err) {
      console.error("Login error:", err);
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
    } catch (err) {
      return false;
    }
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
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}{" "}
      {/* Always render children, let components handle loading state */}
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
