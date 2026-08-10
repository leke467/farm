import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiDollarSign,
  FiPieChart,
  FiInfo,
} from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { formatFarmCurrency } from "../../utils/formatters";
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
import { expenseSchema } from "../../components/forms/validationSchemas";
import { useToast } from "../../context/ToastContext";

function ExpenseTracker() {
  const { activeFarm, expenses, animals, addExpense, updateExpense, deleteExpense, refreshData } = useFarmData();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [expenseCategorySuggestions, setExpenseCategorySuggestions] = useState([]);
  const [linkedAnimalId, setLinkedAnimalId] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      if (activeFarm?.id) {
        try {
          const cats = await apiService.getFarmCategories(activeFarm.id, 'expense_category');
          if (!cats._error) {
            setExpenseCategorySuggestions(cats);
          }
        } catch (error) {
          console.error("Failed to load categories:", error);
        }
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

  const formatDateToYYYYMMDD = (d) => {
    if (!d) return new Date().toISOString().split("T")[0];
    if (d instanceof Date && !isNaN(d)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    const str = String(d);
    if (str.includes("T")) return str.split("T")[0];
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return str;
  };

  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess("");
    try {
      const rawDate = formatDateToYYYYMMDD(data.date);
      const expenseData = {
        farm: activeFarm?.id,
        date: rawDate,
        category: data.category,
        description: data.description,
        amount: parseFloat(String(data.amount).replace(/,/g, "")),
        vendor: data.vendor,
        payment_method: data.payment_method,
        notes: data.notes,
        linked_animal: linkedAnimalId || null,
      };

      if (isEditModalOpen && currentExpense) {
        await updateExpense(currentExpense.id, expenseData);
        const msg = `Expense updated successfully!`;
        toast.success(msg);
        setApiSuccess(msg);
        setIsEditModalOpen(false);
        setCurrentExpense(null);
      } else {
        await addExpense(expenseData);
        const msg = `Expense "${data.description}" added successfully!`;
        toast.success(msg);
        setApiSuccess(msg);
        setIsAddModalOpen(false);
      }
      if (refreshData) {
        try { refreshData(); } catch (e) {}
      }
      setLinkedAnimalId("");
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
    setLinkedAnimalId(expense.linked_animal ? String(expense.linked_animal) : "");
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

  const getLinkedAnimalName = (expense) => {
    const animId = expense.linked_animal || expense.linked_animal_id || expense.linkedAnimal || expense.linkedAnimalId || expense.animal_id || expense.animal;
    if (!animId) return null;
    const found = (animals || []).find((a) => String(a.id) === String(animId));
    return found ? found.name : `Animal #${animId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-sm text-gray-500">Track and manage all farm expenditures</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary inline-flex items-center self-start md:self-auto"
        >
          <FiPlus className="mr-2" /> Add Expense
        </button>
      </div>

      {apiSuccess && <FormSuccess message={apiSuccess} onDismiss={() => setApiSuccess("")} />}
      {apiError && <FormError message={apiError} onDismiss={() => setApiError("")} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-lg font-medium text-gray-700">Total Expenses</h3>
            <div className="p-2.5 sm:p-3 bg-primary-100 text-primary-600 rounded-lg">
              <FiDollarSign className="text-lg sm:text-2xl" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold mt-2 sm:mt-4 text-gray-900">
            {formatFarmCurrency(totalExpenses, activeFarm)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-lg font-medium text-gray-700">Top Category</h3>
            <div className="p-2.5 sm:p-3 bg-secondary-100 text-secondary-600 rounded-lg">
              <FiPieChart className="text-lg sm:text-2xl" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold mt-2 sm:mt-4 capitalize text-gray-900">
            {Object.entries(expensesByCategory).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || "N/A"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-lg font-medium text-gray-700">This Month</h3>
            <div className="p-2.5 sm:p-3 bg-accent-100 text-accent-600 rounded-lg">
              <FiDollarSign className="text-lg sm:text-2xl" />
            </div>
          </div>
          <p className="text-xl sm:text-3xl font-bold mt-2 sm:mt-4 text-gray-900">
            {formatFarmCurrency(
              safeExpenses
                .filter(
                  (e) => new Date(e.date).getMonth() === new Date().getMonth()
                )
                .reduce((sum, e) => sum + e.amount, 0),
              activeFarm
            )}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search expenses by description, vendor..."
            className="pl-9 input text-xs sm:text-sm py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            className="input w-full sm:w-48 capitalize text-xs sm:text-sm py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {Object.keys(expensesByCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Allocation Legend Banner */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg flex-shrink-0">
            <FiInfo size={16} />
          </div>
          <div>
            <span className="font-extrabold text-gray-900 text-xs">Expense Allocation Guide</span>
            <p className="text-[11px] text-gray-500">Visual breakdown of flock-specific costs vs general farm overheads</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/80 shadow-xs text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm ring-2 ring-amber-200 flex-shrink-0"></span>
            <span className="font-bold text-amber-900">
              🟡 Animal / Flock Expense
            </span>
          </div>
          <div className="flex items-center space-x-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-xs text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400 inline-block flex-shrink-0"></span>
            <span className="font-semibold text-gray-700">
              ⚪ General Farm Overhead
            </span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Description & Allocation
                </th>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Category
                </th>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Vendor
                </th>
                <th className="px-3 sm:px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Payment Method
                </th>
                <th className="px-3 sm:px-6 py-3 text-right font-semibold text-gray-600 uppercase tracking-wider text-[11px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => {
                const linkedAnimalName = getLinkedAnimalName(expense);
                const isAnimalExpense = Boolean(linkedAnimalName);

                return (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={
                      isAnimalExpense
                        ? "bg-amber-50/80 hover:bg-amber-100/80 transition-colors border-l-4 border-l-amber-400"
                        : "bg-white hover:bg-gray-50 transition-colors border-l-4 border-l-transparent"
                    }
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-medium text-gray-700">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-900">
                      <div className="font-semibold text-gray-900">{expense.description}</div>
                      {isAnimalExpense ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-amber-200/90 text-amber-950 mt-0.5 shadow-xs border border-amber-300">
                          🟡 {linkedAnimalName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-500 bg-gray-100 mt-0.5">
                          ⚪ General Farm Overhead
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-900">
                      <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-extrabold text-gray-900">
                      {formatFarmCurrency(expense.amount, activeFarm)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-600">
                      {expense.vendor || "-"}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-600 capitalize">
                      {(expense.paymentMethod || expense.payment_method || "cash").replace("_", " ")}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right font-medium">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="text-error-600 hover:text-error-900 font-semibold text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
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
                  helperText="Date when the expense was paid or incurred."
                  required
                />

                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <CategoryCombobox
                      id="category"
                      name="category"
                      value={field.value || ""}
                      onChange={field.onChange}
                      suggestions={expenseCategorySuggestions}
                      placeholder="Type custom or select from dropdown..."
                      label="Category"
                      helperText="Cost type (e.g. Feed, Labor, Vet). Type custom or select from list."
                      required
                    />
                  )}
                />

                <FormField
                  label="Description"
                  type="text"
                  register={register}
                  name="description"
                  errors={errors}
                  placeholder="What was this expense for?"
                  helperText="Short explanation of item or service purchased."
                  required
                />

                <NumberField
                  label="Amount"
                  register={register}
                  name="amount"
                  errors={errors}
                  min="0"
                  placeholder="0.00"
                  helperText="Total cost paid in your farm currency."
                  required
                />

                <FormField
                  label="Vendor"
                  type="text"
                  register={register}
                  name="vendor"
                  errors={errors}
                  placeholder="Where did you buy from?"
                  helperText="Store, company, or individual paid."
                  required
                />

                <SelectField
                  label="Payment Method"
                  register={register}
                  name="payment_method"
                  errors={errors}
                  options={paymentOptions}
                  helperText="Mode of payment (Cash, Card, Bank Transfer, Check)."
                  required
                />

                {/* Link Expense to Animal / Flock */}
                <div>
                  <label className="label flex items-center space-x-1">
                    <span>Link to Animal / Flock</span>
                    <span className="text-xs text-gray-400 font-normal">(optional)</span>
                  </label>
                  <select
                    className="input"
                    value={linkedAnimalId}
                    onChange={(e) => setLinkedAnimalId(e.target.value)}
                  >
                    <option value="">🏠 General Farm Expense (not linked)</option>
                    {(Array.isArray(animals) ? animals : []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} {a.animal_type ? `(${a.animal_type})` : ""} {a.is_group ? `— ${a.count} head` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Link this expense to a specific animal or flock for accurate profit/loss (COGS) tracking. Leave empty for general farm costs.
                  </p>
                </div>

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
