import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Login = () => {
  const { login, authenticated, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [googleRedirectInProgress, setGoogleRedirectInProgress] =
    useState(false);

  // 🐛 Debug: Log all auth states
  useEffect(() => {
    console.log("🐛 AUTH DEBUG:", {
      loading,
      authenticated,
      isAuthenticated,
      user,
      userHasId: user?.id,
      googleRedirectInProgress,
      currentPath: location.pathname,
    });
  }, [
    loading,
    authenticated,
    isAuthenticated,
    user,
    googleRedirectInProgress,
    location.pathname,
  ]);

  // Check if user is already authenticated - FIXED VERSION
  useEffect(() => {
    console.log("🐛 REDIRECT CHECK:", {
      loading,
      authenticated,
      userHasId: user?.id,
      googleRedirectInProgress,
    });

    // Wait for loading to complete and ensure we have authenticated state
    if (!loading && !googleRedirectInProgress) {
      // Use isAuthenticated if available, otherwise fall back to authenticated
      const isLoggedIn =
        typeof isAuthenticated === "function"
          ? isAuthenticated()
          : authenticated;

      if (isLoggedIn && user?.id) {
        const redirectPath =
          localStorage.getItem("redirectAfterLogin") || "/dashboard";
        console.log("🐛 REDIRECTING TO:", redirectPath);
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath, { replace: true });
      }
    }
  }, [
    authenticated,
    isAuthenticated,
    user,
    loading,
    googleRedirectInProgress,
    navigate,
  ]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGoogleLogin = async () => {
    try {
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        "http://localhost:8000/api/auth/google",
        "Google Login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const handleMessage = async (event) => {
        if (event.origin === "http://localhost:8000") {
          const { token } = event.data;
          if (token) {
            console.log(
              "🐛 Google token received:",
              token.substring(0, 20) + "..."
            );
            setGoogleRedirectInProgress(true);

            const success = await login(token);
            console.log("🐛 Google login success:", success);

            if (success) {
              // Wait for auth state to update before redirecting
              setTimeout(() => {
                const redirectPath =
                  localStorage.getItem("redirectAfterLogin") || "/dashboard";
                console.log("🐛 Google redirecting to:", redirectPath);
                localStorage.removeItem("redirectAfterLogin");
                navigate(redirectPath, { replace: true });
                setGoogleRedirectInProgress(false);
              }, 500); // Increased delay
            } else {
              setError("Failed to login with Google");
              setGoogleRedirectInProgress(false);
            }
          }
          popup.close();
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Failed to login with Google");
      setGoogleRedirectInProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPageLoading(true);

    try {
      console.log("🐛 Starting login process...");
      const res = await axios.post(
        "http://localhost:8000/api/auth/login",
        formData
      );
      console.log("🐛 Login response:", {
        status: res.status,
        hasToken: !!res.data.token,
        hasUser: !!res.data.user,
      });

      const token = res.data.token;

      if (!token) {
        throw new Error("No token received from server");
      }

      // Store token first
      localStorage.setItem("token", token);
      console.log("🐛 Token stored in localStorage");

      // Call AuthContext login and wait for it to complete
      console.log("🐛 Calling AuthContext login...");
      const success = await login(token);
      console.log("🐛 AuthContext login result:", success);

      if (success) {
        console.log("🐛 Login successful, waiting for auth state update...");

        // Wait a brief moment for state to update, then redirect
        setTimeout(() => {
          console.log("🐛 Auth state after login:", {
            authenticated,
            user: user?.id,
          });
          const redirectPath =
            localStorage.getItem("redirectAfterLogin") || "/dashboard";
          console.log("🐛 Redirecting to:", redirectPath);
          localStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath, { replace: true });
        }, 100);
      } else {
        console.log("🐛 AuthContext login failed");
        setError("Login failed. Please check your credentials.");
        localStorage.removeItem("token");
      }
    } catch (err) {
      console.error("🐛 Login Error:", err);
      console.log("🐛 Error details:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        needsVerification: err.response?.data?.needsVerification,
      });

      // Handle verification needed case
      if (err.response?.data?.needsVerification) {
        setError("Please complete email and phone verification first.");
      } else {
        setError(
          err.response?.data?.message || "Login failed. Please try again."
        );
      }

      // Clean up on failure
      localStorage.removeItem("token");
    } finally {
      setPageLoading(false);
    }
  };

  // Show loading state while authentication is being processed
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 🐛 Debug: Show current state in development
  if (process.env.NODE_ENV === "development") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
          {/* Debug Panel */}
          <div className="mb-4 p-4 bg-gray-100 rounded text-xs">
            <strong>🐛 Debug Info:</strong>
            <br />
            Loading: {loading ? "true" : "false"}
            <br />
            Authenticated: {authenticated ? "true" : "false"}
            <br />
            IsAuthenticated():{" "}
            {typeof isAuthenticated === "function"
              ? isAuthenticated().toString()
              : "N/A"}
            <br />
            User ID: {user?.id || "none"}
            <br />
            User Email: {user?.email || "none"}
            <br />
            Token in localStorage:{" "}
            {localStorage.getItem("token") ? "yes" : "no"}
            <br />
            Token Length: {localStorage.getItem("token")?.length || 0}
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Welcome Back
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p className="text-red-500 text-center text-sm">{error}</p>
            )}
            <div>
              <label className="block text-gray-600 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={pageLoading}
              />
            </div>
            <div>
              <label className="block text-gray-600 font-medium">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={pageLoading}
              />
              <div className="text-right mt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pageLoading}
            >
              {pageLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={pageLoading || googleRedirectInProgress}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
              {googleRedirectInProgress
                ? "Processing..."
                : "Continue with Google"}
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-4 text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Production version with same fixes
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Welcome Back
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          <div>
            <label className="block text-gray-600 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={pageLoading}
            />
          </div>
          <div>
            <label className="block text-gray-600 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={pageLoading}
            />
            <div className="text-right mt-1">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pageLoading}
          >
            {pageLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            disabled={pageLoading || googleRedirectInProgress}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            {googleRedirectInProgress
              ? "Processing..."
              : "Continue with Google"}
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
