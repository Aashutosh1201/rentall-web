import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar as CalendarIcon,
  Tag,
  Package,
  Info,
} from "lucide-react";
import MapPicker from "../components/MapPicker";
import ImprovedCalendar from "../components/ui/Calendar";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function RequestProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    category: "",
  });

  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/categories");
        const data = await response.json();
        if (response.ok) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateSelect = (dates) => {
    if (!dates) return setSelectedDates([]);
    const newDates = Array.isArray(dates) ? dates : [dates];
    const validDates = newDates
      .map((d) => (d instanceof Date ? new Date(d.setHours(0, 0, 0, 0)) : null))
      .filter((d) => d);
    setSelectedDates(validDates);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setFormData({ ...formData, location: `${latitude}, ${longitude}` });
        },
        (err) => alert("Location error: " + err.message)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDates.length === 0) {
      alert("Please select date(s) for the rental request");
      return;
    }
    setIsSubmitting(true);

    try {
      const body = {
        ...formData,
        needDates: selectedDates.map((d) => d.toISOString().split("T")[0]),
      };
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:8000/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Request posted successfully!");
        navigate("/requests");
      } else {
        alert("❌ Failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("❌ Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Product</h1>
          <p className="text-gray-600 mb-8">
            Can't find what you need? Request it here and let others respond.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What do you need?"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <div className="relative">
                <Info className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain your request in detail"
                  required
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Estimated Budget (Rs.)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your budget estimate"
                  required
                  min="0"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Where do you need it?"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Use My Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Choose on Map
                </button>
              </div>
            </div>

            {showMap && (
              <div className="border rounded-lg p-4">
                <div className="h-64 w-full mb-4">
                  <MapPicker
                    onLocationSelect={(coords) => {
                      setFormData({
                        ...formData,
                        location: `${coords.lat}, ${coords.lng}`,
                      });
                      setShowMap(false);
                    }}
                    onClose={() => setShowMap(false)}
                  />
                </div>
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.label}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Need Rent For</label>
              <div className="bg-white rounded-xl shadow-sm border p-4 w-full">
                <ImprovedCalendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  className="w-full"
                  classNames={{
                    caption_label: "text-sm font-medium text-gray-900",
                    day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                    day_today: "border border-blue-500 text-blue-600",
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />,
                  }}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors ${
                  isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
