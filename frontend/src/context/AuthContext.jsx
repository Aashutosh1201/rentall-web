import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // Corrected import
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin email fetched from environment variables
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

  useEffect(() => {
    const fetchAndSetUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null); // ✅ token is gone → logout
        setAuthenticated(false); // ✅ Make sure authenticated is false
        setLoading(false);
        return;
      }

      try {
        const decoded = validateToken(token);
        if (!decoded) {
          setUser(null); // ✅ token is invalid → logout
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        const res = await axios.get("http://localhost:8000/api/users/refresh", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userFromDB = res.data;
        if (!userFromDB || !userFromDB._id) {
          throw new Error("Invalid user data");
        }
        userFromDB.id = userFromDB._id;
        localStorage.setItem("user", JSON.stringify(userFromDB));
        setUser(userFromDB); // ✅ valid token → set full user
        setAuthenticated(true); // ✅ Set authenticated to true
      } catch (err) {
        console.error("❌ Error fetching user:", err.message);
        setUser(null); // ✅ request failed → treat as unauthenticated
        setAuthenticated(false); // ✅ Make sure authenticated is false
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetUser();
  }, []); // ✅ important to keep dependency array empty

  // Validate token and check expiration
  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("token");
        return null;
      }
      return decoded;
    } catch {
      localStorage.removeItem("token");
      return null;
    }
  };

  const login = async (token) => {
    try {
      console.log("🐛 AuthContext login - validating token...");
      const decodedUser = validateToken(token);
      if (!decodedUser) {
        console.log("🐛 Token validation failed");
        return false;
      }

      localStorage.setItem("token", token);

      console.log("🐛 AuthContext login - fetching user data...");
      const res = await axios.get("http://localhost:8000/api/users/refresh", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userFromDB = res.data;
      if (!userFromDB || !userFromDB._id) {
        throw new Error("Invalid user data received");
      }

      // Ensure user has id field
      userFromDB.id = userFromDB._id;

      localStorage.setItem("user", JSON.stringify(userFromDB));

      // 🔥 THIS IS THE KEY FIX - Set both user and authenticated state
      setUser(userFromDB);
      setAuthenticated(true); // ✅ This was missing!

      console.log("🐛 AuthContext login - success, user set:", {
        userId: userFromDB.id,
        email: userFromDB.email,
        authenticated: true,
      });

      return true;
    } catch (err) {
      console.error("🐛 AuthContext login error:", err);
      // Clean up on error
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setAuthenticated(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // ✅ Also remove user from localStorage
    setUser(null);
    setAuthenticated(false); // ✅ Set authenticated to false
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime && !!user?.id; // ✅ Also check if user exists
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
    authenticated,
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
