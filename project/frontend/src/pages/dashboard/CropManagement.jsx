import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiPlus, FiSearch, FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import CategoryCombobox from "../../components/CategoryCombobox";
import apiService from "../../services/api";
import {
  FormField,
  SelectField,
  NumberField,
  FormError,
  FormSuccess,
  SubmitButton,
} from "../../components/forms/FormComponents";
import { cropSchema } from "../../components/forms/validationSchemas";
import RecordSaleModal from "../../components/forms/RecordSaleModal";
import WeatherImpactForm from "../../components/forms/WeatherImpactForm";
import FertilizerRecommendationForm from "../../components/forms/FertilizerRecommendationForm";
import CropYieldForm from "../../components/forms/CropYieldForm";
import { useToast } from "../../context/ToastContext";

function CropManagement() {
  const { activeFarm, crops, addCrop, updateCrop, deleteCrop } = useFarmData();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [currentCrop, setCurrentCrop] = useState(null);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [cropStageSuggestions, setCropStageSuggestions] = useState([]);

  const [yieldAnalysis, setYieldAnalysis] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weatherImpacts, setWeatherImpacts] = useState([]);
  const [showWeatherForm, setShowWeatherForm] = useState(false);
  const [showFertilizerForm, setShowFertilizerForm] = useState(false);
  const [showYieldForm, setShowYieldForm] = useState(false);
  const [selectedCropForModal, setSelectedCropForModal] = useState(null);
  const [viewTab, setViewTab] = useState("crops"); // "crops" | "harvest_logs" | "fertilizer_logs" | "weather_logs"

  const fetchCropLogs = async () => {
    if (activeFarm?.id) {
      try {
        const farmParams = { farm: activeFarm.id };
        const [yieldRes, recommendRes, weatherRes] = await Promise.all([
          apiService.getCropYieldAnalysis(farmParams).catch(() => []),
          apiService.getFertilizerRecommendations(farmParams).catch(() => []),
          apiService.getWeatherImpactRecords(farmParams).catch(() => []),
        ]);

        setYieldAnalysis(Array.isArray(yieldRes) ? yieldRes : yieldRes?.results || []);
        setRecommendations(Array.isArray(recommendRes) ? recommendRes : recommendRes?.results || []);
        setWeatherImpacts(Array.isArray(weatherRes) ? weatherRes : weatherRes?.results || []);
      } catch (err) {
        console.error("Failed to load crop logs:", err);
      }
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      if (activeFarm?.id) {
        try {
          const cats = await apiService.getFarmCategories(activeFarm.id, 'crop_stage');
          if (!cats._error) {
            setCropStageSuggestions(cats);
          }
        } catch (error) {
          console.error("Failed to load categories:", error);
        }
        fetchCropLogs();
      }
    };
    loadCategories();
  }, [activeFarm?.id]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = useForm({
    resolver: yupResolver(cropSchema),
    defaultValues: {
      name: "",
      field: "",
      area: "",
      planted_date: "",
      expected_harvest_date: "",
      status: "planning",
      stage: "planning",
      notes: "",
    },
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString();
  };

  // Calculate days until harvest
  const daysUntilHarvest = (plantedDate, harvestDate) => {
    if (!plantedDate || !harvestDate) return "N/A";
    const planted = new Date(plantedDate);
    const harvest = new Date(harvestDate);
    const today = new Date();

    if (Number.isNaN(planted.getTime()) || Number.isNaN(harvest.getTime())) {
      return "N/A";
    }

    if (today > harvest) {
      return "Overdue";
    }

    const diffTime = Math.abs(harvest - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate progress percentage
  const calculateProgress = (plantedDate, harvestDate) => {
    if (!plantedDate || !harvestDate) return 0;
    const planted = new Date(plantedDate);
    const harvest = new Date(harvestDate);
    const today = new Date();

    if (Number.isNaN(planted.getTime()) || Number.isNaN(harvest.getTime())) {
      return 0;
    }

    if (today < planted) return 0;
    if (today > harvest) return 100;

    const totalDuration = harvest - planted;
    const elapsed = today - planted;

    return Math.round((elapsed / totalDuration) * 100);
  };

  // Defensive: ensure crops is an array
  const safeCrops = Array.isArray(crops) ? crops : [];

  // Filter crops based on search
  const filteredCrops = safeCrops.filter(
    (crop) =>
      (crop.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (crop.field || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submit
  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess("");

    try {
      const formatDateStr = (d) => {
        if (!d) return new Date().toISOString().split("T")[0];
        const s = String(d).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        try {
          return new Date(s).toISOString().split("T")[0];
        } catch {
          return s.split("T")[0];
        }
      };

      const basePlantedDate = formatDateStr(data.planted_date);
      const baseHarvestDate = formatDateStr(data.expected_harvest_date);

      // Create growth stages if adding new crop
      const growthStages = !isEditModalOpen
        ? [
            {
              stage: "planting",
              date: basePlantedDate,
              completed: true,
              notes: "Initial planting",
            },
            {
              stage: "emergence",
              date: formatDateStr(
                new Date(
                  new Date(basePlantedDate).getTime() + 14 * 24 * 60 * 60 * 1000
                )
              ),
              completed: false,
              notes: "",
            },
            {
              stage: "maturation",
              date: formatDateStr(
                new Date(
                  new Date(basePlantedDate).getTime() + 30 * 24 * 60 * 60 * 1000
                )
              ),
              completed: false,
              notes: "",
            },
            {
              stage: "harvest",
              date: baseHarvestDate,
              completed: false,
              notes: "",
            },
          ]
        : undefined;

      const todayStr = new Date().toISOString().split("T")[0];
      const defaultHarvestStr = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const cropData = {
        name: data.name,
        field: data.field,
        area: parseFloat(data.area) || 1.0,
        planted_date: basePlantedDate && basePlantedDate !== "" ? basePlantedDate : todayStr,
        expected_harvest_date: baseHarvestDate && baseHarvestDate !== "" ? baseHarvestDate : defaultHarvestStr,
        status: data.status || 'growing',
        stage: data.stage || 'Vegetative',
        notes: data.notes || '',
        ...(growthStages && { growth_stages: growthStages }),
      };

      if (isEditModalOpen && currentCrop) {
        updateCrop(currentCrop.id, cropData);
        const msg = `Crop "${data.name}" updated successfully!`;
        toast.success(msg);
        setApiSuccess(msg);
        setIsEditModalOpen(false);
        setCurrentCrop(null);
      } else {
        addCrop(cropData);
        const msg = `Crop "${data.name}" added successfully!`;
        toast.success(msg);
        setApiSuccess(msg);
        setIsAddModalOpen(false);
      }

      reset();
    } catch (error) {
      setApiError(
        error.message ||
          "An error occurred while saving the crop. Please try again."
      );
    }
  };

  // Handle edit button click
  const handleEdit = (crop) => {
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    setCurrentCrop(crop);
    setValue("name", crop.name || "");
    setValue("field", crop.field || "");
    setValue("area", crop.area ? String(crop.area) : "");
    setValue("planted_date", formatDateForInput(crop.planted_date || ""));
    setValue("expected_harvest_date", formatDateForInput(crop.expected_harvest_date || ""));
    setValue("status", crop.status || "planning");
    setValue("stage", crop.stage || "planning");
    setValue("notes", crop.notes || "");
    setIsEditModalOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this crop?")) {
      deleteCrop(id);
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "planning":
        return "bg-gray-100 text-gray-800";
      case "growing":
        return "bg-primary-100 text-primary-800";
      case "harvesting":
        return "bg-accent-100 text-accent-800";
      case "completed":
        return "bg-success-100 text-success-800";
      case "failed":
        return "bg-error-100 text-error-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusOptions = [
    { value: "planning", label: "Planning" },
    { value: "growing", label: "Growing" },
    { value: "harvesting", label: "Harvesting" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
  ];

  const stageOptions = [
    { value: "planning", label: "Planning" },
    { value: "planting", label: "Planting" },
    { value: "emergence", label: "Emergence" },
    { value: "maturation", label: "Maturation" },
    { value: "harvest", label: "Harvest" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Crop Management</h1>
          <p className="text-xs sm:text-sm text-gray-600">Plan and monitor your crops</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center w-full md:w-auto">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
            <button
              className="btn bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => {
                setSelectedCropForModal(null);
                setShowWeatherForm(true);
              }}
            >
              ⛅ Weather
            </button>

            <button
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => {
                setSelectedCropForModal(null);
                setShowFertilizerForm(true);
              }}
            >
              🌱 Fert Rec
            </button>

            <button
              className="btn bg-sky-600 hover:bg-sky-700 text-white font-medium flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => {
                setSelectedCropForModal(null);
                setShowYieldForm(true);
              }}
            >
              🌾 Record Yield
            </button>

            <button
              className="btn btn-primary col-span-2 sm:col-span-1 flex items-center justify-center text-xs sm:text-sm py-2 px-3 shadow-xs"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus className="mr-1.5" />
              Add Crop
            </button>
          </div>

          <div className="flex space-x-1 items-center bg-gray-200/70 p-1 rounded-xl w-full sm:w-auto justify-start sm:justify-center overflow-x-auto whitespace-nowrap">
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewTab === "crops" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewTab("crops")}
            >
              Crops ({safeCrops.length})
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewTab === "harvest_logs" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewTab("harvest_logs")}
            >
              🌾 Yield Logs ({yieldAnalysis.length})
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewTab === "fertilizer_logs" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewTab("fertilizer_logs")}
            >
              🌱 Fert ({recommendations.length})
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewTab === "weather_logs" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setViewTab("weather_logs")}
            >
              ⛅ Weather ({weatherImpacts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 flex">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search crops by name or field..."
            className="pl-10 input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Crop List View */}
      {viewTab === "crops" && (
        filteredCrops.length === 0 ? (
          <div className="text-gray-500 bg-white p-8 rounded-xl text-center shadow-sm">No crops to display.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.map((crop) => (
              <motion.div
                key={crop.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-xl font-bold">{crop.name}</h3>
                        <span
                          className={`ml-3 badge ${getStatusColor(crop.status)}`}
                        >
                          {crop.status}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-600">
                        {crop.field} ({crop.area} acres)
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedCropForModal(crop);
                          setShowYieldForm(true);
                        }}
                        className="px-2 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg flex items-center gap-0.5 transition-colors shadow-2xs"
                        title="Record harvest yield for this crop"
                      >
                        <span>🌾 Yield</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCropForModal(crop);
                          setShowFertilizerForm(true);
                        }}
                        className="px-2 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-0.5 transition-colors shadow-2xs"
                        title="Log fertilizer recommendation"
                      >
                        <span>🌱 Fert</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCropForModal(crop);
                          setShowWeatherForm(true);
                        }}
                        className="px-2 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-0.5 transition-colors shadow-2xs"
                        title="Record weather impact"
                      >
                        <span>⛅ Weather</span>
                      </button>
                      <button
                        onClick={() => handleEdit(crop)}
                        className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full"
                        aria-label="Edit crop"
                        title="Edit crop"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(crop.id)}
                        className="p-1.5 text-gray-500 hover:text-error-500 hover:bg-error-50 rounded-full"
                        aria-label="Delete crop"
                        title="Delete crop"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Planted</p>
                      <p className="font-medium">
                        {formatDate(crop.plantedDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Expected Harvest</p>
                      <p className="font-medium">
                        {formatDate(crop.expectedHarvestDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Current Stage</p>
                      <p className="font-medium">{crop.stage}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Days to Harvest</p>
                      <p className="font-medium">
                        {typeof daysUntilHarvest(
                          crop.plantedDate,
                          crop.expectedHarvestDate
                        ) === "number"
                          ? `${daysUntilHarvest(
                              crop.plantedDate,
                              crop.expectedHarvestDate
                            )} days`
                          : daysUntilHarvest(
                              crop.plantedDate,
                              crop.expectedHarvestDate
                            )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>
                        {calculateProgress(
                          crop.plantedDate,
                          crop.expectedHarvestDate
                        )}
                        %
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary-500 h-2"
                        style={{
                          width: `${calculateProgress(
                            crop.plantedDate,
                            crop.expectedHarvestDate
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Growth Stage Timeline */}
                  <div className="mt-6">
                    <h4 className="font-medium text-sm mb-3">Growth Timeline</h4>
                    <div className="relative">
                      <div className="absolute top-3 left-3 h-full w-0.5 bg-gray-200 -z-10"></div>
                      <div className="space-y-4">
                        {(Array.isArray(crop.growthStages)
                          ? crop.growthStages
                          : []
                        ).map((stage, index) => (
                          <div key={index} className="flex">
                            <div
                              className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                                stage.completed
                                  ? "bg-primary-500 text-white"
                                  : "bg-gray-200"
                              }`}
                            >
                              {stage.completed ? "✓" : ""}
                            </div>
                            <div className="ml-3">
                              <div className="flex justify-between">
                                <p className="font-medium">{stage.stage}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(stage.date)}
                                </p>
                              </div>
                              {stage.notes && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {stage.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {crop.notes && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{crop.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Harvest Yield Logs Table */}
      {viewTab === "harvest_logs" && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🌾 Harvest Yield & ROI Analysis Logs</span>
                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-semibold">
                  {yieldAnalysis.length} Logs
                </span>
              </h2>
              <p className="text-xs text-slate-500">Record of actual vs expected harvest yields, production costs, and ROI %.</p>
            </div>
            <button
              onClick={() => {
                setSelectedCropForModal(null);
                setShowYieldForm(true);
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <span>+ Record Harvest Yield</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Crop</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Season / Year</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-700">Expected Yield</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-700">Actual Yield</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-700">ROI %</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Logged By</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {yieldAnalysis.length > 0 ? (
                  yieldAnalysis.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.crop_name || item.crop?.name || `Crop #${item.crop}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{item.season || "N/A"}</td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                        {item.expected_yield || 0} {item.yield_unit || "kg"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-sky-700">
                        {item.actual_yield || 0} {item.yield_unit || "kg"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {item.roi_percentage ? `${item.roi_percentage}%` : item.roi ? `${item.roi}%` : "0%"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-xs text-indigo-700">
                        {item.recorded_by_name || item.logged_by || activeFarm?.owner_name || "Adebayo Adeleke"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">{item.notes || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No harvest yield records found. Click <strong>"+ Record Harvest Yield"</strong> above to log your crop output.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fertilizer Recommendations Table */}
      {viewTab === "fertilizer_logs" && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>🌱 Fertilizer Recommendation Logs</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  {recommendations.length} Recs
                </span>
              </h2>
              <p className="text-xs text-slate-500">Log of soil test fertilizer type, recommended quantity, and application schedules.</p>
            </div>
            <button
              onClick={() => {
                setSelectedCropForModal(null);
                setShowFertilizerForm(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <span>+ Log Fert Rec</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Crop</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Fertilizer Type</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-700">Recommended Qty</th>
                  <th className="py-3 px-4 text-center font-semibold text-slate-700">Status</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Logged By</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Application Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recommendations.length > 0 ? (
                  recommendations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{rec.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {rec.crop_name || rec.crop?.name || `Crop #${rec.crop}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-700 capitalize">{rec.fertilizer_type}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {rec.recommended_quantity || 0} {rec.unit || "kg"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          rec.status === "completed" || rec.status === "applied"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : rec.status === "pending" || rec.status === "active"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}>
                          {rec.status || "active"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-xs text-indigo-700">
                        {rec.recorded_by_name || rec.logged_by || activeFarm?.owner_name || "Adebayo Adeleke"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{rec.application_window || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No fertilizer recommendations logged yet. Click <strong>"+ Log Fert Rec"</strong> to add a new soil nutrient log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weather Impact Records Table */}
      {viewTab === "weather_logs" && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>⛅ Weather Impact & Recovery Records</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                  {weatherImpacts.length} Events
                </span>
              </h2>
              <p className="text-xs text-slate-500">Record of severe weather events (droughts, floods, hail), yield loss estimates, and recovery strategies.</p>
            </div>
            <button
              onClick={() => {
                setSelectedCropForModal(null);
                setShowWeatherForm(true);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <span>+ Record Weather Impact</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Impact Date</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Crop</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Weather Event</th>
                  <th className="py-3 px-4 text-center font-semibold text-slate-700">Severity</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-700">Estimated Yield Loss</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Logged By</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Recovery Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {weatherImpacts.length > 0 ? (
                  weatherImpacts.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{w.impact_date || w.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {w.crop_name || w.crop?.name || `Crop #${w.crop}`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-800 capitalize">{w.impact_type || w.weather_event}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          w.severity === "high" || w.severity === "critical"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : w.severity === "medium"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300"
                        }`}>
                          {w.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {w.estimated_yield_loss || w.yield_loss || 0}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-xs text-indigo-700">
                        {w.recorded_by_name || w.logged_by || activeFarm?.owner_name || "Adebayo Adeleke"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">{w.recovery_strategy || w.description || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No weather impact events recorded. Click <strong>"+ Record Weather Impact"</strong> to log climate events.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Crop Modal */}
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
                {isEditModalOpen ? "Edit Crop" : "Add Crop"}
              </Dialog.Title>

              {apiError && (
                <FormError message={apiError} onDismiss={() => setApiError("")} />
              )}

              {apiSuccess && (
                <FormSuccess message={apiSuccess} onDismiss={() => setApiSuccess("")} />
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Crop name */}
                  <FormField
                    label="Crop Name"
                    type="text"
                    register={register}
                    name="name"
                    errors={errors}
                    placeholder="e.g., Corn, Cassava, Tomatoes"
                    helperText="Name or type of crop being cultivated."
                    required
                  />

                  {/* Field location */}
                  <FormField
                    label="Field/Location"
                    type="text"
                    register={register}
                    name="field"
                    errors={errors}
                    placeholder="e.g., Field A, Greenhouse 2"
                    helperText="Field plot, bed, or greenhouse location."
                    required
                  />

                  {/* Area */}
                  <NumberField
                    label="Area (acres)"
                    register={register}
                    name="area"
                    errors={errors}
                    placeholder="e.g., 5.5"
                    min="0.01"
                    helperText="Land area occupied by this crop batch in acres."
                    required
                  />

                  {/* Status */}
                  <SelectField
                    label="Status"
                    register={register}
                    name="status"
                    errors={errors}
                    options={statusOptions}
                    helperText="Overall status (Planning, Growing, Harvesting, Completed)."
                    required
                  />

                  {/* Planted date */}
                  <FormField
                    label="Planted Date"
                    type="date"
                    register={register}
                    name="planted_date"
                    errors={errors}
                    max={new Date().toISOString().split("T")[0]}
                    helperText="Date when seeds or seedlings were planted."
                    required
                  />

                  {/* Expected harvest date */}
                  <FormField
                    label="Expected Harvest Date"
                    type="date"
                    register={register}
                    name="expected_harvest_date"
                    errors={errors}
                    helperText="Estimated harvest date based on crop maturity cycle."
                    required
                  />

                  {/* Current stage */}
                  <Controller
                    name="stage"
                    control={control}
                    render={({ field }) => (
                      <CategoryCombobox
                        id="stage"
                        name="stage"
                        value={field.value || ""}
                        onChange={field.onChange}
                        suggestions={cropStageSuggestions}
                        placeholder="Type or select growth stage..."
                        label="Current Growth Stage"
                        helperText="Growth phase (e.g. Vegetative, Flowering, Harvesting)."
                        required
                      />
                    )}
                  />

                  {/* Notes field - spans full width */}
                  <div className="md:col-span-2">
                    <label className="label">Notes</label>
                    <textarea
                      {...register("notes")}
                      className="input h-24"
                      placeholder="Additional notes, planting details, etc."
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
        initialType="crop_sales"
        onSuccess={() => setApiSuccess("Crop sale recorded successfully!")}
      />

      {/* Weather Impact Form Modal */}
      {showWeatherForm && (
        <WeatherImpactForm
          crops={crops}
          cropId={selectedCropForModal?.id || ""}
          onClose={() => {
            setShowWeatherForm(false);
            setSelectedCropForModal(null);
          }}
          onSuccess={() => {
            setShowWeatherForm(false);
            setSelectedCropForModal(null);
            toast.success("Weather impact recorded successfully!");
            fetchCropLogs();
          }}
        />
      )}

      {/* Fertilizer Recommendation Form Modal */}
      {showFertilizerForm && (
        <FertilizerRecommendationForm
          crops={crops}
          cropId={selectedCropForModal?.id || ""}
          onClose={() => {
            setShowFertilizerForm(false);
            setSelectedCropForModal(null);
          }}
          onSuccess={() => {
            setShowFertilizerForm(false);
            setSelectedCropForModal(null);
            toast.success("Fertilizer recommendation saved successfully!");
            fetchCropLogs();
          }}
        />
      )}

      {/* Crop Yield Form Modal */}
      {showYieldForm && (
        <CropYieldForm
          crops={crops}
          cropId={selectedCropForModal?.id || ""}
          onClose={() => {
            setShowYieldForm(false);
            setSelectedCropForModal(null);
          }}
          onSuccess={() => {
            setShowYieldForm(false);
            setSelectedCropForModal(null);
            toast.success("Crop yield recorded successfully!");
            fetchCropLogs();
          }}
        />
      )}
    </div>
  );
}

export default CropManagement;
