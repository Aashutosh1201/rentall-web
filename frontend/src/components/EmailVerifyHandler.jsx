import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EmailVerifyHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/verification/verify-email/${token}`
        );
        setStatus("success");
        setMessage("Email verified successfully!");

        setTimeout(() => {
          if (response.data.isActive) {
            navigate("/login");
          } else {
            navigate("/verify-account");
          }
        }, 2000);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Email verification failed");
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Email Verification</h2>

        {status === "verifying" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-green-600 font-medium">{message}</p>
            <p className="text-gray-600 mt-2">Redirecting...</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <p className="text-red-600 font-medium">{message}</p>
            <button
              onClick={() => navigate("/register")}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Back to Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerifyHandler;
