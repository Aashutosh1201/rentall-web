import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProduct(data);
        } else {
          console.error("Failed to load product:", data.message);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading)
    return <div className="text-center py-10 text-gray-600">Loading...</div>;

  if (!product)
    return (
      <div className="text-center py-10 text-red-500">Product not found.</div>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Image */}
        <img
          src={
            product.imageUrl
              ? `http://localhost:8000${product.imageUrl}`
              : "/no-image.jpg"
          }
          alt={product.title}
          className="w-full h-80 object-cover"
        />

        {/* Details */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {product.title}
          </h1>

          <p className="text-xl text-green-700 font-semibold mb-4">
            Rs. {product.pricePerDay} / day
          </p>

          <p className="text-gray-700 mb-3">
            <span className="font-medium">Location:</span>{" "}
            {typeof product.location === "string"
              ? product.location
              : Array.isArray(product.location)
              ? product.location.join(", ")
              : typeof product.location === "object" && product.location.lat
              ? `${product.location.lat}, ${product.location.lng}`
              : "Not specified"}
          </p>

          <p className="text-gray-700 mb-3">
            <span className="font-medium">Available:</span>{" "}
            {(product.availableDates || []).join(", ") || "Not specified"}
          </p>

          <p className="text-gray-600 mt-6 leading-relaxed">
            {product.description || "No description provided."}
          </p>

          {/* Optional Rent Button */}
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
              Rent Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
