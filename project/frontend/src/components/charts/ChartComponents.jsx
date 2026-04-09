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
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";

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

const chartColors = {
  primary: "rgba(59, 130, 246, 1)",
  primaryLight: "rgba(59, 130, 246, 0.1)",
  success: "rgba(16, 185, 129, 1)",
  successLight: "rgba(16, 185, 129, 0.1)",
  warning: "rgba(245, 158, 11, 1)",
  warningLight: "rgba(245, 158, 11, 0.1)",
  error: "rgba(239, 68, 68, 1)",
  errorLight: "rgba(239, 68, 68, 0.1)",
  accent: "rgba(139, 92, 246, 1)",
  accentLight: "rgba(139, 92, 246, 0.1)",
};

// LineChart Component
export function LineChart({ title, labels, datasets, options = {} }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: { size: 14, weight: "bold" },
      },
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: { size: 11 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: datasets.map((dataset) => ({
      ...dataset,
      borderColor: dataset.borderColor || chartColors.primary,
      backgroundColor: dataset.backgroundColor || chartColors.primaryLight,
      borderWidth: 2,
      tension: 0.4,
      fill: dataset.fill !== undefined ? dataset.fill : true,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: dataset.borderColor || chartColors.primary,
    })),
  };

  return (
    <div className="relative h-80 w-full">
      <Line data={chartData} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

// BarChart Component
export function BarChart({ title, labels, datasets, options = {} }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: { size: 14, weight: "bold" },
      },
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: { size: 11 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor:
        dataset.backgroundColor ||
        [chartColors.primary, chartColors.success, chartColors.warning][
          index % 3
        ],
      borderColor:
        dataset.borderColor ||
        [chartColors.primary, chartColors.success, chartColors.warning][
          index % 3
        ],
      borderWidth: 1,
      borderRadius: 4,
    })),
  };

  return (
    <div className="relative h-80 w-full">
      <Bar data={chartData} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

// PieChart Component
export function PieChart({ title, labels, data, options = {} }) {
  const backgroundColors = [
    chartColors.primary,
    chartColors.success,
    chartColors.warning,
    chartColors.error,
    chartColors.accent,
    "rgba(6, 182, 212, 1)",
    "rgba(249, 115, 22, 1)",
    "rgba(236, 72, 153, 1)",
  ];

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: { size: 14, weight: "bold" },
      },
      legend: {
        display: true,
        position: "right",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="relative h-80 w-full flex items-center justify-center">
      <Pie data={chartData} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

// DoughnutChart Component
export function DoughnutChart({ title, labels, data, options = {} }) {
  const backgroundColors = [
    chartColors.primary,
    chartColors.success,
    chartColors.warning,
    chartColors.error,
    chartColors.accent,
    "rgba(6, 182, 212, 1)",
    "rgba(249, 115, 22, 1)",
    "rgba(236, 72, 153, 1)",
  ];

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      title: {
        display: !!title,
        text: title,
        font: { size: 14, weight: "bold" },
      },
      legend: {
        display: true,
        position: "bottom",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 12 },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="relative h-80 w-full flex items-center justify-center">
      <Doughnut data={chartData} options={{ ...defaultOptions, ...options }} />
    </div>
  );
}

// StatCard Component
export function StatCard({ title, value, subtitle, icon: Icon, color = "primary" }) {
  const colorClasses = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    error: "bg-error-50 text-error-600",
    accent: "bg-accent-50 text-accent-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={32} />
          </div>
        )}
      </div>
    </div>
  );
}

// ChartContainer Component
export function ChartContainer({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {title && <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
}
