import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiDollarSign,
  FiPieChart,
} from "react-icons/fi";
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
import { expenseSchema } from "../../components/forms/validationSchemas";

function ExpenseTracker() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useFarmData();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(expenseSchema),
    defaultValues: {
      date: "",
      category: "Feed",
      description: "",
      amount: "",
      vendor: "",
      payment_method: "Credit Card",
      notes: "",
    },
  });

  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess("");
    try {
      const expenseData = {
        date: data.date,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        vendor: data.vendor,
        payment_method: data.payment_method,
        notes: data.notes,
      };

      if (isEditModalOpen && currentExpense) {
        updateExpense(currentExpense.id, expenseData);
        setApiSuccess(`Expense updated successfully!`);
        setIsEditModalOpen(false);
        setCurrentExpense(null);
      } else {
        addExpense(expenseData);
        setApiSuccess(`Expense "${data.description}" added successfully!`);
        setIsAddModalOpen(false);
      }
      reset();
    } catch (error) {
      setApiError(
        error.message || "An error occurred. Please try again."
      );
    }
  };

  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    setValue("date", expense.date || "");
    setValue("category", expense.category || "Feed");
    setValue("description", expense.description || "");
    setValue("amount", expense.amount ? String(expense.amount) : "");
    setValue("vendor", expense.vendor || "");
    setValue("payment_method", expense.payment_method || "Credit Card");
    setValue("notes", expense.notes || "");
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(id);
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    reset();
    setApiError("");
    setApiSuccess("");
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentExpense(null);
    reset();
    setApiError("");
    setApiSuccess("");
  };

  const categoryOptions = [
    { value: "Feed", label: "Feed" },
    { value: "Medicine", label: "Medicine" },
    { value: "Equipment", label: "Equipment" },
    { value: "Labor", label: "Labor" },
    { value: "Utilities", label: "Utilities" },
    { value: "Seeds/Plants", label: "Seeds/Plants" },
    { value: "Maintenance", label: "Maintenance" },
    { value: "Other", label: "Other" },
  ];

  const paymentOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Credit Card", label: "Credit Card" },
    { value: "Debit Card", label: "Debit Card" },
    { value: "Check", label: "Check" },
    { value: "Bank Transfer", label: "Bank Transfer" },
  ];

  // Defensive: ensure expenses is an array
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Calculate totals
  const totalExpenses = safeExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Group expenses by category
  const expensesByCategory = safeExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Filter expenses
  const filteredExpenses = safeExpenses
    .filter((expense) => {
      if (filter === "all") return true;
      return expense.category.toLowerCase() === filter.toLowerCase();
    })
    .filter(
      (expense) =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Expense Tracker</h1>
          <p className="text-gray-600">Track and manage farm expenses</p>
        </div>

        <div className="mt-4 md:mt-0">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Total Expenses</h3>
            <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
              <FiDollarSign size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4">
            ${totalExpenses.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Largest Category</h3>
            <div className="p-3 bg-secondary-100 text-secondary-600 rounded-lg">
              <FiPieChart size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4">
            {Object.entries(expensesByCategory).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || "N/A"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">This Month</h3>
            <div className="p-3 bg-accent-100 text-accent-600 rounded-lg">
              <FiDollarSign size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mt-4">
            $
            {safeExpenses
              .filter(
                (e) => new Date(e.date).getMonth() === new Date().getMonth()
              )
              .reduce((sum, e) => sum + e.amount, 0)
              .toLocaleString()}
          </p>
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
            placeholder="Search expenses..."
            className="pl-10 input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 items-center">
          <FiFilter className="text-gray-500" />
          <select
            className="input max-w-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Feed">Feed</option>
            <option value="Labor">Labor</option>
            <option value="Equipment">Equipment</option>
            <option value="Utilities">Utilities</option>
            <option value="Seeds">Seeds</option>
            <option value="Veterinary">Veterinary</option>
            <option value="Fuel">Fuel</option>
          </select>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="text-error-600 hover:text-error-900"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <FiDollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No expenses found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by adding an expense."}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn btn-primary"
                >
                  <FiPlus className="mr-2" />
                  Add Expense
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      <Dialog
        open={isAddModalOpen || isEditModalOpen}
        onClose={() =>
          isAddModalOpen ? closeAddModal() : closeEditModal()
        }
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="min-h-screen px-4 text-center">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900 mb-4"
            >
              {isEditModalOpen ? "Edit Expense" : "Add New Expense"}
            </Dialog.Title>

            {apiError && (
              <FormError message={apiError} onDismiss={() => setApiError("")} />
            )}

            {apiSuccess && (
              <FormSuccess message={apiSuccess} onDismiss={() => setApiSuccess("")} />
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <FormField
                  label="Date"
                  type="date"
                  register={register}
                  name="date"
                  errors={errors}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />

                <SelectField
                  label="Category"
                  register={register}
                  name="category"
                  errors={errors}
                  options={categoryOptions}
                  required
                />

                <FormField
                  label="Description"
                  type="text"
                  register={register}
                  name="description"
                  errors={errors}
                  placeholder="What was this expense for?"
                  required
                />

                <NumberField
                  label="Amount"
                  register={register}
                  name="amount"
                  errors={errors}
                  min="0"
                  placeholder="0.00"
                  required
                />

                <FormField
                  label="Vendor"
                  type="text"
                  register={register}
                  name="vendor"
                  errors={errors}
                  placeholder="Where did you buy from?"
                  required
                />

                <SelectField
                  label="Payment Method"
                  register={register}
                  name="payment_method"
                  errors={errors}
                  options={paymentOptions}
                  required
                />

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    {...register("notes")}
                    className="input h-24"
                    placeholder="Additional notes"
                  />
                  {errors.notes && (
                    <span className="text-error-500 text-sm">
                      {errors.notes.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    isAddModalOpen ? closeAddModal() : closeEditModal()
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
    </div>
  );
}

export default ExpenseTracker;
