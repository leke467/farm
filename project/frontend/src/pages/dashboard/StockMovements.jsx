import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FiPlus, FiFilter, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FormField, SelectField, DateField, NumberField } from "../../components/forms/FormComponents";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";

// Validation schema
const movementSchema = yup.object().shape({
  item_id: yup.number().required("Item is required"),
  movement_type: yup.string().required("Movement type is required"),
  quantity: yup.number().positive("Quantity must be greater than 0").required("Quantity is required"),
  batch_number: yup.string().max(100, "Batch number must be less than 100 characters"),
  source_location: yup.string().max(200, "Source location must be less than 200 characters"),
  destination_location: yup.string().max(200, "Destination location must be less than 200 characters"),
  movement_date: yup.date().required("Movement date is required"),
  description: yup.string().max(500, "Description must be less than 500 characters"),
});

const StockMovements = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();

  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(movementSchema),
  });

  useEffect(() => {
    if (activeFarm?.id) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [movRes, itemRes] = await Promise.all([
        apiService.get("/api/inventory/movements/"),
        apiService.get("/api/inventory/"),
      ]);

      setMovements(movRes.data);
      setItems(itemRes.data);
    } catch (error) {
      setApiError("Failed to load stock movement data");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await apiService.post("/api/inventory/movements/", data);
      setApiSuccess("Stock movement recorded successfully!");
      reset();
      setIsAddModalOpen(false);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to record movement");
    }
  };

  const handleDelete = (movementId) => {
    if (window.confirm("Are you sure you want to delete this movement?")) {
      apiService.delete(`/api/inventory/movements/${movementId}/`).then(() => {
        fetchData();
        setApiSuccess("Movement deleted!");
        setTimeout(() => setApiSuccess(""), 2000);
      });
    }
  };

  // Filters
  const filteredMovements = movements.filter((mov) => {
    let matches = true;
    if (filterType !== "all") matches = matches && mov.movement_type === filterType;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      matches =
        matches &&
        (mov.item_name?.toLowerCase().includes(searchLower) ||
          mov.batch_number?.toLowerCase().includes(searchLower) ||
          mov.source_location?.toLowerCase().includes(searchLower) ||
          mov.destination_location?.toLowerCase().includes(searchLower));
    }
    return matches;
  }).sort((a, b) => new Date(b.movement_date) - new Date(a.movement_date));

  // Stats
  const totalReceived = movements
    .filter((m) => m.movement_type === "receipt")
    .reduce((sum, m) => sum + parseFloat(m.quantity || 0), 0);
  const totalIssued = movements
    .filter((m) => m.movement_type === "issue")
    .reduce((sum, m) => sum + parseFloat(m.quantity || 0), 0);
  const totalTransferred = movements
    .filter((m) => m.movement_type === "transfer")
    .reduce((sum, m) => sum + parseFloat(m.quantity || 0), 0);

  // Options
  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

  const movementTypeOptions = [
    { value: "receipt", label: "Receipt" },
    { value: "issue", label: "Issue" },
    { value: "transfer", label: "Transfer" },
    { value: "return", label: "Return" },
    { value: "adjustment", label: "Adjustment" },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "receipt":
        return "bg-green-100 text-green-800";
      case "issue":
        return "bg-red-100 text-red-800";
      case "transfer":
        return "bg-blue-100 text-blue-800";
      case "return":
        return "bg-purple-100 text-purple-800";
      case "adjustment":
        return "bg-yellow-100 text-yellow-800";
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
          <h1 className="text-3xl font-display font-bold">Stock Movements</h1>
          <p className="text-gray-600">Track inventory transfers, receipts, and batch management</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-4 md:mt-0 btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" /> Record Movement
        </button>
      </div>

      {/* Success/Error Messages */}
      {apiSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{apiSuccess}</span>
          <button onClick={() => setApiSuccess("")} className="text-green-600">
            <FiX />
          </button>
        </div>
      )}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{apiError}</span>
          <button onClick={() => setApiError("")} className="text-red-600">
            <FiX />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Total Received</p>
          <p className="text-3xl font-bold text-gray-900">{totalReceived.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Receipts</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Total Issued</p>
          <p className="text-3xl font-bold text-gray-900">{totalIssued.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Issues</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Total Transferred</p>
          <p className="text-3xl font-bold text-gray-900">{totalTransferred.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Transfers</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-2 items-center">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by item, batch, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Types</option>
          <option value="receipt">Receipt</option>
          <option value="issue">Issue</option>
          <option value="transfer">Transfer</option>
          <option value="return">Return</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  From Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  To Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {mov.item_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(mov.movement_type)}`}>
                        {mov.movement_type.charAt(0).toUpperCase() + mov.movement_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {parseFloat(mov.quantity).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {mov.batch_number || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {mov.source_location || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {mov.destination_location || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(mov.movement_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(mov.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No movements found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Movement Modal */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddModalOpen(false)}>
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
                    Record Stock Movement
                  </Dialog.Title>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <SelectField
                      register={register}
                      name="item_id"
                      label="Item"
                      options={itemOptions}
                      errors={errors}
                    />

                    <SelectField
                      register={register}
                      name="movement_type"
                      label="Movement Type"
                      options={movementTypeOptions}
                      errors={errors}
                    />

                    <NumberField
                      register={register}
                      name="quantity"
                      label="Quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      errors={errors}
                    />

                    <FormField
                      register={register}
                      name="batch_number"
                      label="Batch Number (Optional)"
                      type="text"
                      errors={errors}
                    />

                    <FormField
                      register={register}
                      name="source_location"
                      label="Source Location (Optional)"
                      type="text"
                      errors={errors}
                    />

                    <FormField
                      register={register}
                      name="destination_location"
                      label="Destination Location (Optional)"
                      type="text"
                      errors={errors}
                    />

                    <DateField
                      register={register}
                      name="movement_date"
                      label="Movement Date"
                      errors={errors}
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description (Optional)
                      </label>
                      <textarea
                        {...register("description")}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Enter any additional details..."
                      />
                      {errors.description && (
                        <p className="text-red-600 text-xs">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button type="submit" disabled={isSubmitting} className="flex-1 btn btn-primary">
                        {isSubmitting ? "Recording..." : "Record Movement"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
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

export default StockMovements;
