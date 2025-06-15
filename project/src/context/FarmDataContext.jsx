import { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";
import {
  animals as initialAnimals,
  crops as initialCrops,
  tasks as initialTasks,
  inventory as initialInventory,
  expenses as initialExpenses,
} from "../data/mockData";
import { useUser } from "./UserContext";

// Create context
const FarmDataContext = createContext();

// Context provider
export function FarmDataProvider({ children }) {
  const { user } = useUser();
  // State for all farm data
  const [animals, setAnimals] = useState([]);
  const [crops, setCrops] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [farmSettings, setFarmSettings] = useState({
    name: "Green Valley Farm",
    type: "Mixed",
    size: "Medium",
    location: "Fairfield, CA",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Farm type - determines UI mode (individual or group tracking)
  const [farmType, setFarmType] = useState("small"); // 'small' or 'large'

  // Fetch all data from backend on mount (unless demo user)
  useEffect(() => {
    // Only fetch if user is logged in and has a token
    if (!user || !localStorage.getItem("authToken")) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (user && user.isDemo) {
          setAnimals(initialAnimals);
          setCrops(initialCrops);
          setTasks(initialTasks);
          setInventory(initialInventory);
          setExpenses(initialExpenses);
          setFarms([{ name: "Demo Farm", id: "demo" }]);
          setActiveFarm({ name: "Demo Farm", id: "demo" });
        } else {
          // Fetch farms for the user
          const userFarms = await apiService.getFarms();
          setFarms(userFarms || []);
          setActiveFarm((userFarms && userFarms[0]) || null);
        }
      } catch (err) {
        setError("Failed to load farm data");
      }
      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line
  }, [user]);

  // Fetch farm data when activeFarm changes
  useEffect(() => {
    async function fetchFarmData() {
      if (!user || user.isDemo || !activeFarm) return;
      setLoading(true);
      setError(null);
      try {
        const [a, c, t, i, e] = await Promise.all([
          apiService.getAnimals({ farm: activeFarm.id }),
          apiService.getCrops({ farm: activeFarm.id }),
          apiService.getTasks({ farm: activeFarm.id }),
          apiService.getInventory({ farm: activeFarm.id }),
          apiService.getExpenses({ farm: activeFarm.id }),
        ]);
        setAnimals(a || []);
        setCrops(c || []);
        setTasks(t || []);
        setInventory(i || []);
        setExpenses(e || []);
      } catch (err) {
        setError("Failed to load farm data");
      }
      setLoading(false);
    }
    fetchFarmData();
    // eslint-disable-next-line
  }, [activeFarm]);

  // CRUD functions (use backend unless demo user)
  // Animals CRUD
  const addAnimal = async (animal) => {
    if (user && user.isDemo) {
      setAnimals([...animals, { ...animal, id: Date.now().toString() }]);
    } else {
      const res = await apiService.createAnimal(animal);
      if (!res._error) setAnimals([...animals, res]);
    }
  };
  const updateAnimal = async (id, updatedAnimal) => {
    if (user && user.isDemo) {
      setAnimals(
        animals.map((animal) =>
          animal.id === id ? { ...animal, ...updatedAnimal } : animal
        )
      );
    } else {
      const res = await apiService.updateAnimal(id, updatedAnimal);
      if (!res._error)
        setAnimals(animals.map((animal) => (animal.id === id ? res : animal)));
    }
  };
  const deleteAnimal = async (id) => {
    if (user && user.isDemo) {
      setAnimals(animals.filter((animal) => animal.id !== id));
    } else {
      const res = await apiService.deleteAnimal(id);
      if (!res._error) setAnimals(animals.filter((animal) => animal.id !== id));
    }
  };
  const addAnimalGroup = addAnimal; // For now, treat as addAnimal

  // Crops CRUD
  const addCrop = async (crop) => {
    if (user && user.isDemo) {
      setCrops([...crops, { ...crop, id: Date.now().toString() }]);
    } else {
      const res = await apiService.createCrop(crop);
      if (!res._error) setCrops([...crops, res]);
    }
  };
  const updateCrop = async (id, updatedCrop) => {
    if (user && user.isDemo) {
      setCrops(
        crops.map((crop) =>
          crop.id === id ? { ...crop, ...updatedCrop } : crop
        )
      );
    } else {
      const res = await apiService.updateCrop(id, updatedCrop);
      if (!res._error)
        setCrops(crops.map((crop) => (crop.id === id ? res : crop)));
    }
  };
  const deleteCrop = async (id) => {
    if (user && user.isDemo) {
      setCrops(crops.filter((crop) => crop.id !== id));
    } else {
      const res = await apiService.deleteCrop(id);
      if (!res._error) setCrops(crops.filter((crop) => crop.id !== id));
    }
  };

  // Tasks CRUD
  const addTask = async (task) => {
    if (user && user.isDemo) {
      setTasks([
        ...tasks,
        { ...task, id: Date.now().toString(), status: "pending" },
      ]);
    } else {
      const res = await apiService.createTask(task);
      if (!res._error) setTasks([...tasks, res]);
    }
  };
  const updateTask = async (id, updatedTask) => {
    if (user && user.isDemo) {
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, ...updatedTask } : task
        )
      );
    } else {
      const res = await apiService.updateTask(id, updatedTask);
      if (!res._error)
        setTasks(tasks.map((task) => (task.id === id ? res : task)));
    }
  };
  const deleteTask = async (id) => {
    if (user && user.isDemo) {
      setTasks(tasks.filter((task) => task.id !== id));
    } else {
      const res = await apiService.deleteTask(id);
      if (!res._error) setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  // Inventory CRUD
  const addInventoryItem = async (item) => {
    if (user && user.isDemo) {
      setInventory([...inventory, { ...item, id: Date.now().toString() }]);
    } else {
      const res = await apiService.createInventoryItem(item);
      if (!res._error) setInventory([...inventory, res]);
    }
  };
  const updateInventoryItem = async (id, updatedItem) => {
    if (user && user.isDemo) {
      setInventory(
        inventory.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item
        )
      );
    } else {
      const res = await apiService.updateInventoryItem(id, updatedItem);
      if (!res._error)
        setInventory(inventory.map((item) => (item.id === id ? res : item)));
    }
  };
  const deleteInventoryItem = async (id) => {
    if (user && user.isDemo) {
      setInventory(inventory.filter((item) => item.id !== id));
    } else {
      const res = await apiService.deleteInventoryItem(id);
      if (!res._error) setInventory(inventory.filter((item) => item.id !== id));
    }
  };

  // Expenses CRUD
  const addExpense = async (expense) => {
    if (user && user.isDemo) {
      setExpenses([
        ...expenses,
        {
          ...expense,
          id: Date.now().toString(),
          date: new Date().toISOString(),
        },
      ]);
    } else {
      const res = await apiService.createExpense(expense);
      if (!res._error) setExpenses([...expenses, res]);
    }
  };
  const updateExpense = async (id, updatedExpense) => {
    if (user && user.isDemo) {
      setExpenses(
        expenses.map((expense) =>
          expense.id === id ? { ...expense, ...updatedExpense } : expense
        )
      );
    } else {
      const res = await apiService.updateExpense(id, updatedExpense);
      if (!res._error)
        setExpenses(
          expenses.map((expense) => (expense.id === id ? res : expense))
        );
    }
  };
  const deleteExpense = async (id) => {
    if (user && user.isDemo) {
      setExpenses(expenses.filter((expense) => expense.id !== id));
    } else {
      const res = await apiService.deleteExpense(id);
      if (!res._error)
        setExpenses(expenses.filter((expense) => expense.id !== id));
    }
  };

  // Update farm settings (local only for now)
  const updateFarmSettings = (newSettings) => {
    setFarmSettings({ ...farmSettings, ...newSettings });
    if (activeFarm) setActiveFarm({ ...activeFarm, ...newSettings });
  };

  return (
    <FarmDataContext.Provider
      value={{
        animals,
        addAnimal,
        updateAnimal,
        deleteAnimal,
        addAnimalGroup,
        crops,
        addCrop,
        updateCrop,
        deleteCrop,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        farmSettings,
        updateFarmSettings,
        farmType,
        setFarmType,
        loading,
        error,
        farms,
        activeFarm,
        setActiveFarm,
      }}
    >
      {children}
    </FarmDataContext.Provider>
  );
}

// Custom hook to use the context
export function useFarmData() {
  const context = useContext(FarmDataContext);
  if (!context) {
    throw new Error("useFarmData must be used within a FarmDataProvider");
  }
  return context;
}

export default FarmDataContext;
