import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">RentALL</h2>
        <nav className="space-y-2">
          <a href="#" className="block hover:bg-gray-700 p-2 rounded">Dashboard</a>
          <a href="#" className="block hover:bg-gray-700 p-2 rounded">My Listings</a>
          <a href="#" className="block hover:bg-gray-700 p-2 rounded">Orders</a>
          <a href="#" className="block hover:bg-gray-700 p-2 rounded">Profile</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}
