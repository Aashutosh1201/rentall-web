import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaCalendarAlt, FaTag } from "react-icons/fa";

export default function Rent() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rentalDays, setRentalDays] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [processing, setProcessing] = useState(false);
  const [rentalConflict, setRentalConflict] = useState(null);
  const isCartAction = searchParams.get("action") === "cart";

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data);
        } else {
          setError(data.message || "Failed to load product");
        }
      } catch (err) {
        setError("Failed to load product");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, user, navigate]);

  useEffect(() => {
    if (startDate && rentalDays) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + rentalDays);
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [startDate, rentalDays]);

  useEffect(() => {
    if (endDate && startDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Remove the + 1
      if (diffDays !== rentalDays && diffDays > 0) {
        setRentalDays(diffDays);
      }
    }
  }, [startDate, endDate]);

  const calculateTotal = () => {
    if (!product) return 0;
    return product.pricePerDay * rentalDays;
  };

  const handleConfirmRental = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Clear any previous errors
    setError("");

    // Validate dates
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (startDate < today) {
      setError("Start date cannot be in the past");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("End date must be after start date");
      return;
    }

    if (rentalDays < 1) {
      setError("Rental must be for at least 1 day");
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
      const conflictCheck = await fetch(
        "http://localhost:8000/api/rentals/conflict-check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            productId: product._id,
            startDate,
            endDate,
          }),
        }
      );

      const conflictResult = await conflictCheck.json();

      if (!conflictCheck.ok) {
        const reason = conflictResult.message || "Rental conflict detected.";
        const hint = conflictResult.hint || "";

        setRentalConflict(`${reason} ${hint}`);
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
            notes: `Rental for ${product.title} from ${startDate} to ${endDate}`,
          },
        }),
      };

      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        "http://localhost:8000/api/payment/khalti/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      if (response.ok && data.payment_url) {
        // Update sessionStorage with pidx
        sessionStorage.setItem(
          "pendingRental",
          JSON.stringify({
            ...rentalData,
            pidx: data.pidx,
          })
        );

        // Redirect to Khalti payment page
        window.location.href = data.payment_url;
      } else {
        // Handle different error status codes
        let errorMessage = data.message || `Server returned ${response.status}`;

        if (response.status === 404) {
          errorMessage =
            "Payment endpoint not found. Please check server configuration.";
        } else if (response.status === 500) {
          errorMessage = "Internal server error. Please try again later.";
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error initiating rental:", error);
      setError(`Failed to initiate payment: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRentalDaysChange = (days) => {
    setRentalDays(days);
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + days - 1);
      setEndDate(end.toISOString().split("T")[0]);
    }
  };

  const handleAddToCart = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (startDate < today) {
      setError("Start date cannot be in the past");
      return;
    }

    if (endDate < startDate) {
      setError("End date must be after start date");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          productId: id,
          rentalDays,
          startDate,
          endDate,
        }),
      });

      if (res.ok) {
        navigate("/cart");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add to cart");
      }
    } catch (err) {
      setError("Failed to add to cart");
      console.error("Error adding to cart:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
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
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-10 text-red-500 bg-red-50 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600">
            The product you're trying to rent doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {rentalConflict && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 max-w-2xl mx-auto mt-4"
          role="alert"
        >
          <strong className="font-bold">⚠️ Rental Not Allowed: </strong>
          <span className="block sm:inline">{rentalConflict}</span>
          <button
            onClick={() => setRentalConflict(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3 text-xl leading-none"
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
                      if (e.target.src !== "/no-image.jpg") {
                        e.target.src = "/no-image.jpg";
                      } else {
                        e.target.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Im0xNSA5LTYgNi02LTYiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+";
                      }
                    }}
                  />
                  <div>
                    <h3 className="font-medium">{product.title}</h3>
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              {/* Action Buttons */}
              <div className="space-y-4">
                {isCartAction ? (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Add to Cart
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
}
