import { useState, useEffect } from "react";
import { FiBarChart2, FiPieChart, FiTrendingUp, FiTarget, FiDollarSign, FiPlusCircle, FiCalendar, FiArrowUpRight, FiArrowDownRight, FiEye, FiInfo, FiHelpCircle, FiSearch, FiExternalLink, FiX } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { formatFarmCurrency, getFarmCurrencySymbol } from "../../utils/formatters";
import apiService from "../../services/api";
import RecordSaleModal from "../../components/forms/RecordSaleModal";
import SaleDetailModal from "../../components/sales/SaleDetailModal";
import {
  LineChart,
  BarChart,
  PieChart,
  DoughnutChart,
  StatCard,
  ChartContainer,
} from "../../components/charts/ChartComponents";
import AIChartInsight from "../../components/AIChartInsight";

function Reports() {
  const { activeFarm } = useFarmData();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [animalsData, setAnimalsData] = useState(null);
  const [cropsData, setCropsData] = useState(null);
  const [expensesData, setExpensesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [rawAnimals, setRawAnimals] = useState([]);
  const [rawFeeds, setRawFeeds] = useState([]);
  const [rawMedicals, setRawMedicals] = useState([]);
  const [rawInventoryItems, setRawInventoryItems] = useState([]);
  const [rawRevenues, setRawRevenues] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [error, setError] = useState("");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [salesSearchQuery, setSalesSearchQuery] = useState("");
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Time Range Filter
  const [timeRange, setTimeRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    if (activeFarm?.id) {
      fetchAnalyticsData();
    }
  }, [activeFarm?.id]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const farmParam = activeFarm?.id ? `?farm=${activeFarm.id}` : "";
      const [dashboard, animals, crops, expenses, inventory, revenuesList, expensesList, animList, feedList, medList, invItemsList] =
        await Promise.all([
          apiService.get(`/reports/analytics/dashboard/${farmParam}`).catch(() => null),
          apiService.get(`/reports/analytics/animals/${farmParam}`).catch(() => null),
          apiService.get(`/reports/analytics/crops/${farmParam}`).catch(() => null),
          apiService.get(`/reports/analytics/expenses/${farmParam}`).catch(() => null),
          apiService.get(`/reports/analytics/inventory/${farmParam}`).catch(() => null),
          apiService.get(`/expenses/revenues/${farmParam}`).catch(() => []),
          apiService.get(`/expenses/${farmParam}`).catch(() => []),
          apiService.getAnimals({ farm: activeFarm?.id }).catch(() => []),
          apiService.get(`/animals/feed-records/${farmParam}`).catch(() => []),
          apiService.get(`/animals/medical/${farmParam}`).catch(() => []),
          apiService.getInventory({ farm: activeFarm?.id }).catch(() => []),
        ]);

      setDashboardData(dashboard);
      setAnimalsData(animals);
      setCropsData(crops);
      setExpensesData(expenses);
      setInventoryData(inventory);

      const revs = Array.isArray(revenuesList) ? revenuesList : revenuesList?.results || [];
      const exps = Array.isArray(expensesList) ? expensesList : expensesList?.results || [];
      const anims = Array.isArray(animList) ? animList : animList?.results || [];
      const feeds = Array.isArray(feedList) ? feedList : feedList?.results || [];
      const meds = Array.isArray(medList) ? medList : medList?.results || [];
      const invs = Array.isArray(invItemsList) ? invItemsList : invItemsList?.results || [];

      setRawRevenues(revs);
      setRawExpenses(exps);
      setRawAnimals(anims);
      setRawFeeds(feeds);
      setRawMedicals(meds);
      setRawInventoryItems(invs);
    } catch (err) {
      setError("Failed to load analytics data. Please try again.");
      console.error("Analytics error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByRange = (items, dateKey = "date") => {
    if (!items || !Array.isArray(items)) return [];
    if (timeRange === "all") return items;

    const now = new Date();
    return items.filter((item) => {
      const dateVal = item[dateKey] || item.created_at;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      if (timeRange === "this_month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeRange === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      }
      if (timeRange === "this_quarter") {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const itemQuarter = Math.floor(d.getMonth() / 3);
        return itemQuarter === currentQuarter && d.getFullYear() === now.getFullYear();
      }
      if (timeRange === "this_year") {
        return d.getFullYear() === now.getFullYear();
      }
      if (timeRange === "custom") {
        if (customStartDate && d < new Date(customStartDate)) return false;
        if (customEndDate && d > new Date(customEndDate + "T23:59:59")) return false;
        return true;
      }
      return true;
    });
  };

  const dateFilteredRevenues = filterByRange(rawRevenues, "date");
  const filteredRevenues = dateFilteredRevenues.filter((r) => {
    if (!salesSearchQuery) return true;
    const q = salesSearchQuery.toLowerCase();
    return (
      (r.item_sold && r.item_sold.toLowerCase().includes(q)) ||
      (r.buyer && r.buyer.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  });
  const filteredExpenses = filterByRange(rawExpenses, "date");

  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + Number(r.total_amount || r.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netGainLoss = totalRevenue - totalExpenses;
  const isGain = netGainLoss >= 0;
  const profitMargin = totalRevenue > 0 ? ((netGainLoss / totalRevenue) * 100).toFixed(1) : 0;

  // Batch & Flock Unit Economics & Profitability (COGS) Calculation
  const allAnimals = Array.isArray(rawAnimals) ? rawAnimals : rawAnimals?.results || [];
  const allFeeds = Array.isArray(rawFeeds) ? rawFeeds : rawFeeds?.results || [];
  const allMedicals = Array.isArray(rawMedicals) ? rawMedicals : rawMedicals?.results || [];

  const batchProfitability = allAnimals.map((anim) => {
    const getExpenseAnimalId = (e) => {
      const val = e.linked_animal ?? e.linked_animal_id ?? e.linkedAnimal ?? e.linkedAnimalId ?? e.animal_id ?? e.animal;
      if (!val) return null;
      if (typeof val === "object") return val.id;
      return val;
    };

    const purchaseExpense = filteredExpenses.find(
      (e) =>
        (e.category === "Livestock Purchase" || e.category === "livestock_purchase" || (e.description && e.description.toLowerCase().includes("purchase"))) &&
        (String(getExpenseAnimalId(e)) === String(anim.id) ||
          (e.description && anim.name && e.description.toLowerCase().includes(anim.name.toLowerCase())))
    );

    const acqCost = Number(
      anim.purchase_cost ??
      anim.purchasePrice ??
      purchaseExpense?.amount ??
      0
    );

    const animalFeeds = allFeeds.filter(
      (f) =>
        String(f.animal) === String(anim.id) ||
        String(f.animal_id) === String(anim.id) ||
        (f.group_name && f.group_name.toLowerCase() === anim.name.toLowerCase())
    );
    const totalFeedCost = animalFeeds.reduce((sum, f) => {
      let cost = Number(f.cost || 0);
      if (cost <= 0) {
        // Look up cost_per_unit from inventory items for this feed item
        const matchingInvItem = (rawInventoryItems || []).find((inv) =>
          (f.feed_type && inv.name?.toLowerCase() === f.feed_type.toLowerCase()) ||
          inv.name?.toLowerCase().includes(f.feed_type?.toLowerCase() || "") ||
          inv.category === "feed"
        );
        if (matchingInvItem && Number(matchingInvItem.cost_per_unit || 0) > 0) {
          cost = Number(f.amount || 0) * Number(matchingInvItem.cost_per_unit);
        }
      }
      return sum + cost;
    }, 0);

    const isMedicalCategory = (cat) => {
      if (!cat) return false;
      const c = String(cat).toLowerCase().trim();
      return (
        c === "medical" ||
        c === "medical / vet" ||
        c === "vet" ||
        c === "veterinary" ||
        c === "healthcare" ||
        c === "medicine" ||
        c.includes("medical") ||
        c.includes("vet")
      );
    };

    const dedicatedMedicals = allMedicals.filter(
      (m) => String(m.animal) === String(anim.id) || String(m.animal_id) === String(anim.id)
    );
    const dedicatedMedicalCost = dedicatedMedicals.reduce((sum, m) => sum + Number(m.cost || 0), 0);

    const trackerMedicals = filteredExpenses.filter((e) => {
      if (!isMedicalCategory(e.category)) return false;
      const linkedId = getExpenseAnimalId(e);
      if (linkedId && String(linkedId) === String(anim.id)) return true;
      if (e.description && anim.name && e.description.toLowerCase().includes(anim.name.toLowerCase())) return true;
      return false;
    });
    const trackerMedicalCost = trackerMedicals.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalMedicalCost = dedicatedMedicalCost + trackerMedicalCost;
    const medicalCount = dedicatedMedicals.length + trackerMedicals.length;

    const animalExpenses = filteredExpenses.filter((e) => {
      // Exclude purchase expense from extraExpCost to prevent double-counting with acqCost
      if (
        e === purchaseExpense ||
        e.category === "Livestock Purchase" ||
        e.category === "livestock_purchase" ||
        (e.category && e.category.toLowerCase().includes("purchase"))
      ) {
        return false;
      }
      // Exclude medical expenses (handled under totalMedicalCost)
      if (isMedicalCategory(e.category)) {
        return false;
      }
      const linkedId = getExpenseAnimalId(e);
      if (linkedId && String(linkedId) === String(anim.id)) return true;
      if (e.description && anim.name && e.description.toLowerCase().includes(anim.name.toLowerCase())) return true;
      return false;
    });
    const extraExpCost = animalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const cogs = acqCost + totalFeedCost + totalMedicalCost + extraExpCost;

    const animalSales = filteredRevenues.filter(
      (r) =>
        r.item_sold &&
        (r.item_sold.toLowerCase().includes(anim.name.toLowerCase()) ||
          (r.source === "animal_sales" && r.item_sold.toLowerCase().includes(anim.animal_type?.toLowerCase())))
    );
    const totalSalesRevenue = animalSales.reduce(
      (sum, s) => sum + Number(s.total_amount || s.amount || 0),
      0
    );

    const batchNetProfit = totalSalesRevenue - cogs;
    const isBatchProfitable = batchNetProfit >= 0;
    const roiPercent = cogs > 0 ? ((batchNetProfit / cogs) * 100).toFixed(1) : totalSalesRevenue > 0 ? "100.0" : "0.0";
    const headCount = Number(anim.count || 1);

    // Determine the primary sale unit from logged revenue records
    // Revenue records store unit as "kg", "ton", "head", or "unit" based on pricing_basis
    const saleUnits = animalSales.map((s) => (s.unit || "head").toLowerCase());
    const primarySaleUnit = saleUnits.length > 0
      ? saleUnits.reduce((a, b, _, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)
      : "head";

    // Compute total quantity sold in the primary unit
    const totalQtySold = animalSales.reduce((sum, s) => sum + Number(String(s.quantity || 0).replace(/,/g, "")), 0);

    // Compute weight in kg from animal record
    const totalWeightKg = Number(anim.weight || 0);

    // Profit per unit sold (per kg, per ton, per head, etc.)
    let profitPerUnit = 0;
    let unitLabel = primarySaleUnit;
    if (primarySaleUnit === "kg") {
      const weightBasis = totalQtySold > 0 ? totalQtySold : totalWeightKg;
      profitPerUnit = weightBasis > 0 ? batchNetProfit / weightBasis : 0;
      unitLabel = "kg";
    } else if (primarySaleUnit === "ton") {
      const tonBasis = totalQtySold > 0 ? totalQtySold : (totalWeightKg / 1000);
      profitPerUnit = tonBasis > 0 ? batchNetProfit / tonBasis : 0;
      unitLabel = "ton";
    } else if (primarySaleUnit === "head") {
      profitPerUnit = headCount > 0 ? batchNetProfit / headCount : 0;
      unitLabel = "head";
    } else {
      // lump_sum or "unit"
      profitPerUnit = batchNetProfit;
      unitLabel = "batch";
    }

    return {
      animal: anim,
      acqCost,
      totalFeedCost,
      totalMedicalCost,
      extraExpCost,
      cogs,
      totalSalesRevenue,
      batchNetProfit,
      isBatchProfitable,
      roiPercent,
      profitPerUnit: Number(profitPerUnit).toFixed(2),
      unitLabel,
      totalQtySold,
      salesCount: animalSales.length,
      feedCount: animalFeeds.length,
      medicalCount,
      expenseCount: animalExpenses.length,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <RecordSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccess={() => fetchAnalyticsData()}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports & Financial Analytics</h1>
          <p className="text-gray-600">
            Track farm performance, sales revenues, expenses, and profit & loss (gain vs loss)
          </p>
        </div>

        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <FiPlusCircle size={18} />
          <span>+ Record Animal / Crop Sale</span>
        </button>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <FiCalendar className="text-primary-600" size={18} />
            <span>Filter Time Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Time" },
              { id: "this_month", label: "This Month" },
              { id: "last_month", label: "Last Month" },
              { id: "this_quarter", label: "This Quarter" },
              { id: "this_year", label: "This Year" },
              { id: "custom", label: "Custom Range" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  timeRange === btn.id
                    ? "bg-primary-600 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {timeRange === "custom" && (
          <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* PROFIT & LOSS / GAIN VS LOSS BANNER CARD */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${isGain ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
              {isGain ? <FiArrowUpRight size={28} /> : <FiArrowDownRight size={28} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Profit & Loss Performance (Gain vs Loss)</h2>
              <p className="text-xs text-gray-500">
                Calculated from total sales income minus total operational expenses for the selected period
              </p>
            </div>
          </div>

          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isGain ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}
          >
            {isGain ? "🟢 NET GAIN (PROFIT)" : "🔴 NET LOSS"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-800">Total Sales & Revenue</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatFarmCurrency(totalRevenue, activeFarm)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">{filteredRevenues.length} Sales Transactions</p>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <p className="text-xs font-semibold text-amber-800">Total Operational Expenses</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatFarmCurrency(totalExpenses, activeFarm)}
            </p>
            <p className="text-[11px] text-amber-700 mt-1">{filteredExpenses.length} Expense Items</p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isGain ? "bg-emerald-100/40 border-emerald-200" : "bg-red-100/40 border-red-200"
            }`}
          >
            <p className={`text-xs font-semibold ${isGain ? "text-emerald-900" : "text-red-900"}`}>
              Net Gain / Loss (Profit Margin: {profitMargin}%)
            </p>
            <p className={`text-3xl font-extrabold mt-1 ${isGain ? "text-emerald-600" : "text-red-600"}`}>
              {isGain ? "+" : ""}{formatFarmCurrency(netGainLoss, activeFarm)}
            </p>
            <p className={`text-[11px] font-medium mt-1 ${isGain ? "text-emerald-700" : "text-red-700"}`}>
              {isGain ? "Your farm operations are profitable!" : "Expenses exceed sales income for this period."}
            </p>
          </div>
        </div>
      </div>

      {/* Batch & Flock Unit Economics (COGS & Lifetime Profitability) */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <span>🌾 Flock & Batch Lifetime Profitability (Unit Economics COGS)</span>
            </h2>
            <p className="text-xs text-gray-500">
              Measures exact Sales Revenue minus Direct Production Costs (Acquisition + Cumulative Feed Intake + Medical Care) for each livestock batch
            </p>
          </div>
          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full self-start md:self-auto">
            {batchProfitability.length} Batches Tracked
          </span>
        </div>

        {batchProfitability.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {batchProfitability.map((batch) => (
              <div
                key={batch.animal.id}
                className={`p-5 rounded-2xl border transition-all ${
                  batch.isBatchProfitable
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-red-50/40 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                      <span>{batch.animal.name}</span>
                      <span className="text-xs font-normal text-gray-500 capitalize">
                        ({batch.animal.animal_type || "Livestock"})
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      {batch.animal.is_group ? `Group of ${Number(batch.animal.count || 0).toLocaleString()} head ${batch.totalQtySold > 0 ? `(${Number(batch.totalQtySold).toLocaleString()} sold)` : ""}` : "Individual Animal"}{" "}
                      {batch.animal.weight ? `• ${batch.animal.weight} kg` : ""}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      batch.isBatchProfitable
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {batch.isBatchProfitable ? `+${batch.roiPercent}% ROI` : `${batch.roiPercent}% ROI`}
                  </span>
                </div>

                {/* Direct Costs (COGS) vs Revenue Matrix */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-[11px]">Sales Revenue Logged</p>
                    <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                      {formatFarmCurrency(batch.totalSalesRevenue, activeFarm)}
                    </p>
                    <span className="text-[10px] text-gray-400">{batch.salesCount} sales records</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-[11px]">Total Cost of Production (COGS)</p>
                    <p className="text-base font-extrabold text-amber-600 mt-0.5">
                      {formatFarmCurrency(batch.cogs, activeFarm)}
                    </p>
                    <span className="text-[10px] text-gray-400">Acquisition + Feed + Vet + Direct Expenses</span>
                  </div>
                </div>

                {/* Cost Breakdown Accordion */}
                <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>🛒 Acquisition / Purchase Price:</span>
                    <span className="font-semibold text-gray-900">{formatFarmCurrency(batch.acqCost, activeFarm)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>🌾 Cumulative Feed Intake Cost ({batch.feedCount} logs):</span>
                    <span className="font-semibold text-amber-700">{formatFarmCurrency(batch.totalFeedCost, activeFarm)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>💉 Medical & Healthcare Expenses ({batch.medicalCount} logs):</span>
                    <span className="font-semibold text-purple-700">{formatFarmCurrency(batch.totalMedicalCost, activeFarm)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>🏷️ Other Direct Linked Expenses ({batch.expenseCount} logs):</span>
                    <span className="font-semibold text-blue-700">{formatFarmCurrency(batch.extraExpCost, activeFarm)}</span>
                  </div>
                </div>

                {/* Net Batch Profit Footer & Tooltip Explanation */}
                <div
                  className={`mt-4 p-4 rounded-2xl border transition-all ${
                    batch.isBatchProfitable
                      ? "bg-emerald-100/60 border-emerald-200 text-emerald-900"
                      : "bg-red-100/60 border-red-200 text-red-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider">
                          {batch.isBatchProfitable ? "Net Flock Profit" : "Net Flock Loss"}
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTooltip(activeTooltip === `profit-${batch.animal.id}` ? null : `profit-${batch.animal.id}`)}
                          className="p-1 text-emerald-700 hover:text-emerald-900 bg-white/70 hover:bg-white rounded-full transition-all"
                          title="Click to see Profit Formula"
                        >
                          <FiInfo size={14} />
                        </button>
                      </div>
                      <p className="text-xl font-black mt-0.5">
                        {batch.isBatchProfitable ? "+" : ""}{formatFarmCurrency(batch.batchNetProfit, activeFarm)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Unit Economics</p>
                        <button
                          type="button"
                          onClick={() => setActiveTooltip(activeTooltip === `unit-${batch.animal.id}` ? null : `unit-${batch.animal.id}`)}
                          className="p-1 text-emerald-700 hover:text-emerald-900 bg-white/70 hover:bg-white rounded-full transition-all"
                          title="Click to see Unit Economics Breakdown"
                        >
                          <FiInfo size={14} />
                        </button>
                      </div>

                      <p className="text-base font-extrabold mt-0.5">
                        {batch.isBatchProfitable ? "+" : ""}{formatFarmCurrency(batch.profitPerUnit, activeFarm)} / {batch.unitLabel}
                      </p>
                      {batch.totalQtySold > 0 && (
                        <p className="text-[10px] opacity-75 font-medium">
                          {Number(batch.totalQtySold).toLocaleString()} {batch.unitLabel} sold
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Formula Popover 1: Net Flock Profit Breakdown */}
                  {activeTooltip === `profit-${batch.animal.id}` && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-xs text-gray-800 shadow-lg space-y-1.5 animate-fadeIn">
                      <div className="flex justify-between items-center border-b pb-1 font-bold text-emerald-800">
                        <span>💡 How Net Flock Profit is Calculated:</span>
                        <button onClick={() => setActiveTooltip(null)} className="text-gray-400 hover:text-gray-600">
                          <FiX size={14} />
                        </button>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Logged Sales Revenue:</span>
                        <span>+{formatFarmCurrency(batch.totalSalesRevenue, activeFarm)}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-bold">
                        <span>- Total Production COGS:</span>
                        <span>-{formatFarmCurrency(batch.cogs, activeFarm)}</span>
                      </div>
                      <div className="pl-2 border-l-2 border-amber-200 text-[10px] text-gray-600 space-y-0.5 my-1">
                        <div className="flex justify-between"><span>• Acquisition:</span><span>{formatFarmCurrency(batch.acqCost, activeFarm)}</span></div>
                        <div className="flex justify-between"><span>• Feed Intake:</span><span>{formatFarmCurrency(batch.totalFeedCost, activeFarm)}</span></div>
                        <div className="flex justify-between"><span>• Medical:</span><span>{formatFarmCurrency(batch.totalMedicalCost, activeFarm)}</span></div>
                        <div className="flex justify-between"><span>• Direct Expenses ({batch.expenseCount} logs):</span><span>{formatFarmCurrency(batch.extraExpCost, activeFarm)}</span></div>
                      </div>
                      <div className="flex justify-between pt-1 border-t font-black text-gray-900">
                        <span>= Net Clear Flock Profit:</span>
                        <span className="text-emerald-700">+{formatFarmCurrency(batch.batchNetProfit, activeFarm)}</span>
                      </div>
                    </div>
                  )}

                  {/* Formula Popover 2: Unit Economics (Per Kg / Per Head) Breakdown */}
                  {activeTooltip === `unit-${batch.animal.id}` && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-xs text-gray-800 shadow-lg space-y-1.5 animate-fadeIn">
                      <div className="flex justify-between items-center border-b pb-1 font-bold text-emerald-800">
                        <span>📊 What {formatFarmCurrency(batch.profitPerUnit, activeFarm)} / {batch.unitLabel} Means:</span>
                        <button onClick={() => setActiveTooltip(null)} className="text-gray-400 hover:text-gray-600">
                          <FiX size={14} />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        This is your <strong>Net Profit Margin per {batch.unitLabel}</strong> after subtracting all feeding and production costs:
                      </p>
                      <div className="bg-emerald-50 p-2 rounded-lg text-emerald-900 font-mono text-[11px] space-y-1">
                        <div>Net Profit ({formatFarmCurrency(batch.batchNetProfit, activeFarm)}) ÷ {Number(batch.totalQtySold || batch.animal.count || 1).toLocaleString()} {batch.unitLabel} sold</div>
                        <div className="font-bold text-emerald-700">= {formatFarmCurrency(batch.profitPerUnit, activeFarm)} net profit per {batch.unitLabel}</div>
                      </div>
                    </div>
                  )}

                  {/* Direct Link to Sales Ledger Button */}
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium opacity-80">
                      {batch.salesCount} sale receipt(s) logged for this batch
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSalesSearchQuery(batch.animal.name);
                        const el = document.getElementById("sales-ledger-section");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 text-xs font-bold rounded-xl shadow-sm border border-emerald-200 transition-all flex items-center space-x-1.5"
                    >
                      <span>🧾 View Flock Sales Receipts</span>
                      <FiArrowUpRight />
                    </button>
                  </div>

                  {/* AI Unit Economics Analysis for this Specific Animal/Batch Card */}
                  <AIChartInsight
                    chartTitle={`Batch Analysis: ${batch.animal.name}`}
                    chartType="Livestock Unit Economics"
                    data={{
                      name: batch.animal.name,
                      type: batch.animal.animal_type,
                      revenue: batch.totalSalesRevenue,
                      cogs: batch.cogs,
                      acqCost: batch.acqCost,
                      feedCost: batch.totalFeedCost,
                      medicalCost: batch.totalMedicalCost,
                      netProfit: batch.batchNetProfit,
                      roi: batch.roiPercent,
                      profitPerUnit: batch.profitPerUnit,
                      unitLabel: batch.unitLabel,
                      salesCount: batch.salesCount,
                      feedCount: batch.feedCount,
                      medicalCount: batch.medicalCount,
                    }}
                    contextSummary={`Unit economics data for ${batch.animal.name} (${batch.animal.animal_type || "Livestock"}). Revenue: ${batch.totalSalesRevenue}, COGS: ${batch.cogs}, Net Profit: ${batch.batchNetProfit}, ROI: ${batch.roiPercent}%. Feed logs: ${batch.feedCount}, Medical logs: ${batch.medicalCount}, Sales logs: ${batch.salesCount}.`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 text-sm">
            No active livestock batches found. Create animal groups and log feed/sales to view unit economics!
          </div>
        )}
        {batchProfitability.length > 0 && (
          <AIChartInsight
            chartTitle="Flock & Batch Lifetime Profitability (Unit Economics)"
            chartType="Unit Economics Matrix"
            data={batchProfitability}
            contextSummary="Measures exact sales revenues minus COGS (acquisition + cumulative feed + vet) per livestock batch."
          />
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-800">
          {error}
          <button
            onClick={fetchAnalyticsData}
            className="ml-4 underline font-medium hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Animals"
          value={dashboardData?.animals?.total ?? animalsData?.summary?.total_animals ?? 0}
          icon={FiTarget}
          color="primary"
        />
        <StatCard
          title="Active Crops"
          value={dashboardData?.crops?.total ?? cropsData?.summary?.total_crops ?? 0}
          icon={FiBarChart2}
          color="success"
        />
        <StatCard
          title="Total Expenses (Period)"
          value={formatFarmCurrency(totalExpenses, activeFarm)}
          icon={FiTrendingUp}
          color="warning"
        />
        <StatCard
          title="Total Sales (Period)"
          value={formatFarmCurrency(totalRevenue, activeFarm)}
          icon={FiPieChart}
          color="accent"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Expense Trends by Month */}
        {dashboardData?.finances?.expense_trend && (
          <ChartContainer
            title="Monthly Expense Trend"
            chartData={dashboardData.finances.expense_trend}
            chartType="Line Chart"
            contextSummary="Monthly operational expense trajectory across farm activities."
            tooltipTitle="Monthly Expense Trend"
            tooltipDesc="Tracks historical operational spending on a month-by-month basis."
            tooltipHowToRead={["Orange Line: Total expenses logged in each month."]}
            tooltipActionTip="Review months with steep upward spikes to identify recurring cost drivers."
          >
            <LineChart
              labels={dashboardData.finances.expense_trend.map((item) => item.month)}
              datasets={[
                {
                  label: `Expenses (${getFarmCurrencySymbol(activeFarm)})`,
                  data: dashboardData.finances.expense_trend.map((item) => item.total),
                  borderColor: "rgba(245, 158, 11, 1)",
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                },
              ]}
            />
          </ChartContainer>
        )}

        {/* Livestock by Type */}
        {animalsData?.by_type && (
          <ChartContainer
            title="Livestock by Type"
            chartData={animalsData.by_type}
            chartType="Bar Chart"
            contextSummary="Distribution of livestock population across species groups."
            tooltipTitle="Livestock by Type"
            tooltipDesc="Displays head counts across cattle, poultry, goats, pigs, and aquatic stock."
            tooltipHowToRead={["Colored Bars: Total number of active animals per type."]}
            tooltipActionTip="Ensure feed inventory aligns with your largest livestock bars."
          >
            <BarChart
              labels={(animalsData.by_type || []).map((item) => (item.animal_type || "").toUpperCase())}
              datasets={[
                {
                  label: "Head Count",
                  data: (animalsData.by_type || []).map((item) => item.count),
                  backgroundColor: [
                    "rgba(59, 130, 246, 0.6)",
                    "rgba(16, 185, 129, 0.6)",
                    "rgba(245, 158, 11, 0.6)",
                    "rgba(139, 92, 246, 0.6)",
                    "rgba(239, 68, 68, 0.6)",
                    "rgba(6, 182, 212, 0.6)",
                  ],
                },
              ]}
            />
          </ChartContainer>
        )}

        {/* Expenses by Category */}
        {expensesData?.by_category && (
          <ChartContainer
            title="Expenses by Category"
            chartData={expensesData.by_category}
            chartType="Pie Chart"
            contextSummary="Proportional breakdown of farm expenditures by budget category."
            tooltipTitle="Expenses by Category"
            tooltipDesc="Visualizes cost allocation across Feed, Medical/Vet, Equipment, Labor, and Supplies."
            tooltipHowToRead={["Pie Slices: Percentage share per expense category."]}
            tooltipActionTip="Target the largest expense slice for cost-reduction initiatives."
          >
            <PieChart
              labels={(expensesData.by_category || []).map((item) => (item.category || "").toUpperCase())}
              data={(expensesData.by_category || []).map((item) => item.total)}
            />
          </ChartContainer>
        )}

        {/* Crop Status Distribution */}
        {cropsData?.by_status && (
          <ChartContainer
            title="Crop Status"
            chartData={cropsData.by_status}
            chartType="Doughnut Chart"
            contextSummary="Active crop cultivation stage distribution."
            tooltipTitle="Crop Status"
            tooltipDesc="Tracks crop progress across planted, growing, and harvesting stages."
            tooltipHowToRead={["Doughnut Segments: Number of plots in each growth stage."]}
            tooltipActionTip="Prepare harvest storage and buyer contracts as growing crops near maturity."
          >
            <DoughnutChart
              labels={(cropsData.by_status || []).map((item) => (item.status || "").toUpperCase())}
              data={(cropsData.by_status || []).map((item) => item.count)}
            />
          </ChartContainer>
        )}

        {/* Animal Health Status */}
        {animalsData?.by_status && (
          <ChartContainer
            title="Livestock Health Status"
            chartData={animalsData.by_status}
            chartType="Bar Chart"
            contextSummary="Health breakdown across active livestock population."
            tooltipTitle="Livestock Health Status"
            tooltipDesc="Monitors healthy, sick, quarantined, and pregnant animals."
            tooltipHowToRead={["Bars: Head count of animals in each health state."]}
            tooltipActionTip="Isolate animals in sick or quarantined bars immediately to prevent spread."
          >
            <BarChart
              labels={(animalsData.by_status || []).map((item) => (item.status || "").toUpperCase())}
              datasets={[
                {
                  label: "Count",
                  data: (animalsData.by_status || []).map((item) => item.count),
                  backgroundColor: [
                    "rgba(16, 185, 129, 0.6)",
                    "rgba(239, 68, 68, 0.6)",
                    "rgba(245, 158, 11, 0.6)",
                    "rgba(59, 130, 246, 0.6)",
                  ],
                },
              ]}
            />
          </ChartContainer>
        )}

        {/* Inventory by Category */}
        {inventoryData?.by_category && (
          <ChartContainer
            title="Inventory Value by Category"
            chartData={inventoryData.by_category}
            chartType="Pie Chart"
            contextSummary="Total capital valuation tied up in farm inventory."
            tooltipTitle="Inventory Value by Category"
            tooltipDesc="Displays financial valuation tied up in feeds, chemicals, tools, and harvest."
            tooltipHowToRead={["Pie Slices: Monetary value share per inventory category."]}
            tooltipActionTip="Avoid overstocking perishable inventory categories."
          >
            <PieChart
              labels={(inventoryData.by_category || []).map((item) => (item.category || "").toUpperCase())}
              data={(inventoryData.by_category || []).map((item) => item.total_value || item.count)}
            />
          </ChartContainer>
        )}
      </div>

      {/* Detailed Sales & Revenue Ledger Table */}
      <div id="sales-ledger-section" className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8 scroll-mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <span>Recorded Farm Sales & Revenue Ledger</span>
              {salesSearchQuery && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                  <span>Filtered: "{salesSearchQuery}"</span>
                  <button onClick={() => setSalesSearchQuery("")} className="hover:text-emerald-950 font-bold ml-1">✕</button>
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              Complete log of all livestock, crop produce, milk, and egg sales for the selected period
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            {salesSearchQuery && (
              <button
                onClick={() => setSalesSearchQuery("")}
                className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
              >
                Clear Filter
              </button>
            )}
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
              {filteredRevenues.length} Sales Items ({formatFarmCurrency(filteredRevenues.reduce((sum, r) => sum + Number(r.total_amount || r.amount || 0), 0), activeFarm)})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full min-w-[650px] text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Item / Produce Sold</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Quantity & Unit</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRevenues.length > 0 ? (
                filteredRevenues.map((sale) => (
                  <tr key={sale.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {sale.date ? new Date(sale.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {sale.item_sold || "Farm Produce"}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 capitalize font-medium">
                      {(sale.source || "sales").replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-800">
                      {sale.quantity} {sale.unit || "unit"}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 font-medium">
                      {sale.unit_price ? formatFarmCurrency(sale.unit_price, activeFarm) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                      {formatFarmCurrency(sale.total_amount || sale.amount, activeFarm)}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {sale.buyer || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedSaleDetail(sale);
                          setIsDetailModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition-all inline-flex items-center space-x-1"
                        title="View Full Sale Details"
                      >
                        <FiEye size={12} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">
                    No sales recorded for this period. Click <strong>"+ Record Animal / Crop Sale"</strong> at the top to log your sales!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Harvests */}
        {cropsData && cropsData.upcoming_harvests && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Upcoming Harvests</h3>
            <div className="space-y-3">
              {cropsData.upcoming_harvests.slice(0, 5).map((crop, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center pb-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{crop.name}</p>
                    <p className="text-sm text-gray-500">{crop.field || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{crop.stage}</p>
                    <p className="text-sm text-gray-500">
                      {crop.days_to_harvest ? `${crop.days_to_harvest}d left` : "Ready"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Items */}
        {inventoryData && inventoryData.low_stock && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Low Stock Items</h3>
            <div className="space-y-3">
              {inventoryData.low_stock.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center pb-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.quantity} {item.unit}</p>
                    <p className="text-sm text-orange-600 font-medium">
                      Min: {item.min_quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods Distribution */}
        {expensesData && expensesData.by_payment_method && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Payments by Method</h3>
            <div className="space-y-3">
              {Array.isArray(expensesData.by_payment_method)
                ? expensesData.by_payment_method.map((item) => (
                    <div
                      key={item.payment_method}
                      className="flex justify-between items-center pb-3 border-b last:border-b-0"
                    >
                      <p className="font-medium capitalize">{(item.payment_method || "").replace("_", " ")}</p>
                      <p className="text-lg font-bold">{formatFarmCurrency(item.total, activeFarm)}</p>
                    </div>
                  ))
                : Object.entries(expensesData.by_payment_method).map(([method, amount]) => (
                    <div
                      key={method}
                      className="flex justify-between items-center pb-3 border-b last:border-b-0"
                    >
                      <p className="font-medium capitalize">{method.replace("_", " ")}</p>
                      <p className="text-lg font-bold">{formatFarmCurrency(amount, activeFarm)}</p>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {/* Expiring Items */}
        {inventoryData && inventoryData.expiring_soon && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Items Expiring Soon</h3>
            <div className="space-y-3">
              {inventoryData.expiring_soon.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center pb-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      {item.expiry_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SaleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        sale={selectedSaleDetail}
        activeFarm={activeFarm}
      />
    </div>
  );
}

export default Reports;
