import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { CheckCircle, XCircle, CalendarDays, MapPin, Tag } from "lucide-react";

export default function MyOffersPage() {
  const [products, setProducts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, requestId: null, offerId: null });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const base64 = token.split(".")[1];
    const payload = JSON.parse(atob(base64));
    setCurrentUserId(payload.id);

    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/requests/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch my products:", err);
    }
  };

  const handleConfirmAccept = async () => {
    const { requestId, offerId } = confirmDialog;
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:8000/api/requests/${requestId}/accept-offer/${offerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setConfirmDialog({ open: false, requestId: null, offerId: null });
      await fetchMyProducts();
    } catch (err) {
      console.error("Failed to accept offer:", err);
    }
  };

  const renderStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === "accepted") return <span className="text-green-600 dark:text-green-400 font-semibold">✅ Accepted</span>;
    if (s === "rejected") return <span className="text-red-500 dark:text-red-400 font-semibold">❌ Rejected</span>;
    return <span className="text-yellow-600 dark:text-yellow-400 font-semibold">⏳ Pending</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-gray-800 dark:text-gray-100">
      <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-400 mb-10 text-center">
        My Posted Requests & Offers
      </h1>

      {products.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">You haven’t posted any products yet.</p>
      ) : (
        <div className="space-y-10">
          {products.map((product) => (
            <div key={product._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">{product.name}</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
                  <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> Rs. {product.price}/day</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {product.location}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {product.needDates?.join(", ")}</span>
                </div>
                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">{product.description}</p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400 mb-3">Counter Offers:</h3>
                {product.counterOffers?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {product.counterOffers.map((offer, index) => {
                      const status = offer.status?.toLowerCase() || "pending";
                      return (
                        <div
                          key={index}
                          className="p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700 hover:shadow-md transition"
                        >
                          <div className="text-sm">
                            <p className="font-semibold mb-1">Price: Rs. {offer.price}</p>
                            {offer.message && <p className="text-gray-600 dark:text-gray-300 mb-1">💬 {offer.message}</p>}
                            {offer.user?.fullName && <p className="text-gray-500 dark:text-gray-400 mb-1">By: {offer.user.fullName}</p>}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                              Submitted on: {new Date(offer.createdAt).toLocaleString()}
                            </p>
                            {offer.image && (
                              <img
                                src={offer.image}
                                alt="Offer"
                                className="w-full max-w-xs rounded border mb-3 cursor-pointer hover:scale-105 transition"
                                onClick={() => setSelectedImage(offer.image)}
                              />
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <span>Status: {renderStatus(status)}</span>
                              <button
                                disabled={status !== "pending"}
                                onClick={() =>
                                  setConfirmDialog({ open: true, requestId: product._id, offerId: offer._id })
                                }
                                className={`px-4 py-1 rounded text-sm font-medium transition ${
                                  status === "pending"
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                Accept Offer
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No counter offers yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full view"
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-xl"
          />
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, requestId: null, offerId: null })}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-6 rounded-lg z-10 max-w-md w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-700">
          <Dialog.Title className="text-xl font-bold mb-2">
            Confirm Acceptance
          </Dialog.Title>
          <Dialog.Description className="mb-4 text-gray-600 dark:text-gray-300">
            Are you sure you want to accept this offer? This will reject all other offers for this product.
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDialog({ open: false, requestId: null, offerId: null })}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAccept}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
