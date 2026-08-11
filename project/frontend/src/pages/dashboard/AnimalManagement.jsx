import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiUsers,
  FiUserPlus,
} from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import AnimalCard from "../../components/animals/AnimalCard";
import { Dialog } from "@headlessui/react";
import CategoryCombobox from "../../components/CategoryCombobox";
import apiService from "../../services/api";
import FeedRecordForm from "../../components/forms/FeedRecordForm";
import FeedMixModal from "../../components/animals/FeedMixModal";
import RecordSaleModal from "../../components/forms/RecordSaleModal";
import ProductionRecordForm from "../../components/forms/ProductionRecordForm";
import BreedingRecordForm from "../../components/forms/BreedingRecordForm";
import {
  FormField,
  SelectField,
  NumberField,
  FormError,
  FormSuccess,
  SubmitButton,
} from "../../components/forms/FormComponents";
import { animalSchema } from "../../components/forms/validationSchemas";
import { getFarmCurrencySymbol, formatFarmCurrency } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

function AnimalManagement() {
  const {
    activeFarm,
    animals,
    expenses,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    addAnimalGroup,
    farmType,
    setFarmType,
    refreshData,
  } = useFarmData();

  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isFeedMixModalOpen, setIsFeedMixModalOpen] = useState(false);
  const [selectedFeedAnimal, setSelectedFeedAnimal] = useState(null);
  const [feedRecords, setFeedRecords] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [viewTab, setViewTab] = useState("animals"); // "animals" | "feed_logs"
  const [currentAnimal, setCurrentAnimal] = useState(null);
  const [isGroupForm, setIsGroupForm] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [animalTypeSuggestions, setAnimalTypeSuggestions] = useState([]);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [selectedProductionAnimal, setSelectedProductionAnimal] = useState(null);
  const [isBreedingModalOpen, setIsBreedingModalOpen] = useState(false);
  const [selectedBreedingAnimal, setSelectedBreedingAnimal] = useState(null);
  const [breedingRecords, setBreedingRecords] = useState([]);

  const fetchFeedRecords = async () => {
    if (activeFarm?.id) {
      try {
        const [feedRes, invRes] = await Promise.all([
          apiService.get(`/animals/feed-records/?farm=${activeFarm.id}`).catch(() => []),
          apiService.getInventory({ farm: activeFarm.id }).catch(() => []),
        ]);
        const list = Array.isArray(feedRes) ? feedRes : feedRes?.results || feedRes?.data || [];
        const invs = Array.isArray(invRes) ? invRes : invRes?.results || invRes?.data || [];
        setFeedRecords(list);
        setInventoryItems(invs);
      } catch (err) {
        console.error("Failed to load feed records:", err);
      }
    }
  };

  const fetchBreedingRecords = async () => {
    if (activeFarm?.id) {
      try {
        const res = await apiService.get(`/animals/breeding-records/?farm=${activeFarm.id}`).catch(() => []);
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        setBreedingRecords(list);
      } catch (err) {
        console.error("Failed to load breeding records:", err);
      }
    }
  };

  const getFeedRecordCost = (record) => {
    let cost = Number(record.cost || 0);
    if (cost <= 0) {
      const match = (inventoryItems || []).find((inv) =>
        (record.feed_type && inv.name?.toLowerCase() === record.feed_type.toLowerCase()) ||
        inv.name?.toLowerCase().includes(record.feed_type?.toLowerCase() || "") ||
        inv.category === "feed"
      );
      if (match && Number(match.cost_per_unit || 0) > 0) {
        cost = Number(record.amount || 0) * Number(match.cost_per_unit);
      }
    }
    return cost;
  };

  useEffect(() => {
    const loadCategories = async () => {
      if (activeFarm?.id) {
        try {
          const cats = await apiService.getFarmCategories(activeFarm.id, 'animal_type');
          if (!cats._error) {
            setAnimalTypeSuggestions(cats);
          }
        } catch (error) {
          console.error("Failed to load categories:", error);
        }
        fetchFeedRecords();
        fetchBreedingRecords();
      }
    };
    loadCategories();
  }, [activeFarm?.id]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(animalSchema),
    defaultValues: {
      name: "",
      animal_type: "cow",
      breed: "",
      birth_date: "",
      gender: "female",
      weight: "",
      status: "healthy",
      notes: "",
    },
  });

  const isGroup = watch("is_group");

  // Reset form when modal closes
  useEffect(() => {
    if (!isAddModalOpen && !isEditModalOpen) {
      reset({
        name: "",
        animal_type: "cow",
        breed: "",
        birth_date: "",
        gender: "female",
        weight: "",
        status: "healthy",
        notes: "",
        is_group: false,
        count: 2,
      });
      setApiError("");
      setApiSuccess("");
    }
  }, [isAddModalOpen, isEditModalOpen, reset]);

  // Fill form when editing
  useEffect(() => {
    if (currentAnimal && isEditModalOpen) {
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      setValue("name", currentAnimal.name || "");
      setValue("animal_type", currentAnimal.animal_type || "cow");
      setValue("breed", currentAnimal.breed || "");
      setValue(
        "birth_date",
        formatDate(
          currentAnimal.birth_date ||
            currentAnimal.established_date ||
            ""
        )
      );
      setValue("gender", currentAnimal.gender || "female");
      setValue("weight", currentAnimal.weight || currentAnimal.avg_weight || "");
      setValue("status", currentAnimal.status || "healthy");
      setValue("notes", currentAnimal.notes || "");
      setValue("is_group", currentAnimal.is_group || false);
      setValue("count", currentAnimal.count || 2);
      setValue("purchase_cost", currentAnimal.purchase_cost ?? currentAnimal.purchasePrice ?? currentAnimal.purchase_price ?? "");
    }
  }, [currentAnimal, isEditModalOpen, setValue]);

  // Handle form submit
  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess("");

    try {
      const parseCommaNum = (val, isInt = false) => {
        if (val === null || val === undefined || val === "") return isInt ? 0 : null;
        const cleaned = String(val).replace(/,/g, "").trim();
        const parsed = isInt ? parseInt(cleaned, 10) : parseFloat(cleaned);
        return isNaN(parsed) ? (isInt ? 0 : null) : parsed;
      };

      const weightVal = parseCommaNum(data.weight || data.avg_weight);
      const costVal = parseCommaNum(data.purchase_cost) || 0;
      const countVal = data.is_group ? (parseCommaNum(data.count, true) || 1) : 1;

      const dateVal =
        data.birth_date && typeof data.birth_date === "string"
          ? data.birth_date.trim() || null
          : data.birth_date instanceof Date
          ? data.birth_date.toISOString().split("T")[0]
          : data.birth_date
          ? String(data.birth_date)
          : null;

      const animalData = {
        name: data.name,
        animal_type: data.animal_type,
        breed: data.breed || "",
        birth_date: dateVal,
        gender: data.gender || "female",
        weight: data.is_group ? null : weightVal,
        status: data.status || "healthy",
        notes: data.notes || "",
        is_group: !!data.is_group,
        count: countVal,
        avg_weight: data.is_group ? weightVal : null,
        established_date: data.is_group ? dateVal : null,
        purchase_cost: costVal,
        purchasePrice: costVal,
      };

      const animalCost = costVal;

      if (isEditModalOpen && currentAnimal) {
        await updateAnimal(currentAnimal.id, animalData);

        // Sync or log purchase expense if purchase_cost > 0
        if (animalCost > 0 && activeFarm?.id) {
          try {
            const existingExp = (expenses || []).find(
              (e) =>
                (e.category === "Livestock Purchase" || e.category === "livestock_purchase") &&
                (String(e.linked_animal) === String(currentAnimal.id) ||
                  (e.description && e.description.toLowerCase().includes(currentAnimal.name.toLowerCase())))
            );

            if (existingExp) {
              await apiService.patch(`/expenses/${existingExp.id}/`, {
                amount: animalCost,
                description: `Purchase of ${data.is_group ? `${data.count}x ` : ""}${data.name} (${data.animal_type})`,
                payment_method: "cash",
              });
            } else {
              await apiService.post("/expenses/", {
                farm: activeFarm.id,
                category: "Livestock Purchase",
                description: `Purchase of ${data.is_group ? `${data.count}x ` : ""}${data.name} (${data.animal_type})`,
                amount: animalCost,
                date: dateVal || new Date().toISOString().split("T")[0],
                vendor: "Livestock Supplier",
                payment_method: "cash",
                linked_animal: currentAnimal.id,
              });
            }
          } catch (expErr) {
            console.error("Failed to sync livestock purchase expense:", expErr);
          }
        }

        if (refreshData) await refreshData();

        const successMsg = `Animal "${data.name}" updated successfully!`;
        toast.success(successMsg);
        setApiSuccess(successMsg);
        setIsEditModalOpen(false);
        setCurrentAnimal(null);
      } else {
        let createdRes;
        if (data.is_group) {
          createdRes = await addAnimalGroup(animalData);
        } else {
          createdRes = await addAnimal(animalData);
        }

        const newAnimalId = createdRes?.data?.id;

        // Log Livestock Purchase Expense if cost > 0
        if (animalCost > 0 && activeFarm?.id) {
          try {
            await apiService.post("/expenses/", {
              farm: activeFarm.id,
              category: "Livestock Purchase",
              description: `Purchase of ${data.is_group ? `${data.count}x ` : ""}${data.name} (${data.animal_type})`,
              amount: animalCost,
              date: dateVal || new Date().toISOString().split("T")[0],
              vendor: "Livestock Supplier",
              payment_method: "cash",
              linked_animal: newAnimalId || null,
            });
          } catch (expErr) {
            console.error("Failed to log livestock purchase expense:", expErr);
          }
        }

        if (refreshData) await refreshData();

        const successMsg = `${data.is_group ? "Group" : "Animal"} "${data.name}" added successfully!`;
        toast.success(successMsg);
        setApiSuccess(successMsg);
        setIsAddModalOpen(false);
      }

      reset();
    } catch (error) {
      setApiError(
        error.message ||
          "An error occurred while saving the animal. Please try again."
      );
    }
  };

  // Handle edit button click
  const handleEdit = (animal) => {
    setCurrentAnimal(animal);
    setIsGroupForm(animal.is_group);
    setIsEditModalOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this animal?")) {
      deleteAnimal(id);
    }
  };

  // Defensive: ensure animals is an array
  const safeAnimals = Array.isArray(animals) ? animals : [];

  // Filter animals
  const filterAnimals = () => {
    let filteredAnimals = safeAnimals;

    // Apply type filter
    if (currentFilter !== "all") {
      filteredAnimals = filteredAnimals.filter(
        (animal) => animal.animal_type === currentFilter
      );
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredAnimals = filteredAnimals.filter(
        (animal) =>
          (animal.name || "").toLowerCase().includes(term) ||
          (animal.animal_type || "").toLowerCase().includes(term) ||
          (animal.breed || "").toLowerCase().includes(term)
      );
    }

    return filteredAnimals;
  };

  const filteredAnimals = filterAnimals();

  // Get unique animal types for filter
  const animalTypes = [
    "all",
    ...new Set(
      safeAnimals
        .map((animal) => animal.animal_type)
        .filter((type) => typeof type === "string" && type.trim().length > 0)
    ),
  ];

  const animalTypeOptions = [
    { value: "cow", label: "Cow" },
    { value: "goat", label: "Goat" },
    { value: "sheep", label: "Sheep" },
    { value: "pig", label: "Pig" },
    { value: "chicken", label: "Chicken" },
    { value: "duck", label: "Duck" },
    { value: "turkey", label: "Turkey" },
    { value: "fish", label: "Fish" },
    { value: "horse", label: "Horse" },
    { value: "other", label: "Other" },
  ];

  const genderOptions = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
  ];

  const statusOptions = [
    { value: "healthy", label: "Healthy" },
    { value: "sick", label: "Sick" },
    { value: "injured", label: "Injured" },
    { value: "pregnant", label: "Pregnant" },
    { value: "nursing", label: "Nursing" },
    { value: "quarantined", label: "Quarantined" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Animal Management</h1>
          <p className="text-xs sm:text-sm text-gray-600">Track and manage your livestock</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center w-full md:w-auto">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
            <button
              className="btn bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => {
                setSelectedFeedAnimal(null);
                setIsFeedModalOpen(true);
              }}
            >
              🌾 Log Feed
            </button>

            <button
              className="btn bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => {
                setSelectedProductionAnimal(null);
                setIsProductionModalOpen(true);
              }}
            >
              🥛 Record Yield
            </button>

            <button
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => {
                setSelectedBreedingAnimal(null);
                setIsBreedingModalOpen(true);
              }}
            >
              🧬 Add Breeding
            </button>

            <button
              className="btn bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => setIsFeedMixModalOpen(true)}
            >
              🥣 Feed Mixes
            </button>

            <button
              className="btn btn-primary col-span-2 sm:col-span-1 flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus className="mr-1.5" />
              {farmType === "large" ? "Add Group" : "Add Animal"}
            </button>
          </div>

          <div className="flex space-x-1 items-center bg-gray-200/70 p-1 rounded-xl w-full sm:w-auto justify-start sm:justify-center overflow-x-auto whitespace-nowrap">
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewTab === "animals" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewTab("animals")}
            >
              Animals ({safeAnimals.length})
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewTab === "feed_logs" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewTab("feed_logs")}
            >
              🌾 Feed Logs ({feedRecords.length})
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewTab === "breeding_logs" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewTab("breeding_logs")}
            >
              🧬 Breeding Logs ({breedingRecords.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search animals..."
            className="pl-10 input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 items-center">
          <FiFilter className="text-gray-500" />
          <select
            className="input max-w-xs"
            value={currentFilter}
            onChange={(e) => setCurrentFilter(e.target.value)}
          >
            {animalTypes.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "All Types" : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Switcher: Animals Grid vs Feed Logs Table vs Breeding Logs Table */}
      {viewTab === "animals" && (
        filteredAnimals.length === 0 ? (
          <div className="text-gray-500 bg-white p-8 rounded-xl text-center shadow-sm">No animals to display.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnimals.map((animal) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                onEdit={() => handleEdit(animal)}
                onDelete={() => handleDelete(animal.id)}
                onLogFeed={(anim) => {
                  setSelectedFeedAnimal(anim);
                  setIsFeedModalOpen(true);
                }}
                onRecordProduction={(anim) => {
                  setSelectedProductionAnimal(anim);
                  setIsProductionModalOpen(true);
                }}
                onAddBreeding={(anim) => {
                  setSelectedBreedingAnimal(anim);
                  setIsBreedingModalOpen(true);
                }}
              />
            ))}
          </div>
        )
      )}

      {viewTab === "feed_logs" && (
        /* Feed Consumption Logs Table */
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800">🌾 Feed Consumption Log History</h2>
              <p className="text-xs text-slate-500">Record of all animal & group daily feed intake and auto-deductions.</p>
            </div>
            <button
              onClick={() => {
                setSelectedFeedAnimal(null);
                setIsFeedModalOpen(true);
              }}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold"
            >
              + Log New Feed
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Animal / Group</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Feed Type</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">Amount Consumed</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">Cost</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Logged By</th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feedRecords.length > 0 ? (
                  feedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{record.date}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {record.animal_name || record.group_name || `Animal #${record.animal}`}
                      </td>
                      <td className="py-3 px-4 text-green-700 font-semibold">{record.feed_type}</td>
                      <td className="py-3 px-4 text-right font-bold">{record.amount} {record.unit}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800">{formatFarmCurrency(getFeedRecordCost(record), activeFarm)}</td>
                      <td className="py-3 px-4 font-medium text-xs text-indigo-700">{record.recorded_by_name || record.logged_by || activeFarm?.owner_name || "Adebayo Adeleke"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{record.notes || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No feed intake records found. Click <strong>"Log Feed Intake"</strong> above to record animal feeding.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewTab === "breeding_logs" && (
        /* Breeding & Pregnancy Logs Table */
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🧬 Animal Breeding & Pregnancy Logs</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                  {breedingRecords.length} Events
                </span>
              </h2>
              <p className="text-xs text-slate-500">Track all mating dates, sire/dam pairings, expected delivery dates, and breeding outcomes.</p>
            </div>
            <button
              onClick={() => {
                setSelectedBreedingAnimal(null);
                setIsBreedingModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <span>+ Add Breeding Log</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Breeding Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Dam (Female)</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Sire (Male)</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Expected Delivery</th>
                  <th className="py-3 px-4 text-center font-semibold text-slate-700">Status</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-700">Offspring (Healthy / Stillborn)</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Logged By</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Genetics & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {breedingRecords.length > 0 ? (
                  breedingRecords.map((record) => {
                    const bDate = record.breeding_date || record.delivery_date;
                    const bDateStr = bDate ? new Date(bDate).toLocaleDateString() : "N/A";
                    const expDate = record.expected_delivery_date;
                    const expDateStr = expDate ? new Date(expDate).toLocaleDateString() : "N/A";
                    const statusStr = (record.breeding_status || record.status || "planned").toLowerCase();

                    // Calculate days remaining to expected delivery
                    let daysRemaining = null;
                    if (expDate) {
                      const diffTime = new Date(expDate) - new Date();
                      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }

                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{bDateStr}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {record.dam_name || record.animal_name || "Dam"}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {record.sire_name || record.father_name_id || "Sire"}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-slate-800">{expDateStr}</span>
                          {daysRemaining !== null && statusStr !== "delivered" && statusStr !== "successful" && statusStr !== "failed" && (
                            <span className={`block text-[11px] font-bold ${daysRemaining < 0 ? "text-red-600" : daysRemaining <= 14 ? "text-amber-600 animate-pulse" : "text-emerald-600"}`}>
                              {daysRemaining < 0 ? `Overdue by ${Math.abs(daysRemaining)} days` : `Due in ${daysRemaining} days`}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            statusStr === "successful" || statusStr === "confirmed" || statusStr === "completed" || statusStr === "delivered"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : statusStr === "in_progress" || statusStr === "mated" || statusStr === "pregnant"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : statusStr === "failed" || statusStr === "cancelled"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-slate-100 text-slate-700 border border-slate-300"
                          }`}>
                            {statusStr}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                          {record.number_of_offspring ? (
                            <span className="flex items-center justify-end gap-1 text-xs">
                              <span className="text-emerald-600">{record.healthy_offspring || record.number_of_offspring} Healthy</span>
                              {record.stillborn > 0 && <span className="text-rose-600">({record.stillborn} stillborn)</span>}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-normal">Pending delivery</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-xs text-indigo-700">
                          {record.recorded_by_name || record.logged_by || activeFarm?.owner_name || "Adebayo Adeleke"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                          {record.genetics_notes || record.notes || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      No breeding records found for this farm. Click <strong>"+ Add Breeding Log"</strong> to record a new mating or breeding calendar event.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Feed Intake Modal */}
      {isFeedModalOpen && (
        <Dialog
          open={isFeedModalOpen}
          onClose={() => setIsFeedModalOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 mb-4">
                🌾 Log Animal Feed Intake
              </Dialog.Title>
              <FeedRecordForm
                animals={animals}
                activeFarmId={activeFarm?.id}
                selectedAnimalId={selectedFeedAnimal?.id || ""}
                onOpenFeedMixModal={() => {
                  setIsFeedModalOpen(false);
                  setIsFeedMixModalOpen(true);
                }}
                onSuccess={() => {
                  setIsFeedModalOpen(false);
                  fetchFeedRecords();
                  if (refreshData) refreshData();
                }}
                onCancel={() => setIsFeedModalOpen(false)}
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* Feed Mix Formulation Modal */}
      <FeedMixModal
        isOpen={isFeedMixModalOpen}
        onClose={() => setIsFeedMixModalOpen(false)}
        activeFarmId={activeFarm?.id}
        onSuccess={() => {
          fetchFeedRecords();
          if (refreshData) refreshData();
        }}
      />

      {/* Add/Edit Animal Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <Dialog
          open={isAddModalOpen || isEditModalOpen}
          onClose={() =>
            isAddModalOpen
              ? setIsAddModalOpen(false)
              : setIsEditModalOpen(false)
          }
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            {/* Modal content */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <Dialog.Title
                as="h3"
                className="text-xl font-bold text-gray-900 mb-4"
              >
                {isEditModalOpen
                  ? "Edit Animal"
                  : `Add ${isGroupForm ? "Group" : "Animal"}`}
              </Dialog.Title>

              {apiError && (
                <FormError message={apiError} onDismiss={() => setApiError("")} />
              )}

              {apiSuccess && (
                <FormSuccess message={apiSuccess} onDismiss={() => setApiSuccess("")} />
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Group/Individual toggle */}
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("is_group")}
                        onChange={(e) => {
                          register("is_group").onChange(e);
                          setIsGroupForm(e.target.checked);
                        }}
                        className="h-5 w-5 text-primary-600 rounded"
                      />
                      <span className="font-medium">
                        This is a group of animals (flock, herd, etc.)
                      </span>
                    </label>
                  </div>

                  {/* Name field */}
                  <FormField
                    label="Name"
                    type="text"
                    register={register}
                    name="name"
                    errors={errors}
                    placeholder={
                      isGroupForm ? "Group name (e.g., Flock A)" : "Animal name or tag ID"
                    }
                    helperText={isGroupForm ? "Name or label for this group/batch of animals." : "Name or ear tag ID for individual animal identification."}
                    required
                  />

                  {/* Type field */}
                  <Controller
                    name="animal_type"
                    control={control}
                    render={({ field }) => (
                      <CategoryCombobox
                        id="animal_type"
                        name="animal_type"
                        value={field.value || ""}
                        onChange={field.onChange}
                        suggestions={animalTypeSuggestions}
                        placeholder="Type or select animal type..."
                        label="Type"
                        helperText="Species or category (e.g. Cow, Goat, Chicken, Fish)."
                        required
                      />
                    )}
                  />

                  {/* Breed field */}
                  <FormField
                    label="Breed"
                    type="text"
                    register={register}
                    name="breed"
                    errors={errors}
                    placeholder="Breed (e.g. Holstein, Boer)"
                    helperText="Specific breed or genetic line."
                  />

                  {/* Date field */}
                  <FormField
                    label={isGroupForm ? "Established Date" : "Birth Date"}
                    type="date"
                    register={register}
                    name="birth_date"
                    errors={errors}
                    max={new Date().toISOString().split("T")[0]}
                    helperText={isGroupForm ? "Date this flock or herd batch was created." : "Date animal was born or acquired."}
                    required
                  />

                  {/* Status field */}
                  <SelectField
                    label="Status"
                    register={register}
                    name="status"
                    errors={errors}
                    options={statusOptions}
                    helperText="Current health or reproductive state."
                    required
                  />

                  {isGroupForm ? (
                    // Group-specific fields
                    <>
                      <NumberField
                        label="Count"
                        register={register}
                        name="count"
                        errors={errors}
                        min="2"
                        helperText="Total number of animals in this group."
                        required
                      />
                      <NumberField
                        label={`Average Weight (kg)`}
                        register={register}
                        name="weight"
                        errors={errors}
                        min="0"
                        helperText="Average weight per animal in this group."
                      />
                    </>
                  ) : (
                    // Individual animal fields
                    <>
                      <SelectField
                        label="Gender"
                        register={register}
                        name="gender"
                        errors={errors}
                        options={genderOptions}
                        helperText="Sex of the animal."
                        required
                      />
                      <NumberField
                        label={`Weight (kg)`}
                        register={register}
                        name="weight"
                        errors={errors}
                        min="0"
                        helperText="Current weight in kilograms."
                      />
                    </>
                  )}

                  {/* Purchase Cost Field */}
                  <div className="md:col-span-2">
                    <NumberField
                      label={`Purchase Price / Acquisition Cost (${getFarmCurrencySymbol(activeFarm)})`}
                      register={register}
                      name="purchase_cost"
                      errors={errors}
                      min="0"
                      step="any"
                      placeholder="0.00"
                      helperText="Purchase price paid. Automatically creates a Livestock Purchase expense entry for profit & loss analysis."
                    />
                  </div>

                  {/* Notes field - spans full width */}
                  <div className="md:col-span-2">
                    <label className="label">Notes</label>
                    <textarea
                      {...register("notes")}
                      className="input h-24"
                      placeholder="Additional notes, health information, etc."
                    ></textarea>
                    {errors.notes && (
                      <span className="text-error-500 text-sm">
                        {errors.notes.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      isAddModalOpen
                        ? setIsAddModalOpen(false)
                        : setIsEditModalOpen(false)
                    }
                  >
                    Cancel
                  </button>
                  <SubmitButton
                    label={isEditModalOpen ? "Update" : "Add"}
                    loading={isSubmitting}
                  />
                </div>
              </form>
            </div>
          </div>
        </Dialog>
      )}

      <RecordSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        initialType="animal_sales"
        onSuccess={() => setApiSuccess("Animal sale recorded successfully!")}
      />

      {isProductionModalOpen && (
        <ProductionRecordForm
          animalId={selectedProductionAnimal?.id || ""}
          animals={animals}
          onClose={() => {
            setIsProductionModalOpen(false);
            setSelectedProductionAnimal(null);
          }}
          onSuccess={() => {
            setApiSuccess("Animal production recorded & synced to Farm Inventory!");
            if (refreshData) refreshData();
          }}
        />
      )}

      {isBreedingModalOpen && (
        <BreedingRecordForm
          animalId={selectedBreedingAnimal?.id || ""}
          animals={animals}
          onClose={() => {
            setIsBreedingModalOpen(false);
            setSelectedBreedingAnimal(null);
          }}
          onSuccess={() => {
            setApiSuccess("Animal breeding record added successfully!");
            fetchBreedingRecords();
            if (refreshData) refreshData();
          }}
        />
      )}
    </div>
  );
}

export default AnimalManagement;
