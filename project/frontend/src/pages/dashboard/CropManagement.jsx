import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiPlus, FiSearch, FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  FormField,
  SelectField,
  NumberField,
  FormError,
  FormSuccess,
  SubmitButton,
} from "../../components/forms/FormComponents";
import { cropSchema } from "../../components/forms/validationSchemas";

function CropManagement() {
  const { crops, addCrop, updateCrop, deleteCrop } = useFarmData();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCrop, setCurrentCrop] = useState(null);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
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
      // Create growth stages if adding new crop
      const growthStages = !isEditModalOpen
        ? [
            {
              stage: "planting",
              date: data.planted_date,
              completed: true,
              notes: "Initial planting",
            },
            {
              stage: "emergence",
              date: new Date(
                new Date(data.planted_date).getTime() + 14 * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split("T")[0],
              completed: false,
              notes: "",
            },
            {
              stage: "maturation",
              date: new Date(
                new Date(data.planted_date).getTime() + 30 * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split("T")[0],
              completed: false,
              notes: "",
            },
            {
              stage: "harvest",
              date: data.expected_harvest_date,
              completed: false,
              notes: "",
            },
          ]
        : undefined;

      const cropData = {
        name: data.name,
        field: data.field,
        area: parseFloat(data.area),
        planted_date: data.planted_date,
        expected_harvest_date: data.expected_harvest_date,
        status: data.status,
        stage: data.stage,
        notes: data.notes,
        ...(growthStages && { growth_stages: growthStages }),
      };

      if (isEditModalOpen && currentCrop) {
        updateCrop(currentCrop.id, cropData);
        setApiSuccess(`Crop "${data.name}" updated successfully!`);
        setIsEditModalOpen(false);
        setCurrentCrop(null);
      } else {
        addCrop(cropData);
        setApiSuccess(`Crop "${data.name}" added successfully!`);
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Crop Management</h1>
          <p className="text-gray-600">Plan and monitor your crops</p>
        </div>

        <div className="mt-4 md:mt-0">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Crop
          </button>
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

      {/* Crop List */}
      {filteredCrops.length === 0 ? (
        <div className="text-gray-500">No crops to display.</div>
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
                <div className="flex justify-between items-start">
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(crop)}
                      className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full"
                      aria-label="Edit crop"
                      title="Edit crop"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(crop.id)}
                      className="p-2 text-gray-500 hover:text-error-500 hover:bg-error-50 rounded-full"
                      aria-label="Delete crop"
                      title="Delete crop"
                    >
                      <FiTrash2 size={18} />
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
                    placeholder="e.g., Corn, Tomatoes"
                    required
                  />

                  {/* Field location */}
                  <FormField
                    label="Field/Location"
                    type="text"
                    register={register}
                    name="field"
                    errors={errors}
                    placeholder="e.g., Field A"
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
                    required
                  />

                  {/* Status */}
                  <SelectField
                    label="Status"
                    register={register}
                    name="status"
                    errors={errors}
                    options={statusOptions}
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
                    required
                  />

                  {/* Expected harvest date */}
                  <FormField
                    label="Expected Harvest Date"
                    type="date"
                    register={register}
                    name="expected_harvest_date"
                    errors={errors}
                    required
                  />

                  {/* Current stage */}
                  <SelectField
                    label="Current Growth Stage"
                    register={register}
                    name="stage"
                    errors={errors}
                    options={stageOptions}
                    required
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
    </div>
  );
}

export default CropManagement;
