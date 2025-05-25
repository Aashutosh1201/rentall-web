import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bike,
  Camera,
  MonitorSmartphone,
  Drill,
  Shirt,
  Sofa,
  Tent,
  Wrench,
} from "lucide-react";

// Icon mapping object
const iconComponents = {
  Bike: Bike,
  Camera: Camera,
  MonitorSmartphone: MonitorSmartphone,
  Drill: Drill,
  Shirt: Shirt,
  Sofa: Sofa,
  Tent: Tent,
  Wrench: Wrench,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("Fetching categories from API...");
        const response = await fetch("http://localhost:8000/api/categories");
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch categories");
        }

        const data = await response.json();
        console.log("Received categories:", data);
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center">Loading categories...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-red-600">Error: {error}</p>
          <p className="text-center mt-4">
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:underline"
            >
              Try Again
            </button>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Browse by Category
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const IconComponent = iconComponents[cat.icon] || Wrench;
            return (
              <Link
                key={cat._id}
                to={`/categories/${cat.label.toLowerCase()}`}
                className="flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <div className="mb-2">
                  <IconComponent className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
