import { useState, useEffect } from "react";
import { FiTrendingUp, FiBarChart2, FiPackage, FiAlertCircle } from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DemandForecastingDashboard = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();

  const [forecasts, setForecasts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (activeFarm?.id && token) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const [forecastRes, supplierRes] = await Promise.all([
        apiService.getDemandForecasts(),
        apiService.getSuppliers(),
      ]);

      setForecasts(forecastRes.results || forecastRes || []);
      setSuppliers(supplierRes.results || supplierRes || []);
    } catch (error) {
      setApiError("Failed to load forecasting data");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for trends chart
  const trendData = forecasts.slice(0, 12).map((f) => ({
    item: f.item_name?.substring(0, 10) || "Item",
    predicted: f.forecasted_demand || 0,
    reorder: f.reorder_point || 0,
    safety: f.safety_stock || 0,
  }));

  // Prepare data for supply comparison
  const supplierScores = suppliers.map((s) => ({
    name: s.supplier_name?.substring(0, 12) || "Supplier",
    quality: s.quality_rating || 0,
    reliability: s.on_time_delivery_percentage || 0,
    price_index: (s.average_unit_price || 0) / 100,
  }));

  // Count critical reorder points
  const criticalItems = forecasts.filter(
    (f) => f.current_inventory <= (f.reorder_point || 0)
  ).length;

  // Average supplier performance
  const avgQuality =
    suppliers.length > 0
      ? (
          suppliers.reduce((sum, s) => sum + (s.quality_rating || 0), 0) /
          suppliers.length
        ).toFixed(1)
      : 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <FiTrendingUp className="text-blue-600" />
            Demand Forecasting & Supplier Management
          </h1>
          <p className="text-slate-600 mt-2">
            Optimize inventory levels with AI-powered demand forecasting and supplier performance tracking
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Forecasts</p>
                <p className="text-3xl font-bold text-slate-800">{forecasts.length}</p>
              </div>
              <FiBarChart2 className="text-blue-500 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Critical Reorders</p>
                <p className="text-3xl font-bold text-slate-800">{criticalItems}</p>
              </div>
              <FiAlertCircle className="text-orange-500 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Active Suppliers</p>
                <p className="text-3xl font-bold text-slate-800">{suppliers.length}</p>
              </div>
              <FiPackage className="text-green-500 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Avg Quality Rating</p>
                <p className="text-3xl font-bold text-slate-800">{avgQuality}★</p>
              </div>
              <div className="text-purple-500 text-2xl">✓</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Demand Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Demand Prediction Trend</h2>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="item" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#3b82f6"
                    name="Forecasted Demand"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="reorder"
                    stroke="#f59e0b"
                    name="Reorder Point"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="safety"
                    stroke="#10b981"
                    name="Safety Stock"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">
                No forecast data available
              </div>
            )}
          </div>

          {/* Supplier Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Supplier Performance Index</h2>
            {supplierScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={supplierScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="quality" fill="#3b82f6" name="Quality Rating (%)" />
                  <Bar dataKey="reliability" fill="#10b981" name="On-Time Delivery (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">
                No supplier data available
              </div>
            )}
          </div>
        </div>

        {/* Forecasts Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Active Forecasts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Current Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Forecasted Demand</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Reorder Point</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Safety Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Trend</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.length > 0 ? (
                  forecasts.map((forecast, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                        {forecast.item_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {forecast.current_inventory || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                        {forecast.forecasted_demand || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-600">
                        {forecast.reorder_point || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {forecast.safety_stock || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {forecast.seasonal_trend === "increasing" && (
                          <span className="text-green-600 font-bold">↑ Rising</span>
                        )}
                        {forecast.seasonal_trend === "decreasing" && (
                          <span className="text-red-600 font-bold">↓ Falling</span>
                        )}
                        {forecast.seasonal_trend === "stable" && (
                          <span className="text-blue-600 font-bold">→ Stable</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                      No forecasts available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Message */}
        {apiError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{apiError}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-6 text-center text-slate-500">
            <p>Loading forecasting data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandForecastingDashboard;
