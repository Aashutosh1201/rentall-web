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
  Bike,
  Camera,
  MonitorSmartphone,
  Drill,
  Shirt,
  Sofa,
  Tent,
  Wrench,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/categories");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-gray-700 dark:text-gray-300">
            Loading categories...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-red-600 dark:text-red-400">
            Error: {error}
          </p>
          <p className="text-center mt-4">
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try Again
            </button>
          </p>
        </div>
      </section>
    );
  }

  const renderIcon = (iconName) => {
    const Icon = iconComponents[iconName] || Wrench;
    return <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />;
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
          Browse by Category
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/categories/${cat.label.toLowerCase()}`}
              className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="mb-2">{renderIcon(cat.icon)}</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
