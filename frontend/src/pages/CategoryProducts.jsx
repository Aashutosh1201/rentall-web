import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function CategoryProducts() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url =
          category === "all"
            ? "http://localhost:8000/api/products"
            : `http://localhost:8000/api/products?category=${category}`;
        const res = await fetch(url);
        const data = await res.json();
        setProducts(data);
        if (category === "all") setAllProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.title || "").toLowerCase().includes(searchLower) ||
      (product.description || "").toLowerCase().includes(searchLower) ||
      (product.category || "").toLowerCase().includes(searchLower)
    );
  });

  if (loading)
    return <p className="text-center mt-10 text-gray-700 dark:text-gray-300">Loading products...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-gray-800 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-8 capitalize">
        {category === "all" ? "All Products" : `${category} Products`}
      </h1>

      {category === "all" && (
        <div className="relative max-w-md mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Link to={`/product/${product._id}`} key={product._id}>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 bg-white dark:bg-gray-800 hover:shadow-md transition">
              <img
                src={product.imageUrl || "/no-image.jpg"}
                alt={product.title || "Unnamed product"}
                className="w-full h-48 object-cover rounded mb-3"
              />
              <h2 className="text-lg font-semibold mb-1">
                {product.title || "No name"}
              </h2>
              <p className="text-gray-800 dark:text-gray-200 mb-1">
                Price: Rs. {product.pricePerDay || "N/A"}/day
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                Location:{" "}
                {typeof product.location === "string"
                  ? product.location
                  : Array.isArray(product.location)
                  ? product.location.join(", ")
                  : typeof product.location === "object" && product.location.lat
                  ? `${product.location.lat}, ${product.location.lng}`
                  : "Not specified"}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Available:{" "}
                {(product.availableDates || []).join(", ") || "Not specified"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
          {searchTerm
            ? "No products match your search."
            : "No products found in this category."}
        </p>
      )}
    </div>
  );
}
