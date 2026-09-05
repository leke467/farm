import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiShield, FiZap, FiStar, FiCreditCard, FiClock, FiCheck, FiArrowRight } from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { useToast } from "../../context/ToastContext";

const DEFAULT_PLANS = [
  {
    id: 2,
    name: "Pro Monthly",
    slug: "pro-monthly",
    price: 8000,
    original_price: 10000,
    billing_cycle: "monthly",
    duration_days: 30,
    discount_badge: "₦2,000 OFF (20% OFF)",
    features: [
      "Unlimited Farm Locations",
      "Unlimited Animal & Flock Tracking",
      "Unlimited Crop Management",
      "Full Sales & Profit Analytics",
      "AI Agronomist Agent Insights",
      "Priority Customer Support",
    ],
    is_active: true,
    is_popular: false,
  },
  {
    id: 3,
    name: "Pro Yearly",
    slug: "pro-yearly",
    price: 90000,
    original_price: 120000,
    billing_cycle: "yearly",
    duration_days: 365,
    discount_badge: "SAVE ₦30,000 (25% OFF)",
    features: [
      "Best Value — Equals ₦7,500 / month!",
      "2 Months Absolutely FREE",
      "Unlimited Farm Locations",
      "Unlimited Animal & Flock Tracking",
      "Unlimited Crop Management",
      "Full Sales & Profit Analytics",
      "AI Agronomist Agent Insights",
      "VIP Priority 24/7 Support",
    ],
    is_active: true,
    is_popular: true,
  },
];

const Subscription = () => {
  const { user } = useUser();
  const { activeFarm } = useFarmData();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [billingCycle, setBillingCycle] = useState("yearly"); // 'monthly' | 'yearly'

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    checkPaymentVerification();
  }, [location, activeFarm?.id]);

  const checkPaymentVerification = async () => {
    const params = new URLSearchParams(location.search);
    const reference =
      params.get("reference") ||
      params.get("paymentReference") ||
      params.get("paymentRef") ||
      params.get("transactionReference");

    if (reference) {
      setSuccessMsg(`Verifying Monnify payment: ${reference}...`);
      try {
        await apiService.verifySubscriptionPayment(reference);
        toast.success("Subscription activated successfully!");
        setSuccessMsg("Subscription activated successfully!");
        fetchData();
        navigate(location.pathname, { replace: true });
        return;
      } catch (err) {
        console.warn("Direct reference verification error:", err);
      }
    }

    // Auto-verify latest initiated payment if user returns from Monnify portal
    try {
      const verified = await apiService.verifyLatestSubscriptionPayment();
      if (verified && verified.status === "paid") {
        toast.success("Subscription activated successfully!");
        setSuccessMsg("Subscription activated successfully!");
        fetchData();
      }
    } catch (e) {
      // Ignore if no pending payment
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subData, plansData] = await Promise.all([
        apiService.getMySubscription(activeFarm?.id).catch(() => null),
        apiService.getSubscriptionPlans().catch(() => []),
      ]);

      if (subData) setSubscription(subData);
      const rawPlans = Array.isArray(plansData) ? plansData : plansData?.results || [];
      if (rawPlans.length > 0) {
        setPlans(rawPlans);
      } else {
        setPlans(DEFAULT_PLANS);
      }
    } catch (err) {
      console.error("Error fetching subscription data:", err);
      setError(err._error || "Failed to load subscription information.");
      setPlans(DEFAULT_PLANS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeMonnify = async (plan) => {
    setActionLoading(true);
    setError(null);
    toast.info("Connecting to Monnify payment gateway...");
    try {
      const idempotencyKey = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const planId = plan.id || (plan.slug === "pro-yearly" ? 3 : 2);
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const response = await apiService.subscribe(planId, idempotencyKey, redirectUrl);

      if (response && response.checkout_url) {
        toast.success("Redirecting to Monnify checkout...");
        window.location.href = response.checkout_url;
      } else if (response && response.payment_reference) {
        toast.info("Verifying payment reference...");
        await apiService.verifySubscriptionPayment(response.payment_reference);
        toast.success("Subscription processed!");
        fetchData();
      } else {
        setError(response?._error || response?.detail || "Failed to initialize Monnify checkout. Please try again.");
      }
    } catch (err) {
      console.error("Monnify subscription error:", err);
      setError(err._error || err.message || "An error occurred during subscription.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!window.confirm("Are you sure you want to cancel your auto-renewal?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await apiService.cancelSubscription();
      toast.success("Auto-renewal cancelled successfully.");
      setSuccessMsg("Auto-renewal cancelled successfully.");
      fetchData();
    } catch (err) {
      setError(err._error || "Failed to cancel auto-renewal.");
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusBadge = (status) => {
    const s = String(status || "trial").toLowerCase();
    if (s === "active") {
      return (
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-xs rounded-full uppercase tracking-wider">
          Active Subscription
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold text-xs rounded-full uppercase tracking-wider">
          Subscription Cancelled
        </span>
      );
    }
    if (s === "expired") {
      return (
        <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 font-extrabold text-xs rounded-full uppercase tracking-wider">
          Subscription Expired
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 font-extrabold text-xs rounded-full uppercase tracking-wider">
        Free Trial
      </span>
    );
  };

  const hasUsedTrial = Boolean(subscription);

  const filteredPlans = plans.filter((p) => {
    // Completely remove Free Trial card if user has already used it
    if (p.slug === "free-trial" || Number(p.price) === 0) {
      return !hasUsedTrial;
    }
    if (billingCycle === "yearly") return p.billing_cycle === "yearly" || p.slug.includes("yearly");
    return p.billing_cycle === "monthly" || p.slug.includes("monthly");
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Farm Subscription & Billing</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your active subscription plan, switch billing cycles, or complete payments via Monnify.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <FiCheckCircle className="text-emerald-600 text-lg flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Current Subscription Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight">
                {subscription?.plan?.name || subscription?.planName || "Free Trial Plan"}
              </h2>
              {getStatusBadge(subscription?.status)}
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {subscription?.status === "active"
                ? "Your farm operational features are fully active."
                : subscription?.status === "cancelled"
                ? "Your subscription auto-renewal is turned off. Access remains active until your plan end date."
                : subscription?.status === "expired"
                ? "Your subscription has expired. Upgrade below to restore full feature access."
                : "You are currently enjoying your free trial."}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-emerald-400 text-xs font-bold">
            <FiCreditCard size={16} /> Monnify Direct Payments Connected
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-slate-400 text-xs">Plan Price</p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              {subscription?.plan?.price
                ? `₦${Number(subscription.plan.price).toLocaleString()} / ${subscription.plan.billing_cycle === "yearly" ? "yr" : "mo"}`
                : "Free Trial (₦0)"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Access Valid Until</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : "14 Days from Sign up"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Days Remaining</p>
            <p className="text-lg font-black text-amber-400 mt-0.5 flex items-center gap-1.5">
              <FiClock size={16} />
              <span>{subscription?.days_remaining ?? calculateDaysRemaining(subscription?.end_date)} Days</span>
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Auto-Renewal</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {subscription?.is_auto_renew && subscription?.status === "active" ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        {(subscription?.is_auto_renew || subscription?.autoRenew) && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={handleCancelAutoRenew}
              disabled={actionLoading}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition"
            >
              {actionLoading ? "Processing..." : "Cancel Auto-Renew"}
            </button>
          </div>
        )}
      </div>

      {/* Available Plans & Upgrade Options */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upgrade Subscription</h2>
            <p className="text-slate-500 text-xs">Select a discounted plan below to pay instantly via Monnify</p>
          </div>

          {/* Monthly / Yearly Toggle Switch */}
          <div className="inline-flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto justify-center">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all text-center justify-center ${
                billingCycle === "monthly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                billingCycle === "yearly" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Yearly Billing</span>
              <span className="bg-emerald-800/60 text-white text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold">SAVE 25%</span>
            </button>
          </div>
        </div>

        {/* Plans List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPlans.map((plan) => {
            const isYearly = plan.billing_cycle === "yearly" || plan.slug.includes("yearly");
            const isCurrent = subscription?.plan?.id === plan.id || subscription?.plan?.slug === plan.slug;
            const originalPrice = plan.original_price ? Number(plan.original_price) : isYearly ? 120000 : 10000;
            const currentPrice = Number(plan.price || 0);

            return (
              <div
                key={plan.id || plan.slug}
                className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm flex flex-col justify-between transition-all duration-300 relative ${
                  plan.is_popular
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <FiStar className="fill-white" /> Most Popular (Save ₦30,000)
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                    {plan.discount_badge && (
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-lg">
                        {plan.discount_badge}
                      </span>
                    )}
                  </div>

                  <div className="my-4">
                    <div className="flex items-baseline gap-2">
                      {originalPrice > currentPrice && (
                        <span className="text-slate-400 line-through text-base font-bold">
                          ₦{originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-3xl font-black text-emerald-700">
                        ₦{currentPrice.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-xs font-semibold">
                        / {isYearly ? "year" : "month"}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-xs text-emerald-600 font-bold mt-1">
                        Equals only ₦7,500 / month (Save ₦30,000!)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {(plan.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                        <FiCheck className="text-emerald-600 flex-shrink-0 text-base" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl cursor-default border border-slate-200"
                  >
                    Current Active Plan
                  </button>
                ) : plan.price === 0 || plan.slug === "free-trial" ? (
                  <button
                    disabled
                    className="w-full py-3.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl cursor-not-allowed border border-slate-200"
                  >
                    Free Trial Already Used
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribeMonnify(plan)}
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FiCreditCard className="text-base" />
                    <span>Pay ₦{currentPrice.toLocaleString()} with Monnify</span>
                    <FiArrowRight />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monnify Security Guarantee Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <FiShield size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Secure Payments via Monnify (Moniepoint)</h4>
            <p className="text-xs text-slate-500">Supports instant Bank Transfer, Debit Cards, USSD, and Mobile Money.</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          256-bit Bank Grade Encrypted
        </span>
      </div>
    </div>
  );
};

export default Subscription;
