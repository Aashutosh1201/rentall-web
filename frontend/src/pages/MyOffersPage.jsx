import { useEffect, useState } from "react";

export default function MyOffersPage() {
  const [products, setProducts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const base64 = token.split(".")[1];
      const payload = JSON.parse(atob(base64));
      setCurrentUserId(payload.id);
    } catch (err) {
      console.error("Invalid token:", err);
    }

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

  const handleAcceptOffer = async (requestId, offerId) => {
    console.log("🔥 Accepting offer:", { requestId, offerId });

    const token = localStorage.getItem("token");
    if (!token || !requestId || !offerId) {
      console.error("Missing data for accepting offer");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/requests/${requestId}/accept-offer/${offerId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorMsg = await res.text();
        console.error("❌ Error accepting offer:", errorMsg);
        return;
      }

      await fetchMyProducts();
      console.log("✅ Offer accepted and data refreshed.");
    } catch (err) {
      console.error("Failed to accept offer:", err);
    }
  };

  const renderStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === "accepted") return <span className="text-green-600">✅ Accepted</span>;
    if (s === "rejected") return <span className="text-red-500">❌ Rejected</span>;
    return <span className="text-gray-500">⏳ Pending</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">My Product Offers</h1>

      {!Array.isArray(products) ? (
        <p className="text-red-500">Something went wrong. Could not load offers.</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">You haven’t posted any products yet.</p>
      ) : (
        products.map((product) => (
          <div key={product._id} className="mb-10 border-b pb-6">
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>

            {product.counterOffers?.length > 0 ? (
              <div className="space-y-4">
                {product.counterOffers.map((offer, index) => {
                  const status = offer.status?.toLowerCase() || "pending";
                  const isPending = status === "pending";

                  return (
                    <div
                      key={offer._id || index}
                      className="bg-white p-4 rounded-md border shadow-sm space-y-2 relative"
                    >
                      <p className="text-gray-800 font-semibold">
                        Price: Rs. {offer.price}
                      </p>

                      {offer.message && (
                        <p className="text-gray-600">💬 {offer.message}</p>
                      )}

                      {offer.image && (
                        <img
                          src={offer.image}
                          alt="Offer"
                          className="w-48 rounded border cursor-pointer hover:opacity-90"
                          onClick={() => setSelectedImage(offer.image)}
                        />
                      )}

                      <p className="text-sm text-gray-500">
                        Submitted on:{" "}
                        {offer.createdAt
                          ? new Date(offer.createdAt).toLocaleString()
                          : "Unknown"}
                      </p>

                      {offer.user?.fullName && (
                        <p className="text-sm text-gray-500">
                          By: {offer.user.fullName}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2">
                        <span>Status: {renderStatus(status)}</span>
                        <button
                          onClick={() => handleAcceptOffer(product._id, offer._id)}
                          disabled={!isPending}
                          className={`px-4 py-1 rounded text-sm transition ${
                            isPending
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          Accept Offer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No counter offers yet.</p>
            )}
          </div>
        ))
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
    </div>
  );
}
