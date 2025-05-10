import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  MapPin,
  Calendar as CalendarIcon,
  Tag,
  Package,
  Info,
} from "lucide-react";
import MapPicker from "../components/MapPicker";
import { Calendar } from "../components/ui/Calendar"; // You'll need to install and import a calendar component
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    category: "",
    availableDays: [], // This will now store Date objects
    image: null,
  });

  const [showMap, setShowMap] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData({ ...formData, image: file });
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDates((prevDates) => {
      // Check if date is already selected
      const dateStr = date.toISOString().split("T")[0];
      const isSelected = prevDates.some(
        (d) => d.toISOString().split("T")[0] === dateStr
      );

      if (isSelected) {
        // Remove date if already selected
        return prevDates.filter(
          (d) => d.toISOString().split("T")[0] !== dateStr
        );
      } else {
        // Add date if not selected
        return [...prevDates, date];
      }
    });
  };

  // Format dates for form submission
  const formatDatesForSubmission = () => {
    return selectedDates.map((date) => date.toISOString().split("T")[0]);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          location: `${latitude}, ${longitude}`,
        });
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("price", formData.price);
      form.append("location", formData.location);
      form.append("category", formData.category);
      form.append("availableDays", JSON.stringify(formatDatesForSubmission()));
      if (formData.image) {
        form.append("image", formData.image);
      }

      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8000/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Product created successfully!");
        navigate("/dashboard/products");
      } else {
        alert("❌ Failed to create product: " + data.message);
      }
    } catch (err) {
      console.error("Submission Error:", err);
      alert("❌ Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    "Electronics",
    "Tools",
    "Vehicles",
    "Furniture",
    "Sports",
    "Outdoor",
    "Party",
    "Other",
  ];

  // Function to check if a date is selected
  const isDateSelected = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return selectedDates.some((d) => d.toISOString().split("T")[0] === dateStr);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a New Listing
          </h1>
          <p className="text-gray-600 mb-8">
            Share your items with the community and start earning
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                <div className="space-y-1 text-center">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setFormData({ ...formData, image: null });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="image-upload"
                            name="image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product name"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="relative">
                <Info className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your product in detail"
                  required
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Daily Price (Rs.)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter daily rental price"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter location"
                    readOnly
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Use My Location
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Choose on Map
                </button>
              </div>
            </div>

            {showMap && (
              <div className="border rounded-lg p-4">
                <MapPicker
                  onLocationSelect={(coords) => {
                    setFormData({
                      ...formData,
                      location: `${coords.lat}, ${coords.lng}`,
                    });
                    setShowMap(false);
                  }}
                />
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Available Days - Replaced with Calendar */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Available Dates
              </label>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-full ">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  className="w-full"
                  classNames={{
                    root: "w-full",
                    month: "w-full",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium text-gray-900",
                    nav: "flex items-center",
                    nav_button:
                      "h-7 w-7 bg-transparent hover:bg-gray-100 rounded-md flex items-center justify-center",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full",
                    head_row: "w-full flex",
                    head_cell:
                      "text-gray-500 w-full font-normal text-[0.8rem] py-2",
                    row: "flex w-full my-1",
                    cell: "flex-1 text-center relative h-9 [&:has([aria-selected])]:bg-primary-50",
                    day: "w-9 h-9 p-0 mx-auto font-normal rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center",
                    day_selected:
                      "bg-primary-600 text-white hover:bg-primary-700",
                    day_today: "border border-primary-500 text-primary-600",
                    day_outside: "text-gray-400 opacity-50",
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />,
                  }}
                  styles={{
                    day: {
                      margin: "0 auto",
                    },
                  }}
                />
              </div>

              {selectedDates.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Selected dates:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates
                      .sort((a, b) => a - b)
                      .map((date, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                          <button
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className="ml-1.5 rounded-full p-0.5 hover:bg-primary-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center gap-2 px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Listing"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
