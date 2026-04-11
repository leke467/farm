import { useState, useEffect } from "react";
import { FiDollarSign, FiPieChart, FiTrendingUp, FiAlertCircle, FiPlus, FiDownload } from "react-icons/fi";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import FinancialEntryForm from "../../components/forms/FinancialEntryForm";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import { exportToCSV } from "../../utils/csvExport";

const FinancialOverviewDashboard = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();
  const { toasts, removeToast, success } = useToast();

  const [analysis, setAnalysis] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);

  useEffect(() => {
    if (activeFarm?.id && token) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const [analysisRes, revenueRes, debtRes] = await Promise.all([
        apiService.getFinancialAnalysis(),
        apiService.getRevenues(),
        apiService.getDebtManagement(),
      ]);

      setAnalysis(analysisRes.results || analysisRes || []);
      setRevenues(revenueRes.results || revenueRes || []);
      setDebts(debtRes.results || debtRes || []);
    } catch (error) {
      setApiError("Failed to load financial data");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs
  const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalProfit = analysis.reduce((sum, a) => sum + (a.profit_loss || 0), 0);
  const avgROI =
    analysis.length > 0
      ? (analysis.reduce((sum, a) => sum + (a.roi_percentage || 0), 0) / analysis.length).toFixed(2)
      : 0;

  // Total debt
  const totalDebt = debts.reduce((sum, d) => sum + (d.remaining_balance || 0), 0);
  const activeDebts = debts.filter((d) => d.payment_status === "pending").length;

  // Prepare monthly profit/loss data
  const monthlyData = analysis.slice(0, 12).map((a) => ({
    month: a.period_type === "monthly" ? `Month ${a.month || ""}` : `Q${a.quarter || ""} ${a.year || ""}`,
    revenue: a.total_revenue || 0,
    expenses: a.total_expenses || 0,
    profit: a.profit_loss || 0,
  }));

  // Revenue source breakdown
  const sourceBreakdown = {};
  revenues.forEach((r) => {
    const source = r.source || "Other";
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + (r.amount || 0);
  });

  const sourceData = Object.entries(sourceBreakdown).map(([source, value]) => ({
    name: source.substring(0, 15),
    value: value,
  }));

  // Debt payment schedule
  const upcomingPayments = debts
    .filter((d) => d.payment_status === "pending")
    .map((d) => ({
      creditor: d.creditor_name?.substring(0, 15) || "Creditor",
      amount: d.monthly_payment || d.remaining_balance || 0,
      dueDate: new Date(d.due_date).toLocaleDateString(),
      frequency: d.payment_frequency || "monthly",
    }))
    .slice(0, 5);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
              <FiDollarSign className="text-green-600 text-xl sm:text-2xl" />
              <span className="truncate">Financial Overview</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">
              Monitor revenue streams, profit margins, ROI, and debt management in real-time
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowRevenueForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition"
            >
              <FiPlus size={18} /> <span className="hidden sm:inline">Add Revenue</span><span className="sm:hidden">Revenue</span>
            </button>
            <button
              onClick={() => setShowDebtForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition"
            >
              <FiPlus size={18} /> <span className="hidden sm:inline">Add Debt</span><span className="sm:hidden">Debt</span>
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
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Average ROI</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-800">{avgROI}%</p>
              </div>
              <div className="text-purple-500 text-lg sm:text-2xl flex-shrink-0">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Active Debts</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-800">{activeDebts}</p>
                <p className="text-xs text-slate-500 mt-1">Out: ₹{(totalDebt / 100000).toFixed(1)}L</p>
              </div>
              <FiAlertCircle className="text-orange-500 text-lg sm:text-2xl flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Monthly Profit/Loss Trend */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Monthly Profit/Loss Trend</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
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
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    name="Profit/Loss"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-250 flex items-center justify-center text-slate-500 text-sm">
                No financial data available
              </div>
            )}
          </div>

          {/* Revenue Source Distribution */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Revenue Source Breakdown</h2>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
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
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Revenue & Expenses Comparison */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Revenue vs Expenses Comparison</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
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
                <Bar dataKey="expenses" fill="#f59e0b" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-250 flex items-center justify-center text-slate-500 text-sm">
              No data available
            </div>
          )}
        </div>

        {/* Debt Payment Schedule */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Upcoming Debt Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Creditor</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Freq</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Due</th>
                </tr>
              </thead>
              <tbody>
                {upcomingPayments.length > 0 ? (
                  upcomingPayments.map((payment, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-800 whitespace-nowrap">
                        {payment.creditor}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-blue-600 whitespace-nowrap">
                        ₹{payment.amount.toFixed(0)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        {payment.frequency.charAt(0).toUpperCase()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-orange-600 font-semibold whitespace-nowrap">
                        {payment.dueDate}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-xs sm:text-sm text-slate-500">
                      No pending debt payments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Details Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Recent Revenue Records</h2>
            <button
              onClick={() => exportToCSV(revenues, `revenue-${new Date().toLocaleDateString()}.csv`)}
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
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Source</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Item</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Qty</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Price</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {revenues.length > 0 ? (
                  revenues.slice(0, 10).map((revenue, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        {new Date(revenue.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium text-slate-800 whitespace-nowrap">
                        {revenue.source || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        {revenue.item_sold || "N/A"}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        {revenue.quantity || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-slate-700 whitespace-nowrap">
                        ₹{(revenue.unit_price || 0).toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">
                        ₹{(revenue.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-xs sm:text-sm text-slate-500">
                      No revenue records available
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
            <p>Loading financial data...</p>
          </div>
        )}

        {/* Revenue Form Modal */}
        {showRevenueForm && (
          <FinancialEntryForm
            type="revenue"
            onClose={() => setShowRevenueForm(false)}
            onSuccess={() => {
              setShowRevenueForm(false);
              success("Revenue entry recorded successfully!");
              fetchData();
            }}
          />
        )}

        {/* Debt Form Modal */}
        {showDebtForm && (
          <FinancialEntryForm
            type="debt"
            onClose={() => setShowDebtForm(false)}
            onSuccess={() => {
              setShowDebtForm(false);
              success("Debt record added successfully!");
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

export default FinancialOverviewDashboard;
