import { useState } from "react";
import { FiBarChart2, FiPieChart, FiTrendingUp } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Reports() {
  const { animals, crops, expenses } = useFarmData();
  const [timeRange, setTimeRange] = useState("month");

  // Defensive: ensure expenses is an array
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeAnimals = Array.isArray(animals) ? animals : [];
  const safeCrops = Array.isArray(crops) ? crops : [];

  // Prepare data for expense chart
  const expenseData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Monthly Expenses",
        data: [12000, 19000, 15000, 17000, 22000, 18000],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        fill: false,
      },
    ],
  };

  // Prepare data for animal distribution
  const animalDistribution = {
    labels: ["Cows", "Goats", "Chickens", "Fish"],
    datasets: [
      {
        data: [12, 19, 3, 5],
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for crop yield
  const cropYieldData = {
    labels: ["Corn", "Soybeans", "Wheat", "Tomatoes"],
    datasets: [
      {
        label: "Expected Yield (tons)",
        data: [30, 25, 20, 15],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Reports & Analytics</h1>
        <p className="text-gray-600">
          View insights and trends about your farm
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="mb-8">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input max-w-xs"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Trends */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Expense Trends</h2>
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <FiTrendingUp size={24} />
            </div>
          </div>
          <Line
            data={expenseData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Animal Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Animal Distribution</h2>
            <div className="p-2 bg-secondary-100 text-secondary-600 rounded-lg">
              <FiPieChart size={24} />
            </div>
          </div>
          <Pie
            data={animalDistribution}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </div>

        {/* Crop Yield */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Crop Yield</h2>
            <div className="p-2 bg-accent-100 text-accent-600 rounded-lg">
              <FiBarChart2 size={24} />
            </div>
          </div>
          <Bar
            data={cropYieldData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Summary Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Animals</p>
              <p className="text-2xl font-bold">{safeAnimals.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Active Crops</p>
              <p className="text-2xl font-bold">{safeCrops.length}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Monthly Expenses</p>
              <p className="text-2xl font-bold">
                $
                {safeExpenses
                  .filter(
                    (e) => new Date(e.date).getMonth() === new Date().getMonth()
                  )
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Yield Rate</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
