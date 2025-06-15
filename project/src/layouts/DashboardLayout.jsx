import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useFarmData } from "../context/FarmDataContext";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiLogOut,
  FiPackage,
  FiDollarSign,
  FiGrid,
  FiMapPin,
} from "react-icons/fi";
import { motion } from "framer-motion";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, handleLogout } = useUser();
  const { farmSettings, activeFarm } = useFarmData();

  const menuItems = [
    { path: "/dashboard", name: "Dashboard", icon: <FiHome size={20} /> },
    { path: "/animals", name: "Animals", icon: <FiUsers size={20} /> },
    { path: "/crops", name: "Crops", icon: <FiGrid size={20} /> },
    { path: "/tasks", name: "Tasks", icon: <FiCalendar size={20} /> },
    { path: "/inventory", name: "Inventory", icon: <FiPackage size={20} /> },
    { path: "/expenses", name: "Expenses", icon: <FiDollarSign size={20} /> },
    { path: "/reports", name: "Reports", icon: <FiBarChart2 size={20} /> },
    { path: "/settings", name: "Settings", icon: <FiSettings size={20} /> },
  ];

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b">
            <Link to="/dashboard" className="flex items-center">
              <img
                src="https://placehold.co/40x40/2F855A/FFFFFF?text=TT"
                alt="Terra Track"
                className="h-10 w-10 rounded-lg"
              />
              <span className="ml-3 text-xl font-display font-bold text-primary-500">
                Terra Track
              </span>
            </Link>
            <button
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0] || "U"}
              </div>
              <div className="ml-3">
                <p className="font-medium">
                  {user?.firstName} {user?.lastName || "User"}
                </p>
                <p className="text-sm text-gray-500">
                  {activeFarm?.name || farmSettings?.name || "Farm Name"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-5 px-4 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t mt-auto">
            <button
              onClick={onLogout}
              className="flex w-full items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <FiLogOut size={20} className="mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  className="p-2 rounded-md lg:hidden hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
                >
                  <FiMenu size={24} />
                </button>
                <div>
                  <motion.h1
                    className="text-2xl font-display font-bold text-gray-800"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeFarm?.name || farmSettings?.name || "Farm Name"}
                  </motion.h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <FiMapPin className="mr-1" />
                    <span>
                      {activeFarm?.location ||
                        farmSettings?.location ||
                        "Farm Location"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center px-4 py-2 bg-primary-50 rounded-lg text-primary-700">
                  <FiCalendar className="mr-2" />
                  <span>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <div className="relative">
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                    <FiCalendar size={20} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
