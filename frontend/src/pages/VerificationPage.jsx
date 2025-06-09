import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const VerificationPage = () => {
  const navigate = useNavigate();
  const { email: paramEmail } = useParams();

  const [userInfo, setUserInfo] = useState(null);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState({
    emailSend: false,
    emailVerify: false,
    phoneSend: false,
    phoneVerify: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVerificationStatus();
  }, [paramEmail, navigate]);

  const fetchVerificationStatus = async () => {
    try {
      const email =
        paramEmail || localStorage.getItem("pendingVerificationEmail");
      if (!email) return navigate("/register");

      const response = await axios.get(
        `http://localhost:8000/api/verification/status/${email}`
      );
      setUserInfo(response.data);

      if (response.data.isActive) navigate("/login");
    } catch (err) {
      setError("Failed to fetch verification status");
    }
  };

  const setLoadingState = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const handleResponse = (response, successMsg) => {
    setMessage(successMsg);
    setError("");

    // Check if response indicates mock mode
    if (response.data.mockMode) {
      setMockMode(true);
    }

    if (response.data.isActive) {
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  const handleError = (err) => {
    setError(err.response?.data?.message || "Operation failed");
    setMessage("");
  };

  const sendEmailOTP = async () => {
    setLoadingState("emailSend", true);
    try {
      await axios.post(
        "http://localhost:8000/api/verification/send-email-verification",
        {
          email: userInfo.user.email,
        }
      );
      handleResponse({ data: {} }, "Verification code sent to your email!");
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingState("emailSend", false);
    }
  };

  const verifyEmailOTP = async (e) => {
    e.preventDefault();
    if (!emailOTP.trim()) return;

    setLoadingState("emailVerify", true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/verification/verify-email-otp",
        {
          email: userInfo.user.email,
          otp: emailOTP,
        }
      );

      setUserInfo((prev) => ({
        ...prev,
        emailVerified: response.data.emailVerified,
        isActive: response.data.isActive,
      }));

      setEmailOTP("");
      handleResponse(response, "Email verified successfully!");
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingState("emailVerify", false);
    }
  };

  const sendPhoneOTP = async () => {
    setLoadingState("phoneSend", true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/verification/send-sms-verification",
        {
          phone: userInfo.user.phone,
        }
      );

      // Handle mock mode response
      if (response.data.mockMode || response.data.otp) {
        setMockMode(true);
        handleResponse(
          response,
          `SMS Code: ${response.data.otp} (Mock Mode - Check Console)`
        );
      } else {
        handleResponse(response, "OTP sent to your phone!");
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingState("phoneSend", false);
    }
  };

  const verifyPhoneOTP = async (e) => {
    e.preventDefault();
    if (!phoneOTP.trim()) return;

    setLoadingState("phoneVerify", true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/verification/verify-phone",
        {
          phone: userInfo.user.phone,
          otp: phoneOTP,
        }
      );

      setUserInfo((prev) => ({
        ...prev,
        phoneVerified: response.data.phoneVerified,
        isActive: response.data.isActive,
      }));

      setPhoneOTP("");
      handleResponse(response, "Phone verified successfully!");
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingState("phoneVerify", false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const VerificationSection = ({ title, verified, contact, children }) => (
    <div className="mb-6 p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{title}</span>
        <span
          className={`text-sm ${verified ? "text-green-600" : "text-red-600"}`}
        >
          {verified ? "✓ Verified" : "✗ Pending"}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{contact}</p>
      {!verified && children}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Verify Your Account
        </h2>

        {/* Development Mode Banner */}
        {mockMode && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <div className="flex items-center">
              <span className="text-lg mr-2">🛠️</span>
              <div>
                <p className="font-medium">Development Mode</p>
                <p className="text-sm">
                  SMS codes are shown in console and response
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-600 text-center mb-4">
            Hello {userInfo.user.fullName}! Please verify your email and phone
            to activate your account.
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <VerificationSection
          title="Email Verification"
          verified={userInfo.emailVerified}
          contact={userInfo.user.email}
        >
          <button
            onClick={sendEmailOTP}
            disabled={loading.emailSend}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 mb-3"
          >
            {loading.emailSend ? "Sending..." : "Send Email Code"}
          </button>

          <form onSubmit={verifyEmailOTP}>
            <input
              type="text"
              placeholder="Enter 6-digit email code"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              maxLength="6"
            />
            <button
              type="submit"
              disabled={loading.emailVerify || !emailOTP.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading.emailVerify ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        </VerificationSection>

        <VerificationSection
          title="Phone Verification"
          verified={userInfo.phoneVerified}
          contact={userInfo.user.phone}
        >
          <button
            onClick={sendPhoneOTP}
            disabled={loading.phoneSend}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 mb-3"
          >
            {loading.phoneSend ? "Sending..." : "Send SMS Code"}
          </button>

          <form onSubmit={verifyPhoneOTP}>
            <input
              type="text"
              placeholder="Enter 6-digit SMS code"
              value={phoneOTP}
              onChange={(e) => setPhoneOTP(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              maxLength="6"
            />
            <button
              type="submit"
              disabled={loading.phoneVerify || !phoneOTP.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading.phoneVerify ? "Verifying..." : "Verify Phone"}
            </button>
          </form>
        </VerificationSection>

        {userInfo.isActive && (
          <div className="text-center">
            <p className="text-green-600 font-medium mb-3">
              Account activated successfully!
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
            >
              Continue to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
