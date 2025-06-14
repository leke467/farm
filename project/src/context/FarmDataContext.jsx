import { createContext, useContext, useState } from 'react';
import { 
  animals as initialAnimals,
  crops as initialCrops,
  tasks as initialTasks,
  inventory as initialInventory,
  expenses as initialExpenses
} from '../data/mockData';

// Create context
const FarmDataContext = createContext();

// Context provider
export function FarmDataProvider({ children }) {
  // State for all farm data
  const [animals, setAnimals] = useState(initialAnimals);
  const [crops, setCrops] = useState(initialCrops);
  const [tasks, setTasks] = useState(initialTasks);
  const [inventory, setInventory] = useState(initialInventory);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [farmSettings, setFarmSettings] = useState({
    name: 'Green Valley Farm',
    type: 'Mixed',
    size: 'Medium',
    location: 'Fairfield, CA',
  });

  // Farm type - determines UI mode (individual or group tracking)
  const [farmType, setFarmType] = useState('small'); // 'small' or 'large'

  // Animals CRUD
  const addAnimal = (animal) => {
    setAnimals([...animals, { ...animal, id: Date.now().toString() }]);
  };

  const updateAnimal = (id, updatedAnimal) => {
    setAnimals(animals.map(animal => animal.id === id ? { ...animal, ...updatedAnimal } : animal));
  };

  const deleteAnimal = (id) => {
    setAnimals(animals.filter(animal => animal.id !== id));
  };

  // Add group of animals
  const addAnimalGroup = (group) => {
    setAnimals([...animals, { ...group, id: Date.now().toString(), isGroup: true }]);
  };

  // Crops CRUD
  const addCrop = (crop) => {
    setCrops([...crops, { ...crop, id: Date.now().toString() }]);
  };

  const updateCrop = (id, updatedCrop) => {
    setCrops(crops.map(crop => crop.id === id ? { ...crop, ...updatedCrop } : crop));
  };

  const deleteCrop = (id) => {
    setCrops(crops.filter(crop => crop.id !== id));
  };

  // Tasks CRUD
  const addTask = (task) => {
    setTasks([...tasks, { ...task, id: Date.now().toString(), status: 'pending' }]);
  };

  const updateTask = (id, updatedTask) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, ...updatedTask } : task));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Inventory CRUD
  const addInventoryItem = (item) => {
    setInventory([...inventory, { ...item, id: Date.now().toString() }]);
  };

  const updateInventoryItem = (id, updatedItem) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, ...updatedItem } : item));
  };

  const deleteInventoryItem = (id) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  // Expenses CRUD
  const addExpense = (expense) => {
    setExpenses([...expenses, { ...expense, id: Date.now().toString(), date: new Date().toISOString() }]);
  };

  const updateExpense = (id, updatedExpense) => {
    setExpenses(expenses.map(expense => expense.id === id ? { ...expense, ...updatedExpense } : expense));
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  // Update farm settings
  const updateFarmSettings = (newSettings) => {
    setFarmSettings({ ...farmSettings, ...newSettings });
  };

  return (
    <FarmDataContext.Provider value={{ 
      animals, addAnimal, updateAnimal, deleteAnimal, addAnimalGroup,
      crops, addCrop, updateCrop, deleteCrop,
      tasks, addTask, updateTask, deleteTask,
      inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      expenses, addExpense, updateExpense, deleteExpense,
      farmSettings, updateFarmSettings,
      farmType, setFarmType
    }}>
      {children}
    </FarmDataContext.Provider>
  );
}

// Custom hook to use the context
export function useFarmData() {
  const context = useContext(FarmDataContext);
  if (!context) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return context;
}

export default FarmDataContext;