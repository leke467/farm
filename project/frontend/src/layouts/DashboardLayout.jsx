import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useFarmData } from "../context/FarmDataContext";
import { toFarmSlug } from "../utils/formatters";
import apiService from "../services/api";
import AIAgentPanel from "../components/AIAgentPanel";
import Logo from "../components/Logo";
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
  FiAlertCircle,
  FiTrendingUp,
  FiBell,
  FiShoppingBag,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [permissionMap, setPermissionMap] = useState({});
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { farmSlug } = useParams();
  const { user, handleLogout } = useUser();
  const { farmSettings, activeFarm, farms, setActiveFarm } = useFarmData();

  const currentSlug = farmSlug || toFarmSlug(activeFarm?.name || "adehifarm");
  const isOwner = activeFarm?.is_owner === true || activeFarm?.user_role === 'owner';

  useEffect(() => {
    let active = true;
    async function fetchSubscriptionInfo() {
      try {
        const sub = await apiService.getMySubscription(activeFarm?.id);
        if (active && sub && !sub._error) {
          setSubscription(sub);
        }
      } catch (e) {}
    }
    fetchSubscriptionInfo();
    return () => {
      active = false;
    };
  }, [location.pathname, activeFarm?.id]);

  useEffect(() => {
    if (farmSlug && farms && farms.length > 0) {
      const match = farms.find((f) => toFarmSlug(f.name) === farmSlug.toLowerCase());
      if (match && match.id !== activeFarm?.id) {
        setActiveFarm(match);
      }
    }
  }, [farmSlug, farms, activeFarm?.id]);

  useEffect(() => {
    let active = true;
    async function loadNotifications() {
      if (!activeFarm?.id) return;
      try {
        const [tasksRes, inventoryRes] = await Promise.all([
          apiService.get(`/tasks/?farm=${activeFarm.id}&status=pending`).catch(() => []),
          apiService.get(`/inventory/?farm=${activeFarm.id}`).catch(() => []),
        ]);

        const list = [];
        const tasksList = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.results || []);
        tasksList.slice(0, 5).forEach((t) => {
          list.push({
            id: `task-${t.id}`,
            title: t.title || "Pending Farm Task",
            message: `Category: ${t.category || "General"} • Priority: ${t.priority || "Medium"}`,
            type: "task",
            link: `/${currentSlug}/tasks`,
            time: t.due_date ? new Date(t.due_date).toLocaleDateString() : "Due soon",
          });
        });

        const invList = Array.isArray(inventoryRes) ? inventoryRes : (inventoryRes?.results || []);
        invList.filter((item) => Number(item.quantity || 0) <= Number(item.min_quantity || 0)).slice(0, 3).forEach((item) => {
          list.push({
            id: `inv-${item.id}`,
            title: `Low Stock: ${item.name}`,
            message: `Only ${item.quantity} ${item.unit} left (Min: ${item.min_quantity})`,
            type: "warning",
            link: `/${currentSlug}/inventory`,
            time: "Action required",
          });
        });

        if (active) {
          setNotifications(list);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }
    loadNotifications();
    return () => {
      active = false;
    };
  }, [activeFarm?.id, location.pathname, currentSlug]);

  const toggleExpandItem = (key) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const firstName = user?.firstName || user?.first_name || "";
  const lastName = user?.lastName || user?.last_name || "";
  const username = user?.username || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || username || "User";
  const initials = `${
    firstName?.[0] || username?.[0] || "U"
  }${lastName?.[0] || ""}`.toUpperCase();

  const menuItems = [
    { key: "dashboard", path: `/${currentSlug}/dashboard`, name: "Dashboard", icon: <FiHome size={20} /> },
    { key: "animals", path: `/${currentSlug}/animals`, name: "Animals", icon: <FiUsers size={20} /> },
    { key: "crops", path: `/${currentSlug}/crops`, name: "Crops", icon: <FiGrid size={20} /> },
    { key: "tasks", path: `/${currentSlug}/tasks`, name: "Tasks", icon: <FiCalendar size={20} /> },
    { 
      key: "inventory", 
      path: `/${currentSlug}/inventory`, 
      name: "Inventory", 
      icon: <FiPackage size={20} />,
      subItems: [
        { key: "inventory-overview", path: `/${currentSlug}/inventory`, name: "Overview" },
        { key: "inventory-audits", path: `/${currentSlug}/inventory/audits`, name: "Audits" },
        { key: "inventory-costs", path: `/${currentSlug}/inventory/costs`, name: "Cost Analysis" },
      ]
    },
    { key: "expenses", path: `/${currentSlug}/expenses`, name: "Expenses", icon: <FiDollarSign size={20} /> },
    { key: "sales", path: `/${currentSlug}/sales`, name: "Sales & Income", icon: <FiShoppingBag size={20} /> },
    { key: "reports", path: `/${currentSlug}/reports`, name: "Reports", icon: <FiBarChart2 size={20} /> },
    { key: "health", path: `/${currentSlug}/health`, name: "Health Alerts", icon: <FiAlertCircle size={20} /> },
    {
      key: "analytics",
      path: `/${currentSlug}/analytics`,
      name: "Analytics",
      icon: <FiTrendingUp size={20} />,
      subItems: [
        { key: "analytics-forecasting", path: `/${currentSlug}/analytics/forecasting`, name: "Demand Forecasting" },
        { key: "analytics-animals", path: `/${currentSlug}/analytics/animals`, name: "Animal Productivity" },
        { key: "analytics-financial", path: `/${currentSlug}/analytics/financial`, name: "Financial Overview" },
        { key: "analytics-crops", path: `/${currentSlug}/analytics/crops`, name: "Crop Analytics" },
      ]
    },
    { key: "settings", path: `/${currentSlug}/settings`, name: "Settings", icon: <FiSettings size={20} /> },
  ];

  useEffect(() => {
    let cancelled = false;

    async function fetchPermissions() {
      if (!activeFarm?.id || !localStorage.getItem("authToken")) {
        setPermissionMap({});
        return;
      }

      const response = await apiService.getMyFarmPermissions(activeFarm.id);
      if (!cancelled && !response?._error && response?.permission_map) {
        setPermissionMap(response.permission_map);
      }
    }

    fetchPermissions();

    return () => {
      cancelled = true;
    };
  }, [activeFarm?.id, user?.id]);

  const visibleMenuItems = menuItems
    .map((item) => {
      const parentPerm = permissionMap?.[item.key];
      if (parentPerm && parentPerm.can_view === false) {
        return null;
      }
      if (item.subItems) {
        const allowedSubItems = item.subItems.filter((subItem) => {
          const subPerm = permissionMap?.[subItem.key];
          if (!subPerm) return true;
          return Boolean(subPerm.can_view);
        });
        if (allowedSubItems.length === 0) {
          return null;
        }
        return { ...item, subItems: allowedSubItems };
      }
      return item;
    })
    .filter(Boolean);

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
            <Link to={`/${currentSlug}/dashboard`} className="flex items-center">
              <Logo size={36} />
              <span className="ml-3 text-xl font-display font-bold text-primary-500">
                Livesteads
              </span>
            </Link>
            <button
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* User Info & Subscription trigger */}
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className="px-4 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors group"
            title="Click to view user profile & subscription"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-inner group-hover:scale-105 transition-transform">
                  {initials}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {activeFarm?.name || farmSettings?.name || "Farm Name"}
                  </p>
                </div>
              </div>
              {isOwner && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${
                  subscription?.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-sky-100 text-sky-800'
                }`}>
                  {subscription?.status === 'active' ? 'PRO' : 'TRIAL'}
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-5 px-4 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {visibleMenuItems.map((item) => (
                <div key={item.path}>
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => toggleExpandItem(item.key)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          location.pathname.startsWith(item.path)
                            ? "bg-primary-50 text-primary-600"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                        <span className="ml-auto">
                          {expandedItems[item.key] ? "▼" : "▶"}
                        </span>
                      </button>
                      {expandedItems[item.key] && (
                        <div className="pl-8 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                                location.pathname === subItem.path
                                  ? "bg-primary-100 text-primary-600"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  )}
                </div>
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
        <header className="bg-white shadow-sm z-10 border-b border-gray-100">
          <div className="px-3.5 sm:px-6 lg:px-8 py-3 sm:py-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
                <button
                  className="p-2 rounded-lg lg:hidden hover:bg-gray-100 text-gray-700"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Toggle navigation menu"
                >
                  <FiMenu size={22} />
                </button>
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {activeFarm?.logo ? (
                    <img
                      src={activeFarm.logo}
                      alt={`${activeFarm?.name || 'Farm'} logo`}
                      className="h-8 w-8 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl object-cover border border-emerald-500/80 shadow-xs bg-white p-0.5 flex-shrink-0"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <motion.h1
                      className="text-lg sm:text-2xl font-display font-bold text-gray-900 truncate"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activeFarm?.name || farmSettings?.name || "Farm Name"}
                    </motion.h1>
                    <div className="flex items-center mt-0.5 text-xs sm:text-sm text-gray-500 truncate">
                      <FiMapPin className="mr-1 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">
                        {activeFarm?.location ||
                          farmSettings?.location ||
                          "Farm Location"}
                      </span>
                    </div>
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
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors relative focus:outline-none"
                    title="Notifications & Alerts"
                  >
                    <div className="relative">
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow">
                          {notifications.length}
                        </span>
                      )}
                      <FiBell size={22} className="text-gray-600 hover:text-primary-600 transition-colors" />
                    </div>
                  </button>

                  {/* Notifications Dropdown Panel */}
                  {notificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setNotificationsOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FiBell className="text-primary-600" />
                            <h3 className="font-bold text-gray-800 text-sm">Notifications & Alerts</h3>
                          </div>
                          <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full font-semibold">
                            {notifications.length} Active
                          </span>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                          {notifications.length > 0 ? (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  navigate(n.link);
                                }}
                                className="p-3.5 hover:bg-primary-50/50 cursor-pointer transition-colors flex items-start space-x-3 group"
                              >
                                <div
                                  className={`mt-0.5 p-2 rounded-lg ${
                                    n.type === "warning"
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-blue-100 text-blue-600"
                                  }`}
                                >
                                  {n.type === "warning" ? (
                                    <FiAlertCircle size={16} />
                                  ) : (
                                    <FiCalendar size={16} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                    {n.message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {n.time}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-gray-500 text-sm">
                              No active notifications. Everything is up to date!
                            </div>
                          )}
                        </div>

                        <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate("/tasks");
                            }}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors py-1 px-3"
                          >
                            View All Operations & Tasks →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile & Subscription Avatar Button & Popover */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      setProfileOpen(!profileOpen);
                    }}
                    className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-gray-100 transition-all border border-gray-200/80 bg-white shadow-xs focus:outline-none"
                    title="User Profile & Subscription Status"
                  >
                    <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {initials}
                    </div>
                    <div className="hidden sm:flex flex-col text-left pr-1">
                      <span className="text-xs font-bold text-gray-900 leading-tight">
                        {displayName}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {isOwner ? (subscription?.plan?.name || "Pro Plan") : (activeFarm?.name || "Farm Member")}
                      </span>
                    </div>
                  </button>

                  {/* Profile & Subscription Popover Panel */}
                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fadeIn p-4 sm:p-5 space-y-4">
                        {/* Header Profile Summary */}
                        <div className="flex items-center space-x-3.5 pb-4 border-b border-gray-100">
                          <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center shadow-inner">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base truncate">{displayName}</h3>
                            <p className="text-xs text-gray-500 truncate">{user?.email || user?.username || "user@example.com"}</p>
                            <span className="inline-block px-2 py-0.5 mt-1 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-md uppercase">
                              {activeFarm?.name || "Farm Owner"}
                            </span>
                          </div>
                        </div>

                        {/* Active Subscription Details Card (Only for Farm Owner/Admin) */}
                        {isOwner && (
                          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-4 space-y-3 shadow-lg border border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300">Subscription Status</span>
                              <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                                subscription?.status === 'active' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              }`}>
                                {subscription?.status === 'active' ? 'Active' : '14-Day Trial'}
                              </span>
                            </div>

                            <div>
                              <p className="text-sm font-black text-emerald-400">
                                {subscription?.plan?.name || subscription?.planName || "Free Trial Plan"}
                              </p>
                              <p className="text-xs text-slate-300 mt-0.5">
                                {subscription?.end_date 
                                  ? `Valid / Renews: ${new Date(subscription.end_date).toLocaleDateString()}`
                                  : "Full features unlocked"}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setProfileOpen(false);
                                navigate(`/${currentSlug}/subscription`);
                              }}
                              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow"
                            >
                              <FiCreditCard className="text-sm" />
                              <span>Manage Subscription & Monnify</span>
                            </button>
                          </div>
                        )}

                        {/* Quick Menu Actions */}
                        <div className="space-y-1 pt-1 text-xs">
                          {isOwner && (
                            <button
                              onClick={() => {
                                setProfileOpen(false);
                                navigate(`/${currentSlug}/subscription`);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition"
                            >
                              <FiCreditCard className="text-emerald-600 text-sm" />
                              <span className="font-semibold text-gray-800">Subscription & Billing</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              navigate(`/${currentSlug}/settings`);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-700 transition"
                          >
                            <FiSettings className="text-gray-500 text-sm" />
                            <span className="font-semibold text-gray-800">Account Settings</span>
                          </button>
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              onLogout();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 transition"
                          >
                            <FiLogOut className="text-rose-500 text-sm" />
                            <span className="font-semibold text-rose-700">Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-3.5 sm:p-6 lg:p-8">
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
      <AIAgentPanel />
    </div>
  );
}

export default DashboardLayout;
