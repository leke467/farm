import { useState, useEffect } from "react";
import { FiBarChart2, FiTrendingUp, FiCloud, FiAlertTriangle, FiPlus, FiDownload } from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import WeatherImpactForm from "../../components/forms/WeatherImpactForm";
import FertilizerRecommendationForm from "../../components/forms/FertilizerRecommendationForm";
import CropYieldForm from "../../components/forms/CropYieldForm";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { exportToCSV } from "../../utils/csvExport";

const CropAnalyticsDashboard = () => {
  const { token } = useUser();
  const { activeFarm, crops } = useFarmData();
  const { toasts, removeToast, success } = useToast();

  const [yieldAnalysis, setYieldAnalysis] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weatherImpacts, setWeatherImpacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showWeatherForm, setShowWeatherForm] = useState(false);
  const [showFertilizerForm, setShowFertilizerForm] = useState(false);
  const [showYieldForm, setShowYieldForm] = useState(false);

  useEffect(() => {
    if (activeFarm?.id && token) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const [yieldRes, recommendRes, weatherRes] = await Promise.all([
        apiService.getCropYieldAnalysis(),
        apiService.getFertilizerRecommendations(),
        apiService.getWeatherImpactRecords(),
      ]);

      setYieldAnalysis(yieldRes.results || yieldRes || []);
      setRecommendations(recommendRes.results || recommendRes || []);
      setWeatherImpacts(weatherRes.results || weatherRes || []);
    } catch (error) {
      setApiError("Failed to load crop analytics data");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs
  const avgYieldPerformance =
    yieldAnalysis.length > 0
      ? (
          (yieldAnalysis.reduce((sum, y) => sum + ((y.actual_yield || 0) / (y.expected_yield || 1)), 0) /
            yieldAnalysis.length) *
          100
        ).toFixed(1)
      : 0;

  const totalROI = yieldAnalysis.reduce((sum, y) => sum + (y.roi_percentage || 0), 0);
  const avgROI = yieldAnalysis.length > 0 ? (totalROI / yieldAnalysis.length).toFixed(2) : 0;

  const totalYieldLoss = weatherImpacts.reduce((sum, w) => sum + (w.estimated_yield_loss || 0), 0);
  const pendingRecommendations = recommendations.filter((r) => r.status === "pending").length;

  // Prepare yield vs expected chart
  const yieldData = yieldAnalysis.slice(0, 10).map((y) => ({
    crop: y.crop_name?.substring(0, 8) || "Crop",
    expected: y.expected_yield || 0,
    actual: y.actual_yield || 0,
    roi: y.roi_percentage || 0,
  }));

  // Weather impact summary
  const weatherSummary = {};
  weatherImpacts.forEach((w) => {
    const type = w.impact_type || "Other";
    weatherSummary[type] = (weatherSummary[type] || 0) + (w.estimated_yield_loss || 0);
  });

  const weatherData = Object.entries(weatherSummary).map(([type, loss]) => ({
    name: type.substring(0, 12),
    loss: loss,
  }));

  // Fertilizer recommendation effectiveness
  const recommendationStatus = {};
  recommendations.forEach((r) => {
    const status = r.status || "pending";
    recommendationStatus[status] = (recommendationStatus[status] || 0) + 1;
  });

  const statusData = Object.entries(recommendationStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FiBarChart2 className="text-amber-600" />
              Crop Analytics & Environmental Intelligence
            </h1>
            <p className="text-slate-600 mt-2">
              Analyze crop yields, optimize fertilizer usage, and track weather impacts on production
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowWeatherForm(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <FiPlus /> Weather Impact
            </button>
            <button
              onClick={() => setShowFertilizerForm(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <FiPlus /> Fertilizer
            </button>
            <button
              onClick={() => setShowYieldForm(true)}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <FiPlus /> Yield Analysis
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Yield Performance</p>
                <p className="text-3xl font-bold text-slate-800">{avgYieldPerformance}%</p>
              </div>
              <FiTrendingUp className="text-blue-500 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Average ROI</p>
                <p className="text-3xl font-bold text-slate-800">{avgROI}%</p>
              </div>
              <div className="text-green-500 text-2xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Yield Loss</p>
                <p className="text-3xl font-bold text-slate-800">{totalYieldLoss.toFixed(0)} units</p>
              </div>
              <FiCloud className="text-orange-500 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pending Recommendations</p>
                <p className="text-3xl font-bold text-slate-800">{pendingRecommendations}</p>
              </div>
              <FiAlertTriangle className="text-purple-500 text-2xl" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Yield vs Expected */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Expected vs Actual Yield</h2>
            {yieldData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="crop" stroke="#94a3b8" />
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
                  <Bar dataKey="expected" fill="#94a3b8" name="Expected Yield" />
                  <Bar dataKey="actual" fill="#3b82f6" name="Actual Yield" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">
                No yield data available
              </div>
            )}
          </div>

          {/* Weather Impact by Type */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Yield Loss by Weather Event</h2>
            {weatherData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weatherData}>
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
                  <Bar dataKey="loss" fill="#f59e0b" name="Estimated Loss (units)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">
                No weather impact data available
              </div>
            )}
          </div>
        </div>

        {/* ROI Distribution and Recommendation Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ROI Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Crop ROI Performance</h2>
            {yieldData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="crop" stroke="#94a3b8" />
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
                    dataKey="roi"
                    stroke="#10b981"
                    name="ROI (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">
                No ROI data available
              </div>
            )}
          </div>

          {/* Recommendation Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Fertilizer Recommendation Status</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">
                No recommendation data available
              </div>
            )}
          </div>
        </div>

        {/* Fertilizer Recommendations Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Fertilizer Recommendations</h2>
            <button
              onClick={() => exportToCSV(recommendations, `fertilizer-recommendations-${new Date().toLocaleDateString()}.csv`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium text-sm transition"
            >
              <FiDownload /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Crop</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fertilizer Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Recommended Qty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Expected Yield Increase</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 10).map((rec, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {rec.crop_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {rec.fertilizer_type || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 font-semibold">
                        {rec.recommended_quantity || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 font-semibold">
                        {rec.yield_increase_percentage || 0}%
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          rec.status === "applied"
                            ? "bg-green-100 text-green-700"
                            : rec.status === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {rec.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                      No recommendations available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weather Impact Records */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Weather Impact Records</h2>
            <button
              onClick={() => exportToCSV(weatherImpacts, `weather-impacts-${new Date().toLocaleDateString()}.csv`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium text-sm transition"
            >
              <FiDownload /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Crop</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Impact Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Estimated Loss</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Recovery Strategy</th>
                </tr>
              </thead>
              <tbody>
                {weatherImpacts.length > 0 ? (
                  weatherImpacts.slice(0, 10).map((impact, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {new Date(impact.impact_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {impact.crop_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {impact.impact_type || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          impact.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : impact.severity === "medium"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {impact.severity?.toUpperCase() || "LOW"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                        {impact.estimated_yield_loss || 0} units
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {impact.recovery_strategy?.substring(0, 30) || "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                      No weather impact records available
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
            <p>Loading crop analytics data...</p>
          </div>
        )}

        {/* Weather Impact Form Modal */}
        {showWeatherForm && (
          <WeatherImpactForm
            crops={crops}
            onClose={() => setShowWeatherForm(false)}
            onSuccess={() => {
              setShowWeatherForm(false);
              success("Weather impact recorded successfully!");
              fetchData();
            }}
          />
        )}

        {/* Fertilizer Recommendation Form Modal */}
        {showFertilizerForm && (
          <FertilizerRecommendationForm
            crops={crops}
            onClose={() => setShowFertilizerForm(false)}
            onSuccess={() => {
              setShowFertilizerForm(false);
              success("Fertilizer recommendation saved successfully!");
              fetchData();
            }}
          />
        )}

        {/* Crop Yield Form Modal */}
        {showYieldForm && (
          <CropYieldForm
            crops={crops}
            onClose={() => setShowYieldForm(false)}
            onSuccess={() => {
              setShowYieldForm(false);
              success("Crop yield analysis recorded successfully!");
              fetchData();
            }}
          />
        )}

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CropAnalyticsDashboard;
