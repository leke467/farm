import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiHome,
  FiAlertTriangle,
  FiInbox,
  FiBarChart2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiShield,
  FiKey,
  FiEdit,
  FiMessageSquare,
  FiUserCheck,
  FiUserX,
  FiLock,
  FiTrendingUp,
  FiDollarSign,
  FiChevronRight,
  FiFilter,
  FiCreditCard,
  FiPlusCircle,
  FiMinusCircle,
  FiClock,
  FiTag,
  FiCompass,
  FiArrowRight,
} from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { toFarmSlug } from "../../utils/formatters";

const SuperadminDashboard = () => {
  const { user } = useUser();
  const { setActiveFarm } = useFarmData();
  const navigate = useNavigate();

  const handleEnterFarm = (farm) => {
    if (!farm) return;
    if (setActiveFarm) setActiveFarm(farm);
    localStorage.setItem("activeFarmId", farm.id);
    const slug = toFarmSlug(farm.name);
    navigate(`/${slug}/dashboard`);
  };

  const [activeTab, setActiveTab] = useState("overview");

  // Stats state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // Farms state
  const [farms, setFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [farmSearch, setFarmSearch] = useState("");

  // Disputes state
  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [disputeStatusFilter, setDisputeStatusFilter] = useState("all");

  // Contact messages state
  const [contactMessages, setContactMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // Manage Subscription Modal state
  const [subModalTarget, setSubModalTarget] = useState(null); // { user_id, farm_id, username, email }
  const [subAction, setSubAction] = useState("grant"); // grant | extend | cancel
  const [subPlanId, setSubPlanId] = useState("");
  const [subDuration, setSubDuration] = useState("30");
  const [subMsg, setSubMsg] = useState("");

  // Feedback notification
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    valid_until: "",
    max_uses: "",
    is_active: true,
  });
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "farms") fetchFarms();
    if (activeTab === "disputes") fetchDisputes();
    if (activeTab === "messages") fetchMessages();
    if (activeTab === "subscriptions") {
      fetchSubscriptions();
      fetchPayments();
    }
    if (activeTab === "coupons") fetchCoupons();
  }, [activeTab]);

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await apiService.getSuperadminCoupons();
      const list = Array.isArray(res) ? res : res?.results || [];
      setCoupons(list);
    } catch (err) {
      console.error("Failed to fetch coupons", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value),
        is_active: couponForm.is_active,
      };
      if (couponForm.valid_until) payload.valid_until = new Date(couponForm.valid_until).toISOString();
      if (couponForm.max_uses) payload.max_uses = parseInt(couponForm.max_uses, 10);

      await apiService.createSuperadminCoupon(payload);
      setFeedbackMsg(`Coupon code "${payload.code}" created successfully!`);
      setCouponModalOpen(false);
      setCouponForm({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        valid_until: "",
        max_uses: "",
        is_active: true,
      });
      fetchCoupons();
    } catch (err) {
      setCouponError(err._error || err.message || "Failed to create coupon code.");
    }
  };

  const handleToggleCouponActive = async (coupon) => {
    try {
      await apiService.updateSuperadminCoupon(coupon.id, { is_active: !coupon.is_active });
      setFeedbackMsg(`Coupon "${coupon.code}" updated.`);
      fetchCoupons();
    } catch (err) {
      alert(err._error || "Failed to update coupon.");
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) return;
    try {
      await apiService.deleteSuperadminCoupon(coupon.id);
      setFeedbackMsg(`Coupon "${coupon.code}" deleted.`);
      fetchCoupons();
    } catch (err) {
      alert(err._error || "Failed to delete coupon.");
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await apiService.getSuperadminStats();
      if (res && !res._error) {
        setStats(res);
      }
    } catch (err) {
      console.error("Failed to load superadmin stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiService.getSuperadminUsers({ search: userSearch });
      const list = Array.isArray(res) ? res : res?.results || [];
      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchFarms = async () => {
    setLoadingFarms(true);
    try {
      const res = await apiService.getSuperadminFarms({ search: farmSearch });
      const list = Array.isArray(res) ? res : res?.results || [];
      setFarms(list);
    } catch (err) {
      console.error("Failed to fetch farms", err);
    } finally {
      setLoadingFarms(false);
    }
  };

  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const params = disputeStatusFilter !== "all" ? { status: disputeStatusFilter } : {};
      const res = await apiService.getDisputes(params);
      const list = Array.isArray(res) ? res : res?.results || [];
      setDisputes(list);
    } catch (err) {
      console.error("Failed to fetch disputes", err);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await apiService.getContactMessages();
      const list = Array.isArray(res) ? res : res?.results || [];
      setContactMessages(list);
    } catch (err) {
      console.error("Failed to fetch contact messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const res = await apiService.getSuperadminSubscriptions();
      const list = Array.isArray(res) ? res : res?.results || [];
      setSubscriptions(list);
    } catch (err) {
      console.error("Failed to fetch subscriptions", err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await apiService.getSuperadminPayments();
      const list = Array.isArray(res) ? res : res?.results || [];
      setPayments(list);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    }
  };

  const handleUserToggle = async (userId, updateData) => {
    try {
      await apiService.updateSuperadminUser(userId, updateData);
      setFeedbackMsg("User permissions updated successfully!");
      setTimeout(() => setFeedbackMsg(""), 3000);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters long.");
      return;
    }
    try {
      await apiService.updateSuperadminUser(resetModalUser.id, { new_password: newPassword });
      setFeedbackMsg(`Password for ${resetModalUser.username} updated!`);
      setTimeout(() => setFeedbackMsg(""), 3000);
      setResetModalUser(null);
      setNewPassword("");
      setPasswordMsg("");
    } catch (err) {
      setPasswordMsg("Failed to reset password.");
    }
  };

  const handleUpdateDispute = async (disputeId, updateData) => {
    try {
      await apiService.updateDispute(disputeId, updateData);
      setFeedbackMsg("Dispute updated successfully!");
      setTimeout(() => setFeedbackMsg(""), 3000);
      setSelectedDispute(null);
      fetchDisputes();
      fetchStats();
    } catch (err) {
      alert("Failed to update dispute status");
    }
  };

  const handleUpdateMessage = async (msgId, updateData) => {
    try {
      await apiService.updateContactMessage(msgId, updateData);
      setFeedbackMsg("Message updated!");
      setTimeout(() => setFeedbackMsg(""), 3000);
      setSelectedMessage(null);
      fetchMessages();
      fetchStats();
    } catch (err) {
      alert("Failed to update message");
    }
  };

  const handleManageSubscriptionSubmit = async (e) => {
    e.preventDefault();
    setSubMsg("");
    try {
      const payload = {
        action: subAction,
        duration_days: parseInt(subDuration) || 30,
      };
      if (subModalTarget.user_id) payload.user_id = subModalTarget.user_id;
      if (subModalTarget.farm_id) payload.farm_id = subModalTarget.farm_id;
      if (subPlanId) payload.plan_id = subPlanId;

      const res = await apiService.manageSubscription(payload);
      if (res && res.success) {
        setFeedbackMsg(res.message || "Subscription updated successfully!");
        setTimeout(() => setFeedbackMsg(""), 4000);
        setSubModalTarget(null);
        fetchStats();
        if (activeTab === "subscriptions") fetchSubscriptions();
      } else {
        setSubMsg(res?.detail || "Failed to update subscription.");
      }
    } catch (err) {
      setSubMsg(err.message || "Error managing subscription");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center font-bold">
              <FiShield size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Livesteads <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">Superadmin Panel</span>
              </h1>
              <p className="text-xs text-slate-400">Platform Operations, Subscriptions, Users & Dispute Resolution</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/select-farm"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <FiCompass size={16} /> Select / Switch Farm Workspace
            </Link>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user?.first_name || user?.username || "Admin"}</p>
              <p className={`text-[10px] font-bold uppercase ${user?.is_superuser ? "text-purple-400" : "text-blue-400"}`}>
                {user?.is_superuser ? "Superuser" : "Staff Member"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {feedbackMsg && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-lg shadow-emerald-500/10">
            <span className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400" /> {feedbackMsg}
            </span>
            <button onClick={() => setFeedbackMsg("")} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-4">
          {[
            { id: "overview", label: "Overview & Analytics", icon: FiBarChart2 },
            { id: "subscriptions", label: "Subscriptions & Revenue", icon: FiCreditCard, highlight: true },
            { id: "coupons", label: "Coupon Codes", icon: FiTag, count: coupons.length },
            { id: "users", label: "User Management", icon: FiUsers, count: stats?.users?.total },
            { id: "farms", label: "Farms Registry", icon: FiHome, count: stats?.farms?.total },
            { id: "disputes", label: "Dispute Settlement", icon: FiAlertTriangle, count: stats?.communications?.open_disputes, highlight: stats?.communications?.open_disputes > 0 },
            { id: "messages", label: "Contact Messages", icon: FiInbox, count: stats?.communications?.unread_messages, highlight: stats?.communications?.unread_messages > 0 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                      tab.highlight
                        ? "bg-red-500 text-white font-black animate-pulse"
                        : isActive
                        ? "bg-slate-950 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & SYSTEM STATS */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Subscription Money</span>
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                    <FiDollarSign size={20} />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-400 mb-1">
                  ₦{(stats?.subscriptions?.total_revenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">{stats?.subscriptions?.active || 0} Active</span> • {stats?.subscriptions?.trial || 0} Trials
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <FiUsers size={20} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mb-1">{stats?.users?.total || 0}</div>
                <p className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">{stats?.users?.active || 0} Active</span> • {stats?.users?.staff || 0} Staff
                </p>
              </div>

              <div
                onClick={() => navigate("/admin/select-farm")}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition group"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-400 transition">Registered Farms</span>
                  <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiHome size={20} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white mb-1">{stats?.farms?.total || 0}</div>
                <p className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                  Click to select farm workspace <FiArrowRight size={12} />
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Disputes</span>
                  <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center">
                    <FiAlertTriangle size={20} />
                  </div>
                </div>
                <div className="text-3xl font-black text-orange-400 mb-1">{stats?.communications?.open_disputes || 0}</div>
                <p className="text-xs text-slate-400">Out of {stats?.communications?.total_disputes || 0} Total Disputes</p>
              </div>
            </div>

            {/* Platform Financial Summaries */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-emerald-400" /> Platform Financial Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Subscription Revenue Collected</p>
                  <p className="text-2xl font-extrabold text-emerald-400">₦{(stats?.subscriptions?.total_revenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Platform Sales Revenue Recorded</p>
                  <p className="text-2xl font-extrabold text-teal-400">₦{(stats?.finances?.total_revenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Platform Expenses Recorded</p>
                  <p className="text-2xl font-extrabold text-red-400">₦{(stats?.finances?.total_expenses || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Total Active Loans & Debt</p>
                  <p className="text-2xl font-extrabold text-orange-400">₦{(stats?.finances?.total_debt || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBSCRIPTIONS & REVENUE */}
        {activeTab === "subscriptions" && (
          <div className="space-y-8">
            {/* Revenue Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Subscription Revenue</p>
                <div className="text-3xl font-black text-emerald-400">₦{(stats?.subscriptions?.total_revenue || 0).toLocaleString()}</div>
                <p className="text-[10px] text-slate-500 mt-1">Processed payments via Monnify</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Active Subscriptions</p>
                <div className="text-3xl font-black text-white">{stats?.subscriptions?.active || 0}</div>
                <p className="text-[10px] text-emerald-400 font-semibold mt-1">Paid & Active Farms</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Trial Accounts</p>
                <div className="text-3xl font-black text-cyan-400">{stats?.subscriptions?.trial || 0}</div>
                <p className="text-[10px] text-slate-400 mt-1">14-Day Free Trial</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cancelled Subscriptions</p>
                <div className="text-3xl font-black text-red-400">{stats?.subscriptions?.cancelled || 0}</div>
                <p className="text-[10px] text-slate-400 mt-1">Expired or Cancelled</p>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FiCreditCard className="text-emerald-400" /> Platform Subscriptions Registry
                  </h3>
                  <p className="text-xs text-slate-400">Manage, grant, extend, or cancel subscription plans for any farm user</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">End Date</th>
                      <th className="p-3">Days Left</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-850">
                        <td className="p-3 font-bold text-white">
                          {sub.user_name}
                          <span className="block text-[10px] text-slate-500">{sub.user_email}</span>
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-md font-bold">
                            {sub.plan_name} (₦{sub.plan_price})
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              sub.status === "active"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : sub.status === "trial"
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{sub.start_date}</td>
                        <td className="p-3 font-semibold text-white">{sub.end_date}</td>
                        <td className="p-3 font-bold text-amber-400">
                          {sub.days_remaining !== undefined ? `${sub.days_remaining} Days` : "N/A"}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSubModalTarget({ user_id: sub.user, username: sub.user_name, email: sub.user_email });
                              setSubAction("grant");
                              setSubMsg("");
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-2.5 py-1 rounded-lg text-[10px]"
                          >
                            Grant / Upgrade
                          </button>
                          <button
                            onClick={() => {
                              setSubModalTarget({ user_id: sub.user, username: sub.user_name, email: sub.user_email });
                              setSubAction("extend");
                              setSubMsg("");
                            }}
                            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold px-2.5 py-1 rounded-lg text-[10px]"
                          >
                            Extend +30 Days
                          </button>
                          <button
                            onClick={() => {
                              setSubModalTarget({ user_id: sub.user, username: sub.user_name, email: sub.user_email });
                              setSubAction("cancel");
                              setSubMsg("");
                            }}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold px-2.5 py-1 rounded-lg text-[10px]"
                          >
                            Cancel Sub
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Transactions Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FiDollarSign className="text-emerald-400" /> Payment Transaction Audit Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-850">
                        <td className="p-3 font-mono font-bold text-slate-300">{p.payment_reference}</td>
                        <td className="p-3 text-white font-semibold">
                          {p.user_name}
                          <span className="block text-[10px] text-slate-500">{p.user_email}</span>
                        </td>
                        <td className="p-3 font-extrabold text-emerald-400">₦{parseFloat(p.amount).toLocaleString()}</td>
                        <td className="p-3 text-slate-400 uppercase text-[10px] font-bold">{p.provider}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === "paid"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">User Management & Permissions</h2>
                <p className="text-xs text-slate-400">Manage user accounts, roles, staff status, password resets, and subscriptions</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={fetchUsers}
                  className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Farms</th>
                    <th className="p-3">Role Status</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-850">
                      <td className="p-3 font-semibold text-white">
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                        <span className="block text-[10px] text-slate-500">@{u.username}</span>
                      </td>
                      <td className="p-3 text-slate-300">{u.email}</td>
                      <td className="p-3">
                        <span className="bg-slate-800 text-emerald-400 px-2 py-1 rounded-md font-bold">
                          {u.farms_count} Farm(s)
                        </span>
                      </td>
                      <td className="p-3">
                        {u.is_superuser ? (
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Superuser
                          </span>
                        ) : u.is_staff ? (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Staff
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                            Farmer
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {u.is_active ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <FiCheckCircle /> Active
                          </span>
                        ) : (
                          <span className="text-red-400 font-semibold flex items-center gap-1">
                            <FiXCircle /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSubModalTarget({ user_id: u.id, username: u.username, email: u.email });
                            setSubAction("grant");
                            setSubMsg("");
                          }}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-2.5 py-1 rounded-lg text-[10px]"
                        >
                          <FiCreditCard className="inline mr-1" /> Manage Sub
                        </button>
                        <button
                          onClick={() => handleUserToggle(u.id, { is_active: !u.is_active })}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                            u.is_active ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>

                        {user?.is_superuser ? (
                          <>
                            <button
                              onClick={() => handleUserToggle(u.id, { is_staff: !u.is_staff })}
                              className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-2.5 py-1 rounded-lg font-bold text-[10px]"
                            >
                              {u.is_staff ? "Remove Staff" : "Make Staff"}
                            </button>
                            <button
                              onClick={() => handleUserToggle(u.id, { is_superuser: !u.is_superuser })}
                              className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-2.5 py-1 rounded-lg font-bold text-[10px]"
                            >
                              {u.is_superuser ? "Remove Superuser" : "Make Superuser"}
                            </button>
                          </>
                        ) : (
                          <span
                            className="text-[10px] text-slate-500 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg inline-flex items-center gap-1 cursor-not-allowed"
                            title="Only Superusers can promote or demote Staff & Superuser roles"
                          >
                            <FiLock size={10} /> Role Change (Superuser Only)
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setResetModalUser(u);
                            setNewPassword("");
                            setPasswordMsg("");
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                        >
                          <FiKey className="inline mr-1" /> Reset PW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FARMS REGISTRY */}
        {activeTab === "farms" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Registered Platform Farms</h2>
                <p className="text-xs text-slate-400">View all farm operations across the platform and manage farm subscriptions</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search farm by name or location..."
                  value={farmSearch}
                  onChange={(e) => setFarmSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={fetchFarms}
                  className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Farm Name</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Live Animals</th>
                    <th className="p-3">Crops</th>
                    <th className="p-3 text-right">Subscription Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {farms.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-850">
                      <td className="p-3 font-bold text-white">{f.name}</td>
                      <td className="p-3 text-slate-300">
                        {f.owner_name}
                        <span className="block text-[10px] text-slate-500">{f.owner_email}</span>
                      </td>
                      <td className="p-3 text-slate-400">{f.location || "N/A"}</td>
                      <td className="p-3 text-slate-400 capitalize">{f.farm_type || "Mixed"}</td>
                      <td className="p-3 text-emerald-400 font-bold">{f.animals_count} Head</td>
                      <td className="p-3 text-cyan-400 font-bold">{f.crops_count} Batches</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleEnterFarm(f)}
                          className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          <FiArrowRight className="inline mr-1" /> Enter Workspace
                        </button>
                        <button
                          onClick={() => {
                            setSubModalTarget({ farm_id: f.id, username: f.owner_name, email: f.owner_email });
                            setSubAction("grant");
                            setSubMsg("");
                          }}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          <FiCreditCard className="inline mr-1" /> Add / Change Sub
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DISPUTE SETTLEMENT CENTER */}
        {activeTab === "disputes" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiAlertTriangle className="text-orange-400" /> Dispute & Ticket Settlement Center
                  </h2>
                  <p className="text-xs text-slate-400">Review, investigate, and settle platform user disputes and issues</p>
                </div>
                <div className="flex gap-2">
                  {["all", "open", "in_review", "resolved", "closed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setDisputeStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                        disputeStatusFilter === st
                          ? "bg-orange-500 text-slate-950"
                          : "bg-slate-950 text-slate-400 hover:text-white"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Ticket #</th>
                      <th className="p-3">Reporter</th>
                      <th className="p-3">Subject & Category</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {disputes.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-850">
                        <td className="p-3 font-mono font-bold text-orange-400">{d.ticket_number}</td>
                        <td className="p-3 text-slate-300">
                          {d.reporter_name}
                          <span className="block text-[10px] text-slate-500">{d.reporter_email}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-white">{d.subject}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{d.category} {d.farm_name ? `• ${d.farm_name}` : ""}</p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              d.priority === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : d.priority === "high"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {d.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                              d.status === "open"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : d.status === "in_review"
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {d.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setResolutionNotes(d.resolution_notes || "");
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Review & Settle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONTACT MESSAGES INBOX */}
        {activeTab === "messages" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <FiInbox className="text-purple-400" /> Public Contact Us Submissions
            </h2>
            <p className="text-xs text-slate-400 mb-6">Review inquiry messages submitted via the public Contact Us page</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Sender Name</th>
                    <th className="p-3">Contact Info</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {contactMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-850">
                      <td className="p-3 text-slate-400">{new Date(msg.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-white">{msg.name}</td>
                      <td className="p-3 text-slate-300">
                        {msg.email}
                        {msg.phone && <span className="block text-[10px] text-slate-500">{msg.phone}</span>}
                      </td>
                      <td className="p-3 text-slate-200">{msg.subject}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            msg.status === "unread"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse"
                              : msg.status === "replied"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedMessage(msg);
                            setAdminNotes(msg.admin_notes || "");
                            if (msg.status === "unread") {
                              handleUpdateMessage(msg.id, { status: "read" });
                            }
                          }}
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold px-3 py-1 rounded-lg text-xs"
                        >
                          View Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: COUPON CODES */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FiTag className="text-emerald-400" /> Coupon & Promo Code Management
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Create percentage discounts, flat amount vouchers, or trial extensions for promotional campaigns.
                </p>
              </div>
              <button
                onClick={() => {
                  setCouponError("");
                  setCouponModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
              >
                <FiPlusCircle size={16} /> Create New Coupon
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              {loadingCoupons ? (
                <div className="p-12 text-center text-slate-400 text-sm">Loading coupon codes...</div>
              ) : coupons.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  No coupon codes created yet. Click "Create New Coupon" to generate one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">Code</th>
                        <th className="p-4">Discount Type</th>
                        <th className="p-4">Value</th>
                        <th className="p-4">Usage Count</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {coupons.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/50 transition">
                          <td className="p-4 font-mono font-black text-emerald-400 text-sm">{c.code}</td>
                          <td className="p-4 capitalize">{c.discount_type.replace("_", " ")}</td>
                          <td className="p-4 font-bold text-white">
                            {c.discount_type === "percentage"
                              ? `${c.discount_value}% OFF`
                              : c.discount_type === "flat"
                              ? `₦${Number(c.discount_value).toLocaleString()} OFF`
                              : `${c.discount_value} Days Trial`}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-200">{c.times_used}</span>
                            <span className="text-slate-500"> / {c.max_uses ? c.max_uses : "∞"}</span>
                          </td>
                          <td className="p-4">
                            {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "Never"}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleCouponActive(c)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                                c.is_active
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-500 border border-slate-700"
                              }`}
                            >
                              {c.is_active ? "Active" : "Disabled"}
                            </button>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleDeleteCoupon(c)}
                              className="text-rose-400 hover:text-rose-300 hover:underline font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MANAGE SUBSCRIPTION MODAL */}
      {subModalTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FiCreditCard className="text-emerald-400" /> Manage Subscription
                </h3>
                <p className="text-xs text-slate-400">{subModalTarget.username || subModalTarget.email}</p>
              </div>
              <button onClick={() => setSubModalTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {subMsg && <p className="text-xs text-red-400 font-semibold">{subMsg}</p>}

            <form onSubmit={handleManageSubscriptionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">Action</label>
                <select
                  value={subAction}
                  onChange={(e) => setSubAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="grant">Grant / Upgrade Plan</option>
                  <option value="extend">Extend Current Plan (+ Days)</option>
                  <option value="cancel">Cancel Active Subscription</option>
                </select>
              </div>

              {subAction === "grant" && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">Select Tier Plan</label>
                  <select
                    value={subPlanId}
                    onChange={(e) => setSubPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Pro Tier (₦8,000 / month)</option>
                    <option value="6">Pro Yearly (₦90,000 / year)</option>
                    <option value="3">Enterprise Tier (₦15,000 / month)</option>
                    <option value="1">Free Plan (₦0)</option>
                  </select>
                </div>
              )}

              {subAction !== "cancel" && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">Duration (Days)</label>
                  <select
                    value={subDuration}
                    onChange={(e) => setSubDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="30">30 Days (1 Month)</option>
                    <option value="90">90 Days (3 Months)</option>
                    <option value="180">180 Days (6 Months)</option>
                    <option value="365">365 Days (1 Year)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className={`flex-1 font-bold py-2.5 rounded-xl text-xs ${
                    subAction === "cancel"
                      ? "bg-red-500 hover:bg-red-400 text-white"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  }`}
                >
                  {subAction === "cancel" ? "Confirm Cancellation" : "Apply Subscription"}
                </button>
                <button
                  type="button"
                  onClick={() => setSubModalTarget(null)}
                  className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPUTE SETTLEMENT MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-orange-400 font-bold">{selectedDispute.ticket_number}</span>
                <h3 className="text-lg font-bold text-white">{selectedDispute.subject}</h3>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <p><span className="text-slate-400">Reporter:</span> <strong className="text-white">{selectedDispute.reporter_name}</strong> ({selectedDispute.reporter_email})</p>
                <p><span className="text-slate-400">Category:</span> <span className="text-slate-200 capitalize">{selectedDispute.category}</span></p>
                <p className="pt-2 text-slate-300 leading-relaxed">"{selectedDispute.description}"</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Resolution / Settlement Notes:</label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter detailed investigation findings, action taken, or refund/settlement decision..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handleUpdateDispute(selectedDispute.id, { status: "resolved", resolution_notes: resolutionNotes })}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  ✓ Mark Resolved / Settle
                </button>
                <button
                  onClick={() => handleUpdateDispute(selectedDispute.id, { status: "in_review", resolution_notes: resolutionNotes })}
                  className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold py-2.5 rounded-xl text-xs"
                >
                  Mark In Review
                </button>
                <button
                  onClick={() => handleUpdateDispute(selectedDispute.id, { status: "closed", resolution_notes: resolutionNotes })}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT MESSAGE DETAILS MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{selectedMessage.subject}</h3>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <p><span className="text-slate-400">From:</span> <strong className="text-white">{selectedMessage.name}</strong> ({selectedMessage.email})</p>
                {selectedMessage.phone && <p><span className="text-slate-400">Phone:</span> <span className="text-emerald-400">{selectedMessage.phone}</span></p>}
                <p className="pt-2 text-slate-200 leading-relaxed font-sans">"{selectedMessage.message}"</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Admin Response Notes:</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record internal response notes or phone follow-up summary..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleUpdateMessage(selectedMessage.id, { status: "replied", admin_notes: adminNotes })}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  ✓ Mark Replied
                </button>
                <button
                  onClick={() => handleUpdateMessage(selectedMessage.id, { status: "archived", admin_notes: adminNotes })}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Reset Password for @{resetModalUser.username}</h3>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {passwordMsg && <p className="text-xs text-red-400 font-semibold">{passwordMsg}</p>}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password (min 6 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePasswordReset}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs"
              >
                Confirm Password Reset
              </button>
              <button
                onClick={() => setResetModalUser(null)}
                className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {couponModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiTag className="text-emerald-400" /> Create Coupon / Promo Code
              </h3>
              <button onClick={() => setCouponModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {couponError && <p className="text-xs text-rose-400 font-semibold">{couponError}</p>}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coupon Code (e.g. FARM2026)</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="PROMO50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Discount Type</label>
                <select
                  value={couponForm.discount_type}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="flat">Flat Amount Discount (₦)</option>
                  <option value="trial_extension">Trial Extension (Extra Free Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {couponForm.discount_type === "percentage"
                    ? "Percentage Off (e.g. 20 for 20%)"
                    : couponForm.discount_type === "flat"
                    ? "Discount Amount in ₦ (e.g. 2000)"
                    : "Extra Free Trial Days (e.g. 14)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={couponForm.discount_value}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                  placeholder="20"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Uses (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.max_uses}
                    onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={couponForm.valid_until}
                    onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="coupon_is_active"
                  checked={couponForm.is_active}
                  onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="coupon_is_active" className="text-slate-300 font-semibold cursor-pointer">
                  Enable Coupon Immediately
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                >
                  Create Coupon Code
                </button>
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminDashboard;
