import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const VerificationPage = () => {
  const navigate = useNavigate();
  const { email: paramEmail } = useParams();

  const [userInfo, setUserInfo] = useState(null);
  const [emailOTP, setEmailOTP] = useState(["", "", "", "", "", ""]);
  const [phoneOTP, setPhoneOTP] = useState(["", "", "", "", "", ""]);
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState({
    emailSend: false,
    emailVerify: false,
    phoneSend: false,
    phoneVerify: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState({ email: 0, phone: 0 });

  // Refs for input fields
  const emailInputRefs = useRef([]);
  const phoneInputRefs = useRef([]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [paramEmail, navigate]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => ({
        email: prev.email > 0 ? prev.email - 1 : 0,
        phone: prev.phone > 0 ? prev.phone - 1 : 0,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const email =
        paramEmail || localStorage.getItem("pendingVerificationEmail");
      if (!email) return navigate("/register");

      if (!localStorage.getItem("pendingVerificationEmail")) {
        localStorage.setItem("pendingVerificationEmail", email);
      }

      const response = await axios.get(
        `http://localhost:8000/api/verification/status/${email}`
      );
      setUserInfo(response.data);

      if (response.data.isActive) {
        console.log("User is already active, redirecting to KYC info");
        sessionStorage.setItem("justVerified", "true");
        navigate("/kyc-info");
      }
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

    if (response.data.mockMode) {
      setMockMode(true);
    }
  };

  const handleError = (err) => {
    setError(err.response?.data?.message || "Operation failed");
    setMessage("");
  };

  const handleOTPChange = (index, value, otpArray, setOTP, inputRefs) => {
    // Handle pasted content
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOTP = [...otpArray];
      for (let i = 0; i < 6; i++) {
        newOTP[i] = digits[i] || "";
      }
      setOTP(newOTP);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newOTP.findIndex((digit) => !digit);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
      return;
    }

    const newOTP = [...otpArray];
    newOTP[index] = value;
    setOTP(newOTP);

    // Move to next input if value is entered and not the last input
    if (value && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    }
  };

  const handleOTPKeyDown = (e, index, otpArray, setOTP, inputRefs) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!otpArray[index] && index > 0) {
        // If current box is empty, move to previous box
        setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
      } else if (otpArray[index]) {
        // If current box has content, clear it
        const newOTP = [...otpArray];
        newOTP[index] = "";
        setOTP(newOTP);
      }
    }
    // Handle delete key
    else if (e.key === "Delete") {
      const newOTP = [...otpArray];
      newOTP[index] = "";
      setOTP(newOTP);
    }
    // Handle arrow keys
    else if (e.key === "ArrowLeft" && index > 0) {
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
    } else if (e.key === "ArrowRight" && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    }
    // Handle paste
    else if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6);
        const newOTP = [...otpArray];
        for (let i = 0; i < 6; i++) {
          newOTP[i] = digits[i] || "";
        }
        setOTP(newOTP);

        // Focus the next empty input or the last one
        const nextEmptyIndex = newOTP.findIndex((digit) => !digit);
        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
        setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
      });
    }
  };

  const sendEmailOTP = async () => {
    setLoadingState("emailSend", true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/verification/send-email-verification",
        {
          email: userInfo.user.email,
        }
      );
      handleResponse({ data: {} }, "New verification code sent to your email!");
      setCountdown((prev) => ({ ...prev, email: 60 }));
      // Focus the first email input after sending OTP
      setTimeout(() => {
        if (emailInputRefs.current[0]) {
          emailInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingState("emailSend", false);
    }
  };

  const verifyEmailOTP = async (e) => {
    e.preventDefault();
    const otpString = emailOTP.join("");
    if (!otpString.trim() || otpString.length !== 6) return;

    setLoadingState("emailVerify", true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/verification/verify-email-otp",
        {
          email: userInfo.user.email,
          otp: otpString,
        }
      );

      console.log("Email verification response:", response.data);

      setUserInfo((prev) => ({
        ...prev,
        emailVerified: response.data.emailVerified,
        isActive: response.data.isActive,
      }));

      setEmailOTP(["", "", "", "", "", ""]);

      if (response.data.isActive) {
        setMessage("Email verified successfully! Redirecting to KYC setup...");
        sessionStorage.setItem("justVerified", "true");
        setTimeout(() => navigate("/kyc-info"), 2000);
      } else {
        setMessage(
          "Email verified successfully! Please verify your phone to complete activation."
        );
      }

      if (response.data.mockMode) {
        setMockMode(true);
      }
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

      if (response.data.mockMode || response.data.otp) {
        setMockMode(true);
        handleResponse(
          response,
          `SMS Code: ${response.data.otp} (Mock Mode - Check Console)`
        );
      } else {
        handleResponse(response, "New OTP sent to your phone!");
      }
      setCountdown((prev) => ({ ...prev, phone: 60 }));
      // Focus the first phone input after sending OTP
      setTimeout(() => {
        if (phoneInputRefs.current[0]) {
          phoneInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingState("phoneSend", false);
    }
  };

  const verifyPhoneOTP = async (e) => {
    e.preventDefault();
    const otpString = phoneOTP.join("");
    if (!otpString.trim() || otpString.length !== 6) return;

    setLoadingState("phoneVerify", true);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/verification/verify-phone",
        {
          phone: userInfo.user.phone,
          otp: otpString,
        }
      );

      console.log("Phone verification response:", response.data);

      setUserInfo((prev) => ({
        ...prev,
        phoneVerified: response.data.phoneVerified,
        isActive: response.data.isActive,
      }));

      setPhoneOTP(["", "", "", "", "", ""]);

      if (response.data.isActive) {
        setMessage("Phone verified successfully! Redirecting to KYC setup...");
        sessionStorage.setItem("justVerified", "true");
        setTimeout(() => navigate("/kyc-info"), 2000);
      } else {
        setMessage(
          "Phone verified successfully! Please verify your email to complete activation."
        );
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoadingState("phoneVerify", false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading your verification details...
          </p>
        </div>
      </div>
    );
  }

  const OTPInput = ({ otp, setOTP, inputRefs, label, id }) => (
    <div>
      <label
        htmlFor={`${id}-0`}
        className="block text-sm font-semibold text-gray-700 mb-3"
      >
        {label}
      </label>
      <div className="flex space-x-3 justify-center mb-1">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`${id}-${index}`}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            value={digit}
            onChange={(e) =>
              handleOTPChange(index, e.target.value, otp, setOTP, inputRefs)
            }
            onKeyDown={(e) =>
              handleOTPKeyDown(e, index, otp, setOTP, inputRefs)
            }
            onFocus={(e) => e.target.select()}
            className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-300"
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 text-center mt-2">
        Enter the 6-digit code sent to your{" "}
        {id === "email-otp" ? "email" : "phone"}
      </p>
    </div>
  );

  const VerificationSection = ({
    title,
    verified,
    contact,
    children,
    type,
  }) => (
    <div
      className={`mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl ${verified ? "ring-2 ring-green-100" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`mr-4 p-3 rounded-full ${verified ? "bg-green-100" : "bg-indigo-100"} transition-colors duration-200`}
          >
            {verified ? (
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{contact}</p>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
        >
          {verified ? "✓ Verified" : "Pending"}
        </span>
      </div>
      {!verified && (
        <div className="border-t border-gray-100 pt-4">{children}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto">
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              ></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Verify Your Account
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Hi{" "}
            <span className="font-semibold text-indigo-600">
              {userInfo.user.fullName}
            </span>
            ! We've sent verification codes to your contact details. Please
            enter them below to activate your account.
          </p>
        </div>

        {mockMode && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-amber-800">
                Development Mode Active
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                SMS codes are displayed in console for testing purposes.
              </p>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-green-800">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <VerificationSection
            title="Email Verification"
            verified={userInfo.emailVerified}
            contact={userInfo.user.email}
            type="email"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Check your email for the verification code
              </p>
              <button
                onClick={sendEmailOTP}
                disabled={loading.emailSend || countdown.email > 0}
                className={`text-sm font-medium ${
                  loading.emailSend || countdown.email > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-indigo-600 hover:text-indigo-700 cursor-pointer"
                } transition-colors duration-200`}
              >
                {loading.emailSend ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : countdown.email > 0 ? (
                  `Resend in ${countdown.email}s`
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>

            <form onSubmit={verifyEmailOTP} className="space-y-6">
              <OTPInput
                otp={emailOTP}
                setOTP={setEmailOTP}
                inputRefs={emailInputRefs}
                label="Email Verification Code"
                id="email-otp"
              />
              <button
                type="submit"
                disabled={loading.emailVerify || emailOTP.join("").length !== 6}
                className={`w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-xl text-base font-semibold text-white transition-all duration-200 ${
                  loading.emailVerify || emailOTP.join("").length !== 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {loading.emailVerify ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>
          </VerificationSection>

          <VerificationSection
            title="Phone Verification"
            verified={userInfo.phoneVerified}
            contact={userInfo.user.phone}
            type="phone"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Check your phone for the SMS code
              </p>
              <button
                onClick={sendPhoneOTP}
                disabled={loading.phoneSend || countdown.phone > 0}
                className={`text-sm font-medium ${
                  loading.phoneSend || countdown.phone > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-emerald-600 hover:text-emerald-700 cursor-pointer"
                } transition-colors duration-200`}
              >
                {loading.phoneSend ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : countdown.phone > 0 ? (
                  `Resend in ${countdown.phone}s`
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>

            <form onSubmit={verifyPhoneOTP} className="space-y-6">
              <OTPInput
                otp={phoneOTP}
                setOTP={setPhoneOTP}
                inputRefs={phoneInputRefs}
                label="SMS Verification Code"
                id="phone-otp"
              />
              <button
                type="submit"
                disabled={loading.phoneVerify || phoneOTP.join("").length !== 6}
                className={`w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-xl text-base font-semibold text-white transition-all duration-200 ${
                  loading.phoneVerify || phoneOTP.join("").length !== 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transform hover:-translate-y-0.5"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
              >
                {loading.phoneVerify ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify Phone"
                )}
              </button>
            </form>
          </VerificationSection>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
