import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function RequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [offer, setOffer] = useState({ price: "", message: "" });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/requests/${id}`);
        const data = await res.json();
        setRequest(data);
      } catch (err) {
        console.error("Error fetching request:", err);
      }
    };
    fetchRequest();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOffer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offer.price) return alert("Offer price is required");

    const formData = new FormData();
    formData.append("price", offer.price);
    formData.append("message", offer.message);
    if (image) formData.append("image", image);

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:8000/api/requests/${id}/counter`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error submitting offer");

      alert("✅ Offer submitted successfully");
      setOffer({ price: "", message: "" });
      setImage(null);
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!request)
    return (
      <p className="text-center mt-10 text-gray-500 dark:text-gray-400">
        Loading request...
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800 dark:text-gray-100">
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400 mb-4">
        {request.name}
      </h1>
      <p className="mb-2">
        <strong>Budget:</strong> Rs. {request.price}/day
      </p>
      <p className="mb-2">
        <strong>Dates Needed:</strong> {request.needDates?.join(", ")}
      </p>
      <p className="mb-2">
        <strong>Location:</strong> {request.location}
      </p>
      <p className="mb-6">
        <strong>Description:</strong> {request.description}
      </p>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-300 dark:border-gray-700 pt-6 mt-6 space-y-4 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          💬 Make a Counter Offer
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Offer Price (Rs.)
          </label>
          <input
            type="number"
            name="price"
            value={offer.price}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message (optional)
          </label>
          <textarea
            name="message"
            value={offer.message}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Optional Product Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Offer"}
        </button>
      </form>
    </div>
  );
}
