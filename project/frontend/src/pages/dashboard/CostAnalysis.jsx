import { useState, useEffect } from "react";
import { FiBarChart2, FiTrendingUp, FiDollarSign, FiSearch } from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, formatFarmCurrency, getFarmCurrencySymbol } from "../../utils/formatters";

const CostAnalysis = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (activeFarm?.id) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const [itemsRes, transRes] = await Promise.all([
        apiService.get(`/inventory/?farm=${activeFarm.id}`),
        apiService.get(`/inventory/transactions/?farm=${activeFarm.id}`),
      ]);

      const itemsList = Array.isArray(itemsRes) ? itemsRes : itemsRes?.results || itemsRes?.data || [];
      const transList = Array.isArray(transRes) ? transRes : transRes?.results || transRes?.data || [];

      setInventoryItems(itemsList);
      setTransactions(transList);
    } catch (error) {
      console.error("Failed to load inventory cost data:", error);
      setApiError("Failed to load inventory cost data");
      setInventoryItems([]);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Build cost tracking items from inventory items and transactions
  const costTrackingData = (inventoryItems || []).map((item) => {
    const itemTrans = (transactions || []).filter(
      (t) => t.item === item.id || t.item_id === item.id || t.inventory_item === item.id
    );

    const unitsPurchased = itemTrans
      .filter((t) => t.transaction_type === "in" || t.transaction_type === "purchase")
      .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

    const unitsIssued = itemTrans
      .filter((t) => t.transaction_type === "out" || t.transaction_type === "usage")
      .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

    const costPerUnit = Number(item.cost_per_unit || 0);
    const quantity = Number(item.quantity || 0);
    const totalVal = item.total_value != null ? Number(item.total_value) : quantity * costPerUnit;
    const purchaseCost = unitsPurchased > 0 ? unitsPurchased * costPerUnit : totalVal;

    return {
      id: item.id,
      inventory_item: item,
      cost_method: item.cost_method || "weighted_avg",
      total_units_purchased: unitsPurchased || quantity,
      total_units_issued: unitsIssued,
      total_purchase_cost: purchaseCost,
      weighted_avg_cost: costPerUnit,
      current_value: totalVal,
    };
  });

  // Filter data safely
  let filteredCosts = costTrackingData;
  if (selectedMethod !== "all") {
    filteredCosts = filteredCosts.filter((c) => c.cost_method === selectedMethod);
  }
  if (filterCategory !== "all") {
    filteredCosts = filteredCosts.filter((c) => c.inventory_item?.category === filterCategory);
  }
  if (searchQuery) {
    filteredCosts = filteredCosts.filter((c) =>
      c.inventory_item?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Calculate totals safely
  const totalPurchaseCost = (filteredCosts || []).reduce((sum, c) => sum + Number(c.total_purchase_cost || 0), 0);
  const totalInventoryValue = (filteredCosts || []).reduce((sum, c) => sum + Number(c.current_value || 0), 0);

  const costMethodBreakdown = {};
  (filteredCosts || []).forEach((c) => {
    const method = c.cost_method || "weighted_avg";
    costMethodBreakdown[method] = (costMethodBreakdown[method] || 0) + Number(c.total_purchase_cost || 0);
  });

  const categoryBreakdown = {};
  (filteredCosts || []).forEach((c) => {
    const cat = c.inventory_item?.category || "uncategorized";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Number(c.total_purchase_cost || 0);
  });

  const methodLabels = {
    weighted_avg: "Weighted Average",
    weighted_average: "Weighted Average",
    fifo: "FIFO",
    lifo: "LIFO",
  };

  const costByMethodData = Object.entries(costMethodBreakdown).map(([method, value]) => ({
    name: methodLabels[method.toLowerCase()] || method.toUpperCase(),
    value: parseFloat(value.toFixed(2)),
  }));

  const costByCategoryData = Object.entries(categoryBreakdown).map(([category, value]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: parseFloat(value.toFixed(2)),
  }));

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Cost Analysis</h1>
        <p className="text-gray-600">Track and analyze inventory costs by method and category</p>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {apiError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Purchase Cost</p>
              <p className="text-3xl font-bold text-primary-600">{formatFarmCurrency(totalPurchaseCost, activeFarm)}</p>
            </div>
            <FiDollarSign className="text-4xl text-primary-100" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Inventory Value</p>
              <p className="text-3xl font-bold text-green-600">{formatFarmCurrency(totalInventoryValue, activeFarm)}</p>
            </div>
            <FiTrendingUp className="text-4xl text-green-100" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tracked Items</p>
              <p className="text-3xl font-bold text-blue-600">{filteredCosts.length}</p>
            </div>
            <FiBarChart2 className="text-4xl text-blue-100" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Methods</option>
          <option value="fifo">FIFO</option>
          <option value="lifo">LIFO</option>
          <option value="weighted_avg">Weighted Average</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="feed">Feed</option>
          <option value="fertilizer">Fertilizer</option>
          <option value="medical">Medical</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="fuel">Fuel</option>
          <option value="tools">Tools</option>
          <option value="seeds">Seeds</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost by Method */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Cost Distribution by Valuation Method</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Breakdown of total inventory value based on accounting cost methods (Weighted Average, FIFO, LIFO).
            </p>
          </div>
          {costByMethodData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={costByMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costByMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatFarmCurrency(value, activeFarm)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              {/* Summary Cards */}
              <div className="mt-4 space-y-2 border-t pt-3">
                {costByMethodData.map((entry, index) => {
                  const pct = totalPurchaseCost > 0 ? ((entry.value / totalPurchaseCost) * 100).toFixed(1) : "100.0";
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-semibold text-gray-700">{entry.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {formatFarmCurrency(entry.value, activeFarm)} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No valuation data available</p>
          )}
        </div>

        {/* Cost by Category */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Cost Distribution by Category</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Total expenditure across feed, seeds, fertilizer, equipment, medical, and other stock categories.
            </p>
          </div>
          {costByCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={costByCategoryData}
                margin={{ top: 15, right: 15, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                <YAxis
                  width={75}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const sym = getFarmCurrencySymbol(activeFarm);
                    if (val >= 1000000) return `${sym}${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${sym}${(val / 1000).toFixed(0)}k`;
                    return `${sym}${val}`;
                  }}
                />
                <Tooltip formatter={(value) => formatFarmCurrency(value, activeFarm)} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {costByCategoryData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No category data available</p>
          )}
        </div>
      </div>

      {/* Detailed Cost Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Cost Tracking Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cost Method</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Total Units Purchased</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Total Units Issued</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Purchase Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Weighted Avg Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCosts.length > 0 ? (
                filteredCosts.map((cost) => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {cost.inventory_item?.name || "Unnamed Item"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                      {cost.inventory_item?.category || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {cost.cost_method?.toUpperCase() || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">
                      {cost.total_units_purchased}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">
                      {cost.total_units_issued}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {formatFarmCurrency(cost.total_purchase_cost, activeFarm)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-primary-600">
                      {formatFarmCurrency(cost.weighted_avg_cost, activeFarm)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No cost data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CostAnalysis;
