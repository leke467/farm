import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiPlus, FiCheck, FiAlertCircle, FiFilter, FiX } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FormField, SelectField, DateField, TextAreaField } from "../../components/forms/FormComponents";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";

const HealthAlerts = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();
  
  const [alerts, setAlerts] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [breedingCalendars, setBreedingCalendars] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddAlertModalOpen, setIsAddAlertModalOpen] = useState(false);
  const [isAddVaccineModalOpen, setIsAddVaccineModalOpen] = useState(false);
  const [isAddBreedingModalOpen, setIsAddBreedingModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  // Alert form
  const {
    register: registerAlert,
    handleSubmit: handleAlertSubmit,
    formState: { errors: alertErrors, isSubmitting: isAlertSubmitting },
    reset: resetAlert,
  } = useForm({
    defaultValues: {
      animal: "",
      alert_type: "vaccination_due",
      priority: "medium",
      title: "",
      description: "",
      due_date: "",
    },
  });

  // Vaccination form
  const {
    register: registerVaccine,
    handleSubmit: handleVaccineSubmit,
    formState: { errors: vaccineErrors, isSubmitting: isVaccineSubmitting },
    reset: resetVaccine,
  } = useForm({
    defaultValues: {
      animal: "",
      vaccine_type: "rabies",
      scheduled_date: "",
      status: "scheduled",
    },
  });

  // Breeding form
  const {
    register: registerBreeding,
    handleSubmit: handleBreedingSubmit,
    formState: { errors: breedingErrors, isSubmitting: isBreedingSubmitting },
    reset: resetBreeding,
  } = useForm({
    defaultValues: {
      animal: "",
      breeding_date: "",
      partner_animal_name: "",
      status: "planning",
    },
  });

  useEffect(() => {
    if (activeFarm?.id) {
      fetchHealthData();
    }
  }, [activeFarm?.id, token]);

  const fetchHealthData = async () => {
    setIsLoading(true);
    try {
      const [alertsRes, vaccsRes, breedingRes, animalsRes] = await Promise.all([
        apiService.get("/api/animals/health-alerts/"),
        apiService.get("/api/animals/vaccinations/"),
        apiService.get("/api/animals/breeding/"),
        apiService.get("/api/animals/"),
      ]);

      setAlerts(alertsRes.data);
      setVaccinations(vaccsRes.data);
      setBreedingCalendars(breedingRes.data);
      setAnimals(animalsRes.data);
    } catch (error) {
      setApiError("Failed to load health data");
      console.error("Error fetching health data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onAlertSubmit = async (data) => {
    try {
      await apiService.post("/api/animals/health-alerts/", data);
      setApiSuccess("Health alert created successfully!");
      resetAlert();
      setIsAddAlertModalOpen(false);
      fetchHealthData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to create health alert");
    }
  };

  const onVaccineSubmit = async (data) => {
    try {
      await apiService.post("/api/animals/vaccinations/", data);
      setApiSuccess("Vaccination scheduled successfully!");
      resetVaccine();
      setIsAddVaccineModalOpen(false);
      fetchHealthData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to schedule vaccination");
    }
  };

  const onBreedingSubmit = async (data) => {
    try {
      await apiService.post("/api/animals/breeding/", data);
      setApiSuccess("Breeding calendar created successfully!");
      resetBreeding();
      setIsAddBreedingModalOpen(false);
      fetchHealthData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to create breeding calendar");
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiService.patch(`/api/animals/health-alerts/${alertId}/`, {
        status: "acknowledged",
      });
      fetchHealthData();
      setApiSuccess("Alert acknowledged!");
      setTimeout(() => setApiSuccess(""), 2000);
    } catch (error) {
      setApiError("Failed to acknowledge alert");
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await apiService.patch(`/api/animals/health-alerts/${alertId}/`, {
        status: "resolved",
      });
      fetchHealthData();
      setApiSuccess("Alert resolved!");
      setTimeout(() => setApiSuccess(""), 2000);
    } catch (error) {
      setApiError("Failed to resolve alert");
    }
  };

  const handleDeleteAlert = (alertId) => {
    if (window.confirm("Are you sure you want to delete this alert?")) {
      apiService.delete(`/api/animals/health-alerts/${alertId}/`).then(() => {
        fetchHealthData();
        setApiSuccess("Alert deleted!");
        setTimeout(() => setApiSuccess(""), 2000);
      });
    }
  };

  // Filters
  const filteredAlerts = alerts.filter((alert) => {
    let matches = true;
    if (filterPriority !== "all") matches = matches && alert.priority === filterPriority;
    if (filterStatus !== "all") matches = matches && alert.status === filterStatus;
    return matches;
  });

  // Stats
  const activeAlerts = alerts.filter((a) => a.status === "active").length;
  const overdueVaccines = vaccinations.filter((v) => v.status === "overdue").length;
  const upcomingBreedings = breedingCalendars.filter((b) => b.status === "planning").length;

  // Animals dropdown
  const animalOptions = animals.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.animal_type})`,
  }));

  // Priority and status options
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  const alertTypeOptions = [
    { value: "vaccination_due", label: "Vaccination Due" },
    { value: "medical_followup", label: "Medical Follow-up" },
    { value: "breeding_due", label: "Breeding Due" },
    { value: "weight_concern", label: "Weight Concern" },
    { value: "feed_low", label: "Feed Low" },
    { value: "health_status", label: "Health Status Change" },
    { value: "quarantine_reminder", label: "Quarantine Reminder" },
    { value: "other", label: "Other" },
  ];

  const vaccineTypeOptions = [
    { value: "rabies", label: "Rabies" },
    { value: "fmd", label: "Foot and Mouth Disease" },
    { value: "brucellosis", label: "Brucellosis" },
    { value: "tuberculosis", label: "Tuberculosis" },
    { value: "lumpy_skin", label: "Lumpy Skin Disease" },
    { value: "anthrax", label: "Anthrax" },
    { value: "rotavirus", label: "Rotavirus" },
    { value: "clostridium", label: "Clostridium" },
    { value: "newcastle", label: "Newcastle Disease" },
    { value: "coccidiosis", label: "Coccidiosis" },
    { value: "other", label: "Other" },
  ];

  const breedingStatusOptions = [
    { value: "planning", label: "Planning" },
    { value: "in_progress", label: "In Progress" },
    { value: "confirmed", label: "Confirmed Pregnant" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Health Alerts</h1>
          <p className="text-gray-600">Monitor vaccinations, breeding, and animal health</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => setIsAddAlertModalOpen(true)}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" /> New Alert
          </button>
          <button
            onClick={() => setIsAddVaccineModalOpen(true)}
            className="btn btn-secondary flex items-center"
          >
            <FiPlus className="mr-2" /> Schedule Vaccine
          </button>
          <button
            onClick={() => setIsAddBreedingModalOpen(true)}
            className="btn btn-secondary flex items-center"
          >
            <FiPlus className="mr-2" /> Add Breeding
          </button>
        </div>
      </div>

      {/* Success/Error messages */}
      {apiSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{apiSuccess}</span>
          <button onClick={() => setApiSuccess("")} className="text-green-600"><FiX /></button>
        </div>
      )}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{apiError}</span>
          <button onClick={() => setApiError("")} className="text-red-600"><FiX /></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Active Alerts</p>
          <p className="text-3xl font-bold text-gray-900">{activeAlerts}</p>
          <p className="text-xs text-gray-500 mt-2">Require immediate attention</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm font-medium">Overdue Vaccinations</p>
          <p className="text-3xl font-bold text-gray-900">{overdueVaccines}</p>
          <p className="text-xs text-gray-500 mt-2">Schedule immediately</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Upcoming Breedings</p>
          <p className="text-3xl font-bold text-gray-900">{upcomingBreedings}</p>
          <p className="text-xs text-gray-500 mt-2">In planning stage</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4 items-center">
        <FiFilter className="text-gray-400" />
        <div className="flex gap-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Health Alerts Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiAlertCircle className="text-red-500" /> Health Alerts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Animal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Alert Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {alert.animal_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {alert.alert_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{alert.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {alert.due_date || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {alert.status === "active" && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== "resolved" && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No health alerts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vaccinations Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiCheck className="text-green-500" /> Vaccination Schedule
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Animal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Vaccine Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Scheduled Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Veterinarian
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vaccinations.length > 0 ? (
                vaccinations.map((vac) => (
                  <tr key={vac.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {vac.animal_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {vac.vaccine_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(vac.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vac.status)}`}>
                        {vac.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {vac.veterinarian || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No vaccinations scheduled
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breeding Calendar Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Breeding Calendar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Animal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Breeding Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {breedingCalendars.length > 0 ? (
                breedingCalendars.map((breeding) => (
                  <tr key={breeding.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {breeding.animal_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {breeding.partner_animal_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(breeding.breeding_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {breeding.expected_delivery_date
                        ? new Date(breeding.expected_delivery_date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(breeding.status)}`}>
                        {breeding.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No breeding calendars found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Health Alert Modal */}
      <Transition appear show={isAddAlertModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsAddAlertModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold mb-4">
                    Create Health Alert
                  </Dialog.Title>

                  <form onSubmit={handleAlertSubmit(onAlertSubmit)} className="space-y-4">
                    <SelectField
                      register={registerAlert}
                      name="animal"
                      label="Animal"
                      options={animalOptions}
                      errors={alertErrors}
                    />

                    <SelectField
                      register={registerAlert}
                      name="alert_type"
                      label="Alert Type"
                      options={alertTypeOptions}
                      errors={alertErrors}
                    />

                    <FormField
                      register={registerAlert}
                      name="title"
                      label="Title"
                      type="text"
                      errors={alertErrors}
                    />

                    <TextAreaField
                      register={registerAlert}
                      name="description"
                      label="Description"
                      errors={alertErrors}
                      rows={3}
                    />

                    <SelectField
                      register={registerAlert}
                      name="priority"
                      label="Priority"
                      options={priorityOptions}
                      errors={alertErrors}
                    />

                    <DateField
                      register={registerAlert}
                      name="due_date"
                      label="Due Date (Optional)"
                      errors={alertErrors}
                    />

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={isAlertSubmitting}
                        className="flex-1 btn btn-primary"
                      >
                        {isAlertSubmitting ? "Creating..." : "Create Alert"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddAlertModalOpen(false)}
                        className="flex-1 btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Vaccination Modal */}
      <Transition appear show={isAddVaccineModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsAddVaccineModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold mb-4">
                    Schedule Vaccination
                  </Dialog.Title>

                  <form onSubmit={handleVaccineSubmit(onVaccineSubmit)} className="space-y-4">
                    <SelectField
                      register={registerVaccine}
                      name="animal"
                      label="Animal"
                      options={animalOptions}
                      errors={vaccineErrors}
                    />

                    <SelectField
                      register={registerVaccine}
                      name="vaccine_type"
                      label="Vaccine Type"
                      options={vaccineTypeOptions}
                      errors={vaccineErrors}
                    />

                    <DateField
                      register={registerVaccine}
                      name="scheduled_date"
                      label="Scheduled Date"
                      errors={vaccineErrors}
                    />

                    <SelectField
                      register={registerVaccine}
                      name="status"
                      label="Status"
                      options={[
                        { value: "scheduled", label: "Scheduled" },
                        { value: "completed", label: "Completed" },
                        { value: "cancelled", label: "Cancelled" },
                      ]}
                      errors={vaccineErrors}
                    />

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={isVaccineSubmitting}
                        className="flex-1 btn btn-primary"
                      >
                        {isVaccineSubmitting ? "Scheduling..." : "Schedule"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddVaccineModalOpen(false)}
                        className="flex-1 btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Breeding Calendar Modal */}
      <Transition appear show={isAddBreedingModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsAddBreedingModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold mb-4">
                    Add Breeding Calendar Entry
                  </Dialog.Title>

                  <form onSubmit={handleBreedingSubmit(onBreedingSubmit)} className="space-y-4">
                    <SelectField
                      register={registerBreeding}
                      name="animal"
                      label="Animal"
                      options={animalOptions}
                      errors={breedingErrors}
                    />

                    <FormField
                      register={registerBreeding}
                      name="partner_animal_name"
                      label="Partner Animal Name (Optional)"
                      type="text"
                      errors={breedingErrors}
                    />

                    <DateField
                      register={registerBreeding}
                      name="breeding_date"
                      label="Breeding Date"
                      errors={breedingErrors}
                    />

                    <SelectField
                      register={registerBreeding}
                      name="status"
                      label="Status"
                      options={breedingStatusOptions}
                      errors={breedingErrors}
                    />

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={isBreedingSubmitting}
                        className="flex-1 btn btn-primary"
                      >
                        {isBreedingSubmitting ? "Creating..." : "Create"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddBreedingModalOpen(false)}
                        className="flex-1 btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default HealthAlerts;
