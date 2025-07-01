import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "products") await fetchProducts();
      if (activeTab === "kyc") await fetchKYC();
      if (activeTab === "users") await fetchUsers();
      if (activeTab === "rentals") await fetchRentals();
      if (activeTab === "extensions") await fetchExtensions();
    } catch (err) {
      console.error(err);
      setError("Error fetching data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await axiosInstance.get("/admin/products");
    setProducts(data);
  };

  const fetchKYC = async () => {
    const { data } = await axiosInstance.get("/admin/kyc");
    setKycSubmissions(data);
  };

  const fetchUsers = async () => {
    const { data } = await axiosInstance.get("/users");
    setUsers(data);
  };

  const fetchRentals = async () => {
    const { data } = await axiosInstance.get("/admin/rentals");
    setRentals(data);
  };

  const fetchExtensions = async () => {
    const { data } = await axiosInstance.get("/admin/extension-requests");
    setExtensions(data);
  };

  // Product management
  const deleteProduct = async (id) => {
    try {
      await axiosInstance.delete(`/admin/products/${id}`);
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (err) {
      setError("Failed to delete product.");
      console.error(err);
    }
  };

  // KYC management
  const updateKYCStatus = async (id, status) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/kyc/${id}`, {
        status,
      });
      setKycSubmissions((prev) =>
        prev
          .map((kyc) =>
            kyc._id === id ? { ...kyc, status: data.status } : kyc
          )
          .sort((a, b) => (a.status === "pending" ? -1 : 1))
      );
    } catch (err) {
      setError("Failed to update KYC status.");
      console.error(err);
    }
  };

  // User management
  const deleteUser = async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (err) {
      setError("Failed to delete user.");
      console.error(err);
    }
  };

  // Rental management
  const confirmReturn = async (id) => {
    try {
      await axiosInstance.post(`/admin/confirm-return/${id}`);
      fetchRentals();
    } catch (err) {
      setError("Failed to confirm return.");
      console.error(err);
    }
  };

  const confirmDelivery = async (id) => {
    try {
      await axiosInstance.post(`/admin/confirm-delivery/${id}`);
      fetchRentals();
    } catch (err) {
      setError("Failed to confirm delivery.");
      console.error(err);
    }
  };

  // Extension management
  const respondToExtension = async (rentalId, decision) => {
    try {
      await axiosInstance.post(`/respond-extension/${rentalId}`, { decision });
      fetchExtensions();
      fetchRentals();
    } catch (err) {
      setError("Failed to respond to extension request.");
      console.error(err);
    }
  };

  const renderBadge = (text, color) => (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full text-white`}
      style={{ backgroundColor: color }}
    >
      {text}
    </span>
  );

  const tabs = [
    { id: "products", label: "Products" },
    { id: "rentals", label: "Rentals" },
    { id: "extensions", label: "Extension Requests" },
    { id: "kyc", label: "KYC Submissions" },
    { id: "users", label: "Users" },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-600">
          Logout
        </button>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 text-lg font-medium ${
              activeTab === tab.id
                ? "border-b-4 border-blue-500 text-blue-500"
                : "text-gray-500"
            } hover:text-blue-500`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Products Tab */}
      {!loading && activeTab === "products" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{product.description}</p>
                  <p className="text-gray-600 mt-1">
                    <strong>Category:</strong> {product.category}
                  </p>
                  <p className="text-gray-600 mt-1">
                    <strong>Location:</strong> {product.location}
                  </p>
                  <p className="text-gray-600 mt-1">
                    <strong>Status:</strong>{" "}
                    {renderBadge(
                      product.status,
                      product.status === "available" ? "#10b981" : "#f59e0b"
                    )}
                  </p>
                  <p className="text-gray-800 font-bold mt-2">
                    Rs. {product.pricePerDay}/day
                  </p>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600 transition"
                    onClick={() => deleteProduct(product._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KYC Submissions Tab */}
      {!loading && activeTab === "kyc" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            KYC Submissions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {kycSubmissions.map((kyc) => (
              <div
                key={kyc._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-800">
                  {kyc.fullName}
                </h3>
                <p className="text-gray-600 mt-1">
                  <strong>Date of Birth:</strong> {kyc.dob}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Phone:</strong> {kyc.phone}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>ID Type:</strong> {kyc.idType}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>ID Number:</strong> {kyc.idNumber}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Status:</strong>{" "}
                  {renderBadge(
                    kyc.status,
                    kyc.status === "approved"
                      ? "#10b981"
                      : kyc.status === "pending"
                        ? "#f59e0b"
                        : "#ef4444"
                  )}
                </p>

                {/* Document Images */}
                <div className="mt-4 space-y-2">
                  {kyc.documentPhoto && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Document:
                      </p>
                      <a
                        href={kyc.documentPhoto}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                  {kyc.idDocumentPath && (
                    <img
                      src={kyc.idDocumentPath}
                      alt="ID Document"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  {kyc.selfiePath && (
                    <img
                      src={kyc.selfiePath}
                      alt="Selfie"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div className="flex justify-between mt-4 space-x-2">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex-1"
                    onClick={() => updateKYCStatus(kyc._id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex-1"
                    onClick={() => updateKYCStatus(kyc._id, "disapproved")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Users Tab */}
      {!loading && activeTab === "users" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-gray-800">
                  {user.fullName}
                </h3>
                <p className="text-gray-600 mt-1">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Phone:</strong> {user.phone}
                </p>
                <p className="text-gray-600 mt-1">
                  <strong>Status:</strong>{" "}
                  {renderBadge(
                    user.isActive ? "Active" : "Inactive",
                    user.isActive ? "#10b981" : "#6b7280"
                  )}
                </p>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-red-600 transition w-full"
                  onClick={() => deleteUser(user._id)}
                >
                  Delete User
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rentals Tab */}
      {!loading && activeTab === "rentals" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            All Rentals
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late?
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Extra Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rentals.map((rental) => (
                    <tr key={rental._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rental.productId?.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rental.userId?.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderBadge(
                          rental.status,
                          {
                            pending: "#f59e0b",
                            booked: "#3b82f6",
                            returned: "#10b981",
                            late: "#ef4444",
                          }[rental.status] || "#6b7280"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(rental.actualStartDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(rental.actualEndDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rental.lateReturn?.isLate
                          ? renderBadge("LATE", "#ef4444")
                          : "No"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rental.lateReturn?.extraAmount
                          ? `Rs. ${rental.lateReturn.extraAmount}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rental.lateReturn?.chargedExtra
                          ? renderBadge("Paid", "#10b981")
                          : renderBadge("Unpaid", "#6b7280")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {rental.deliveryLogistics?.photoProof && (
                          <a
                            href={rental.deliveryLogistics.photoProof}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            View Delivery
                          </a>
                        )}
                        {rental.returnLogistics?.photoProof && (
                          <a
                            href={rental.returnLogistics.photoProof}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            View Return
                          </a>
                        )}
                        <div className="flex space-x-2 mt-2">
                          {!rental.deliveryLogistics?.confirmedByAdmin && (
                            <button
                              onClick={() => confirmDelivery(rental._id)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                            >
                              Confirm Delivery
                            </button>
                          )}
                          {!rental.returnLogistics?.confirmedByAdmin && (
                            <button
                              onClick={() => confirmReturn(rental._id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                            >
                              Confirm Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Extensions Tab */}
      {!loading && activeTab === "extensions" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Extension Requests
          </h2>
          <div className="space-y-4">
            {extensions.map((extension) => (
              <div
                key={extension._id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {extension.productId?.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      <strong>User:</strong> {extension.userId?.fullName}
                    </p>
                    <p className="text-gray-600 mt-1">
                      <strong>Requested Days:</strong>{" "}
                      {extension.extensionRequest?.requestedDays} more days
                    </p>
                    <p className="text-gray-600 mt-1">
                      <strong>Status:</strong>{" "}
                      {renderBadge(
                        extension.extensionRequest?.status || "Pending",
                        extension.extensionRequest?.status === "approved"
                          ? "#10b981"
                          : extension.extensionRequest?.status === "rejected"
                            ? "#ef4444"
                            : "#f59e0b"
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() =>
                        respondToExtension(extension._id, "approved")
                      }
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        respondToExtension(extension._id, "rejected")
                      }
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Admin;
