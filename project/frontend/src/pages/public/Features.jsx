import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiBarChart2,
  FiCalendar,
  FiCloud,
  FiShoppingBag,
  FiPieChart,
  FiSliders,
  FiCheckCircle,
  FiShield,
  FiZap,
  FiArrowRight,
  FiTrendingUp,
  FiBox,
} from "react-icons/fi";
import Navbar from "../../components/Navbar";

const Features = () => {
  const featuresList = [
    {
      id: "livestock",
      title: "Livestock & Batch Management",
      icon: FiUsers,
      color: "from-emerald-500 to-teal-600",
      description: "Complete lifecycle tracking for dairy cattle, poultry broilers, layer flocks, swine herds, and fish ponds.",
      points: [
        "Track individual animal weight, breed genetics, and health scores",
        "Monitor daily milk yields (liters/day) and egg collection crates",
        "Breeding calendar with expected delivery dates and AI sire logs",
        "Batch mortality tracking and unit cost allocation",
      ],
    },
    {
      id: "crops",
      title: "Crop Field & Acreage Management",
      icon: FiCloud,
      color: "from-green-500 to-emerald-700",
      description: "Manage multiple crop fields, greenhouse plots, planting schedules, and harvest yields with high precision.",
      points: [
        "Field-by-field acreage and growth stage tracking (planting to harvest)",
        "Harvest log recording with tons/hectare yield efficiency metrics",
        "AI NPK fertilizer dose recommendations based on crop variety",
        "Weather impact tracking (heatwave, drought) with recovery action plans",
      ],
    },
    {
      id: "feed",
      title: "Smart Feed Formulator",
      icon: FiSliders,
      color: "from-amber-500 to-yellow-600",
      description: "Linear programming feed formulation tool to mix high-protein feeds while minimizing cost per bag.",
      points: [
        "Select crude protein (CP), energy (ME), and crude fiber target percentages",
        "Automated cost-minimization algorithm across available raw grains",
        "Feed distribution logs per animal pen or poultry house",
        "Feed Conversion Ratio (FCR) analytics for rapid growth optimization",
      ],
    },
    {
      id: "sales",
      title: "Sales & Income Ledger",
      icon: FiShoppingBag,
      color: "from-blue-500 to-indigo-600",
      description: "Comprehensive revenue tracking with produce receipts, buyer database, and unit market valuation.",
      points: [
        "Log livestock sales, milk crates, grain harvests, and tractor rentals",
        "Automatic stock deduction upon sale record creation",
        "Instant transaction receipt breakdown per buyer",
        "Average order value (AOV) and revenue trend analytics",
      ],
    },
    {
      id: "financials",
      title: "Financial Reports & Unit Economics",
      icon: FiPieChart,
      color: "from-purple-500 to-indigo-700",
      description: "Real-time Profit & Loss statements, COGS calculations, and flock/batch lifetime profitability.",
      points: [
        "Net Gain vs Loss breakdown across selectable time ranges",
        "Flock lifetime profitability (Direct Sales minus Feed & Medical Costs)",
        "Operational expense categorizations (Labor, Fuel, Vet, Feed)",
        "Commercial agricultural loan and debt management tracking",
      ],
    },
    {
      id: "inventory",
      title: "Inventory & Stocktake Audits",
      icon: FiBox,
      color: "from-cyan-500 to-blue-600",
      description: "Multi-store inventory management with physical stocktake reconciliation audits and shrinkage logs.",
      points: [
        "Low-stock threshold alerts for feed bags, vaccines, and fertilizers",
        "Physical inventory stocktake audits with variance calculation",
        "FIFO / LIFO cost tracking and supplier pricing histories",
        "AI Demand forecasting for optimal monthly reorder points",
      ],
    },
    {
      id: "tasks",
      title: "Task Scheduler & Delegation",
      icon: FiCalendar,
      color: "from-orange-500 to-amber-600",
      description: "Organize daily farm duties, assign workers, set priority levels, and track task completion.",
      points: [
        "Schedule morning milking, vaccination checks, and drip irrigation",
        "Assign tasks to specific farm helpers or store managers",
        "Filter pending vs completed work orders in real-time",
        "Overdue task notification alerts for critical operations",
      ],
    },
    {
      id: "analytics",
      title: "AI Agronomist & Decision Analytics",
      icon: FiTrendingUp,
      color: "from-rose-500 to-pink-600",
      description: "Predictive analytics powered by machine learning to optimize yields and prevent operational risks.",
      points: [
        "Demand prediction trends across 12-month historical usage",
        "Supplier performance index (On-time delivery % and quality grade)",
        "Animal health score risk alerts and weight variance concerns",
        "Integrated AI Assistant for instant agronomist queries",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar dark={true} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <FiZap /> Complete Agricultural Operating System
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Powerful Tools Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">High-Yield Modern Farming</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          From multi-flock livestock tracking to AI agronomy and profitability reports, explore everything Livesteads offers to optimize your farm.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition transform active:scale-95 flex items-center gap-2"
          >
            <span>Start Free Trial</span>
            <FiArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold px-8 py-3.5 rounded-xl transition"
          >
            ⚡ 1-Click Demo Login
          </Link>
        </div>
      </section>

      {/* Grid of Features */}
      <section className="max-w-7xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuresList.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
                    {feat.description}
                  </p>
                  <ul className="space-y-2.5">
                    {feat.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-400">
                        <FiCheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={16} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-teal-900/40 border-t border-slate-800 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Supercharge Your Farm’s Yield?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8">
            Join hundreds of progressive commercial farmers using Livesteads Farm OS today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              Get Started Now
            </Link>
            <Link
              to="/pricing"
              className="border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-3.5 rounded-xl transition"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
