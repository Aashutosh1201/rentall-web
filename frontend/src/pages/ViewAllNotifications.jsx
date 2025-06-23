// src/pages/ViewAllNotifications.jsx
import React, { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const ViewAllNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 mt-20">
      <div className="flex items-center mb-6">
        <FiBell className="text-2xl text-blue-600 mr-2" />
        <h1 className="text-xl font-semibold text-gray-800">
          All Notifications
        </h1>
      </div>
      <div className="bg-white shadow rounded-lg divide-y">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-gray-500">
            No notifications to display.
          </p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 transition-all flex justify-between items-start hover:bg-gray-50 cursor-pointer ${
                notification.read ? "bg-white" : "bg-blue-50"
              }`}
              onClick={() => handleMarkAsRead(notification._id)}
            >
              <div>
                <p className="text-sm text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewAllNotifications;
