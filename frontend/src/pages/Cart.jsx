import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaTrash, FaShoppingCart } from "react-icons/fa";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/cart", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setCartItems(data.items); // ✅ Use `.items` from backend response
      } else {
        setError(data.message || "Failed to fetch cart items");
      }
    } catch (err) {
      setError("Failed to fetch cart items");
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/cart/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items); // ✅ update from server response
      } else {
        const data = await res.json();
        setError(data.message || "Failed to remove item from cart");
      }
    } catch (err) {
      setError("Failed to remove item from cart");
      console.error("Error removing from cart:", err);
    }
  };

  const proceedToCheckout = () => {
    navigate("/checkout");
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.pricePerDay * item.quantity; // ✅ use quantity
    }, 0);
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FaShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-600">
              Add some items to your cart to get started
            </p>
            <button
              onClick={() => navigate("/products")}
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <div key={item.product._id} className="p-6 flex items-center">
                <img
                  src={
                    item.product.imageUrl
                      ? `http://localhost:8000${item.product.imageUrl}`
                      : "/no-image.jpg"
                  }
                  alt={item.product.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="ml-6 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.product.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                  <p className="mt-2 text-lg font-medium text-green-600">
                    Rs. {item.product.pricePerDay * item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.product._id)}
                  className="ml-6 p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-medium text-gray-900">
                Total Amount:
              </span>
              <span className="text-2xl font-bold text-green-600">
                Rs. {calculateTotal()}
              </span>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => navigate("/products")}
                className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue Shopping
              </button>
              <button
                onClick={proceedToCheckout}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
