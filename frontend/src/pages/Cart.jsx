import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState(""); // Single error state like Rent component
  const [isLoading, setIsLoading] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [rentalConflict, setRentalConflict] = useState(null); // Add rental conflict state
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (user && user.kycStatus !== "verified") {
      setShowKycModal(true);
    }
  }, [user]);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const cartRes = await axios.get("http://localhost:8000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split("T")[0];

      const updated = cartRes.data.items.map((item) => ({
        ...item,
        startDate: item.startDate?.split("T")[0] || today,
        endDate: item.endDate?.split("T")[0] || tomorrowString,
        rentalDays: item.rentalDays || 1,
        pricePerDay: item.pricePerDay || item.product?.pricePerDay || 0,
      }));

      // Fetch latest rental info for each item
      const rentalStatuses = await Promise.all(
        updated.map((item) =>
          axios
            .get(
              `http://localhost:8000/api/rentals/latest/${item.product._id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then((res) => res.data)
            .catch((err) => {
              console.warn(
                `Failed to fetch rental info for ${item.product._id}`,
                err
              );
              return { isRented: false };
            })
        )
      );

      // Attach rental info to each cart item
      const updatedWithRentalInfo = updated.map((item, index) => ({
        ...item,
        rentalInfo: rentalStatuses[index],
      }));

      setCart({ ...cartRes.data, items: updatedWithRentalInfo });
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (index, field, value) => {
    // Clear previous errors
    setError("");
    setRentalConflict(null);

    const updatedItems = [...cart.items];
    const item = updatedItems[index];

    // Validate that we have a valid product ID
    if (!item.product || !item.product._id) {
      console.error("Invalid product ID for cart item:", item);
      setError("Invalid item - please refresh the page");
      return;
    }

    // Update the field
    item[field] = value;

    // Handle date and rental days calculations
    if (field === "startDate" || field === "endDate") {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const diffInMs = end - start;
      const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
      item.rentalDays = days > 0 ? days : 1;
    }

    if (field === "rentalDays") {
      const start = new Date(item.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + Number(value));
      item.endDate = end.toISOString().split("T")[0];
    }

    // Calculate total for this item
    const pricePerDay = item.pricePerDay || item.product?.pricePerDay || 0;
    item.total = pricePerDay * item.rentalDays;

    // Update local state immediately for better UX
    setCart({ ...cart, items: updatedItems });

    // Send update to backend (optional - for persistence)
    try {
      const productId = item.product._id;
      console.log("Updating cart item with productId:", productId);

      const updateData = {
        quantity: item.quantity || 1,
        rentalDays: item.rentalDays,
        startDate: item.startDate,
        endDate: item.endDate,
        pricePerDay: pricePerDay,
      };

      console.log("Update data:", updateData);

      await axios.put(
        `http://localhost:8000/api/cart/${productId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Cart item updated successfully");
    } catch (err) {
      console.error("Failed to update cart item:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // Show user-friendly error similar to Rent component
      const resData = err.response?.data;
      let errorMessage = "Something went wrong. Please try again.";

      if (resData?.message) {
        errorMessage = resData.message;
        if (resData.hint) {
          errorMessage += ` ${resData.hint}`;
        }
      }

      // Check if it's a rental conflict
      if (
        (resData?.message && resData.message.includes("conflict")) ||
        (resData?.message && resData.message.includes("rented"))
      ) {
        setRentalConflict(errorMessage);
      } else {
        setError(errorMessage);
      }

      // Optionally revert the local state change
      // fetchCart(); // Uncomment this if you want to revert on error
    }
  };

  const removeFromCart = (productId) => {
    if (!productId) {
      console.error("No product ID provided for removal");
      return;
    }

    setIsLoading(true);
    axios
      .delete(`http://localhost:8000/api/cart/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCart(res.data))
      .catch((err) => {
        console.error("Error removing from cart:", err);
        setError("Failed to remove item from cart");
      })
      .finally(() => setIsLoading(false));
  };

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      const pricePerDay = item.pricePerDay || item.product?.pricePerDay || 0;
      return total + pricePerDay * item.rentalDays;
    }, 0);
  };

  const validateAndCheckout = async () => {
    if (!user || user.kycStatus !== "verified") {
      setShowKycModal(true);
      return;
    }

    // Clear previous errors
    setError("");
    setRentalConflict(null);

    // Validate dates
    const today = new Date().toISOString().split("T")[0];
    let hasValidationError = false;

    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];

      if (!item.startDate || !item.endDate) {
        setError("All items must have start and end dates selected");
        hasValidationError = true;
        break;
      } else if (item.startDate < today) {
        setError("Start date cannot be in the past");
        hasValidationError = true;
        break;
      } else if (new Date(item.startDate) >= new Date(item.endDate)) {
        setError("End date must be after start date for all items");
        hasValidationError = true;
        break;
      }
    }

    if (hasValidationError) {
      return;
    }

    const totalAmount = calculateTotal();

    // Store data in the EXACT format expected by PaymentCallback
    sessionStorage.setItem(
      "pendingCartRental",
      JSON.stringify({
        items: cart.items.map((item) => ({
          productId: item.product._id,
          startDate: item.startDate,
          endDate: item.endDate,
          rentalDays: item.rentalDays,
          total:
            (item.pricePerDay || item.product?.pricePerDay || 0) *
            item.rentalDays,
          pricePerDay: item.pricePerDay || item.product?.pricePerDay || 0,
          productName: item.product.title || item.product.name, // For reference
        })),
        totalAmount,
        timestamp: Date.now(), // For debugging
      })
    );

    try {
      setIsLoading(true);

      // Optional: Use the prepareCartForCheckout endpoint for validation
      const cartValidation = await axios.get(
        "http://localhost:8000/api/cart/prepare-checkout",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!cartValidation.data.success) {
        throw new Error("Cart validation failed");
      }

      const res = await axios.post(
        "http://localhost:8000/api/payment/khalti/initiate",
        {
          return_url: "http://localhost:3000/payment/callback",
          website_url: "http://localhost:3000",
          amount: Math.round(totalAmount * 100), // Ensure it's an integer
          purchase_order_id: `cart-${Date.now()}`,
          purchase_order_name: "Cart Checkout",
          merchant_extra: JSON.stringify({
            type: "cart_checkout",
            item_count: cart.items.length,
            user_id: user?.id,
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { payment_url } = res.data;

      if (!payment_url) {
        throw new Error("Payment URL not received");
      }

      window.location.href = payment_url;
    } catch (err) {
      console.error("Payment error:", err);

      let errorMessage = "Something went wrong. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        if (err.response.data.hint) {
          errorMessage += ` ${err.response.data.hint}`;
        }
      } else if (err.message) {
        errorMessage = `Failed to initiate payment: ${err.message}`;
      }

      // Check if it's a rental conflict
      if (
        errorMessage.includes("conflict") ||
        errorMessage.includes("rented")
      ) {
        setRentalConflict(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          Your Shopping Cart
        </h2>

        {/* Rental Conflict Alert - Similar to Rent component */}
        {rentalConflict && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
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

        {/* General error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {cart.items.length === 0 ? (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-4 text-lg text-gray-600">Your cart is empty</p>
            <button
              onClick={() => navigate("/categories")}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {cart.items.map((item, i) => {
                const pricePerDay =
                  item.pricePerDay || item.product?.pricePerDay || 0;
                const itemTotal = pricePerDay * item.rentalDays;

                return (
                  <li key={item.product?._id || i} className="py-6">
                    <div className="flex flex-col sm:flex-row">
                      <div className="flex-shrink-0 mb-4 sm:mb-0">
                        <img
                          src={
                            item.product?.imageUrl ||
                            "https://via.placeholder.com/150"
                          }
                          alt={item.product?.title || "Product"}
                          className="h-32 w-32 object-cover rounded"
                        />
                      </div>

                      <div className="ml-0 sm:ml-6 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {item.product?.title ||
                                item.product?.name ||
                                "Unknown Product"}
                            </h3>

                            {/* Rental status display like in Rent.jsx */}
                            {item.rentalInfo?.isRented && (
                              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700 font-medium">
                                  ⚠️ Currently Rented
                                </p>
                                <p className="text-sm text-red-600 mt-1">
                                  This item is rented until{" "}
                                  <strong>
                                    {new Date(
                                      item.rentalInfo.rentedUntil
                                    ).toLocaleDateString()}
                                  </strong>
                                  .
                                </p>
                                <p className="text-sm text-green-600 mt-1">
                                  Available from{" "}
                                  <strong>
                                    {new Date(
                                      item.rentalInfo.availableFrom
                                    ).toLocaleDateString()}
                                  </strong>
                                  .
                                </p>
                              </div>
                            )}

                            <p className="mt-1 text-sm text-gray-500">
                              Rs. {pricePerDay} per day
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product?._id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={isLoading || !item.product?._id}
                          >
                            {isLoading ? (
                              <svg
                                className="animate-spin h-5 w-5 text-red-500"
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
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rental Days
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.rentalDays}
                              onChange={(e) =>
                                updateItem(i, "rentalDays", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={item.startDate}
                              min={new Date().toISOString().split("T")[0]}
                              onChange={(e) =>
                                updateItem(i, "startDate", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={item.endDate}
                              min={
                                item.startDate ||
                                new Date().toISOString().split("T")[0]
                              }
                              onChange={(e) =>
                                updateItem(i, "endDate", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <p className="text-lg font-medium text-gray-900">
                            Rs. {itemTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-gray-200 mt-8 pt-8">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Summary
                </h3>
                <p className="text-xl font-semibold text-gray-900">
                  Rs. {calculateTotal().toFixed(2)}
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
                <button
                  onClick={() => navigate("/categories")}
                  className="px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  disabled={isLoading}
                >
                  Continue Shopping
                </button>
                {user?.kycStatus !== "verified" ? (
                  <div className="mt-4 text-red-600 font-medium">
                    Please complete your KYC to proceed to checkout.
                  </div>
                ) : (
                  <button
                    onClick={validateAndCheckout}
                    className={`px-6 py-3 border border-transparent rounded-md text-base font-medium text-white transition-colors duration-200 flex items-center justify-center
      ${
        isLoading || cart.items.length === 0 || error || rentalConflict
          ? "bg-blue-300 cursor-not-allowed opacity-50"
          : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      }`}
                    disabled={
                      isLoading ||
                      cart.items.length === 0 ||
                      error ||
                      rentalConflict
                    }
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        Processing...
                      </>
                    ) : (
                      "Proceed to Checkout"
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* KYC Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              KYC Verification Required
            </h2>
            <p className="text-gray-700 mb-4">
              You must complete your KYC and get it approved by the admin to
              proceed with checkout.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowKycModal(false);
                  navigate("/");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKycModal(false);
                  navigate("/kyc");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
              >
                Complete KYC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
