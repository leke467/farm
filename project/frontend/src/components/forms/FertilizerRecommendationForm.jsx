import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import apiService from "../../services/api";

const FertilizerRecommendationForm = ({ onClose, onSuccess, crops = [] }) => {
  const [formData, setFormData] = useState({
    crop: "",
    date: new Date().toISOString().split("T")[0],
    fertilizer_type: "nitrogen",
    recommended_quantity: "",
    quantity_unit: "kg",
    application_method: "broadcast",
    expected_yield_increase: "",
    estimated_cost: "",
    status: "pending",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fertilizerTypes = [
    { value: "nitrogen", label: "Nitrogen (N)" },
    { value: "phosphorus", label: "Phosphorus (P)" },
    { value: "potassium", label: "Potassium (K)" },
    { value: "npk", label: "NPK Blend" },
    { value: "organic", label: "Organic Fertilizer" },
    { value: "bio_fertilizer", label: "Bio-Fertilizer" },
    { value: "micronutrient", label: "Micronutrient" },
  ];

  const applicationMethods = [
    { value: "broadcast", label: "Broadcast" },
    { value: "drip_irrigation", label: "Drip Irrigation" },
    { value: "foliar_spray", label: "Foliar Spray" },
    { value: "band_application", label: "Band Application" },
    { value: "fertigation", label: "Fertigation" },
  ];

  const statuses = [
    { value: "pending", label: "Pending" },
    { value: "applied", label: "Applied" },
    { value: "skipped", label: "Skipped" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.crop) newErrors.crop = "Crop is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.recommended_quantity || parseFloat(formData.recommended_quantity) <= 0) {
      newErrors.recommended_quantity = "Quantity must be greater than 0";
    }
    if (!formData.expected_yield_increase || parseFloat(formData.expected_yield_increase) < 0 || parseFloat(formData.expected_yield_increase) > 100) {
      newErrors.expected_yield_increase = "Yield increase must be between 0 and 100 (%)";
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

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        crop: formData.crop,
        date: formData.date,
        fertilizer_type: formData.fertilizer_type,
        recommended_quantity: parseFloat(formData.recommended_quantity),
        quantity_unit: formData.quantity_unit,
        application_method: formData.application_method,
        yield_increase_percentage: parseFloat(formData.expected_yield_increase),
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : 0,
        status: formData.status,
        notes: formData.notes,
      };

      const response = await apiService.createFertilizerRecommendation(payload);

      if (response._error) {
        setSubmitError(response.detail || "Failed to create recommendation");
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
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">Fertilizer Recommendation</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 flex-shrink-0"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Crop *
            </label>
            <select
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.crop ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">Select crop</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name || `Crop ${crop.id}`}
                </option>
              ))}
            </select>
            {errors.crop && (
              <p className="text-red-500 text-xs mt-1">{errors.crop}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.date ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fertilizer Type
            </label>
            <select
              name="fertilizer_type"
              value={formData.fertilizer_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {fertilizerTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="recommended_quantity"
                value={formData.recommended_quantity}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.recommended_quantity ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit
              </label>
              <select
                name="quantity_unit"
                value={formData.quantity_unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="kg">kg</option>
                <option value="liters">Liters</option>
                <option value="bags">Bags</option>
                <option value="units">Units</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Application Method
            </label>
            <select
              name="application_method"
              value={formData.application_method}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {applicationMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expected Yield Increase (%) *
            </label>
            <input
              type="number"
              name="expected_yield_increase"
              value={formData.expected_yield_increase}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.expected_yield_increase ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.expected_yield_increase && (
              <p className="text-red-500 text-xs mt-1">{errors.expected_yield_increase}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estimated Cost (₹)
            </label>
            <input
              type="number"
              name="estimated_cost"
              value={formData.estimated_cost}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

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

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-700 text-xs sm:text-sm">{submitError}</p>
            </div>
          )}

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
              <span className="hidden sm:inline">{isSubmitting ? "Saving..." : "Save Recommendation"}</span>
              <span className="sm:hidden">{isSubmitting ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FertilizerRecommendationForm;
