import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import apiService from "../../services/api";

const FinancialEntryForm = ({ type = "revenue", onClose, onSuccess }) => {
  const isRevenue = type === "revenue";

  const [formData, setFormData] = useState({
    // Revenue fields
    date: new Date().toISOString().split("T")[0],
    source: "animal_products",
    item_sold: "",
    quantity: "",
    unit_price: "",
    quality_grade: "good",
    buyer: "",
    amount: "",
    notes: "",

    // Debt fields
    creditor_name: "",
    loan_amount: "",
    principal_amount: "",
    interest_rate: "",
    loan_date: "",
    due_date: "",
    monthly_payment: "",
    payment_frequency: "monthly",
    payment_status: "pending",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const revenueSources = [
    { value: "animal_products", label: "Animal Products" },
    { value: "crop_sales", label: "Crop Sales" },
    { value: "dairy", label: "Dairy" },
    { value: "livestock_sale", label: "Livestock Sale" },
    { value: "other", label: "Other" },
  ];

  const qualityGrades = [
    { value: "premium", label: "Premium" },
    { value: "good", label: "Good" },
    { value: "standard", label: "Standard" },
  ];

  const paymentFrequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

  const validateRevenue = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.item_sold) newErrors.item_sold = "Item sold is required";
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.unit_price || parseFloat(formData.unit_price) < 0) {
      newErrors.unit_price = "Unit price is required and must be >= 0";
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDebt = () => {
    const newErrors = {};

    if (!formData.creditor_name) {
      newErrors.creditor_name = "Creditor name is required";
    }
    if (!formData.loan_amount || parseFloat(formData.loan_amount) <= 0) {
      newErrors.loan_amount = "Loan amount must be greater than 0";
    }
    if (!formData.principal_amount || parseFloat(formData.principal_amount) <= 0) {
      newErrors.principal_amount = "Principal amount must be greater than 0";
    }
    if (!formData.interest_rate || parseFloat(formData.interest_rate) < 0) {
      newErrors.interest_rate = "Interest rate must be >= 0";
    }
    if (!formData.loan_date) {
      newErrors.loan_date = "Loan date is required";
    }
    if (!formData.due_date) {
      newErrors.due_date = "Due date is required";
    }
    if (!formData.monthly_payment || parseFloat(formData.monthly_payment) <= 0) {
      newErrors.monthly_payment = "Monthly payment must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const isValid = isRevenue ? validateRevenue() : validateDebt();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      let response;
      if (isRevenue) {
        const payload = {
          date: formData.date,
          source: formData.source,
          item_sold: formData.item_sold,
          quantity: parseInt(formData.quantity),
          unit_price: parseFloat(formData.unit_price),
          quality_grade: formData.quality_grade,
          buyer: formData.buyer,
          amount: parseFloat(formData.amount),
          notes: formData.notes,
        };
        response = await apiService.createRevenue(payload);
      } else {
        const payload = {
          creditor_name: formData.creditor_name,
          loan_amount: parseFloat(formData.loan_amount),
          principal_amount: parseFloat(formData.principal_amount),
          interest_rate: parseFloat(formData.interest_rate),
          loan_date: formData.loan_date,
          due_date: formData.due_date,
          monthly_payment: parseFloat(formData.monthly_payment),
          payment_frequency: formData.payment_frequency,
          payment_status: formData.payment_status,
          notes: formData.notes,
        };
        response = await apiService.createDebt(payload);
      }

      if (response._error) {
        setSubmitError(response.detail || "Failed to create entry");
      } else {
        onSuccess?.();
        if (onClose) onClose();
      }
    } catch (error) {
      setSubmitError(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
            {isRevenue ? "Record Revenue" : "Record Debt"}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 flex-shrink-0"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {isRevenue ? (
            <>
              {/* Revenue Form */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date ? "border-red-500" : "border-slate-300"
                  }`}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Source
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {revenueSources.map((src) => (
                    <option key={src.value} value={src.value}>
                      {src.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Item Sold *
                </label>
                <input
                  type="text"
                  name="item_sold"
                  value={formData.item_sold}
                  onChange={handleChange}
                  placeholder="e.g., Milk, Eggs, Wheat"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.item_sold ? "border-red-500" : "border-slate-300"
                  }`}
                />
                {errors.item_sold && (
                  <p className="text-red-500 text-xs mt-1">{errors.item_sold}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.quantity ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.unit_price ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quality Grade
                </label>
                <select
                  name="quality_grade"
                  value={formData.quality_grade}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {qualityGrades.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Buyer
                </label>
                <input
                  type="text"
                  name="buyer"
                  value={formData.buyer}
                  onChange={handleChange}
                  placeholder="Buyer name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-red-500" : "border-slate-300"
                  }`}
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Debt Form */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Creditor Name *
                </label>
                <input
                  type="text"
                  name="creditor_name"
                  value={formData.creditor_name}
                  onChange={handleChange}
                  placeholder="Name of creditor/lender"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.creditor_name ? "border-red-500" : "border-slate-300"
                  }`}
                />
                {errors.creditor_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.creditor_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                    Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="loan_amount"
                    value={formData.loan_amount}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.loan_amount ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    name="interest_rate"
                    value={formData.interest_rate}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.interest_rate ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                    Loan Date *
                  </label>
                  <input
                    type="date"
                    name="loan_date"
                    value={formData.loan_date}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.loan_date ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.due_date ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                    Monthly Payment (₹) *
                  </label>
                  <input
                    type="number"
                    name="monthly_payment"
                    value={formData.monthly_payment}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                      errors.monthly_payment ? "border-red-500" : "border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Frequency
                  </label>
                  <select
                    name="payment_frequency"
                    value={formData.payment_frequency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {paymentFrequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partially Paid</option>
                  <option value="paid">Fully Paid</option>
                </select>
              </div>
            </>
          )}

          {/* Notes (common) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows="2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-700 text-xs sm:text-sm">{submitError}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium order-2 sm:order-1"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              <FiPlus size={18} />
              <span className="hidden sm:inline">{isSubmitting ? "Saving..." : "Record Entry"}</span>
              <span className="sm:hidden">{isSubmitting ? "Saving..." : "Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialEntryForm;
