import React from "react";
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

const categories = [
  { icon: <Bike className="w-8 h-8 text-blue-600" />, label: "Vehicles" },
  { icon: <Camera className="w-8 h-8 text-blue-600" />, label: "Cameras" },
  { icon: <MonitorSmartphone className="w-8 h-8 text-blue-600" />, label: "Gadgets" },
  { icon: <Drill className="w-8 h-8 text-blue-600" />, label: "Tools" },
  { icon: <Shirt className="w-8 h-8 text-blue-600" />, label: "Clothing" },
  { icon: <Sofa className="w-8 h-8 text-blue-600" />, label: "Furniture" },
  { icon: <Tent className="w-8 h-8 text-blue-600" />, label: "Camping" },
  { icon: <Wrench className="w-8 h-8 text-blue-600" />, label: "Others" },
];

const Categories = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Browse by Category
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <div className="mb-2">{cat.icon}</div>
              <span className="text-sm font-medium text-gray-700">
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
