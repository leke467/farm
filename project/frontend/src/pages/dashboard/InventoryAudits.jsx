import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheckCircle } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FormField, SelectField, DateField, TextAreaField } from "../../components/forms/FormComponents";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";

// Validation schema
const auditSchema = yup.object().shape({
  audit_date: yup.date().required("Audit date is required"),
  status: yup.string().required("Status is required"),
  notes: yup.string().max(500, "Notes must be less than 500 characters"),
});

const auditLineSchema = yup.object().shape({
  item_id: yup.number().required("Item is required"),
  expected_quantity: yup.number().positive("Expected quantity must be greater than 0").required(),
  counted_quantity: yup.number().min(0, "Counted quantity cannot be negative").required(),
  notes: yup.string().max(200, "Notes must be less than 200 characters"),
});

const InventoryAudits = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();

  const [audits, setAudits] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddAuditModalOpen, setIsAddAuditModalOpen] = useState(false);
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const auditForm = useForm({
    resolver: yupResolver(auditSchema),
    defaultValues: {
      status: "draft",
    },
  });

  const lineForm = useForm({
    resolver: yupResolver(auditLineSchema),
  });

  useEffect(() => {
    if (activeFarm?.id) {
      fetchData();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [auditRes, itemRes] = await Promise.all([
        apiService.get("/api/inventory/audits/"),
        apiService.get("/api/inventory/"),
      ]);

      setAudits(auditRes.data);
      setItems(itemRes.data);
    } catch (error) {
      setApiError("Failed to load audit data");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateAudit = async (data) => {
    try {
      await apiService.post("/api/inventory/audits/", data);
      setApiSuccess("Audit created successfully!");
      auditForm.reset();
      setIsAddAuditModalOpen(false);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to create audit");
    }
  };

  const onAddLineItem = async (data) => {
    if (!selectedAudit) return;

    try {
      await apiService.post("/api/inventory/audits/", {
        ...data,
        audit_id: selectedAudit.id,
      });
      setApiSuccess("Line item added!");
      lineForm.reset();
      setIsAddLineModalOpen(false);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to add line item");
    }
  };

  const handleDeleteAudit = (auditId) => {
    if (window.confirm("Are you sure you want to delete this audit?")) {
      apiService.delete(`/api/inventory/audits/${auditId}/`).then(() => {
        fetchData();
        setApiSuccess("Audit deleted!");
        setTimeout(() => setApiSuccess(""), 2000);
      });
    }
  };

  const handleUpdateAuditStatus = async (auditId, newStatus) => {
    try {
      await apiService.patch(`/api/inventory/audits/${auditId}/`, {
        status: newStatus,
      });
      setApiSuccess("Audit status updated!");
      fetchData();
      setTimeout(() => setApiSuccess(""), 2000);
    } catch (error) {
      setApiError("Failed to update audit status");
    }
  };

  // Filter audits
  const filteredAudits = audits.filter((audit) => {
    if (filterStatus !== "all") return audit.status === filterStatus;
    return true;
  });

  // Calculate variance stats
  const calculateVariance = (expected, counted) => {
    if (!expected || expected === 0) return 0;
    return (((counted - expected) / expected) * 100).toFixed(2);
  };

  // Stats
  const totalAudits = audits.length;
  const completedAudits = audits.filter((a) => a.status === "completed").length;
  const inProgressAudits = audits.filter((a) => a.status === "in_progress").length;

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (${i.unit})`,
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVarianceColor = (variance) => {
    const v = parseFloat(variance);
    if (v > 5) return "text-red-600 font-bold";
    if (v > 0) return "text-orange-600";
    if (v < -5) return "text-red-600 font-bold";
    return "text-green-600";
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
          <h1 className="text-3xl font-display font-bold">Inventory Audits</h1>
          <p className="text-gray-600">Track physical inventory counts and reconciliation</p>
        </div>
        <button
          onClick={() => setIsAddAuditModalOpen(true)}
          className="mt-4 md:mt-0 btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" /> New Audit
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
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Total Audits</p>
          <p className="text-3xl font-bold text-gray-900">{totalAudits}</p>
          <p className="text-xs text-gray-500 mt-2">All time audits</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm font-medium">In Progress</p>
          <p className="text-3xl font-bold text-gray-900">{inProgressAudits}</p>
          <p className="text-xs text-gray-500 mt-2">Active audits</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-gray-900">{completedAudits}</p>
          <p className="text-xs text-gray-500 mt-2">Finished audits</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Audits List */}
      <div className="space-y-4">
        {filteredAudits.length > 0 ? (
          filteredAudits.map((audit) => (
            <div key={audit.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Audit Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Audit #{audit.id} - {new Date(audit.audit_date).toLocaleDateString()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Created by: {audit.created_by_name || "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(audit.status)}`}>
                    {audit.status === "in_progress" ? "In Progress" : audit.status}
                  </span>
                  {audit.status !== "completed" && (
                    <select
                      value={audit.status}
                      onChange={(e) => handleUpdateAuditStatus(audit.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="draft">Draft</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Audit Notes */}
              {audit.notes && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Notes:</strong> {audit.notes}
                  </p>
                </div>
              )}

              {/* Line Items */}
              {audit.line_items && audit.line_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Expected</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Counted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Variance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {audit.line_items.map((line) => (
                        <tr key={line.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">{line.item_name}</td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {parseFloat(line.expected_quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">
                            {parseFloat(line.counted_quantity).toFixed(2)}
                          </td>
                          <td className={`px-6 py-3 text-sm ${getVarianceColor(line.variance)}`}>
                            {line.variance}%
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700">{line.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No line items recorded for this audit
                </div>
              )}

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                {audit.status !== "completed" && (
                  <button
                    onClick={() => {
                      setSelectedAudit(audit);
                      setIsAddLineModalOpen(true);
                    }}
                    className="btn btn-secondary text-sm flex items-center"
                  >
                    <FiPlus className="mr-1" /> Add Item
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAudit(audit.id)}
                  className="btn text-red-600 hover:bg-red-50 text-sm flex items-center"
                >
                  <FiTrash2 className="mr-1" /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No audits found
          </div>
        )}
      </div>

      {/* Create Audit Modal */}
      <Transition appear show={isAddAuditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddAuditModalOpen(false)}>
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
                    Create New Audit
                  </Dialog.Title>

                  <form onSubmit={auditForm.handleSubmit(onCreateAudit)} className="space-y-4">
                    <DateField
                      register={auditForm.register}
                      name="audit_date"
                      label="Audit Date"
                      errors={auditForm.formState.errors}
                    />

                    <SelectField
                      register={auditForm.register}
                      name="status"
                      label="Initial Status"
                      options={statusOptions}
                      errors={auditForm.formState.errors}
                    />

                    <TextAreaField
                      register={auditForm.register}
                      name="notes"
                      label="Notes (Optional)"
                      rows={3}
                      errors={auditForm.formState.errors}
                    />

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={auditForm.formState.isSubmitting}
                        className="flex-1 btn btn-primary"
                      >
                        {auditForm.formState.isSubmitting ? "Creating..." : "Create Audit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddAuditModalOpen(false)}
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

      {/* Add Line Item Modal */}
      <Transition appear show={isAddLineModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddLineModalOpen(false)}>
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
                    Add Item to Audit
                  </Dialog.Title>

                  <form onSubmit={lineForm.handleSubmit(onAddLineItem)} className="space-y-4">
                    <SelectField
                      register={lineForm.register}
                      name="item_id"
                      label="Item"
                      options={itemOptions}
                      errors={lineForm.formState.errors}
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Expected Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...lineForm.register("expected_quantity")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {lineForm.formState.errors.expected_quantity && (
                        <p className="text-red-600 text-xs">
                          {lineForm.formState.errors.expected_quantity.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Counted Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...lineForm.register("counted_quantity")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {lineForm.formState.errors.counted_quantity && (
                        <p className="text-red-600 text-xs">
                          {lineForm.formState.errors.counted_quantity.message}
                        </p>
                      )}
                    </div>

                    <FormField
                      register={lineForm.register}
                      name="notes"
                      label="Notes (Optional)"
                      type="text"
                      errors={lineForm.formState.errors}
                    />

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={lineForm.formState.isSubmitting}
                        className="flex-1 btn btn-primary"
                      >
                        {lineForm.formState.isSubmitting ? "Adding..." : "Add Item"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddLineModalOpen(false)}
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

export default InventoryAudits;
