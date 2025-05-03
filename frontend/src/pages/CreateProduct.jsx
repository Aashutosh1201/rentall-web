import { useState } from "react";
import MapPicker from "../components/MapPicker";

export default function CreateProduct() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    category: "",
    availableDays: [],
    image: null,
  });

  const [showMap, setShowMap] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      const updatedDays = checked
        ? [...formData.availableDays, value]
        : formData.availableDays.filter((day) => day !== value);
      setFormData({ ...formData, availableDays: updatedDays });
    } else if (type === "file") {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
  
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("price", formData.price);
      form.append("location", formData.location);
      form.append("category", formData.category);
      form.append("availableDays", JSON.stringify(formData.availableDays)); // convert to string
      if (formData.image) {
        form.append("image", formData.image);
      }
  
      const token = localStorage.getItem("token"); // Make sure user is logged in
  
      const response = await fetch("http://localhost:8000/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ protected route
        },
        body: form,
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("✅ Product created successfully!");
        console.log(data);
        // Optionally reset the form
      } else {
        alert("❌ Failed to create product: " + data.message);
      }
    } catch (err) {
      console.error("Submission Error:", err);
      alert("❌ Something went wrong!");
    }
  };
  

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md mt-10 rounded-md">
      <h1 className="text-2xl font-semibold mb-4">Create a Product Listing</h1>
      <form onSubmit={handleSubmit}>

        <input
          type="text"
          name="name"
          placeholder="Name of product"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
          rows="3"
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
          required
        />

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            readOnly
          />
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Use my location
          </button>
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="bg-gray-600 text-white px-3 py-2 rounded"
          >
            Choose on Map
          </button>
        </div>

        {showMap && (
          <MapPicker
            onLocationSelect={(coords) => {
              setFormData({
                ...formData,
                location: `${coords.lat}, ${coords.lng}`,
              });
              setShowMap(false);
            }}
          />
        )}

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
          required
        >
          <option value="">Select Category</option>
          <option value="Electronics">Electronics</option>
          <option value="Tools">Tools</option>
          <option value="Vehicles">Vehicles</option>
          <option value="Furniture">Furniture</option>
        </select>

        <div className="mb-3">
          <label className="font-medium block mb-1">Available Days:</label>
          <div className="grid grid-cols-3 gap-2">
            {days.map((day) => (
              <label key={day} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="availableDays"
                  value={day}
                  checked={formData.availableDays.includes(day)}
                  onChange={handleChange}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="block mb-1 font-medium">Upload Product Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Submit
        </button>

        <div className="mt-3 text-center">
          <a href="/listing-policies" className="text-blue-600 underline">
            View Listing Policies
          </a>
        </div>
      </form>
    </div>
  );
}
