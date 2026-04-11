import { useState, useEffect } from "react";
import { FiTrendingUp, FiBarChart2, FiUsers, FiDollarSign, FiPlus, FiDownload } from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ProductionRecordForm from "../../components/forms/ProductionRecordForm";
import BreedingRecordForm from "../../components/forms/BreedingRecordForm";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { useDataFilter } from "../../hooks/useDataFilter";
import FilterBar from "../../components/FilterBar";
import { exportToCSV } from "../../utils/csvExport";

const AnimalProductivityDashboard = () => {
  const { token } = useUser();
  const { activeFarm, animals } = useFarmData();
  const { toasts, removeToast, success, error } = useToast();

  const [metrics, setMetrics] = useState([]);
  const [productionRecords, setProductionRecords] = useState([]);
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [showBreedingForm, setShowBreedingForm] = useState(false);
  const [productionFilters, setProductionFilters] = useState({});
  const [breedingFilters, setBreedingFilters] = useState({});

  // Apply filters to data
  const filteredProduction = useDataFilter(productionRecords, productionFilters);
  const filteredBreeding = useDataFilter(breedingRecords, breedingFilters);

  useEffect(() => {
    if (activeFarm?.id && token) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const [metricsRes, productionRes, breedingRes] = await Promise.all([
        apiService.getAnimalProductionMetrics(),
        apiService.getProductionRecords(),
        apiService.getBreedingRecords(),
      ]);

      setMetrics(metricsRes.results || metricsRes || []);
      setProductionRecords(productionRes.results || productionRes || []);
      setBreedingRecords(breedingRes.results || breedingRes || []);
    } catch (error) {
      setApiError("Failed to load animal data");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs
  const totalRevenue = metrics.reduce((sum, m) => sum + (m.total_revenue || 0), 0);
  const totalCosts = metrics.reduce((sum, m) => sum + (m.total_costs || 0), 0);
  const totalProfit = totalRevenue - totalCosts;
  const avgEfficiency =
    metrics.length > 0
      ? (metrics.reduce((sum, m) => sum + (m.efficiency_ratio || 0), 0) / metrics.length).toFixed(2)
      : 0;

  // Prepare data for revenue chart
  const revenueData = metrics.slice(0, 8).map((m) => ({
    animal: m.animal_name?.substring(0, 10) || "Animal",
    revenue: m.total_revenue || 0,
    costs: m.total_costs || 0,
    profit: (m.total_revenue || 0) - (m.total_costs || 0),
  }));

  // Production type breakdown
  const productionTypeBreakdown = {};
  productionRecords.forEach((r) => {
    const type = r.production_type || "Other";
    productionTypeBreakdown[type] = (productionTypeBreakdown[type] || 0) + (r.quantity || 0);
  });

  const productionTypeData = Object.entries(productionTypeBreakdown).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: value,
  }));

  // Breeding success rate
  const totalBreeding = breedingRecords.length;
  const successfulBreeding = breedingRecords.filter((b) => b.breeding_status === "successful").length;
  const successRate = totalBreeding > 0 ? ((successfulBreeding / totalBreeding) * 100).toFixed(1) : 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
              <FiUsers className="text-green-600 text-xl sm:text-2xl" />
              <span className="truncate">Animal Productivity & Breeding</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">
              Track production metrics, breeding success, and revenue generation by animal
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowProductionForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition"
            >
              <FiPlus size={18} className="sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Add Production</span><span className="sm:hidden">Prod</span>
            </button>
            <button
              onClick={() => setShowBreedingForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition"
            >
              <FiPlus size={18} className="sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Add Breeding</span><span className="sm:hidden">Breed</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Revenue</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-800">₹{(totalRevenue / 100000).toFixed(1)}L</p>
              </div>
              <FiDollarSign className="text-green-500 text-lg sm:text-2xl flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Costs</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-800">₹{(totalCosts / 100000).toFixed(1)}L</p>
              </div>
              <div className="text-orange-500 text-lg sm:text-2xl flex-shrink-0">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Net Profit</p>
                <p className={`text-xl sm:text-3xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{(totalProfit / 100000).toFixed(1)}L
                </p>
              </div>
              <FiTrendingUp className="text-blue-500 text-lg sm:text-2xl flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Breeding Success</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-800">{successRate}%</p>
              </div>
              <div className="text-purple-500 text-lg sm:text-2xl flex-shrink-0">✓</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revenue vs Costs Chart */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Animal Revenue & Cost Analysis</h2>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="animal" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="costs" fill="#f59e0b" name="Costs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-250 flex items-center justify-center text-slate-500 text-sm">
                No production data available
              </div>
            )}
          </div>

          {/* Production Type Distribution */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Production Type Distribution</h2>
            {productionTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={productionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-250 flex items-center justify-center text-slate-500 text-sm">
                No production type data available
              </div>
            )}
          </div>
        </div>

        {/* Production Records Filter */}
        <FilterBar
          onFilter={setProductionFilters}
          onReset={() => setProductionFilters({})}
          filterOptions={{ animal: animals || [] }}
        />

        {/* Production Records Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Recent Production Records</h2>
            <button
              onClick={() => exportToCSV(filteredProduction, `production-records-${new Date().toLocaleDateString()}.csv`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium text-xs sm:text-sm transition w-full sm:w-auto justify-center"
            >
              <FiDownload size={16} /> <span className="hidden sm:inline">Export</span><span className="sm:hidden">CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Animal</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Qty</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Quality</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredProduction.length > 0 ? (
                  filteredProduction.slice(0, 10).map((record, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-800 whitespace-nowrap">
                        {record.animal_name || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        {record.production_type || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-blue-600 whitespace-nowrap">
                        {record.quantity || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${
                          record.quality_grade === "premium"
                            ? "bg-green-100 text-green-700"
                            : record.quality_grade === "good"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {record.quality_grade?.toUpperCase() || "STD"}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">
                        ₹{(record.total_market_value || 0).toFixed(0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-500">
                      No production records available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breeding Records Filter */}
        <FilterBar
          onFilter={setBreedingFilters}
          onReset={() => setBreedingFilters({})}
          filterOptions={{}}
        />

        {/* Breeding Records Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Breeding Records</h2>
            <button
              onClick={() => exportToCSV(filteredBreeding, `breeding-records-${new Date().toLocaleDateString()}.csv`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium text-xs sm:text-sm transition w-full sm:w-auto justify-center"
            >
              <FiDownload size={16} /> <span className="hidden sm:inline">Export</span><span className="sm:hidden">CSV</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Sire</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Dam</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Off</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredBreeding.length > 0 ? (
                  filteredBreeding.slice(0, 10).map((record, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        {new Date(record.breeding_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-800 whitespace-nowrap">
                        {record.sire_name || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-800 whitespace-nowrap">
                        {record.dam_name || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-blue-600 font-semibold whitespace-nowrap">
                        {record.number_of_offspring || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${
                          record.breeding_status === "successful"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {record.breeding_status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {record.success_rate? `${record.success_rate}%` : "N/A"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-xs sm:text-sm text-slate-500">
                      No breeding records available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Message */}
        {apiError && (
          <div className="mt-4 sm:mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
            <p className="text-red-700">{apiError}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 sm:mt-6 text-center text-slate-500 text-sm">
            <p>Loading animal productivity data...</p>
          </div>
        )}

        {/* Production Record Form Modal */}
        {showProductionForm && (
          <ProductionRecordForm
            animals={animals}
            onClose={() => setShowProductionForm(false)}
            onSuccess={() => {
              setShowProductionForm(false);
              success("Production record added successfully!");
              fetchData();
            }}
          />
        )}

        {/* Breeding Record Form Modal */}
        {showBreedingForm && (
          <BreedingRecordForm
            onClose={() => setShowBreedingForm(false)}
            onSuccess={() => {
              setShowBreedingForm(false);
              success("Breeding record added successfully!");
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

export default AnimalProductivityDashboard;
