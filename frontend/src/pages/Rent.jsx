import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Rent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [rentalDays, setRentalDays] = useState(1);
  const [pickupMethod, setPickupMethod] = useState("lender-dropoff");
  const [deliveryMethod, setDeliveryMethod] = useState("self-pickup");
  const [returnPickupMethod, setReturnPickupMethod] =
    useState("borrower-dropoff");
  const [fees, setFees] = useState(null);

  // Set default dates: today and tomorrow
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrowString);
  const [processing, setProcessing] = useState(false);
  const { user, loading } = useAuth();
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [rentalConflict, setRentalConflict] = useState(null);
  const token = localStorage.getItem("token");
  const isCartAction = searchParams.get("action") === "cart";
  const API_BASE = process.env.REACT_APP_API_URL;

  // Check user authentication and KYC status
  useEffect(() => {
    if (loading) return; // ✅ Wait for context to load

    if (!user || !user.id) {
      console.log("🔍 Rent.jsx user:", user);
      console.log("🔍 token:", localStorage.getItem("token"));
      navigate("/login");
      return;
    }

    if (user.kycStatus !== "verified") {
      setShowKYCModal(true);
    }
  }, [user, loading, navigate]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setPageLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Update end date when start date or rental days change
  useEffect(() => {
    if (startDate && rentalDays) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + rentalDays);
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [startDate, rentalDays]);

  // Update rental days when dates change
  useEffect(() => {
    if (endDate && startDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays !== rentalDays && diffDays > 0) {
        setRentalDays(diffDays);
      }
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const calculateFees = async () => {
      if (!startDate || !endDate || !product?._id) return;
      try {
        const res = await axios.post(
          `${API_BASE}/api/rentals/calculate-fee`,
          {
            productId: product._id,
            startDate,
            endDate,
            deliveryMethod,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setFees(res.data);
      } catch (err) {
        console.error("Fee calc error", err);
        toast.error("Could not calculate delivery fees.");
      }
    };

    calculateFees();
  }, [startDate, endDate, deliveryMethod, returnPickupMethod]);

  const calculateTotal = () => {
    if (!product) return 0;
    return product.pricePerDay * rentalDays;
  };

  const handleRentalDaysChange = (days) => {
    setRentalDays(days);
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + days);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  const handleAddToCart = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      toast.error("Please select both start and end dates");
      return;
    }

    const todayDate = new Date().toISOString().split("T")[0];
    if (startDate < todayDate) {
      setError("Start date cannot be in the past");
      toast.error("Start date cannot be in the past");
      return;
    }

    if (endDate < startDate) {
      setError("End date must be after start date");
      toast.error("End date must be after start date");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8000/api/cart",
        {
          productId: id,
          rentalDays,
          startDate,
          endDate,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200 || res.status === 201) {
        toast.success("Product added to cart successfully!");
        navigate("/cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to add to cart";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleConfirmRental = async () => {
    if (!user || !user.id) {
      navigate("/login");
      return;
    }

    // Clear any previous errors
    setError("");
    setRentalConflict(null);

    // Validate dates
    if (!startDate || !endDate) {
      const errorMsg = "Please select both start and end dates";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const todayDate = new Date().toISOString().split("T")[0];
    if (startDate < todayDate) {
      const errorMsg = "Start date cannot be in the past";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      const errorMsg = "End date must be after start date";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (rentalDays < 1) {
      const errorMsg = "Rental must be for at least 1 day";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setProcessing(true);

    try {
      // Calculate rental days
      const calculatedRentalDays = Math.ceil(
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
      );

      const totalAmount = calculateTotal();

      // Store minimal rental data in sessionStorage
      const rentalData = {
        productId: product._id,
        productTitle: product.title,
        startDate: startDate,
        endDate: endDate,
        rentalDays: calculatedRentalDays,
        totalAmount: totalAmount,
      };

      sessionStorage.setItem("pendingRental", JSON.stringify(rentalData));

      // Check for rental conflict before proceeding
      const conflictCheck = await axios.post(
        "http://localhost:8000/api/rentals/conflict-check",
        {
          productId: product._id,
          startDate,
          endDate,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (conflictCheck.status !== 200) {
        const reason =
          conflictCheck.data?.message || "Rental conflict detected.";
        const hint = conflictCheck.data?.hint || "";
        const conflictMessage = `${reason} ${hint}`;

        setRentalConflict(conflictMessage);
        toast.error(conflictMessage);
        setProcessing(false);
        return;
      }

      // Initialize Khalti payment
      const paymentData = {
        return_url: `${window.location.origin}/payment/callback`,
        website_url: window.location.origin,
        amount: totalAmount * 100, // Khalti expects amount in paisa
        purchase_order_id: `rental_${Date.now()}`,
        purchase_order_name: `Rental: ${product.title}`,
        customer_info: {
          name: user.name || user.email.split("@")[0],
          email: user.email,
          phone: user.phone || "9800000000",
        },
        amount_breakdown: [
          {
            label: "Rental Cost",
            amount: totalAmount * 100,
          },
        ],
        product_details: [
          {
            identity: product._id,
            name: product.title,
            total_price: totalAmount * 100,
            quantity: 1,
            unit_price: totalAmount * 100,
          },
        ],
        merchant_username: "rental_platform",
        merchant_extra: JSON.stringify({
          rental_data: {
            productId: rentalData.productId,
            rentalDays: rentalData.rentalDays,
            startDate: rentalData.startDate,
            endDate: rentalData.endDate,
            pickupMethod,
            deliveryMethod,
            notes: `Rental for ${product.title} from ${startDate} to ${endDate}`,
          },
        }),
      };

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        "http://localhost:8000/api/payment/khalti/initiate",
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 && response.data.payment_url) {
        // Update sessionStorage with pidx
        sessionStorage.setItem(
          "pendingRental",
          JSON.stringify({
            ...rentalData,
            pidx: response.data.pidx,
          })
        );

        // Redirect to Khalti payment page
        window.location.href = response.data.payment_url;
      } else {
        throw new Error(
          response.data?.message || "Failed to initialize payment"
        );
      }
    } catch (error) {
      console.error("Rental error:", error);

      let errorMessage = "Something went wrong. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        if (error.response.data.hint) {
          errorMessage += ` ${error.response.data.hint}`;
        }
      } else if (error.message) {
        errorMessage = `Failed to initiate payment: ${error.message}`;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  <div className="mt-6 p-4 border rounded-lg bg-blue-50 text-blue-800 shadow-sm">
    <h3 className="font-semibold text-lg mb-1">📍 Our Hub Location</h3>
    <p>Maitidevi, Kathmandu</p>
    <p className="text-sm text-gray-600">Open: 9:00 AM – 6:00 PM</p>
    <p className="text-sm text-gray-600">Contact: 980XXXXXXX</p>
  </div>;

  // KYC Modal
  if (showKYCModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            KYC Verification Required
          </h2>
          <p className="text-gray-700 mb-6">
            You must complete your KYC and get it approved by the admin before
            you can rent products.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => navigate("/kyc")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Complete KYC
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-10 text-red-500 bg-red-50 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => {
              setError("");
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-10 text-red-500 bg-red-50 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600">
            The product you're trying to rent doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/categories")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Rental Conflict Alert */}
      {rentalConflict && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 max-w-2xl mx-auto mt-4"
          role="alert"
        >
          <strong className="font-bold">⚠️ Rental Not Allowed: </strong>
          <span className="block sm:inline">{rentalConflict}</span>
          <button
            onClick={() => setRentalConflict(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3 text-xl leading-none hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              {isCartAction ? "Add to Cart" : "Complete Your Rental"}
            </h1>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Product Summary */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Product Summary</h2>
                <div className="flex items-center space-x-4">
                  <img
                    src={product.imageUrl || "/no-image.jpg"}
                    alt={product.title}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Im0xNSA5LTYgNi02LTYiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+";
                    }}
                  />
                  <div>
                    <h3 className="font-medium text-lg">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {product.description}
                    </p>
                    <p className="text-green-600 font-semibold">
                      Rs. {product.pricePerDay} / day
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rentalDays}
                    onChange={(e) =>
                      handleRentalDaysChange(parseInt(e.target.value) || 1)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    Rs. {calculateTotal()}
                  </span>
                </div>
              </div>

              <div className="border p-4 rounded mb-4">
                <h3 className="text-md font-semibold mb-2">
                  Delivery & Return Options
                </h3>

                <input type="hidden" value="lender-dropoff" />

                <label className="block text-sm font-medium mb-1">
                  Hub → You
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="border rounded w-full p-2 mb-3"
                >
                  <option value="self-pickup">I’ll collect from hub</option>
                  <option value="company-delivery">
                    Deliver to my location
                  </option>
                </select>

                {/* Borrower will choose return method at the time of returning the item */}
              </div>
              {fees && (
                <div className="border p-4 rounded bg-gray-50 text-sm mt-2">
                  <div>Rental Fee: Rs. {fees.rentalFee}</div>
                  <div>Delivery to You: Rs. {fees.deliveryFee}</div>
                  <div>
                    Pickup from You (Return): Rs. {fees.returnPickupFee}
                  </div>
                  <div>Return to Lender: Rs. {fees.returnDeliveryFee}</div>
                  <div className="mt-2 font-bold">Total: Rs. {fees.total}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                {isCartAction ? (
                  <button
                    onClick={handleAddToCart}
                    disabled={processing}
                    className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Adding to Cart...</span>
                      </>
                    ) : (
                      <span>Add to Cart</span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmRental}
                    disabled={processing}
                    className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                        </svg>
                        <span>Pay with Khalti</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => navigate(-1)}
                  disabled={processing}
                  className="w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              {/* Khalti Info */}
              {!isCartAction && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
                    </svg>
                    <h3 className="font-semibold text-purple-800">
                      Payment with Khalti
                    </h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    You will be redirected to Khalti's secure payment gateway to
                    complete your transaction. The rental will be confirmed
                    after successful payment verification. Supported payment
                    methods: Khalti wallet, Mobile banking, and more.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rent;
