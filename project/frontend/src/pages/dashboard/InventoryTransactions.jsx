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
const transactionSchema = yup.object().shape({
  item_id: yup.number().required("Item is required"),
  transaction_type: yup.string().required("Transaction type is required"),
  quantity: yup.number().positive("Quantity must be greater than 0").required("Quantity is required"),
  cost_per_unit: yup.number().min(0, "Cost cannot be negative"),
  transaction_date: yup.date().required("Transaction date is required"),
  reason: yup.string().max(200, "Reason must be less than 200 characters"),
  reference: yup.string().max(100, "Reference must be less than 100 characters"),
});

const InventoryTransactions = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();

  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(transactionSchema),
    defaultValues: {
      transaction_type: "in",
      status: "completed",
      cost_per_unit: 0,
    },
  });

  useEffect(() => {
    if (activeFarm?.id) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [transRes, itemRes] = await Promise.all([
        apiService.get("/api/inventory/transactions/"),
        apiService.get("/api/inventory/"),
      ]);

      setTransactions(transRes.data);
      setItems(itemRes.data);
    } catch (error) {
      setApiError("Failed to load inventory data");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await apiService.post("/api/inventory/transactions/", data);
      setApiSuccess("Transaction created successfully!");
      reset();
      setIsAddModalOpen(false);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to create transaction");
    }
  };

  const handleDelete = (transactionId) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      apiService.delete(`/api/inventory/transactions/${transactionId}/`).then(() => {
        fetchData();
        setApiSuccess("Transaction deleted!");
        setTimeout(() => setApiSuccess(""), 2000);
      });
    }
  };

  // Filters
  const filteredTransactions = transactions.filter((trans) => {
    let matches = true;
    if (filterType !== "all") matches = matches && trans.transaction_type === filterType;
    if (filterStatus !== "all") matches = matches && trans.status === filterStatus;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      matches =
        matches &&
        (trans.item_name?.toLowerCase().includes(searchLower) ||
          trans.reason?.toLowerCase().includes(searchLower) ||
          trans.reference?.toLowerCase().includes(searchLower));
    }
    return matches;
  });

  // Stats
  const totalIn = transactions
    .filter((t) => t.transaction_type === "in")
    .reduce((sum, t) => sum + parseFloat(t.quantity || 0), 0);
  const totalOut = transactions
    .filter((t) => t.transaction_type === "out")
    .reduce((sum, t) => sum + parseFloat(t.quantity || 0), 0);
  const totalValue = filteredTransactions.reduce((sum, t) => {
    const cost = (t.cost_per_unit || 0) * (t.quantity || 0);
    return sum + (t.transaction_type === "in" ? cost : -cost);
  }, 0);

  // Options
  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

  const transactionTypeOptions = [
    { value: "in", label: "Stock In" },
    { value: "out", label: "Stock Out" },
    { value: "adjustment", label: "Adjustment" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "in":
        return "bg-green-100 text-green-800";
      case "out":
        return "bg-red-100 text-red-800";
      case "adjustment":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
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
          <h1 className="text-3xl font-display font-bold">Inventory Transactions</h1>
          <p className="text-gray-600">Track all stock movements and adjustments</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-4 md:mt-0 btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" /> Record Transaction
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
          <p className="text-gray-600 text-sm font-medium">Total Stock In</p>
          <p className="text-3xl font-bold text-gray-900">{totalIn.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Units received</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Total Stock Out</p>
          <p className="text-3xl font-bold text-gray-900">{totalOut.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Units issued</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Transaction Value</p>
          <p className="text-3xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Net inventory cost</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-2 items-center">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by item, reason, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
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
                  Cost/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Status
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
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trans) => (
                  <tr key={trans.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {trans.item_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(trans.transaction_type)}`}>
                        {trans.transaction_type === "in" ? "Stock In" : trans.transaction_type === "out" ? "Stock Out" : "Adjustment"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {parseFloat(trans.quantity).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      ${(trans.cost_per_unit || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      ${(trans.total_cost || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trans.status)}`}>
                        {trans.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(trans.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(trans.id)}
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
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
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
                    Record Inventory Transaction
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
                      name="transaction_type"
                      label="Transaction Type"
                      options={transactionTypeOptions}
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

                    <NumberField
                      register={register}
                      name="cost_per_unit"
                      label="Cost Per Unit (Optional)"
                      type="number"
                      step="0.01"
                      min="0"
                      errors={errors}
                    />

                    <DateField
                      register={register}
                      name="transaction_date"
                      label="Transaction Date"
                      errors={errors}
                    />

                    <SelectField
                      register={register}
                      name="status"
                      label="Status"
                      options={statusOptions}
                      errors={errors}
                    />

                    <FormField
                      register={register}
                      name="reason"
                      label="Reason (Optional)"
                      type="text"
                      errors={errors}
                    />

                    <FormField
                      register={register}
                      name="reference"
                      label="Reference Number (Optional)"
                      type="text"
                      errors={errors}
                    />

                    <div className="flex gap-2 pt-4">
                      <button type="submit" disabled={isSubmitting} className="flex-1 btn btn-primary">
                        {isSubmitting ? "Recording..." : "Record Transaction"}
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

export default InventoryTransactions;
