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

  // Refs for input fields
  const emailInputRefs = useRef([]);
  const phoneInputRefs = useRef([]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [paramEmail, navigate]);

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
      handleResponse({ data: {} }, "Verification code sent to your email!");
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
        handleResponse(response, "OTP sent to your phone!");
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-600">Loading your verification details...</p>
        </div>
      </div>
    );
  }

  const OTPInput = ({ otp, setOTP, inputRefs, label, id }) => (
    <div>
      <label
        htmlFor={`${id}-0`}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <div className="flex space-x-2 justify-center">
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
            className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        ))}
      </div>
    </div>
  );

  const VerificationSection = ({ title, verified, contact, children }) => (
    <div className="mb-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div
            className={`mr-3 p-2 rounded-full ${verified ? "bg-green-100" : "bg-blue-100"}`}
          >
            {verified ? (
              <svg
                className="w-5 h-5 text-green-600"
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
                className="w-5 h-5 text-blue-600"
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
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
        >
          {verified ? "Verified" : "Pending"}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4 ml-11">{contact}</p>
      {!verified && children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Verify Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hello{" "}
            <span className="font-medium text-blue-600">
              {userInfo.user.fullName}
            </span>
            ! Please verify your contact details to activate your account.
          </p>
        </div>

        {mockMode && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
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
              <h3 className="text-sm font-medium text-yellow-800">
                Development Mode
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  SMS codes are shown in console and response for testing
                  purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
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
              <p className="text-sm font-medium text-green-800">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <VerificationSection
            title="Email Verification"
            verified={userInfo.emailVerified}
            contact={userInfo.user.email}
          >
            <button
              onClick={sendEmailOTP}
              disabled={loading.emailSend}
              className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading.emailSend ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4`}
            >
              {loading.emailSend ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                </>
              ) : (
                <>
                  <svg
                    className="-ml-1 mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                  Send Email Code
                </>
              )}
            </button>

            <form onSubmit={verifyEmailOTP} className="space-y-4">
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
                className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading.emailVerify || emailOTP.join("").length !== 6 ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading.emailVerify ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          >
            <button
              onClick={sendPhoneOTP}
              disabled={loading.phoneSend}
              className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading.phoneSend ? "bg-green-400" : "bg-green-600 hover:bg-green-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4`}
            >
              {loading.phoneSend ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                </>
              ) : (
                <>
                  <svg
                    className="-ml-1 mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  Send SMS Code
                </>
              )}
            </button>

            <form onSubmit={verifyPhoneOTP} className="space-y-4">
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
                className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading.phoneVerify || phoneOTP.join("").length !== 6 ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading.phoneVerify ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
      </div>
    </div>
  );
};

export default VerificationPage;
