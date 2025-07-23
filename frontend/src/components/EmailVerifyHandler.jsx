import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Email Verification
        </h2>

        {status === "verifying" && (
          <div>
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-blue-600 mb-4" />
            <p className="text-gray-700 dark:text-gray-300">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <p className="text-green-600 font-medium">{message}</p>
            <p className="text-gray-500 mt-2">Redirecting...</p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <p className="text-red-600 font-semibold">{message}</p>
            <button
              onClick={() => navigate("/register")}
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition"
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
