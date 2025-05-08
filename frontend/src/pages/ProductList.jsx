import { useEffect, useState } from "react";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/products");
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);

        const uniqueCategories = [
          "All",
          ...new Set(data.map((product) => product.category || "Uncategorized")),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((product) => product.category === selectedCategory)
      );
    }
  }, [selectedCategory, products]);

  if (loading) return <p className="text-center mt-10">Loading products...</p>;

  return (
    <div className="flex px-4 py-8 max-w-screen-xl mx-auto">
      {/* Sidebar */}
      <div className="sticky top-16 w-48 bg-gray-100 p-4 shadow-md h-fit self-start">
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
        <ul>
          {categories.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => setSelectedCategory(cat)}
                className={`block w-full text-left py-2 px-3 rounded-md mb-1 ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "hover:bg-blue-100 text-gray-700"
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ml-4">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            className="border rounded-lg shadow-sm p-4 bg-white"
          >
            <img
              src={
                product.imageUrl
                  ? `http://localhost:8000${product.imageUrl}`
                  : "/no-image.jpg"
              }
              alt={product.title || "Unnamed product"}
              className="w-full h-40 object-cover rounded mb-3"
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
    </div>
  );
}
