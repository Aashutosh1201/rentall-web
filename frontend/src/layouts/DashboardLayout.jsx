import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 dark:bg-gray-950 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">RentALL</h2>
        <nav className="space-y-2">
          <a
            href="#"
            className="block hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#"
            className="block hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded transition-colors"
          >
            My Listings
          </a>
          <a
            href="#"
            className="block hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded transition-colors"
          >
            Orders
          </a>
          <a
            href="#"
            className="block hover:bg-gray-700 dark:hover:bg-gray-800 p-2 rounded transition-colors"
          >
            Profile
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900 transition-colors">
        <Outlet />
      </main>
    </div>
  );
}
