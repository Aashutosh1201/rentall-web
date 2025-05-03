import React, { useEffect, useState } from "react";
import axios from "../../api/axios";

const UserHome = () => {
  const [user, setUser] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to load user:", err);
      alert("Session expired or not logged in.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!user) {
    return <div className="text-center text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.fullName}!</h1>
      <p className="text-gray-600">Email: {user.email}</p>
      <p className="text-gray-600">Phone: {user.phone}</p>
      <hr className="my-4" />
      <p className="text-gray-700">🚀 Product management features coming soon...</p>
    </div>
  );
};

export default UserHome;
