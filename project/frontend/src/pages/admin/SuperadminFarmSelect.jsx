import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiCompass,
  FiSearch,
  FiFilter,
  FiUser,
  FiMail,
  FiMapPin,
  FiLayers,
  FiArrowRight,
  FiShield,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiCpu,
  FiTrendingUp,
} from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { useToast } from "../../context/ToastContext";

const toFarmSlug = (name) => {
  if (!name) return "myfarm";
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
};

const SuperadminFarmSelect = () => {
  const { user } = useUser();
  const { setActiveFarm, setFarms } = useFarmData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [farms, setLocalFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSuperadminFarms();
      const farmList = Array.isArray(data) ? data : data?.results || [];
      setLocalFarms(farmList);
      if (setFarms) setFarms(farmList);
    } catch (err) {
      console.error("Error loading superadmin farms:", err);
      toast.error("Failed to load platform farms.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFarm = (farm) => {
    if (!farm) return;
    if (setActiveFarm) setActiveFarm(farm);
    localStorage.setItem("activeFarmId", farm.id);
    const slug = toFarmSlug(farm.name);
    toast.success(`Entering ${farm.name} workspace...`);
    navigate(`/${slug}/dashboard`);
  };

  const filteredFarms = farms.filter((f) => {
    const query = search.toLowerCase().trim();
    const nameMatch = f.name?.toLowerCase().includes(query);
    const ownerNameMatch = f.owner_name?.toLowerCase().includes(query);
    const ownerEmailMatch = f.owner_email?.toLowerCase().includes(query);
    const locationMatch = f.location?.toLowerCase().includes(query);

    const matchesSearch = !query || nameMatch || ownerNameMatch || ownerEmailMatch || locationMatch;

    const matchesType =
      typeFilter === "all" || (f.farm_type || f.type || "").toLowerCase() === typeFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && (f.subscription_status === "active" || f.subscription_status === "trial")) ||
      (statusFilter === "expired" && f.subscription_status === "expired");

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      {/* Background Decor */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* Header Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-black text-2xl">
              <FiCompass size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <FiShield size={10} /> Superadmin Portal
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {user?.username || user?.email}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Select Farm Workspace
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/dashboard"
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <FiShield size={16} className="text-purple-400" /> Platform Admin Panel
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by farm name, owner, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Farm Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="all">All Farm Types</option>
              <option value="livestock">Livestock</option>
              <option value="poultry">Poultry</option>
              <option value="crop">Crop Farming</option>
              <option value="fish">Fish Farming / Aquaculture</option>
              <option value="mixed">Mixed Farming</option>
            </select>
          </div>

          {/* Subscription Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active / Trial Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
        </div>

        {/* Total Count Header */}
        <div className="flex justify-between items-center px-2">
          <p className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white font-bold">{filteredFarms.length}</strong> of{" "}
            <strong className="text-white font-bold">{farms.length}</strong> platform farms
          </p>
        </div>

        {/* Farms Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <FiLayers size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">No Farms Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No farms matched your search criteria. Try adjusting your search term or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarms.map((farm) => {
              const status = farm.subscription_status || "active";
              const isExpired = status === "expired";
              const isTrial = status === "trial";

              return (
                <div
                  key={farm.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Accent Top Border */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:opacity-100 transition" />

                  <div className="space-y-4">
                    {/* Top Row: Name & Badges */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {farm.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          slug: /{toFarmSlug(farm.name)}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                          isExpired
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : isTrial
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {farm.subscription_plan_name || (isTrial ? "Free Trial" : "Active")}
                      </span>
                    </div>

                    {/* Owner & Location Info */}
                    <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-2 text-slate-300">
                        <FiUser size={14} className="text-emerald-400 shrink-0" />
                        <span className="font-semibold">{farm.owner_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <FiMail size={14} className="text-slate-500 shrink-0" />
                        <span className="truncate">{farm.owner_email}</span>
                      </div>
                      {farm.location && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <FiMapPin size={14} className="text-slate-500 shrink-0" />
                          <span>{farm.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Operational Metrics Pills */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">Animals & Flocks</span>
                        <strong className="text-white font-bold text-sm">{farm.animals_count || 0}</strong>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">Crop Batches</span>
                        <strong className="text-white font-bold text-sm">{farm.crops_count || 0}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA Button */}
                  <div className="pt-6 mt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => handleSelectFarm(farm)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer group-hover:scale-[1.02]"
                    >
                      <span>Enter Farm Workspace</span>
                      <FiArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperadminFarmSelect;
