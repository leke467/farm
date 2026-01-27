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
    name: "",
    type: "",
    size: "",
    location: "",
    address: "",
    total_area: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Farm type - determines UI mode (individual or group tracking)
  const [farmType, setFarmType] = useState("small"); // 'small' or 'large'

  // Fetch all data from backend on mount (unless demo user)
  useEffect(() => {
    // Only fetch if user is logged in and has a token
    if (!user || !localStorage.getItem("authToken")) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
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
          console.log("User Farms is", userFarms)
          
          let farmObj = null;
          if (
            userFarms &&
            Array.isArray(userFarms.results) &&
            userFarms.results.length > 0
          ) {
            farmObj = userFarms.results[0];
            console.log("Farm Obj ", farmObj)
          }
          
          if (!cancelled) {
            setFarms((userFarms && userFarms.results) || []);
            if (farmObj) {
              setActiveFarm(farmObj);
              setFarmSettings({
                name: farmObj.name || "",
                type: farmObj.farm_type || "",
                size: farmObj.size || "",
                location: farmObj.location || "",
                address: farmObj.address || "",
                total_area: farmObj.total_area || "",
                description: farmObj.description || "",
              });
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching farm data:", err);
          setError("Failed to load farm data: " + (err.message || "Unknown error"));
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    }
    fetchData();
    
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [user]);

  // Fetch farm data when activeFarm changes
  useEffect(() => {
    let cancelled = false;
    
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
        
        if (!cancelled) {
          // Handle both array and paginated responses
          setAnimals(Array.isArray(a) ? a : (a?.results || []));
          setCrops(Array.isArray(c) ? c : (c?.results || []));
          setTasks(Array.isArray(t) ? t : (t?.results || []));
          setInventory(Array.isArray(i) ? i : (i?.results || []));
          setExpenses(Array.isArray(e) ? e : (e?.results || []));
          
          console.log("Fetched farm data:", { 
            animals: Array.isArray(a) ? a : a?.results, 
            crops: Array.isArray(c) ? c : c?.results, 
            tasks: Array.isArray(t) ? t : t?.results, 
            inventory: Array.isArray(i) ? i : i?.results, 
            expenses: Array.isArray(e) ? e : e?.results 
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching farm data:", err);
          setError("Failed to load farm data: " + (err.message || "Unknown error"));
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    }
    fetchFarmData();
    
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [activeFarm]);

  // CRUD functions (use backend unless demo user)
  // Animals CRUD
  const addAnimal = async (animal) => {
    try {
      if (user && user.isDemo) {
        setAnimals([...animals, { ...animal, id: Date.now().toString() }]);
        return { success: true };
      } else {
        const res = await apiService.createAnimal({ ...animal, farm: activeFarm?.id });
        console.log("Animal created:", res);
        if (res && !res._error) {
          setAnimals([...animals, res]);
          return { success: true, data: res };
        } else {
          setError("Failed to add animal");
          return { success: false, error: "Failed to add animal" };
        }
      }
    } catch (err) {
      console.error("Error adding animal:", err);
      setError("Failed to add animal: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const updateAnimal = async (id, updatedAnimal) => {
    try {
      if (user && user.isDemo) {
        setAnimals(
          animals.map((animal) =>
            animal.id === id ? { ...animal, ...updatedAnimal } : animal
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateAnimal(id, updatedAnimal);
        console.log("Animal updated:", res);
        if (res && !res._error) {
          setAnimals(animals.map((animal) => (animal.id === id ? res : animal)));
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error updating animal:", err);
      setError("Failed to update animal: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const deleteAnimal = async (id) => {
    try {
      if (user && user.isDemo) {
        setAnimals(animals.filter((animal) => animal.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteAnimal(id);
        console.log("Animal deleted:", res);
        if (!res._error) {
          setAnimals(animals.filter((animal) => animal.id !== id));
          return { success: true };
        }
      }
    } catch (err) {
      console.error("Error deleting animal:", err);
      setError("Failed to delete animal: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const addAnimalGroup = addAnimal; // For now, treat as addAnimal

  // Crops CRUD
  const addCrop = async (crop) => {
    try {
      if (user && user.isDemo) {
        setCrops([...crops, { ...crop, id: Date.now().toString() }]);
        return { success: true };
      } else {
        const res = await apiService.createCrop({ ...crop, farm: activeFarm?.id });
        console.log("Crop created:", res);
        if (res && !res._error) {
          setCrops([...crops, res]);
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error adding crop:", err);
      setError("Failed to add crop: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const updateCrop = async (id, updatedCrop) => {
    try {
      if (user && user.isDemo) {
        setCrops(
          crops.map((crop) =>
            crop.id === id ? { ...crop, ...updatedCrop } : crop
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateCrop(id, updatedCrop);
        console.log("Crop updated:", res);
        if (res && !res._error) {
          setCrops(crops.map((crop) => (crop.id === id ? res : crop)));
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error updating crop:", err);
      setError("Failed to update crop: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const deleteCrop = async (id) => {
    try {
      if (user && user.isDemo) {
        setCrops(crops.filter((crop) => crop.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteCrop(id);
        console.log("Crop deleted:", res);
        if (!res._error) {
          setCrops(crops.filter((crop) => crop.id !== id));
          return { success: true };
        }
      }
    } catch (err) {
      console.error("Error deleting crop:", err);
      setError("Failed to delete crop: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };

  // Tasks CRUD
  const addTask = async (task) => {
    try {
      if (user && user.isDemo) {
        setTasks([
          ...tasks,
          { ...task, id: Date.now().toString(), status: "pending" },
        ]);
        return { success: true };
      } else {
        const res = await apiService.createTask({ ...task, farm: activeFarm?.id });
        console.log("Task created:", res);
        if (res && !res._error) {
          setTasks([...tasks, res]);
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Failed to add task: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const updateTask = async (id, updatedTask) => {
    try {
      if (user && user.isDemo) {
        setTasks(
          tasks.map((task) =>
            task.id === id ? { ...task, ...updatedTask } : task
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateTask(id, updatedTask);
        console.log("Task updated:", res);
        if (res && !res._error) {
          setTasks(tasks.map((task) => (task.id === id ? res : task)));
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const deleteTask = async (id) => {
    try {
      if (user && user.isDemo) {
        setTasks(tasks.filter((task) => task.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteTask(id);
        console.log("Task deleted:", res);
        if (!res._error) {
          setTasks(tasks.filter((task) => task.id !== id));
          return { success: true };
        }
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };

  // Inventory CRUD
  const addInventoryItem = async (item) => {
    try {
      if (user && user.isDemo) {
        setInventory([...inventory, { ...item, id: Date.now().toString() }]);
        return { success: true };
      } else {
        const res = await apiService.createInventoryItem({ ...item, farm: activeFarm?.id });
        console.log("Inventory item created:", res);
        if (res && !res._error) {
          setInventory([...inventory, res]);
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error adding inventory item:", err);
      setError("Failed to add inventory item: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const updateInventoryItem = async (id, updatedItem) => {
    try {
      if (user && user.isDemo) {
        setInventory(
          inventory.map((item) =>
            item.id === id ? { ...item, ...updatedItem } : item
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateInventoryItem(id, updatedItem);
        console.log("Inventory item updated:", res);
        if (res && !res._error) {
          setInventory(inventory.map((item) => (item.id === id ? res : item)));
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error updating inventory item:", err);
      setError("Failed to update inventory item: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const deleteInventoryItem = async (id) => {
    try {
      if (user && user.isDemo) {
        setInventory(inventory.filter((item) => item.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteInventoryItem(id);
        console.log("Inventory item deleted:", res);
        if (!res._error) {
          setInventory(inventory.filter((item) => item.id !== id));
          return { success: true };
        }
      }
    } catch (err) {
      console.error("Error deleting inventory item:", err);
      setError("Failed to delete inventory item: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };

  // Expenses CRUD
  const addExpense = async (expense) => {
    try {
      if (user && user.isDemo) {
        setExpenses([
          ...expenses,
          {
            ...expense,
            id: Date.now().toString(),
            date: new Date().toISOString(),
          },
        ]);
        return { success: true };
      } else {
        const res = await apiService.createExpense({ ...expense, farm: activeFarm?.id });
        console.log("Expense created:", res);
        if (res && !res._error) {
          setExpenses([...expenses, res]);
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error adding expense:", err);
      setError("Failed to add expense: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const updateExpense = async (id, updatedExpense) => {
    try {
      if (user && user.isDemo) {
        setExpenses(
          expenses.map((expense) =>
            expense.id === id ? { ...expense, ...updatedExpense } : expense
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateExpense(id, updatedExpense);
        console.log("Expense updated:", res);
        if (res && !res._error) {
          setExpenses(
            expenses.map((expense) => (expense.id === id ? res : expense))
          );
          return { success: true, data: res };
        }
      }
    } catch (err) {
      console.error("Error updating expense:", err);
      setError("Failed to update expense: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
    }
  };
  const deleteExpense = async (id) => {
    try {
      if (user && user.isDemo) {
        setExpenses(expenses.filter((expense) => expense.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteExpense(id);
        console.log("Expense deleted:", res);
        if (!res._error) {
          setExpenses(expenses.filter((expense) => expense.id !== id));
          return { success: true };
        }
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Failed to delete expense: " + (err.message || "Unknown error"));
      return { success: false, error: err.message };
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
