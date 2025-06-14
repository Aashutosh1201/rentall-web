import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [errors, setErrors] = useState({});
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = () => {
    axios
      .get("http://localhost:8000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const updated = res.data.items.map((item) => {
          const today = new Date().toISOString().split("T")[0];
          return {
            ...item,
            startDate: item.startDate?.split("T")[0] || today,
            rentalDays: item.rentalDays || 1,
            endDate: item.endDate?.split("T")[0] || today,
          };
        });
        setCart({ ...res.data, items: updated });
      })
      .catch((err) => console.error(err));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...cart.items];
    updatedItems[index][field] = value;

    if (field === "rentalDays") {
      const start = new Date(updatedItems[index].startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + Number(value));
      updatedItems[index].endDate = end.toISOString().split("T")[0];
    }

    setCart({ ...cart, items: updatedItems });
  };

  const removeFromCart = (productId) => {
    axios
      .delete(`http://localhost:8000/api/cart/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCart(res.data))
      .catch((err) => console.error(err));
  };

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      return total + item.product.pricePerDay * item.rentalDays;
    }, 0);
  };

  const validateAndCheckout = async () => {
    const validationErrors = {};
    const today = new Date().toISOString().split("T")[0];

    cart.items.forEach((item, i) => {
      if (!item.startDate || !item.endDate) {
        validationErrors[i] = "Start and end date required";
      } else if (item.startDate < today) {
        validationErrors[i] = "Start date cannot be in past";
      } else if (item.endDate <= item.startDate) {
        validationErrors[i] = "End must be after start";
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const totalAmount = calculateTotal();

    try {
      const res = await axios.post(
        "http://localhost:8000/api/payment/khalti/initiate",
        {
          return_url: "http://localhost:3000/dashboard/orders",
          website_url: "http://localhost:3000",
          amount: totalAmount * 100,
          purchase_order_id: `cart-${Date.now()}`,
          purchase_order_name: "Cart Checkout",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { payment_url } = res.data;
      window.location.href = payment_url;
    } catch (err) {
      console.error("Payment error:", err);
    }
  };

  if (!cart) return <p>Loading cart...</p>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
      {cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-6">
            {cart.items.map((item, i) => (
              <li
                key={item.product._id}
                className="border rounded p-4 space-y-3 shadow"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{item.product.title}</h3>
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <p>Rs. {item.product.pricePerDay} per day</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Rental Days</label>
                    <input
                      type="number"
                      min={1}
                      value={item.rentalDays}
                      onChange={(e) =>
                        updateItem(i, "rentalDays", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      value={item.startDate}
                      onChange={(e) =>
                        updateItem(i, "startDate", e.target.value)
                      }
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <input
                      type="date"
                      value={item.endDate}
                      onChange={(e) => updateItem(i, "endDate", e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                </div>
                {errors[i] && (
                  <p className="text-red-500 text-sm mt-1">{errors[i]}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => navigate("/products")}
              className="text-blue-600 hover:underline"
            >
              Keep Shopping
            </button>
            <span className="text-lg font-semibold">
              Total: Rs. {calculateTotal()}
            </span>
            <button
              onClick={validateAndCheckout}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
