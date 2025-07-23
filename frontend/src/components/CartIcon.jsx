import { FaShoppingCart } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CartIcon() {
  const [count, setCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.token) return;

    fetch("http://localhost:8000/api/cart", {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => setCount(data.items?.length || 0))
      .catch((err) => console.error("Cart fetch error:", err));
  }, [user]);

  return (
    <button
      onClick={() => navigate("/cart")}
      className="relative group transition-all duration-150"
      aria-label="View cart"
    >
      <FaShoppingCart className="text-2xl text-gray-700 dark:text-gray-200 group-hover:text-blue-600" />
      {count > 0 && (
        <span
          className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-semibold
          rounded-full px-1.5 min-w-[18px] text-center animate-pulse"
        >
          {count}
        </span>
      )}
    </button>
  );
}
