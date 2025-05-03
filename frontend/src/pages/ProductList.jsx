import { useEffect, useState } from "react";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/products");
        const data = await res.json();
        console.log("Fetched products:", data);
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading products...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product._id} className="border rounded-lg shadow p-4 bg-white">
          <img
            src={
              product.imageUrl
                ? `http://localhost:8000${product.imageUrl}`
                : "/no-image.jpg"
            }
            alt={product.title || "Unnamed product"}
            className="w-full h-48 object-cover rounded mb-3"
          />
          <h2 className="text-xl font-semibold">
            {product.title || "No name"}
          </h2>
          <p className="text-gray-700 mb-1">
            Price: {product.pricePerDay ? `Rs. ${product.pricePerDay}/day` : "N/A"}
          </p>
          <p className="text-gray-600 mb-1">
            Location:{" "}
            {typeof product.location === "string"
              ? product.location
              : Array.isArray(product.location)
              ? product.location.join(", ")
              : typeof product.location === "object" && product.location.lat
              ? `${product.location.lat}, ${product.location.lng}`
              : "Not specified"}
          </p>
          <p className="text-sm text-gray-500">
            Available:{" "}
            {(product.availableDates || []).join(", ") || "Not specified"}
          </p>
        </div>
      ))}
    </div>
  );
}
