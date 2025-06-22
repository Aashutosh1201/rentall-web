import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  MapPin,
  Calendar as CalendarIcon,
  Tag,
  Package,
  Info,
  Clock,
  AlertCircle,
} from "lucide-react";
import MapPicker from "../components/MapPicker";
import { useLocation } from "react-router-dom";
import ImprovedCalendar from "../components/ui/Calendar";
import { useAuth } from "../context/AuthContext";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function CreateProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    category: "",
    image: null,
  });

  const [showMap, setShowMap] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState([]);

  // ✅ FIXED: Move useEffect to top level, before any conditional returns
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/categories");
        const data = await response.json();

        if (response.ok) {
          setCategories(data); // data is an array of categories
        } else {
          console.error("Failed to fetch categories", data.message);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // ✅ UPDATED: Different modals based on KYC status
  if (user?.kycStatus !== "verified") {
    // Case 1: KYC not filled at all (user has no kycStatus or it's undefined/null)
    if (!user?.kycStatus) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-blue-600">
                KYC Required
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              You need to complete your KYC verification to{" "}
              {location.pathname.includes("create-product") ? "lend" : "borrow"}{" "}
              items. This helps us maintain a safe and trusted community.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/kyc-form")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Fill KYC
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Case 2: KYC is pending/submitted but not yet verified
    if (user?.kycStatus === "pending" || user?.kycStatus === "submitted") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-yellow-600 mr-2" />
              <h2 className="text-lg font-semibold text-yellow-600">
                KYC Under Review
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Your KYC is currently being reviewed by our admin team. This
              process usually takes 24-48 hours. You'll be notified once it's
              approved and you can start{" "}
              {location.pathname.includes("create-product")
                ? "lending"
                : "borrowing"}{" "}
              items.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>What's next?</strong> We'll send you an email
                confirmation once your KYC is approved. You can also check your
                status in your profile.
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
              >
                Go to Home
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Check Status
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Case 3: KYC was rejected
    if (user?.kycStatus === "rejected") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-red-600">
                KYC Verification Failed
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Your KYC verification was not approved. Please check your email
              for details about what needs to be corrected, or contact our
              support team.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                You can resubmit your KYC with the correct information.
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate("/kyc-form")}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Retry KYC
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

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

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.match("image.*")) {
        setFormData({ ...formData, image: file });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please select an image file");
      }
    }
  };

  const handleDateSelect = (dates) => {
    // Handle undefined or null case
    if (!dates) {
      setSelectedDates([]);
      return;
    }
    console.log(dates);

    // Convert single date to array
    const newDates = Array.isArray(dates) ? dates : [dates];

    // Process dates - ensure they're valid Date objects and normalize time
    const validDates = newDates
      .map((date) => {
        // If date is already a Date object, use it
        if (date instanceof Date && !isNaN(date)) {
          return new Date(date.setHours(0, 0, 0, 0));
        }
        // If date is a string, try to parse it
        if (typeof date === "string") {
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate)) {
            return new Date(parsedDate.setHours(0, 0, 0, 0));
          }
        }
        return null;
      })
      .filter((date) => date !== null);

    console.log("Processed dates:", validDates);
    setSelectedDates(validDates);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData({
            ...formData,
            location: `${latitude}, ${longitude}`,
          });
        },
        (error) => {
          alert("Error getting location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Selected dates before submit:", selectedDates); // Debug log
    console.log("Selected dates length:", selectedDates.length); // Debug log
    console.log("Selected dates type:", typeof selectedDates); // Debug log
    console.log("Selected dates is array:", Array.isArray(selectedDates)); // Debug log

    if (selectedDates.length === 0) {
      alert("Please select at least one available date");
      return;
    }

    setIsSubmitting(true);

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("price", formData.price);
      form.append("location", formData.location);
      form.append("category", formData.category);

      // Format dates as YYYY-MM-DD strings
      const formattedDates = selectedDates.map(
        (date) => date.toISOString().split("T")[0]
      );
      form.append("availableDays", JSON.stringify(formattedDates));

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
        alert(
          "❌ Failed to create product: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Submission Error:", err);
      alert("❌ Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-blue-500"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
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
                    <Upload
                      className={`mx-auto h-12 w-12 ${
                        isDragging ? "text-blue-500" : "text-gray-400"
                      }`}
                    />
                    <div className="flex text-sm text-gray-600 justify-center">
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
                  min="0"
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
                <div className="h-64 w-full mb-4">
                  <MapPicker
                    initialLocation={
                      formData.location
                        ? {
                            lat: parseFloat(formData.location.split(",")[0]),
                            lng: parseFloat(formData.location.split(",")[1]),
                          }
                        : null
                    }
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
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Confirm Location
                </button>
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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

            {/* Available Dates */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Available Dates
              </label>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 w-full">
                <ImprovedCalendar
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
                    day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                    day_today: "border border-blue-500 text-blue-600",
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
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              // Remove this date from selectedDates
                              const newDates = selectedDates.filter(
                                (d) => d.toISOString() !== date.toISOString()
                              );
                              setSelectedDates(newDates);
                            }}
                            className="ml-1.5 rounded-full p-0.5 hover:bg-blue-200"
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
