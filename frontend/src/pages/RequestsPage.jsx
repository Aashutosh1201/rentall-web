import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Tag } from "lucide-react";

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/requests");
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const formatCompactDateRange = (dates) => {
    if (!Array.isArray(dates) || dates.length === 0) return "Unspecified";

    const sorted = [...dates].sort();
    const start = new Date(sorted[0]);
    const end = new Date(sorted[sorted.length - 1]);

    const sameMonth = start.getMonth() === end.getMonth();
    const startDay = start.getDate();
    const endDay = end.getDate();

    const month = start.toLocaleString("default", { month: "short" });

    return sameMonth
      ? `${month} ${startDay}-${endDay}`
      : `${start.toLocaleString("default", { month: "short" })} ${startDay} - ${end.toLocaleString("default", { month: "short" })} ${endDay}`;
  };

  if (loading)
    return (
      <div className="text-center mt-20 text-blue-600">
        <p className="text-lg font-medium animate-pulse">Loading requests...</p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          🔎 Product Rental Requests
        </h1>
        <Link
          to="/request-product"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          + New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>No requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div
              key={req._id}
              className="border rounded-xl shadow-md p-5 bg-white hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2 text-blue-800">
                {req.name}
              </h2>
              <p className="text-gray-700 mb-1 flex items-center">
                <Tag className="h-4 w-4 mr-1 text-gray-500" /> Rs. {req.price}/day
              </p>
              <p className="text-gray-600 text-sm mb-1 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                {req.location || "Not specified"}
              </p>
              <p className="text-gray-500 text-sm mb-2 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1 text-gray-500" />
                {formatCompactDateRange(req.needDates)}
              </p>
              <p className="text-sm text-gray-700 mb-4">
                {req.description?.slice(0, 100)}...
              </p>
              <Link
                to={`/requests/${req._id}`}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
              >
                View & Make Offer
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
