import { useState, useEffect } from "react";
import { FiBarChart2, FiTrendingUp, FiDollarSign, FiSearch } from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CostAnalysis = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();

  const [costTracking, setCostTracking] = useState([]);
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
    try {
      const [costRes, transRes] = await Promise.all([
        apiService.get("/api/inventory/cost-tracking/"),
        apiService.get("/api/inventory/transactions/"),
      ]);
      setCostTracking(costRes.data);
      setTransactions(transRes.data);
    } catch (error) {
      setApiError("Failed to load cost data");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data
  let filteredCosts = costTracking;
  if (selectedMethod !== "all") {
    filteredCosts = filteredCosts.filter((c) => c.cost_method === selectedMethod);
  }
  if (filterCategory !== "all") {
    filteredCosts = filteredCosts.filter((c) => c.inventory_item?.category === filterCategory);
  }
  if (searchQuery) {
    filteredCosts = filteredCosts.filter((c) =>
      c.inventory_item?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Calculate totals
  const totalPurchaseCost = filteredCosts.reduce((sum, c) => sum + (c.total_purchase_cost || 0), 0);
  const totalInventoryValue = filteredCosts.reduce((sum, c) => {
    const item = transactions.find((t) => t.item === c.inventory_item?.id);
    return sum + (c.weighted_avg_cost * (c.total_units_purchased - c.total_units_issued) || 0);
  }, 0);
  const costMethodBreakdown = {};
  filteredCosts.forEach((c) => {
    costMethodBreakdown[c.cost_method] = (costMethodBreakdown[c.cost_method] || 0) + c.total_purchase_cost;
  });

  const categoryBreakdown = {};
  filteredCosts.forEach((c) => {
    const cat = c.inventory_item?.category || "unknown";
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (c.weighted_avg_cost * c.total_units_purchased);
  });

  const costByMethodData = Object.entries(costMethodBreakdown).map(([method, value]) => ({
    name: method.toUpperCase(),
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
              <p className="text-3xl font-bold text-primary-600">${totalPurchaseCost.toFixed(2)}</p>
            </div>
            <FiDollarSign className="text-4xl text-primary-100" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Inventory Value</p>
              <p className="text-3xl font-bold text-green-600">${totalInventoryValue.toFixed(2)}</p>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Distribution by Method</h3>
          {costByMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costByMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costByMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Cost by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Distribution by Category</h3>
          {costByCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costByCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
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
                      {cost.inventory_item?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                      {cost.inventory_item?.category}
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
                      ${cost.total_purchase_cost?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-primary-600">
                      ${cost.weighted_avg_cost?.toFixed(2) || "0.00"}
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
