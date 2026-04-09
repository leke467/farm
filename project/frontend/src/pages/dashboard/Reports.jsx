import { useState, useEffect } from "react";
import { FiBarChart2, FiPieChart, FiTrendingUp, FiTarget } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import apiService from "../../services/api";
import {
  LineChart,
  BarChart,
  PieChart,
  DoughnutChart,
  StatCard,
  ChartContainer,
} from "../../components/charts/ChartComponents";

function Reports() {
  const { activeFarm } = useFarmData();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [animalsData, setAnimalsData] = useState(null);
  const [cropsData, setCropsData] = useState(null);
  const [expensesData, setExpensesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeFarm]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [dashboard, animals, crops, expenses, inventory] =
        await Promise.all([
          apiService.get("/reports/analytics/dashboard/"),
          apiService.get("/reports/analytics/animals/"),
          apiService.get("/reports/analytics/crops/"),
          apiService.get("/reports/analytics/expenses/"),
          apiService.get("/reports/analytics/inventory/"),
        ]);

      setDashboardData(dashboard);
      setAnimalsData(animals);
      setCropsData(crops);
      setExpensesData(expenses);
      setInventoryData(inventory);
    } catch (err) {
      setError("Failed to load analytics data. Please try again.");
      console.error("Analytics error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Reports & Analytics</h1>
        <p className="text-gray-600">
          View insights and trends about your farm
        </p>
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
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Animals"
            value={dashboardData.total_animals || 0}
            icon={FiTarget}
            color="primary"
          />
          <StatCard
            title="Active Crops"
            value={dashboardData.total_crops || 0}
            icon={FiBarChart2}
            color="success"
          />
          <StatCard
            title="Monthly Expenses"
            value={
              dashboardData.monthly_expenses
                ? `$${dashboardData.monthly_expenses.toFixed(2)}`
                : "$0.00"
            }
            icon={FiTrendingUp}
            color="warning"
          />
          <StatCard
            title="Inventory Items"
            value={dashboardData.total_inventory_items || 0}
            icon={FiPieChart}
            color="accent"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Expense Trends by Month */}
        {expensesData && expensesData.monthly_trend && (
          <ChartContainer title="Monthly Expense Trend">
            <LineChart
              labels={Object.keys(expensesData.monthly_trend).map((month) =>
                month.substring(0, 3)
              )}
              datasets={[
                {
                  label: "Expenses ($)",
                  data: Object.values(expensesData.monthly_trend),
                  borderColor: "rgba(245, 158, 11, 1)",
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                },
              ]}
            />
          </ChartContainer>
        )}

        {/* Livestock by Type */}
        {animalsData && animalsData.by_type && (
          <ChartContainer title="Livestock by Type">
            <BarChart
              labels={Object.keys(animalsData.by_type)}
              datasets={[
                {
                  label: "Count",
                  data: Object.values(animalsData.by_type),
                  backgroundColor: [
                    "rgba(59, 130, 246, 0.5)",
                    "rgba(16, 185, 129, 0.5)",
                    "rgba(245, 158, 11, 0.5)",
                    "rgba(139, 92, 246, 0.5)",
                    "rgba(239, 68, 68, 0.5)",
                    "rgba(6, 182, 212, 0.5)",
                  ],
                },
              ]}
            />
          </ChartContainer>
        )}

        {/* Expenses by Category */}
        {expensesData && expensesData.by_category && (
          <ChartContainer title="Expenses by Category">
            <PieChart
              labels={Object.keys(expensesData.by_category)}
              data={Object.values(expensesData.by_category)}
            />
          </ChartContainer>
        )}

        {/* Crop Status Distribution */}
        {cropsData && cropsData.by_status && (
          <ChartContainer title="Crop Status">
            <DoughnutChart
              labels={Object.keys(cropsData.by_status)}
              data={Object.values(cropsData.by_status)}
            />
          </ChartContainer>
        )}

        {/* Animal Health Status */}
        {animalsData && animalsData.health_status && (
          <ChartContainer title="Livestock Health">
            <BarChart
              labels={["Healthy", "Sick", "Injured", "Pregnant", "Nursing", "Quarantined"]}
              datasets={[
                {
                  label: "Count",
                  data: [
                    animalsData.health_status.healthy || 0,
                    animalsData.health_status.sick || 0,
                    animalsData.health_status.injured || 0,
                    animalsData.health_status.pregnant || 0,
                    animalsData.health_status.nursing || 0,
                    animalsData.health_status.quarantined || 0,
                  ],
                  backgroundColor: [
                    "rgba(16, 185, 129, 0.5)",
                    "rgba(239, 68, 68, 0.5)",
                    "rgba(245, 158, 11, 0.5)",
                    "rgba(59, 130, 246, 0.5)",
                    "rgba(139, 92, 246, 0.5)",
                    "rgba(249, 115, 22, 0.5)",
                  ],
                },
              ]}
            />
          </ChartContainer>
        )}

        {/* Inventory by Category */}
        {inventoryData && inventoryData.by_category && (
          <ChartContainer title="Inventory by Category">
            <PieChart
              labels={Object.keys(inventoryData.by_category)}
              data={Object.values(inventoryData.by_category)}
            />
          </ChartContainer>
        )}
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
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.quantity} {item.unit}</p>
                    <p className="text-sm text-warning-600 font-medium">
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
              {Object.entries(expensesData.by_payment_method).map(
                ([method, amount]) => (
                  <div
                    key={method}
                    className="flex justify-between items-center pb-3 border-b last:border-b-0"
                  >
                    <p className="font-medium">{method}</p>
                    <p className="text-lg font-bold">${amount.toFixed(2)}</p>
                  </div>
                )
              )}
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
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-error-600">
                      {item.days_until_expiry}d
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
