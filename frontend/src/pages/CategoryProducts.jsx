import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
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
        // Always fetch all products when category is 'all'
        const url =
          category === "all"
            ? "http://localhost:8000/api/products"
            : `http://localhost:8000/api/products?category=${category}`;

        const res = await fetch(url);
        const data = await res.json();

        setProducts(data);
        // Store all products separately if we're in 'all' view
        if (category === "all") {
          setAllProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  // Filter products based on search term
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      (product.title || "").toLowerCase().includes(searchLower) ||
      (product.description || "").toLowerCase().includes(searchLower) ||
      (product.category || "").toLowerCase().includes(searchLower)
    );
  });

  if (loading) return <p className="text-center mt-10">Loading products...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 capitalize">
        {category === "all" ? "All Products" : `${category} Products`}
      </h1>

      {/* Search bar - only show when viewing 'all' products */}
      {category === "all" && (
        <div className="relative max-w-md mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Link to={`/product/${product._id}`} key={product._id}>
            <div className="border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition">
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
                    : typeof product.location === "object" &&
                        product.location.lat
                      ? `${product.location.lat}, ${product.location.lng}`
                      : "Not specified"}
              </p>
              <p className="text-gray-500 text-sm">
                Available:{" "}
                {(product.availableDates || []).join(", ") || "Not specified"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-600 mt-8">
          {searchTerm
            ? "No products match your search."
            : "No products found in this category."}
        </p>
      )}
    </div>
  );
}
