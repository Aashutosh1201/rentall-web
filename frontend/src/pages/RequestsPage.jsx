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
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold text-gray-900">
          💼 People Need These — Offer Yours & Earn!
        </h1>
        <div className="flex gap-3">
          <Link
            to="/my-offers"
            className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 transition"
          >
            👀 See My Requests
          </Link>
          <Link
            to="/request-product"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            + New Request
          </Link>
        </div>
      </div>

      {/* Motivational CTA Section */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mb-10 shadow-sm">
        <h2 className="text-xl font-semibold text-blue-800 mb-1">
          💡 Got something idle? Turn it into income!
        </h2>
        <p className="text-gray-700 mb-3">
          People are actively looking for tools, gadgets, and gear. If you've got what
          they need, post an offer and start earning today.
        </p>
        <button
          onClick={() => {
            const requestList = document.getElementById("request-list");
            requestList?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-block bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Browse Requests →
        </button>
      </div>

      {/* No Requests Fallback */}
      {requests.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No requests found at the moment.</p>
        </div>
      ) : (
        <div id="request-list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-blue-700 mb-2">
                  {req.name}
                </h2>
                <p className="text-gray-800 font-medium flex items-center mb-1">
                  <Tag className="w-4 h-4 mr-2 text-gray-500" />
                  Rs. {req.price}/day
                </p>
                <p className="text-gray-600 flex items-center mb-1 text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  {req.location || "Not specified"}
                </p>
                <p className="text-gray-500 flex items-center text-sm mb-3">
                  <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                  {formatCompactDateRange(req.needDates)}
                </p>
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {req.description?.slice(0, 120) || "No description provided."}
                </p>
              </div>
              <Link
                to={`/requests/${req._id}`}
                className="mt-auto w-full text-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition text-sm font-semibold"
              >
                Make Offer & Earn
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
