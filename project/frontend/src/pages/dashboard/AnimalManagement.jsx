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
import {
  FormField,
  SelectField,
  NumberField,
  FormError,
  FormSuccess,
  SubmitButton,
} from "../../components/forms/FormComponents";
import { animalSchema } from "../../components/forms/validationSchemas";

function AnimalManagement() {
  const {
    animals,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    addAnimalGroup,
    farmType,
    setFarmType,
  } = useFarmData();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(null);
  const [isGroupForm, setIsGroupForm] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

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
    }
  }, [currentAnimal, isEditModalOpen, setValue]);

  // Handle form submit
  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess("");

    try {
      const animalData = {
        name: data.name,
        animal_type: data.animal_type,
        breed: data.breed,
        birth_date: data.birth_date,
        gender: data.gender,
        weight:
          data.is_group || !data.weight ? null : parseFloat(data.weight),
        status: data.status,
        notes: data.notes,
        is_group: data.is_group,
        count: data.is_group ? parseInt(data.count, 10) : 1,
        avg_weight: data.is_group ? parseFloat(data.weight) : null,
        established_date: data.is_group ? data.birth_date : null,
      };

      if (isEditModalOpen && currentAnimal) {
        updateAnimal(currentAnimal.id, animalData);
        setApiSuccess(
          `Animal "${data.name}" updated successfully!`
        );
        setIsEditModalOpen(false);
        setCurrentAnimal(null);
      } else {
        if (data.is_group) {
          addAnimalGroup(animalData);
        } else {
          addAnimal(animalData);
        }
        setApiSuccess(
          `${data.is_group ? "Group" : "Animal"} "${data.name}" added successfully!`
        );
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Animal Management</h1>
          <p className="text-gray-600">Track and manage your livestock</p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            {farmType === "large" ? "Add Group" : "Add Animal"}
          </button>

          <div className="flex space-x-2 items-center">
            <button
              className={`btn py-2 px-4 ${
                farmType === "small" ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => setFarmType("small")}
            >
              <FiUserPlus className="mr-2" />
              Individual
            </button>
            <button
              className={`btn py-2 px-4 ${
                farmType === "large" ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => setFarmType("large")}
            >
              <FiUsers className="mr-2" />
              Group
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

      {/* Animal List */}
      {filteredAnimals.length === 0 ? (
        <div className="text-gray-500">No animals to display.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onEdit={() => handleEdit(animal)}
              onDelete={() => handleDelete(animal.id)}
            />
          ))}
        </div>
      )}

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
                      isGroupForm ? "Group name (e.g., Flock A)" : "Animal name"
                    }
                    required
                  />

                  {/* Type field */}
                  <SelectField
                    label="Type"
                    register={register}
                    name="animal_type"
                    errors={errors}
                    options={animalTypeOptions}
                    required
                  />

                  {/* Breed field */}
                  <FormField
                    label="Breed"
                    type="text"
                    register={register}
                    name="breed"
                    errors={errors}
                    placeholder="Breed"
                  />

                  {/* Date field */}
                  <FormField
                    label={isGroupForm ? "Established Date" : "Birth Date"}
                    type="date"
                    register={register}
                    name="birth_date"
                    errors={errors}
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />

                  {/* Status field */}
                  <SelectField
                    label="Status"
                    register={register}
                    name="status"
                    errors={errors}
                    options={statusOptions}
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
                        required
                      />
                      <NumberField
                        label={`Average Weight (kg)`}
                        register={register}
                        name="weight"
                        errors={errors}
                        min="0"
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
                        required
                      />
                      <NumberField
                        label={`Weight (kg)`}
                        register={register}
                        name="weight"
                        errors={errors}
                        min="0"
                      />
                    </>
                  )}

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
    </div>
  );
}

export default AnimalManagement;
