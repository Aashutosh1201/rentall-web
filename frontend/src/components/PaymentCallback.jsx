// Updated PaymentCallback.jsx - Fixed cart processing and navigation
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your payment...");
  const processedRef = useRef(false);
  const mountedRef = useRef(true);

  // Function to attempt user restoration from localStorage
  const restoreUserSession = async () => {
    const storedToken = localStorage.getItem("token");

    if (login && typeof login === "function" && storedToken) {
      const success = await login(storedToken);
      if (success) {
        const decoded = jwtDecode(storedToken);
        return { ...decoded, token: storedToken };
      }
    }

    return null; // fallback if login fails
  };

  useEffect(() => {
    mountedRef.current = true;

    if (
      processedRef.current &&
      (status === "success" || status === "error" || status === "canceled")
    ) {
      return;
    }

    processedRef.current = true;

    const processPayment = async () => {
      try {
        const pidx = searchParams.get("pidx");
        const paymentStatus = searchParams.get("status");
        const transactionId = searchParams.get("transaction_id");
        const amount = searchParams.get("amount");
        const totalAmount = searchParams.get("total_amount");

        // Validate required parameters first
        if (!pidx) {
          if (mountedRef.current) {
            setStatus("error");
            setMessage("Invalid payment reference. Please try again.");
          }
          return;
        }

        // Check for cancellation first
        if (paymentStatus === "User canceled" || paymentStatus === "Canceled") {
          if (mountedRef.current) {
            setStatus("canceled");
            setMessage("Payment was canceled. You can try again.");
          }
          return;
        }

        // Handle authentication - try to restore if not present
        let currentUser = user;
        if (!currentUser?.token) {
          currentUser = await restoreUserSession();
          if (!currentUser?.token) {
            setStatus("error");
            setMessage(
              "Authentication session expired. Please log in and contact support with your payment reference: " +
                pidx
            );
            return;
          }
        }

        // If payment is completed and we have user + amount, try direct creation
        if (paymentStatus === "Completed" && amount && currentUser?.token) {
          await createRentalFromUrl(pidx, transactionId, amount, currentUser);
          return;
        }

        // If still no authentication, we need to handle this gracefully
        if (!currentUser?.token) {
          // Check if we have enough info to create rental without backend verification
          if (paymentStatus === "Completed" && amount) {
            await createRentalWithoutAuth(pidx, transactionId, amount);
            return;
          }

          if (mountedRef.current) {
            setStatus("error");
            setMessage(
              "Authentication session expired. Please log in and contact support with your payment reference: " +
                pidx
            );
          }
          return;
        }

        if (mountedRef.current) {
          setMessage("Verifying payment with Khalti...");
        }

        // Verify payment with backend
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

        if (!verifyResponse.ok) {
          const errorText = await verifyResponse.text();
          throw new Error(
            `Payment verification failed (${verifyResponse.status}): ${errorText}`
          );
        }

        const verifyData = await verifyResponse.json();

        // Handle successful verification
        if (verifyData.success) {
          if (
            verifyData.status === "completed" ||
            verifyData.status === "Completed"
          ) {
            if (verifyData.rental_created && verifyData.rental_id) {
              if (mountedRef.current) {
                setStatus("success");
                setMessage(
                  "Payment successful! Your rental has been confirmed."
                );
                sessionStorage.removeItem("pendingRental");
                sessionStorage.removeItem("pendingCartRental");
                setTimeout(() => navigate("/dashboard/orders"), 3000);
              }
            } else {
              // ✅ Instead of showing new message immediately,
              // set a neutral loading state to avoid flicker
              if (mountedRef.current) {
                setStatus("processing");
                setMessage("Finalizing your order...");
              }

              await createRentalFallback(
                verifyData,
                pidx,
                transactionId,
                currentUser
              );
            }
          } else {
            // Payment not completed
            if (mountedRef.current) {
              setStatus("error");
              setMessage(`Payment ${verifyData.status}. Please try again.`);
            }
          }
        } else {
          // Verification failed
          if (mountedRef.current) {
            setStatus("error");
            setMessage(verifyData.message || "Payment verification failed");
          }
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        if (mountedRef.current) {
          setStatus("error");
          setMessage(`Error: ${error.message}`);
        }
      }
    };

    const createRentalWithoutAuth = async (pidx, transactionId, amount) => {
      try {
        // First try to get rental data from session storage
        let rentalData = JSON.parse(
          sessionStorage.getItem("pendingRental") || "{}"
        );

        // Check if this is a cart checkout
        const cartData = JSON.parse(
          sessionStorage.getItem("pendingCartRental") || "{}"
        );

        if (cartData?.items?.length > 0) {
          // Handle cart checkout without auth
          await processCartWithoutAuth(cartData, pidx, transactionId, amount);
          return;
        }

        // If no session data, try to extract from URL parameters (merchant_extra)
        if (!rentalData.productId) {
          const merchantExtra = searchParams.get("merchant_extra");
          if (merchantExtra) {
            try {
              const extraData = JSON.parse(merchantExtra);
              if (extraData.rental_data) {
                rentalData = {
                  productId: extraData.rental_data.productId,
                  startDate: extraData.rental_data.startDate,
                  endDate: extraData.rental_data.endDate,
                  rentalDays: extraData.rental_data.rentalDays,
                  totalAmount: parseInt(amount) / 100,
                };
              }
            } catch (e) {
              // Silent error handling
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
          // Silent error handling
        }

        const rentalRequestData = {
          productId: rentalData.productId,
          startDate: rentalData.startDate,
          endDate: rentalData.endDate,
          rentalDays: rentalData.rentalDays,
          totalAmount: parseInt(amount) / 100,
          paymentId: pidx,
          transactionId: transactionId,
          paymentMethod: "khalti",
          paymentStatus: "completed",
          ...(userInfo && { userId: userInfo.id }),
        };

        const headers = {
          "Content-Type": "application/json",
        };

        if (storedToken) {
          headers.Authorization = `Bearer ${storedToken}`;
        }

        const createResponse = await fetch(
          "http://localhost:8000/api/rentals/create",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${storedToken}`,
            },
            body: JSON.stringify(rentalRequestData),
          }
        );

        if (!createResponse.ok) {
          if (createResponse.status === 409) {
            // Duplicate rental – treat as success
            const errorData = await createResponse.json();
            if (errorData.rental) {
              if (mountedRef.current) {
                setStatus("success");
                setMessage(
                  "Payment successful! Your rental was already created."
                );
                sessionStorage.removeItem("pendingRental");
                setTimeout(() => navigate("/dashboard/orders"), 3000);
              }
              return;
            }
          }

          const errorText = await createResponse.text();
          throw new Error(
            `Rental creation failed (${createResponse.status}): ${errorText}`
          );
        }

        const rentalResponse = await createResponse.json();

        if (rentalResponse.success) {
          if (mountedRef.current) {
            setStatus("success");
            setMessage("Payment successful! Your rental has been confirmed.");
            sessionStorage.removeItem("pendingRental");
            setTimeout(() => navigate("/dashboard/orders"), 3000);
          }
        } else {
          throw new Error(rentalResponse.message || "Failed to create rental");
        }
      } catch (error) {
        if (mountedRef.current) {
          setStatus("error");
          setMessage(
            `Payment completed but could not create rental automatically. Please contact support with payment reference: ${pidx}`
          );
        }
      }
    };

    const processCartWithoutAuth = async (
      cartData,
      pidx,
      transactionId,
      amount
    ) => {
      try {
        // Try to get stored user info
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (!storedToken) {
          throw new Error("Authentication required for cart checkout");
        }

        let userInfo = null;
        try {
          userInfo = storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
          throw new Error("Invalid user data");
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${storedToken}`,
        };

        // Create rentals for each cart item
        for (const item of cartData.items) {
          const rentalRequestData = {
            productId: item.productId,
            startDate: item.startDate,
            endDate: item.endDate,
            rentalDays: item.rentalDays,
            totalAmount: item.total,
            paymentId: pidx,
            transactionId: transactionId,
            paymentMethod: "khalti",
            paymentStatus: "completed",
          };

          const createResponse = await fetch(
            "http://localhost:8000/api/rentals/create",
            {
              method: "POST",
              headers,
              body: JSON.stringify(rentalRequestData),
            }
          );

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Rental creation failed: ${errorText}`);
          }

          const rentalResponse = await createResponse.json();
          if (!rentalResponse.success) {
            throw new Error(
              rentalResponse.message || "Failed to create rental"
            );
          }
        }

        // Clear the cart after successful rental creation
        try {
          await fetch("http://localhost:8000/api/cart/clear", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
        } catch (clearError) {
          console.error("Failed to clear cart:", clearError);
          // Don't fail the whole process if cart clearing fails
        }

        if (mountedRef.current) {
          setStatus("success");
          setMessage("Payment successful! Your cart items have been rented.");
          sessionStorage.removeItem("pendingCartRental");
          setTimeout(() => navigate("/dashboard/orders"), 3000);
        }
      } catch (error) {
        if (mountedRef.current) {
          setStatus("error");
          setMessage(
            `Payment completed but could not process cart rentals automatically. Please contact support with payment reference: ${pidx}`
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
        const completionData = {
          pidx: pidx,
          transactionId: transactionId,
          amount: parseInt(amount) / 100,
          rentalData: rentalData,
          paymentStatus: "completed",
          paymentMethod: "khalti",
        };

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

        if (completionResponse.ok) {
          const completionResult = await completionResponse.json();

          if (completionResult.success) {
            if (mountedRef.current) {
              setStatus("success");
              setMessage("Payment successful! Your rental has been confirmed.");
              sessionStorage.removeItem("pendingRental");
              setTimeout(() => navigate("/dashboard/orders"), 3000);
            }
            return;
          }
        }

        throw new Error("Payment completion endpoint also failed");
      } catch (error) {
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
        const rentalData = JSON.parse(
          sessionStorage.getItem("pendingRental") || "{}"
        );

        const cartData = JSON.parse(
          sessionStorage.getItem("pendingCartRental") || "{}"
        );

        // ✅ Handle cart checkout
        if (cartData?.items?.length > 0) {
          if (mountedRef.current) {
            setMessage("Creating rentals for your cart items...");
          }

          let rentalSuccessCount = 0;

          for (const item of cartData.items) {
            const res = await fetch(
              "http://localhost:8000/api/rentals/create",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({
                  productId: item.productId,
                  startDate: item.startDate,
                  endDate: item.endDate,
                  rentalDays: item.rentalDays,
                  totalAmount: item.total,
                  paymentId: pidx,
                  transactionId,
                  paymentMethod: "khalti",
                  paymentStatus: "completed",
                }),
              }
            );

            if (!res.ok) {
              if (res.status === 409) {
                const conflictData = await res.json();
                console.warn(
                  "Rental already exists for cart item:",
                  conflictData.rental?._id
                );
                rentalSuccessCount++; // Count this as success to avoid false error
                continue;
              }

              const errText = await res.text();
              console.warn(
                `Rental creation failed for product ${item.productId}:`,
                errText
              );
              continue;
            }

            const rentalResponse = await res.json();
            if (rentalResponse.success) {
              rentalSuccessCount++;
            }
          }

          // ✅ If at least one rental was created or already existed
          if (rentalSuccessCount > 0 && mountedRef.current) {
            sessionStorage.removeItem("pendingCartRental");

            try {
              await fetch("http://localhost:8000/api/cart/clear", {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${currentUser.token}`,
                },
              });
            } catch (clearError) {
              console.warn("Cart clear failed:", clearError);
            }

            setStatus("success");
            setMessage("Payment successful! Your cart items have been rented.");
            setTimeout(() => navigate("/dashboard/orders"), 3000);
          } else {
            throw new Error("None of the cart rentals could be completed.");
          }

          return;
        }

        // ✅ Handle single item rental
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
          totalAmount: parseInt(amount) / 100,
          paymentId: pidx,
          transactionId: transactionId,
          paymentMethod: "khalti",
          paymentStatus: "completed",
        };

        // Check if rental already exists
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
            if (mountedRef.current) {
              setStatus("success");
              setMessage("Payment successful! Your rental has been confirmed.");
              sessionStorage.removeItem("pendingRental");
              setTimeout(() => navigate("/dashboard/orders"), 3000);
            }
            return;
          }
        }

        // Create single rental
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

        if (!createResponse.ok) {
          if (createResponse.status === 409) {
            const errorData = await createResponse.json();
            if (errorData.rental) {
              if (mountedRef.current) {
                setStatus("success");
                setMessage(
                  "Payment successful! Your rental was already created."
                );
                sessionStorage.removeItem("pendingRental");
                setTimeout(() => navigate("/dashboard/orders"), 3000);
              }
              return;
            }
          }

          const errorText = await createResponse.text();
          throw new Error(
            `Rental creation failed (${createResponse.status}): ${errorText}`
          );
        }

        const rentalResponse = await createResponse.json();

        if (rentalResponse.success) {
          if (mountedRef.current) {
            setStatus("success");
            setMessage("Payment successful! Your rental has been confirmed.");
            sessionStorage.removeItem("pendingRental");
            setTimeout(() => navigate("/dashboard/orders"), 3000);
          }
        } else {
          throw new Error(rentalResponse.message || "Failed to create rental");
        }
      } catch (error) {
        console.error("Rental creation error:", error);
        if (mountedRef.current) {
          setStatus("error");
          setMessage(
            "Payment completed but could not create rental automatically. Please contact support with payment reference: " +
              pidx
          );
        }
      }
    };

    const createRentalFallback = async (
      verifyData,
      pidx,
      transactionId,
      currentUser
    ) => {
      try {
        const rentalData = JSON.parse(
          sessionStorage.getItem("pendingRental") || "{}"
        );

        const cartData = JSON.parse(
          sessionStorage.getItem("pendingCartRental") || "{}"
        );

        // ✅ Handle cart fallback
        if (cartData?.items?.length > 0) {
          let rentalSuccessCount = 0;

          for (const item of cartData.items) {
            const rentalRequestData = {
              productId: item.productId,
              startDate: item.startDate,
              endDate: item.endDate,
              rentalDays: item.rentalDays,
              totalAmount: item.total,
              paymentId: pidx,
              transactionId: transactionId || verifyData.transaction_id || pidx,
              paymentMethod: "khalti",
              paymentStatus: "completed",
            };

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

            if (!createResponse.ok) {
              if (createResponse.status === 409) {
                const conflictData = await createResponse.json();
                console.warn(
                  "Cart fallback: Rental already exists",
                  conflictData.rental?._id
                );
                rentalSuccessCount++; // ✅ treat as success
                continue;
              }

              const errText = await createResponse.text();
              console.warn(
                `Rental fallback failed for product ${item.productId}:`,
                errText
              );
              continue;
            }

            const rentalResponse = await createResponse.json();
            if (rentalResponse.success) {
              rentalSuccessCount++;
            }
          }

          // ✅ If at least one succeeded (or already existed), treat as success
          if (rentalSuccessCount > 0 && mountedRef.current) {
            sessionStorage.removeItem("pendingCartRental");

            try {
              await fetch("http://localhost:8000/api/cart/clear", {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${currentUser.token}`,
                },
              });
            } catch (clearError) {
              console.warn("Cart clear failed:", clearError);
            }

            setStatus("success");
            setMessage("Payment successful! Your cart items have been rented.");
            setTimeout(() => navigate("/dashboard/orders"), 3000);
            return;
          }

          // ❌ If all cart items failed
          throw new Error("None of the cart rentals could be completed.");
        }

        // ✅ Handle single item fallback
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

        // Check if already exists
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
            if (mountedRef.current) {
              setStatus("success");
              setMessage("Payment successful! Your rental has been confirmed.");
              sessionStorage.removeItem("pendingRental");
              setTimeout(() => navigate("/dashboard/orders"), 3000);
            }
            return;
          }
        }

        // Try creating rental
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

        if (!createResponse.ok) {
          if (createResponse.status === 409) {
            const errorData = await createResponse.json();
            if (errorData.rental) {
              if (mountedRef.current) {
                setStatus("success");
                setMessage(
                  "Payment successful! Your rental was already created."
                );
                sessionStorage.removeItem("pendingRental");
                setTimeout(() => navigate("/dashboard/orders"), 3000);
              }
              return;
            }
          }

          const errorText = await createResponse.text();
          throw new Error(
            `Rental creation failed (${createResponse.status}): ${errorText}`
          );
        }

        const rentalResponse = await createResponse.json();

        if (rentalResponse.success) {
          if (mountedRef.current) {
            setStatus("success");
            setMessage("Payment successful! Your rental has been confirmed.");
            sessionStorage.removeItem("pendingRental");
            setTimeout(() => navigate("/dashboard/orders"), 3000);
          }
        } else {
          throw new Error(rentalResponse.message || "Failed to create rental");
        }
      } catch (error) {
        console.error("Rental creation error (fallback):", error);
        if (mountedRef.current) {
          setStatus("error");
          setMessage(
            `Payment successful but rental creation failed: ${error.message}. Please contact support with payment reference: ${pidx}`
          );
        }
      }
    };

    processPayment();

    return () => {
      mountedRef.current = false;
    };
  }, [searchParams, user?.token]);

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
          {status === "success" && "Order Confirmed!"}
          {status === "error" && "Payment Issue"}
          {status === "canceled" && "Payment Canceled"}
          {status === "processing" && "Processing Payment..."}
        </h2>

        <p className={`${getStatusColor()} mb-6`}>{message}</p>

        <div className="space-y-3">
          {status === "success" && (
            <div className="text-sm text-gray-600">
              Redirecting to your orders in a few seconds...
            </div>
          )}

          {(status === "error" || status === "canceled") && (
            <div className="space-y-3">
              <button
                onClick={() => navigate("/categories")}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back to Cart
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
                onClick={() => navigate("/categories")}
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
