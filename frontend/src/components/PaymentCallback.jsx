// Fixed PaymentCallback.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your payment...");

  useEffect(() => {
    if (!user?.token) {
      setStatus("error");
      setMessage("Authentication required. Please log in again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    const processPayment = async () => {
      try {
        const pidx = searchParams.get("pidx");
        const paymentStatus = searchParams.get("status");
        const transactionId = searchParams.get("transaction_id");

        if (!pidx) {
          setStatus("error");
          setMessage("Invalid payment reference");
          return;
        }

        if (paymentStatus === "Completed") {
          setMessage("Verifying payment and creating rental...");

          // Step 1: Verify payment
          const verifyResponse = await fetch(
            "http://localhost:8000/api/payment/khalti/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
              body: JSON.stringify({ pidx }),
            }
          );

          if (!verifyResponse.ok) {
            const verifyError = await verifyResponse
              .json()
              .catch(() => ({ message: "Payment verification failed" }));
            throw new Error(
              verifyError.message || "Payment verification failed"
            );
          }

          const verifyData = await verifyResponse.json();

          if (verifyData.success && verifyData.status === "completed") {
            // Step 2: Get rental data from storage
            const rentalData = JSON.parse(
              sessionStorage.getItem("pendingRental") || "{}"
            );

            // Prepare simplified rental data
            const rentalRequestData = {
              productId: rentalData.productId,
              startDate: rentalData.startDate,
              endDate: rentalData.endDate,
              totalAmount: verifyData.total_amount
                ? verifyData.total_amount / 100
                : rentalData.totalAmount, // Convert from paisa to rupees
              paymentId: pidx,
              transactionId: transactionId || pidx,
            };

            console.log("Rental request data:", rentalRequestData); // Debug log

            // Validate we have all required data
            if (
              !rentalRequestData.productId ||
              !rentalRequestData.startDate ||
              !rentalRequestData.endDate ||
              !rentalRequestData.totalAmount
            ) {
              throw new Error("Missing rental information. Please try again.");
            }

            // Step 3: Create rental
            const createRentalResponse = await fetch(
              "http://localhost:8000/api/rentals/create",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify(rentalRequestData),
              }
            );

            if (!createRentalResponse.ok) {
              let errorData;
              try {
                errorData = await createRentalResponse.json();
              } catch (parseError) {
                const errorText = await createRentalResponse.text();
                console.error("Raw error response:", errorText);
                throw new Error(
                  `Server error (${createRentalResponse.status}): ${errorText}`
                );
              }
              throw new Error(
                errorData.message ||
                  `Rental creation failed (${createRentalResponse.status})`
              );
            }

            const rentalResponse = await createRentalResponse.json();

            if (rentalResponse.success) {
              setStatus("success");
              setMessage("Payment successful! Your rental has been confirmed.");

              // Clear stored data
              sessionStorage.removeItem("pendingRental");

              setTimeout(() => navigate("/rentals"), 3000);
            } else {
              throw new Error(
                rentalResponse.message || "Rental creation failed"
              );
            }
          } else {
            throw new Error("Payment verification failed");
          }
        } else if (paymentStatus === "User canceled") {
          setStatus("canceled");
          setMessage("Payment was canceled. You can try again.");
        } else {
          setStatus("error");
          setMessage(`Payment failed: ${paymentStatus || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        setStatus("error");
        setMessage(`Error: ${error.message}`);
      }
    };

    if (searchParams.get("pidx")) {
      processPayment();
    } else {
      setStatus("error");
      setMessage("No payment reference found");
    }
  }, [searchParams, user, navigate]);

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
          {status === "success" && "Rental Confirmed!"}
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
