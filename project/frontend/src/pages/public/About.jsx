import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiZap,
  FiTrendingUp,
  FiGlobe,
  FiAward,
  FiUsers,
  FiArrowRight,
  FiHeart,
  FiShield,
} from "react-icons/fi";
import Navbar from "../../components/Navbar";

const About = () => {
  const stats = [
    { value: "250,000+", label: "Livestock & Poultry Tracked" },
    { value: "50,000+", label: "Hectares of Crops Managed" },
    { value: "₦1.8 Billion", label: "Farm Revenues Logged" },
    { value: "99.8%", label: "System Uptime Reliability" },
  ];

  const pillars = [
    {
      title: "Data-Driven Profitability",
      desc: "Every feed bag, vaccine dose, and worker hour is tied directly to unit economics so farmers know their true Cost of Goods Sold (COGS).",
      icon: FiTrendingUp,
    },
    {
      title: "AI Agronomist & Feed Optimization",
      desc: "Our linear programming formulators and predictive AI advise farmers on optimal feed mixes and disease mitigations before yields decline.",
      icon: FiZap,
    },
    {
      title: "Offline-First & Mobile Friendly",
      desc: "Designed to work seamlessly on remote fields with low internet connectivity, syncing automatically when connection is restored.",
      icon: FiGlobe,
    },
    {
      title: "Bank-Grade Security",
      desc: "Role-based menu permissions, audit histories, and encrypted cloud backups keep your agricultural financial records safe.",
      icon: FiShield,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar dark={true} />

      {/* Hero */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <FiHeart /> Built for Agricultural Innovators
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Empowering Modern Farmers with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Intelligent Software</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Livesteads Farm OS is on a mission to digitize agricultural operations across Africa and worldwide—combining livestock tracking, crop analytics, smart feed formulation, and financial intelligence.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
          {stats.map((st, i) => (
            <div key={i} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-1">{st.value}</div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-slate-900/50 border-y border-slate-800 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest block mb-2">Our Story</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Bridging the Gap Between Traditional Farming & Cutting-Edge Technology
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
              Livesteads was born out of first-hand experience with the challenges facing commercial farm managers: missing inventory records, unoptimized feed spending, unrecorded harvest sales, and lack of real-time profitability visibility.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We built Livesteads to give every farmer—whether running 50 acres of maize or 10,000 broiler chickens—the exact software tools needed to maximize yield, streamline labor, and build sustainable agribusinesses.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-800 flex items-center justify-center p-8 text-center">
              <div>
                <FiAward size={56} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Trusted Agricultural Platform</h3>
                <p className="text-xs text-slate-400">Serving commercial mixed farms, poultry integration complexes, and dairy estates.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Why Farmers Choose Livesteads</h2>
          <p className="text-slate-400 text-base">Built around the 4 core pillars of high-yield farm operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-slate-900 border-t border-slate-800 py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white mb-4">Transform Your Farm Today</h2>
          <p className="text-slate-300 mb-8">Test our full demo environment or start your 14-day free trial in under 2 minutes.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition flex items-center gap-2"
            >
              <span>Get Started Free</span>
              <FiArrowRight />
            </Link>
            <Link
              to="/pricing"
              className="border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-3 rounded-xl transition"
            >
              Explore Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
