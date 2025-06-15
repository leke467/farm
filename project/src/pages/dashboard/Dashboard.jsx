import { FiUsers, FiGrid, FiDollarSign, FiPackage } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";

// Components
import SummaryCard from "../../components/dashboard/SummaryCard";
import WeatherWidget from "../../components/dashboard/WeatherWidget";
import TaskList from "../../components/dashboard/TaskList";
import AnimalSummary from "../../components/dashboard/AnimalSummary";
import AlertsList from "../../components/dashboard/AlertsList";

function Dashboard() {
  const { animals, crops, expenses, inventory } = useFarmData();

  // Defensive: ensure all are arrays
  const safeAnimals = Array.isArray(animals) ? animals : [];
  const safeCrops = Array.isArray(crops) ? crops : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  // Calculate total animals
  const totalAnimals = safeAnimals.reduce((total, animal) => {
    return total + (animal.isGroup ? animal.count : 1);
  }, 0);

  // Calculate total acres
  const totalAcres = safeCrops.reduce((total, crop) => {
    return total + crop.area;
  }, 0);

  // Calculate total expenses this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthExpenses = safeExpenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((total, expense) => total + expense.amount, 0);

  // Calculate low inventory items
  const lowInventoryCount = safeInventory.filter(
    (item) => item.quantity <= item.minQuantity
  ).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-gray-600">Farm overview and key metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Animals"
          value={totalAnimals}
          icon={<FiUsers size={24} />}
          change={5}
          color="primary"
        />
        <SummaryCard
          title="Crop Acreage"
          value={`${totalAcres} acres`}
          icon={<FiGrid size={24} />}
          change={0}
          color="secondary"
        />
        <SummaryCard
          title="This Month Expenses"
          value={`$${thisMonthExpenses.toLocaleString()}`}
          icon={<FiDollarSign size={24} />}
          change={-3}
          color="accent"
        />
        <SummaryCard
          title="Low Inventory Items"
          value={lowInventoryCount}
          icon={<FiPackage size={24} />}
          change={lowInventoryCount > 0 ? 100 : 0}
          color="error"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weather Widget */}
          <WeatherWidget />

          {/* Task List */}
          <TaskList limit={5} />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Animal Summary */}
          <AnimalSummary />

          {/* Alerts List */}
          <AlertsList />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
