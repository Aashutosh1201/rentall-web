import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // KYC Modal States
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycStatusShownOnce, setKycStatusShownOnce] = useState({
    approved: false,
    rejected: false,
  });

  // Track if pending modal has been shown in current session
  const [pendingModalShownThisSession, setPendingModalShownThisSession] =
    useState(false);

  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

  // Load KYC status shown flags from localStorage
  useEffect(() => {
    const savedFlags = localStorage.getItem("kycStatusShownFlags");
    if (savedFlags) {
      try {
        setKycStatusShownOnce(JSON.parse(savedFlags));
      } catch (e) {
        console.error("Error parsing KYC status flags:", e);
      }
    }
  }, []);

  // Save KYC status shown flags to localStorage
  const updateKycStatusShownFlags = (status) => {
    const newFlags = {
      ...kycStatusShownOnce,
      [status]: true,
    };
    setKycStatusShownOnce(newFlags);
    localStorage.setItem("kycStatusShownFlags", JSON.stringify(newFlags));
  };

  useEffect(() => {
    const fetchAndSetUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const decoded = validateToken(token);
        if (!decoded) {
          setUser(null);
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
        setUser(userFromDB);
        setAuthenticated(true);

        // Check KYC status after user is set - only on initial load
        await checkAndShowKycModal(userFromDB.email, token, true);
      } catch (err) {
        console.error("❌ Error fetching user:", err.message);
        setUser(null);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetUser();
  }, []);

  // Function to check KYC status and show modal if needed
  const checkAndShowKycModal = async (
    userEmail,
    token,
    isInitialLoad = false
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/kyc/status/${userEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch KYC status");
        return;
      }

      const kycData = await response.json();

      if (kycData.exists && kycData.status) {
        const status = kycData.status;
        setKycStatus(status);

        // Show modal based on status and whether it's been shown before
        if (status === "pending") {
          // Only show pending modal on initial load or first login, and only once per session
          if (isInitialLoad && !pendingModalShownThisSession) {
            setKycModalOpen(true);
            setPendingModalShownThisSession(true);
          }
        } else if (status === "approved" && !kycStatusShownOnce.approved) {
          // Show approved modal only once
          if (isInitialLoad) {
            setKycModalOpen(true);
          }
        } else if (status === "rejected" && !kycStatusShownOnce.rejected) {
          // Show rejected modal only once
          if (isInitialLoad) {
            setKycModalOpen(true);
          }
        }
      } else {
        // No KYC found - you might want to handle this case
        console.log("No KYC found for user");
      }
    } catch (error) {
      console.error("Error checking KYC status:", error);
    }
  };

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
        return { success: false, user: null };
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

      userFromDB.id = userFromDB._id;
      localStorage.setItem("user", JSON.stringify(userFromDB));

      setUser(userFromDB);
      setAuthenticated(true);

      console.log("🐛 AuthContext login - success, user set:", {
        userId: userFromDB.id,
        email: userFromDB.email,
        authenticated: true,
      });

      // Check KYC status after successful login - this is first page after login
      await checkAndShowKycModal(userFromDB.email, token, true);

      return { success: true, user: userFromDB };
    } catch (err) {
      console.error("🐛 AuthContext login error:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setAuthenticated(false);
      return { success: false, user: null, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("kycStatusShownFlags"); // Clear KYC flags on logout
    setUser(null);
    setAuthenticated(false);
    setKycModalOpen(false);
    setKycStatus(null);
    setKycStatusShownOnce({ approved: false, rejected: false });
    // Reset pending modal session flag
    setPendingModalShownThisSession(false);
  };

  const closeKycModal = () => {
    if (kycStatus && (kycStatus === "approved" || kycStatus === "rejected")) {
      // Mark this status as shown
      updateKycStatusShownFlags(kycStatus);
    }
    setKycModalOpen(false);
  };

  const handleKycResubmit = () => {
    // Mark rejected as shown since user is taking action
    updateKycStatusShownFlags("rejected");
    setKycModalOpen(false);
    // Navigate to KYC form or handle resubmission
    window.location.href = "/kyc-info"; // or use your navigation method
  };

  const isAuthenticated = () => {
    return authenticated;
  };

  const isAdmin = () => {
    return user?.email === ADMIN_EMAIL;
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
    // KYC Modal related
    kycModalOpen,
    kycStatus,
    closeKycModal,
    handleKycResubmit,
    checkAndShowKycModal,
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
