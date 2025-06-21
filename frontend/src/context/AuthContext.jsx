import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // Corrected import
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin email fetched from environment variables
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

  useEffect(() => {
    const fetchAndSetUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const decoded = validateToken(token);
        if (!decoded) {
          setUser(null);
          setLoading(false);
          return;
        }

        const res = await axios.get("http://localhost:8000/api/users/refresh", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userFromDB = res.data;
        userFromDB.id = userFromDB._id;
        localStorage.setItem("user", JSON.stringify(userFromDB));
        setUser(userFromDB); // ✅ this is what your app needs
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetUser();
  }, []);

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

  const login = async (token) => {
    try {
      const decodedUser = validateToken(token);
      if (!decodedUser) return false;

      localStorage.setItem("token", token);

      const res = await axios.get("http://localhost:8000/api/users/refresh", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userFromDB = res.data;
      localStorage.setItem("user", JSON.stringify(userFromDB));
      setUser(userFromDB); // ✅ full profile from DB

      return true;
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
    setUser,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
