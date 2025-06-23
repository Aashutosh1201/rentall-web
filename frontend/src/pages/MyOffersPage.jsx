import { useEffect, useState } from "react";

export default function MyOffersPage() {
  const [products, setProducts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const base64 = token.split(".")[1];
    const payload = JSON.parse(atob(base64));
    setCurrentUserId(payload.id);

    const fetchMyProducts = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/requests/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("Fetched products:", data); // ✅ Debug log
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch my products:", err);
      }
    };

    fetchMyProducts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">My Product Offers</h1>

      {!Array.isArray(products) ? (
        <p className="text-red-500">Something went wrong. Could not load offers.</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">You haven’t posted any products yet.</p>
      ) : (
        products.map((product) => (
          <div key={product._id} className="mb-10">
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            {product.counterOffers?.length > 0 ? (
              <div className="space-y-4">
                {product.counterOffers.map((offer, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-md border shadow-sm space-y-2"
                  >
                    <p className="text-gray-800 font-semibold">Price: Rs. {offer.price}</p>
                    {offer.message && (
                      <p className="text-gray-600">💬 {offer.message}</p>
                    )}
                    {offer.image && (
                      <img
                        src={offer.image}
                        alt="Offer"
                        className="w-48 rounded border"
                      />
                    )}
                    <p className="text-sm text-gray-500">
                      Submitted on:{" "}
                      {new Date(offer.createdAt).toLocaleString()}
                    </p>
                    {offer.user?.fullName && (
                      <p className="text-sm text-gray-500">
                        By: {offer.user.fullName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No counter offers yet.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
