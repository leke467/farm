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

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const getResultsArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  return [];
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toSnakeEnum = (value, fallback = "other") => {
  if (!value && value !== 0) return fallback;
  return String(value).trim().toLowerCase().replace(/\s+/g, "_");
};

const normalizeFarm = (farm) => {
  if (!farm) return farm;
  return {
    ...farm,
    type: farm.type ?? farm.farm_type ?? "",
    farm_type: farm.farm_type ?? farm.type ?? "",
  };
};

const normalizeAnimal = (animal) => {
  if (!animal) return animal;
  return {
    ...animal,
    type: animal.type ?? animal.animal_type ?? "",
    animal_type: animal.animal_type ?? animal.type ?? "",
    birthDate: animal.birthDate ?? animal.birth_date ?? "",
    birth_date: animal.birth_date ?? animal.birthDate ?? null,
    isGroup: animal.isGroup ?? animal.is_group ?? false,
    is_group: animal.is_group ?? animal.isGroup ?? false,
    count: normalizeNumber(animal.count, 1),
    weight: normalizeOptionalNumber(animal.weight),
    avgWeight: normalizeOptionalNumber(animal.avgWeight ?? animal.avg_weight),
    avg_weight: normalizeOptionalNumber(animal.avg_weight ?? animal.avgWeight),
    establishedDate: animal.establishedDate ?? animal.established_date ?? null,
    established_date: animal.established_date ?? animal.establishedDate ?? null,
    weightHistory: ensureArray(animal.weightHistory ?? animal.weight_history),
    weight_history: ensureArray(animal.weight_history ?? animal.weightHistory),
    medicalHistory: ensureArray(animal.medicalHistory ?? animal.medical_history),
    medical_history: ensureArray(animal.medical_history ?? animal.medicalHistory),
    foodConsumption: ensureArray(
      animal.foodConsumption ?? animal.food_consumption
    ),
    food_consumption: ensureArray(
      animal.food_consumption ?? animal.foodConsumption
    ),
    sampleWeights: ensureArray(animal.sampleWeights ?? animal.sample_weights),
    sample_weights: ensureArray(animal.sample_weights ?? animal.sampleWeights),
    waterQuality: ensureArray(animal.waterQuality ?? animal.water_quality),
    water_quality: ensureArray(animal.water_quality ?? animal.waterQuality),
    status: (animal.status ?? "healthy").toLowerCase(),
  };
};

const normalizeCrop = (crop) => {
  if (!crop) return crop;
  const growthStages = ensureArray(crop.growthStages ?? crop.growth_stages).map(
    (stage) => ({
      ...stage,
      stage: (stage.stage ?? "").toLowerCase(),
    })
  );

  return {
    ...crop,
    area: normalizeNumber(crop.area, 0),
    plantedDate: crop.plantedDate ?? crop.planted_date ?? "",
    planted_date: crop.planted_date ?? crop.plantedDate ?? null,
    expectedHarvestDate:
      crop.expectedHarvestDate ?? crop.expected_harvest_date ?? "",
    expected_harvest_date:
      crop.expected_harvest_date ?? crop.expectedHarvestDate ?? null,
    growthStages,
    growth_stages: growthStages,
    status: (crop.status ?? "planning").toLowerCase(),
    stage: (crop.stage ?? "planning").toLowerCase(),
  };
};

const normalizeTask = (task) => {
  if (!task) return task;

  const assignedSource = task.assignedTo ?? task.assigned_to ?? null;
  const assignedTo =
    typeof assignedSource === "string"
      ? assignedSource
      : assignedSource?.username ||
        [assignedSource?.first_name, assignedSource?.last_name]
          .filter(Boolean)
          .join(" ") ||
        "";

  return {
    ...task,
    dueDate: task.dueDate ?? task.due_date ?? "",
    due_date: task.due_date ?? task.dueDate ?? null,
    assignedTo,
    status: (task.status ?? "pending").toLowerCase(),
    priority: (task.priority ?? "medium").toLowerCase(),
    category: toSnakeEnum(task.category, "other"),
  };
};

const normalizeInventoryItem = (item) => {
  if (!item) return item;
  return {
    ...item,
    quantity: normalizeNumber(item.quantity, 0),
    minQuantity: normalizeNumber(item.minQuantity ?? item.min_quantity, 0),
    min_quantity: normalizeNumber(item.min_quantity ?? item.minQuantity, 0),
    purchaseDate: item.purchaseDate ?? item.purchase_date ?? null,
    purchase_date: item.purchase_date ?? item.purchaseDate ?? null,
    expiryDate: item.expiryDate ?? item.expiry_date ?? null,
    expiry_date: item.expiry_date ?? item.expiryDate ?? null,
    costPerUnit: normalizeOptionalNumber(item.costPerUnit ?? item.cost_per_unit),
    cost_per_unit: normalizeOptionalNumber(item.cost_per_unit ?? item.costPerUnit),
  };
};

const normalizeExpense = (expense) => {
  if (!expense) return expense;
  const paymentMethod = toSnakeEnum(
    expense.paymentMethod ?? expense.payment_method,
    "cash"
  );
  return {
    ...expense,
    amount: normalizeNumber(expense.amount, 0),
    category: toSnakeEnum(expense.category, "other"),
    paymentMethod,
    payment_method: paymentMethod,
  };
};

const toTaskPayload = (task) => {
  const payload = {
    ...task,
  };

  if (payload.dueDate !== undefined) {
    payload.due_date = payload.dueDate;
    delete payload.dueDate;
  }
  if (payload.assignedTo !== undefined) {
    payload.assigned_to = payload.assignedTo;
    delete payload.assignedTo;
  }
  if (payload.recurrencePattern !== undefined) {
    payload.recurrence_pattern = payload.recurrencePattern;
    delete payload.recurrencePattern;
  }
  if (payload.category !== undefined) {
    payload.category = toSnakeEnum(payload.category, "other");
  }
  if (payload.priority !== undefined) {
    payload.priority = String(payload.priority).toLowerCase();
  }
  if (payload.status !== undefined) {
    payload.status = String(payload.status).toLowerCase();
  }

  return payload;
};

const toExpensePayload = (expense) => {
  const payload = {
    ...expense,
  };

  if (payload.paymentMethod !== undefined) {
    payload.payment_method = toSnakeEnum(payload.paymentMethod, "cash");
    delete payload.paymentMethod;
  } else if (payload.payment_method !== undefined) {
    payload.payment_method = toSnakeEnum(payload.payment_method, "cash");
  }

  if (payload.category !== undefined) {
    payload.category = toSnakeEnum(payload.category, "other");
  }
  if (payload.amount !== undefined) {
    payload.amount = normalizeNumber(payload.amount, 0);
  }

  return payload;
};

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
          setAnimals(initialAnimals.map(normalizeAnimal));
          setCrops(initialCrops.map(normalizeCrop));
          setTasks(initialTasks.map(normalizeTask));
          setInventory(initialInventory.map(normalizeInventoryItem));
          setExpenses(initialExpenses.map(normalizeExpense));
          setFarms([{ name: "Demo Farm", id: "demo" }]);
          setActiveFarm({ name: "Demo Farm", id: "demo" });
        } else {
          // Fetch farms for the user
          const userFarms = await apiService.getFarms();

          const farmList = getResultsArray(userFarms).map(normalizeFarm);
          const farmObj = farmList[0] || null;
          
          if (!cancelled) {
            setFarms(farmList);
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
          setAnimals(getResultsArray(a).map(normalizeAnimal));
          setCrops(getResultsArray(c).map(normalizeCrop));
          setTasks(getResultsArray(t).map(normalizeTask));
          setInventory(getResultsArray(i).map(normalizeInventoryItem));
          setExpenses(getResultsArray(e).map(normalizeExpense));
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
        setAnimals((prev) => [
          ...prev,
          normalizeAnimal({ ...animal, id: Date.now().toString() }),
        ]);
        return { success: true };
      } else {
        const res = await apiService.createAnimal({ ...animal, farm: activeFarm?.id });
        if (res && !res._error) {
          const normalizedAnimal = normalizeAnimal(res);
          setAnimals((prev) => [...prev, normalizedAnimal]);
          return { success: true, data: normalizedAnimal };
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
        setAnimals((prev) =>
          prev.map((animal) =>
            animal.id === id ? { ...animal, ...updatedAnimal } : animal
          )
        );
        return { success: true };
      } else {
        const animalUpdatePayload = {
          ...updatedAnimal,
          farm: updatedAnimal?.farm ?? activeFarm?.id,
        };
        const res = await apiService.updateAnimal(id, animalUpdatePayload);
        if (res && !res._error) {
          const normalizedAnimal = normalizeAnimal(res);
          setAnimals((prev) =>
            prev.map((animal) => (animal.id === id ? normalizedAnimal : animal))
          );
          return { success: true, data: normalizedAnimal };
        } else {
          const errorMessage =
            res?.detail || res?.error || "Failed to update animal";
          setError(`Failed to update animal: ${errorMessage}`);
          return { success: false, error: errorMessage };
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
        setAnimals((prev) => prev.filter((animal) => animal.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteAnimal(id);
        if (!res._error) {
          setAnimals((prev) => prev.filter((animal) => animal.id !== id));
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
        setCrops((prev) => [
          ...prev,
          normalizeCrop({ ...crop, id: Date.now().toString() }),
        ]);
        return { success: true };
      } else {
        const res = await apiService.createCrop({ ...crop, farm: activeFarm?.id });
        if (res && !res._error) {
          const normalizedCrop = normalizeCrop(res);
          setCrops((prev) => [...prev, normalizedCrop]);
          return { success: true, data: normalizedCrop };
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
        setCrops((prev) =>
          prev.map((crop) =>
            crop.id === id ? { ...crop, ...updatedCrop } : crop
          )
        );
        return { success: true };
      } else {
        const cropUpdatePayload = {
          ...updatedCrop,
          farm: updatedCrop?.farm ?? activeFarm?.id,
        };
        const res = await apiService.updateCrop(id, cropUpdatePayload);
        if (res && !res._error) {
          const normalizedCrop = normalizeCrop(res);
          setCrops((prev) =>
            prev.map((crop) => (crop.id === id ? normalizedCrop : crop))
          );
          return { success: true, data: normalizedCrop };
        } else {
          const errorMessage =
            res?.detail || res?.error || "Failed to update crop";
          setError(`Failed to update crop: ${errorMessage}`);
          return { success: false, error: errorMessage };
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
        setCrops((prev) => prev.filter((crop) => crop.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteCrop(id);
        if (!res._error) {
          setCrops((prev) => prev.filter((crop) => crop.id !== id));
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
        setTasks((prev) => [
          ...prev,
          normalizeTask({ ...task, id: Date.now().toString(), status: "pending" }),
        ]);
        return { success: true };
      } else {
        const res = await apiService.createTask({
          ...toTaskPayload(task),
          farm: activeFarm?.id,
        });
        if (res && !res._error) {
          const normalizedTask = normalizeTask(res);
          setTasks((prev) => [...prev, normalizedTask]);
          return { success: true, data: normalizedTask };
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
        setTasks((prev) =>
          prev.map((task) =>
            task.id === id ? { ...task, ...updatedTask } : task
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateTask(id, toTaskPayload(updatedTask));
        if (res && !res._error) {
          const normalizedTask = normalizeTask(res);
          setTasks((prev) =>
            prev.map((task) => (task.id === id ? normalizedTask : task))
          );
          return { success: true, data: normalizedTask };
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
        setTasks((prev) => prev.filter((task) => task.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteTask(id);
        if (!res._error) {
          setTasks((prev) => prev.filter((task) => task.id !== id));
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
        setInventory((prev) => [
          ...prev,
          normalizeInventoryItem({ ...item, id: Date.now().toString() }),
        ]);
        return { success: true };
      } else {
        const res = await apiService.createInventoryItem({ ...item, farm: activeFarm?.id });
        if (res && !res._error) {
          const normalizedItem = normalizeInventoryItem(res);
          setInventory((prev) => [...prev, normalizedItem]);
          return { success: true, data: normalizedItem };
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
        setInventory((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, ...updatedItem } : item
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateInventoryItem(id, updatedItem);
        if (res && !res._error) {
          const normalizedItem = normalizeInventoryItem(res);
          setInventory((prev) =>
            prev.map((item) => (item.id === id ? normalizedItem : item))
          );
          return { success: true, data: normalizedItem };
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
        setInventory((prev) => prev.filter((item) => item.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteInventoryItem(id);
        if (!res._error) {
          setInventory((prev) => prev.filter((item) => item.id !== id));
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
        setExpenses((prev) => [
          ...prev,
          normalizeExpense({
            ...expense,
            id: Date.now().toString(),
            date: new Date().toISOString(),
          }),
        ]);
        return { success: true };
      } else {
        const res = await apiService.createExpense({
          ...toExpensePayload(expense),
          farm: activeFarm?.id,
        });
        if (res && !res._error) {
          const normalizedExpense = normalizeExpense(res);
          setExpenses((prev) => [...prev, normalizedExpense]);
          return { success: true, data: normalizedExpense };
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
        setExpenses((prev) =>
          prev.map((expense) =>
            expense.id === id ? { ...expense, ...updatedExpense } : expense
          )
        );
        return { success: true };
      } else {
        const res = await apiService.updateExpense(
          id,
          toExpensePayload(updatedExpense)
        );
        if (res && !res._error) {
          const normalizedExpense = normalizeExpense(res);
          setExpenses((prev) =>
            prev.map((expense) =>
              expense.id === id ? normalizedExpense : expense
            )
          );
          return { success: true, data: normalizedExpense };
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
        setExpenses((prev) => prev.filter((expense) => expense.id !== id));
        return { success: true };
      } else {
        const res = await apiService.deleteExpense(id);
        if (!res._error) {
          setExpenses((prev) => prev.filter((expense) => expense.id !== id));
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
