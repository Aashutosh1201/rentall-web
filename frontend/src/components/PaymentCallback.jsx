// Fixed PaymentCallback.jsx - Handles authentication issues during payment callback
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth(); // Add login function from context
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your payment...");
  const [debugInfo, setDebugInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const processedRef = useRef(false);
  const mountedRef = useRef(true);

  const addLog = (log) => {
    console.log("PaymentCallback:", log);
    if (mountedRef.current) {
      setLogs((prev) => [
        ...prev,
        `${new Date().toLocaleTimeString()}: ${log}`,
      ]);
    }
  };

  // Function to attempt user restoration from localStorage
  const restoreUserSession = () => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        // If login function is available in context, use it
        if (login && typeof login === "function") {
          login({ ...userData, token: storedToken });
          addLog("User session restored from localStorage");
          return { ...userData, token: storedToken };
        }
      }
      return null;
    } catch (error) {
      addLog(`Error restoring user session: ${error.message}`);
      return null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Only prevent multiple executions if we've already succeeded
    if (
      processedRef.current &&
      (status === "success" || status === "error" || status === "canceled")
    ) {
      addLog("Already processed with final status, skipping...");
      return;
    }

    // Set processed flag immediately
    processedRef.current = true;

    const processPayment = async () => {
      try {
        addLog("Starting payment processing...");

        const pidx = searchParams.get("pidx");
        const paymentStatus = searchParams.get("status");
        const transactionId = searchParams.get("transaction_id");
        const amount = searchParams.get("amount");
        const totalAmount = searchParams.get("total_amount");

        addLog(
          `URL Parameters - pidx: ${pidx}, status: ${paymentStatus}, transactionId: ${transactionId}, amount: ${amount}`
        );

        const urlParams = {
          pidx,
          paymentStatus,
          transactionId,
          amount,
          totalAmount,
          allParams: Object.fromEntries(searchParams.entries()),
        };

        // Validate required parameters first
        if (!pidx) {
          addLog("ERROR: Missing pidx parameter");
          if (mountedRef.current) {
            setStatus("error");
            setMessage("Invalid payment reference. Please try again.");
          }
          return;
        }

        // Check for cancellation first
        if (paymentStatus === "User canceled" || paymentStatus === "Canceled") {
          addLog("Payment was canceled by user");
          if (mountedRef.current) {
            setStatus("canceled");
            setMessage("Payment was canceled. You can try again.");
          }
          return;
        }

        // Handle authentication - try to restore if not present
        let currentUser = user;
        if (!currentUser?.token) {
          addLog("User not authenticated, attempting to restore session...");
          currentUser = restoreUserSession();
        }

        if (mountedRef.current) {
          setDebugInfo({
            ...urlParams,
            timestamp: new Date().toISOString(),
            userToken: currentUser?.token ? "Present" : "Missing",
            userInfo: currentUser ? "Logged in" : "Not logged in",
            sessionRestored: !user?.token && currentUser?.token ? "Yes" : "No",
          });
        }

        // If payment is completed and we have user + amount, try direct creation
        if (paymentStatus === "Completed" && amount && currentUser?.token) {
          addLog(
            "Payment status from URL is 'Completed', attempting direct rental creation"
          );
          await createRentalFromUrl(pidx, transactionId, amount, currentUser);
          return;
        }

        // If still no authentication, we need to handle this gracefully
        if (!currentUser?.token) {
          addLog("ERROR: Cannot authenticate user for payment verification");

          // Check if we have enough info to create rental without backend verification
          if (paymentStatus === "Completed" && amount) {
            addLog(
              "Attempting to create rental without authentication (using session data)"
            );
            await createRentalWithoutAuth(pidx, transactionId, amount);
            return;
          }

          if (mountedRef.current) {
            setStatus("error");
            setMessage(
              "Authentication session expired. Please log in and contact support with your payment reference: " +
                pidx
            );
            // Don't auto-redirect to login, show the pidx for reference
          }
          return;
        }

        addLog("Authentication check passed");
        if (mountedRef.current) {
          setMessage("Verifying payment with Khalti...");
        }

        // Verify payment with backend
        addLog("Making API call to verify payment...");

        const verifyResponse = await fetch(
          "http://localhost:8000/api/payment/khalti/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentUser.token}`,
            },
            body: JSON.stringify({ pidx }),
          }
        );

        addLog(
          `API Response Status: ${verifyResponse.status} ${verifyResponse.statusText}`
        );

        // Check if response is ok
        if (!verifyResponse.ok) {
          const errorText = await verifyResponse.text();
          addLog(`API Error Response: ${errorText}`);
          throw new Error(
            `Payment verification failed (${verifyResponse.status}): ${errorText}`
          );
        }

        const verifyData = await verifyResponse.json();
        addLog(`API Success Response: ${JSON.stringify(verifyData)}`);

        if (mountedRef.current) {
          setDebugInfo((prev) => ({ ...prev, verifyData }));
        }

        // Handle successful verification
        if (verifyData.success) {
          if (
            verifyData.status === "completed" ||
            verifyData.status === "Completed"
          ) {
            if (verifyData.rental_created && verifyData.rental_id) {
              addLog("✅ Rental already created by backend.");
              if (mountedRef.current) {
                setStatus("success");
                setMessage(
                  "Payment successful! Your rental has been confirmed."
                );
                sessionStorage.removeItem("pendingRental");
                setTimeout(() => navigate("/rentals"), 3000);
              }
              return; // ✅ STOP HERE!
            }

            // Backend did NOT create rental → fallback
            addLog("⚠️ Rental not created by backend, attempting fallback.");
            if (mountedRef.current) {
              setMessage("Payment verified. Creating your rental...");
            }
            await createRentalFallback(
              verifyData,
              pidx,
              transactionId,
              currentUser
            );
          } else {
            addLog(`Payment status is not completed: ${verifyData.status}`);
            // Payment not completed
            if (mountedRef.current) {
              setStatus("error");
              setMessage(`Payment ${verifyData.status}. Please try again.`);
            }
          }
        } else {
          addLog(`Payment verification failed: ${verifyData.message}`);
          // Verification failed
          if (mountedRef.current) {
            setStatus("error");
            setMessage(verifyData.message || "Payment verification failed");
          }
        }
      } catch (error) {
        addLog(`CATCH ERROR: ${error.message}`);
        console.error("Payment processing error:", error);
        if (mountedRef.current) {
          setStatus("error");
          setMessage(`Error: ${error.message}`);
          setDebugInfo((prev) => ({ ...prev, error: error.message }));
        }
      }
    };

    const createRentalWithoutAuth = async (pidx, transactionId, amount) => {
      try {
        addLog("Creating rental without authentication using session data...");

        // First try to get rental data from session storage
        let rentalData = JSON.parse(
          sessionStorage.getItem("pendingRental") || "{}"
        );

        addLog(`Rental data from session: ${JSON.stringify(rentalData)}`);

        // If no session data, try to extract from URL parameters (merchant_extra)
        if (!rentalData.productId) {
          addLog(
            "No rental data in session, trying to extract from URL parameters..."
          );

          const merchantExtra = searchParams.get("merchant_extra");
          if (merchantExtra) {
            try {
              const extraData = JSON.parse(merchantExtra);
              addLog(`Merchant extra data: ${JSON.stringify(extraData)}`);

              if (extraData.rental_data) {
                rentalData = {
                  productId: extraData.rental_data.productId,
                  startDate: extraData.rental_data.startDate,
                  endDate: extraData.rental_data.endDate,
                  rentalDays: extraData.rental_data.rentalDays,
                  totalAmount: parseInt(amount) / 100, // Convert paisa to rupees
                };
                addLog(
                  `Extracted rental data from merchant_extra: ${JSON.stringify(rentalData)}`
                );
              }
            } catch (e) {
              addLog(`Error parsing merchant_extra: ${e.message}`);
            }
          }
        }

        if (!rentalData.productId) {
          throw new Error(
            "Rental information not found in session or URL parameters. Please contact support with payment reference: " +
              pidx
          );
        }

        // Try to get stored user info for the request
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        let userInfo = null;
        try {
          userInfo = storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
          addLog("Could not parse stored user info");
        }

        const rentalRequestData = {
          productId: rentalData.productId,
          startDate: rentalData.startDate,
          endDate: rentalData.endDate,
          rentalDays: rentalData.rentalDays,
          totalAmount: parseInt(amount) / 100, // Convert paisa to rupees
          paymentId: pidx,
          transactionId: transactionId,
          paymentMethod: "khalti",
          paymentStatus: "completed",
          // Include user info if available
          ...(userInfo && { userId: userInfo.id }),
        };

        addLog(
          `Attempting rental creation without auth: ${JSON.stringify(rentalRequestData)}`
        );

        // Try with token first if available
        const headers = {
          "Content-Type": "application/json",
        };

        if (storedToken) {
          headers.Authorization = `Bearer ${storedToken}`;
          addLog("Using stored token for request");
        }

        const createResponse = await fetch(
          "http://localhost:8000/api/rentals/create",
          {
            method: "POST",
            headers,
            body: JSON.stringify(rentalRequestData),
          }
        );

        addLog(`Rental creation response status: ${createResponse.status}`);

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          addLog(`Rental creation error response: ${errorText}`);

          // Try calling a special endpoint for completed payments
          addLog("Trying special payment completion endpoint...");
          return await tryPaymentCompletionEndpoint(
            pidx,
            transactionId,
            amount,
            rentalData
          );
        }

        const rentalResponse = await createResponse.json();
        addLog(`Rental creation response: ${JSON.stringify(rentalResponse)}`);

        if (rentalResponse.success) {
          addLog("Rental created successfully without auth");
          if (mountedRef.current) {
            setStatus("success");
            setMessage("Payment successful! Your rental has been confirmed.");
            sessionStorage.removeItem("pendingRental");
            setTimeout(() => navigate("/rentals"), 3000);
          }
        } else {
          throw new Error(rentalResponse.message || "Failed to create rental");
        }
      } catch (error) {
        addLog(`Rental creation without auth failed: ${error.message}`);
        if (mountedRef.current) {
          setStatus("error");
          setMessage(
            `Payment completed but could not create rental automatically. Please contact support with payment reference: ${pidx}`
          );
        }
      }
    };

    const tryPaymentCompletionEndpoint = async (
      pidx,
      transactionId,
      amount,
      rentalData
    ) => {
      try {
        addLog("Trying payment completion endpoint as final fallback...");

        const completionData = {
          pidx: pidx,
          transactionId: transactionId,
          amount: parseInt(amount) / 100,
          rentalData: rentalData,
          paymentStatus: "completed",
          paymentMethod: "khalti",
        };

        addLog(`Payment completion data: ${JSON.stringify(completionData)}`);

        const completionResponse = await fetch(
          "http://localhost:8000/api/payment/complete-rental",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(completionData),
          }
        );

        addLog(
          `Payment completion response status: ${completionResponse.status}`
        );

        if (completionResponse.ok) {
          const completionResult = await completionResponse.json();
          addLog(
            `Payment completion response: ${JSON.stringify(completionResult)}`
          );

          if (completionResult.success) {
            addLog("Rental created via payment completion endpoint");
            if (mountedRef.current) {
              setStatus("success");
              setMessage("Payment successful! Your rental has been confirmed.");
              sessionStorage.removeItem("pendingRental");
              setTimeout(() => navigate("/rentals"), 3000);
            }
            return;
          }
        }

        throw new Error("Payment completion endpoint also failed");
      } catch (error) {
        addLog(`Payment completion endpoint failed: ${error.message}`);
        throw error;
      }
    };

    const createRentalFromUrl = async (
      pidx,
      transactionId,
      amount,
      currentUser
    ) => {
      try {
        addLog("Creating rental directly from URL parameters...");
        const rentalData = JSON.parse(
          sessionStorage.getItem("pendingRental") || "{}"
        );

        addLog(`Rental data from session: ${JSON.stringify(rentalData)}`);

        if (!rentalData.productId) {
          throw new Error(
            "Rental information not found. Please contact support with payment reference: " +
              pidx
          );
        }

        const rentalRequestData = {
          productId: rentalData.productId,
          startDate: rentalData.startDate,
          endDate: rentalData.endDate,
          rentalDays: rentalData.rentalDays,
          totalAmount: parseInt(amount) / 100, // Convert paisa to rupees
          paymentId: pidx,
          transactionId: transactionId,
          paymentMethod: "khalti",
          paymentStatus: "completed",
        };

        addLog(
          `Creating rental with URL data: ${JSON.stringify(rentalRequestData)}`
        );
        const checkResponse = await fetch(
          `http://localhost:8000/api/rentals/by-payment/${pidx}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentUser.token}`,
            },
          }
        );

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.exists) {
            addLog(
              "❌ Rental already exists for this payment. Skipping creation."
            );
            return;
          }
        }
        const createResponse = await fetch(
          "http://localhost:8000/api/rentals/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentUser.token}`,
            },
            body: JSON.stringify(rentalRequestData),
          }
        );

        addLog(`Rental creation response status: ${createResponse.status}`);

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          addLog(`Rental creation error: ${errorText}`);
          throw new Error(
            `Rental creation failed (${createResponse.status}): ${errorText}`
          );
        }

        const rentalResponse = await createResponse.json();
        addLog(`Rental creation response: ${JSON.stringify(rentalResponse)}`);

        if (rentalResponse.success) {
          addLog("Rental created successfully from URL");
          if (mountedRef.current) {
            setStatus("success");
            setMessage("Payment successful! Your rental has been confirmed.");
            sessionStorage.removeItem("pendingRental");
            setTimeout(() => navigate("/rentals"), 3000);
          }
        } else {
          throw new Error(rentalResponse.message || "Failed to create rental");
        }
      } catch (error) {
        addLog(`Direct rental creation error: ${error.message}`);
        // Fall back to normal verification process
        if (mountedRef.current) {
          setMessage("Verifying payment with backend...");
        }
        // Don't set error status, let the normal flow handle it
      }
    };

    const createRentalFallback = async (
      verifyData,
      pidx,
      transactionId,
      currentUser
    ) => {
      try {
        addLog("Starting rental creation fallback...");
        const rentalData = JSON.parse(
          sessionStorage.getItem("pendingRental") || "{}"
        );

        addLog(`Rental data from session: ${JSON.stringify(rentalData)}`);

        if (!rentalData.productId) {
          throw new Error(
            "Rental information not found. Please contact support with payment reference: " +
              pidx
          );
        }

        const rentalRequestData = {
          productId: rentalData.productId,
          startDate: rentalData.startDate,
          endDate: rentalData.endDate,
          rentalDays: rentalData.rentalDays,
          totalAmount: verifyData.amount
            ? verifyData.amount / 100
            : rentalData.totalAmount,
          paymentId: pidx,
          transactionId: transactionId || verifyData.transaction_id || pidx,
          paymentMethod: "khalti",
          paymentStatus: "completed",
        };

        addLog(
          `Creating rental with data: ${JSON.stringify(rentalRequestData)}`
        );

        const checkResponse = await fetch(
          `http://localhost:8000/api/rentals/by-payment/${pidx}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentUser.token}`,
            },
          }
        );

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.exists) {
            addLog(
              "❌ Rental already exists for this payment. Skipping creation."
            );
            return;
          }
        }

        const createResponse = await fetch(
          "http://localhost:8000/api/rentals/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentUser.token}`,
            },
            body: JSON.stringify(rentalRequestData),
          }
        );

        addLog(`Rental creation response status: ${createResponse.status}`);

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          addLog(`Rental creation error: ${errorText}`);
          throw new Error(
            `Rental creation failed (${createResponse.status}): ${errorText}`
          );
        }

        const rentalResponse = await createResponse.json();
        addLog(`Rental creation response: ${JSON.stringify(rentalResponse)}`);

        if (rentalResponse.success) {
          addLog("Rental created successfully");
          if (mountedRef.current) {
            setStatus("success");
            setMessage("Payment successful! Your rental has been confirmed.");
            sessionStorage.removeItem("pendingRental");
            setTimeout(() => navigate("/rentals"), 3000);
          }
        } else {
          throw new Error(rentalResponse.message || "Failed to create rental");
        }
      } catch (error) {
        addLog(`Rental creation error: ${error.message}`);
        console.error("Rental creation error:", error);
        if (mountedRef.current) {
          setStatus("error");
          setMessage(
            `Payment successful but rental creation failed: ${error.message}. Please contact support with payment reference: ${pidx}`
          );
        }
      }
    };

    // Start processing immediately
    addLog("Starting payment processing immediately...");
    processPayment();

    return () => {
      addLog("Component unmounting, cleaning up...");
      mountedRef.current = false;
    };
  }, [searchParams, user?.token]); // Keep dependencies minimal

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
        className={`max-w-4xl w-full ${getBackgroundColor()} rounded-lg shadow-lg p-8 text-center`}
      >
        {getStatusIcon()}

        <h2 className={`text-2xl font-bold ${getStatusColor()} mb-4`}>
          {status === "success" && "Rental Confirmed!"}
          {status === "error" && "Payment Issue"}
          {status === "canceled" && "Payment Canceled"}
          {status === "processing" && "Processing Payment..."}
        </h2>

        <p className={`${getStatusColor()} mb-6`}>{message}</p>

        {/* Debug Information - Always show for debugging */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Debug Info */}
          {debugInfo && (
            <div className="bg-gray-100 p-3 rounded text-xs text-left max-h-60 overflow-y-auto">
              <strong>Debug Info:</strong>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          {/* Logs */}
          <div className="bg-gray-100 p-3 rounded text-xs text-left max-h-60 overflow-y-auto">
            <strong>Execution Logs:</strong>
            <div className="mt-2">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

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
              {status === "error" && (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Login to Access Your Account
                </button>
              )}
            </div>
          )}

          {status === "processing" && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  processedRef.current = false;
                  window.location.reload();
                }}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Retry Processing
              </button>
              <button
                onClick={() => navigate("/products")}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel & Browse Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
