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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
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

  const calculateTotal = () => {
    if (!product) return 0;
    return product.pricePerDay * rentalDays;
  };

  const generateUniqueOrderId = () => {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const initiateKhaltiPayment = async (rentalData) => {
    try {
      setPaymentProcessing(true);

      const paymentPayload = {
        return_url: `${window.location.origin}/payment/callback`,
        website_url: window.location.origin,
        amount: calculateTotal() * 100, // Convert to paisa (1 NPR = 100 paisa)
        purchase_order_id: generateUniqueOrderId(),
        purchase_order_name: `Rental: ${product.title}`,
        customer_info: {
          name: user.name || user.email.split("@")[0],
          email: user.email,
          phone: user.phone || "9800000000", // Default phone if not available
        },
        amount_breakdown: [
          {
            label: "Rental Cost",
            amount: product.pricePerDay * rentalDays * 100,
          },
        ],
        product_details: [
          {
            identity: product._id,
            name: product.title,
            total_price: calculateTotal() * 100,
            quantity: 1,
            unit_price: calculateTotal() * 100,
          },
        ],
        merchant_username: "rental_platform",
        merchant_extra: JSON.stringify({
          rental_data: rentalData,
          user_id: user.id,
        }),
      };

      console.log("User object:", user);
      console.log("Token being sent:", user.token);
      console.log("Token type:", typeof user.token);
      // Call your backend to initiate Khalti payment - FIXED URL
      const response = await fetch(
        "http://localhost:8000/api/payment/khalti/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(paymentPayload),
        }
      );

      const data = await response.json();

      if (response.ok && data.payment_url) {
        // Redirect to Khalti payment page
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }
    } catch (err) {
      setError("Failed to initiate payment: " + err.message);
      console.error("Error initiating Khalti payment:", err);
      setPaymentProcessing(false);
    }
  };

  const handleAddToCart = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
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

  const handleRent = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const rentalData = {
      productId: id,
      rentalDays,
      startDate,
      endDate,
      totalAmount: calculateTotal(),
    };

    // FIXED: Go directly to payment without creating rental record first
    // The rental will be created after successful payment verification
    await initiateKhaltiPayment(rentalData);
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              {isCartAction ? "Add to Cart" : "Complete Your Rental"}
            </h1>

            <div className="space-y-6">
              {/* Product Summary */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Product Summary</h2>
                <div className="flex items-center space-x-4">
                  <img
                    src={
                      product.imageUrl
                        ? `http://localhost:8000${product.imageUrl}`
                        : "/no-image.jpg"
                    }
                    alt={product.title}
                    className="w-24 h-24 object-cover rounded-lg"
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
                    onChange={(e) => setRentalDays(parseInt(e.target.value))}
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
                    onClick={handleRent}
                    disabled={paymentProcessing}
                    className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {paymentProcessing ? (
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
                  disabled={paymentProcessing}
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
