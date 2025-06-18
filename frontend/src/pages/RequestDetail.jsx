import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function RequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [offer, setOffer] = useState({ price: "", message: "" });
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

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:8000/api/requests/${id}/counter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(offer),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error submitting offer");

      alert("✅ Offer submitted successfully");
      setOffer({ price: "", message: "" });
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!request)
    return <p className="text-center mt-10 text-gray-500">Loading request...</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-800 mb-4">{request.name}</h1>
      <p className="text-gray-700 mb-2">
        <strong>Budget:</strong> Rs. {request.price}/day
      </p>
      <p className="text-gray-600 mb-2">
        <strong>Dates Needed:</strong> {request.needDates?.join(", ")}
      </p>
      <p className="text-gray-600 mb-2">
        <strong>Location:</strong> {request.location}
      </p>
      <p className="text-gray-700 mb-6">
        <strong>Description:</strong> {request.description}
      </p>

      <form
        onSubmit={handleSubmit}
        className="border-t pt-6 mt-6 space-y-4 bg-gray-50 p-6 rounded-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-2">💬 Make a Counter Offer</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Offer Price (Rs.)
          </label>
          <input
            type="number"
            name="price"
            value={offer.price}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message (optional)
          </label>
          <textarea
            name="message"
            value={offer.message}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border rounded-md"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Offer"}
        </button>
      </form>
    </div>
  );
}
