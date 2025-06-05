// components/PaymentCallback.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your payment...");
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    console.log("PaymentCallback state:", {
      pidx: searchParams.get("pidx"),
      paymentStatus: searchParams.get("status"),
      user: user ? "authenticated" : "not authenticated",
      loading,
      hasProcessed,
    });

    // Wait for auth to be fully loaded and only process once
    if (loading || hasProcessed) {
      return; // Still loading auth or already processed
    }

    const processPayment = async () => {
      setHasProcessed(true); // Mark as processed immediately

      try {
        const pidx = searchParams.get("pidx");
        const paymentStatus = searchParams.get("status");
        const transactionId = searchParams.get("transaction_id");

        if (!pidx) {
          setStatus("error");
          setMessage("Invalid payment reference");
          return;
        }

        // Check if user is authenticated
        if (!user || !user.token) {
          setStatus("error");
          setMessage("Authentication required. Please log in again.");
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          return;
        }

        if (paymentStatus === "Completed") {
          console.log("Processing completed payment verification...");

          const response = await fetch("/api/payment/khalti/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ pidx }),
          });

          console.log("Backend response status:", response.status);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Backend response data:", data);

          if (data.success && data.status === "completed") {
            setStatus("success");
            setMessage("Payment successful! Your rental has been confirmed.");

            setTimeout(() => {
              navigate("/rentals");
            }, 3000);
          } else {
            setStatus("error");
            setMessage(
              data.message ||
                "Payment verification failed. Please contact support."
            );
          }
        } else if (paymentStatus === "User canceled") {
          setStatus("canceled");
          setMessage("Payment was canceled. You can try again.");
        } else {
          console.log("Payment failed with status:", paymentStatus);
          setStatus("error");
          setMessage(`Payment failed: ${paymentStatus || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        setStatus("error");
        setMessage(`Error processing payment: ${error.message}`);
      }
    };

    // Process payment if we have the required parameters
    if (searchParams.get("pidx")) {
      processPayment();
    } else {
      setStatus("error");
      setMessage("No payment reference found");
      setHasProcessed(true);
    }
  }, [searchParams, user, loading, navigate, hasProcessed]);

  // Show loading while auth context is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-blue-50 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Loading...</h2>
          <p className="text-blue-800">Initializing payment verification...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        );
      case "canceled":
        return (
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "canceled":
        return "text-yellow-800";
      default:
        return "text-blue-800";
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "canceled":
        return "bg-yellow-50";
      default:
        return "bg-blue-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div
        className={`max-w-md w-full ${getBackgroundColor()} rounded-lg shadow-lg p-8 text-center`}
      >
        {getStatusIcon()}

        <h2 className={`text-2xl font-bold ${getStatusColor()} mb-4`}>
          {status === "success" && "Payment Successful!"}
          {status === "error" && "Payment Failed"}
          {status === "canceled" && "Payment Canceled"}
          {status === "processing" && "Processing Payment..."}
        </h2>

        <p className={`${getStatusColor()} mb-6`}>{message}</p>

        <div className="space-y-3">
          {status === "success" && (
            <div className="text-sm text-gray-600">
              Redirecting to your rentals in a few seconds...
            </div>
          )}

          {(status === "error" || status === "canceled") && (
            <div className="space-y-3">
              <button
                onClick={() => navigate("/products")}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Go to Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
