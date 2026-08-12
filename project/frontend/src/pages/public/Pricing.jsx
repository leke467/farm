import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiZap, FiShield, FiStar, FiCreditCard, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import Navbar from "../../components/Navbar";

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("yearly"); // 'monthly' | 'yearly'

  const monthlyPlan = {
    id: "pro-monthly",
    name: "Pro Monthly",
    originalPrice: "₦10,000",
    price: "₦8,000",
    period: "/month",
    discountBadge: "₦2,000 OFF (20% Savings)",
    description: "Perfect for active commercial farms needing full operational tracking.",
    features: [
      "Unlimited Farm Locations",
      "Unlimited Animal & Flock Tracking",
      "Unlimited Crop Field Management",
      "Full Sales & Profitability Reports",
      "AI Agronomist Agent Insights",
      "Feed Formulation Calculator",
      "Instant Monnify Card & Transfer Payment",
      "24/7 Priority Support",
    ],
    buttonText: "Subscribe for ₦8,000 / mo",
    isPopular: false,
  };

  const yearlyPlan = {
    id: "pro-yearly",
    name: "Pro Yearly",
    originalPrice: "₦120,000",
    price: "₦90,000",
    period: "/year",
    equivalentMonthly: "₦7,500 / month",
    discountBadge: "SAVE ₦30,000 (25% OFF)",
    description: "Our best value plan! Pay for 9 months and get 3 months completely FREE.",
    features: [
      "Best Value — Equals only ₦7,500 / month!",
      "Save ₦30,000 Every Year",
      "2 Months Free Included",
      "Unlimited Farm Locations",
      "Unlimited Animal & Flock Tracking",
      "Unlimited Crop Field Management",
      "Full Sales & Profitability Reports",
      "AI Agronomist Agent Insights",
      "VIP Dedicated Support",
    ],
    buttonText: "Claim Yearly Discount (₦90,000 / yr)",
    isPopular: true,
  };

  const trialPlan = {
    id: "free-trial",
    name: "14-Day Free Trial",
    originalPrice: "",
    price: "₦0",
    period: "/14 days",
    discountBadge: "100% Free",
    description: "Experience all features risk-free with zero commitment.",
    features: [
      "Full Access for 14 Days",
      "Up to 2 Farm Locations",
      "Up to 50 Animals / Batches",
      "Up to 20 Crops",
      "Basic Analytics",
      "No Credit Card Required",
    ],
    buttonText: "Start 14-Day Free Trial",
    isPopular: false,
  };

  const faqs = [
    {
      q: "How does the discount pricing work?",
      a: "Our standard monthly rate is ₦10,000/mo, but we offer an instant ₦2,000 discount so you pay only ₦8,000/mo. For the yearly subscription, standard price is ₦120,000/yr, discounted by ₦30,000 down to ₦90,000/yr (saving you 25%!).",
    },
    {
      q: "How do I pay with Monnify?",
      a: "We integrate directly with Monnify (by Moniepoint). You can pay via instant Bank Transfer, Debit/Credit Cards, or USSD directly inside your dashboard. Transactions are verified in seconds.",
    },
    {
      q: "Can I upgrade from Monthly to Yearly later?",
      a: "Yes! You can switch to the Yearly plan at any time from your Subscription dashboard to lock in the ₦30,000 annual discount.",
    },
    {
      q: "Is there a money-back guarantee?",
      a: "Absolutely! We offer a 14-day hassle-free money-back guarantee if you are not completely satisfied with Livesteads.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar dark={true} />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <FiZap className="text-sm" /> Special Discount Pricing Active
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          Simple, Transparent Plans Built for Your Farm’s Growth
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Manage crops, livestock, financial COGS, sales receipts, and AI insights with instant Monnify payments.
        </p>

        {/* Monthly / Yearly Billing Toggle */}
        <div className="mt-10 inline-flex items-center bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              billingCycle === "monthly"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Yearly Billing
            <span className="bg-slate-950/30 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-md">
              SAVE 25%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Free Trial Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition duration-300">
          <div>
            <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg mb-4">
              {trialPlan.discountBadge}
            </span>
            <h3 className="text-2xl font-bold text-white mb-2">{trialPlan.name}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{trialPlan.description}</p>
            <div className="mb-6">
              <span className="text-4xl font-black text-white">{trialPlan.price}</span>
              <span className="text-slate-400 text-sm">{trialPlan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {trialPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                  <FiCheck className="text-emerald-400 flex-shrink-0 text-base" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => navigate("/register")}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition border border-slate-700"
          >
            {trialPlan.buttonText}
          </button>
        </div>

        {/* Pro Monthly Card */}
        <div
          className={`bg-slate-900/50 border rounded-3xl p-8 flex flex-col justify-between transition duration-300 relative ${
            billingCycle === "monthly"
              ? "border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-2 ring-emerald-500/30"
              : "border-slate-800/80 hover:border-slate-700"
          }`}
        >
          {billingCycle === "monthly" && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
              Selected Plan
            </div>
          )}
          <div>
            <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg mb-4">
              {monthlyPlan.discountBadge}
            </span>
            <h3 className="text-2xl font-bold text-white mb-2">{monthlyPlan.name}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{monthlyPlan.description}</p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 line-through text-lg font-bold">{monthlyPlan.originalPrice}</span>
                <span className="text-4xl font-black text-white">{monthlyPlan.price}</span>
                <span className="text-slate-400 text-sm">{monthlyPlan.period}</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold mt-1">Discounted from ₦10,000 / month</p>
            </div>

            <ul className="space-y-3 mb-8">
              {monthlyPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                  <FiCheck className="text-emerald-400 flex-shrink-0 text-base" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => navigate("/login?plan=pro-monthly")}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{monthlyPlan.buttonText}</span>
            <FiArrowRight />
          </button>
        </div>

        {/* Pro Yearly Card (MOST POPULAR / BEST VALUE) */}
        <div
          className={`bg-slate-900/90 border rounded-3xl p-8 flex flex-col justify-between transition duration-300 relative ${
            billingCycle === "yearly"
              ? "border-emerald-400 shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-400/40"
              : "border-emerald-500/40 hover:border-emerald-500"
          }`}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
            <FiStar className="fill-slate-950" /> Most Popular (Best Value)
          </div>

          <div>
            <span className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black rounded-lg mb-4 mt-2">
              {yearlyPlan.discountBadge}
            </span>
            <h3 className="text-2xl font-bold text-white mb-2">{yearlyPlan.name}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{yearlyPlan.description}</p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 line-through text-lg font-bold">{yearlyPlan.originalPrice}</span>
                <span className="text-4xl font-black text-emerald-400">{yearlyPlan.price}</span>
                <span className="text-slate-400 text-sm">{yearlyPlan.period}</span>
              </div>
              <p className="text-xs font-bold text-emerald-300 mt-1">Equals {yearlyPlan.equivalentMonthly}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {yearlyPlan.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xs text-slate-200">
                  <FiCheckCircle className="text-emerald-400 flex-shrink-0 text-base" />
                  <span className={idx === 0 ? "font-bold text-emerald-300" : ""}>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => navigate("/login?plan=pro-yearly")}
            className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{yearlyPlan.buttonText}</span>
            <FiArrowRight />
          </button>
        </div>
      </div>

      {/* Monnify Trust Bar */}
      <div className="max-w-4xl mx-auto px-6 py-8 mb-16 bg-slate-900/60 border border-slate-800 rounded-3xl text-center flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
          <FiCreditCard className="text-emerald-400 text-2xl" />
          <span>Monnify Instant Bank Transfer & Cards</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
          <FiShield className="text-emerald-400 text-2xl" />
          <span>14-Day Money-Back Guarantee</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-sm font-semibold">
          <FiZap className="text-emerald-400 text-2xl" />
          <span>Instant Automated Activation</span>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center text-white mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-2">{faq.q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
