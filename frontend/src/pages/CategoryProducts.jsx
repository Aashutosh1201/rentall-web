import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function CategoryProducts() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/products?category=${category}`
        );
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  if (loading) return <p className="text-center mt-10">Loading products...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 capitalize">
        {category} Products
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition"
          >
            <img
              src={
                product.imageUrl
                  ? `http://localhost:8000${product.imageUrl}`
                  : "/no-image.jpg"
              }
              alt={product.title || "Unnamed product"}
              className="w-full h-48 object-cover rounded mb-3"
            />
            <h2 className="text-lg font-semibold mb-1">
              {product.title || "No name"}
            </h2>
            <p className="text-gray-800 mb-1">
              Price: Rs. {product.pricePerDay || "N/A"}/day
            </p>
            <p className="text-gray-600 text-sm mb-1">
              Location:{" "}
              {typeof product.location === "string"
                ? product.location
                : Array.isArray(product.location)
                ? product.location.join(", ")
                : typeof product.location === "object" && product.location.lat
                ? `${product.location.lat}, ${product.location.lng}`
                : "Not specified"}
            </p>
            <p className="text-gray-500 text-sm">
              Available:{" "}
              {(product.availableDates || []).join(", ") || "Not specified"}
            </p>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-gray-600 mt-8">
          No products found in this category.
        </p>
      )}
    </div>
  );
}
