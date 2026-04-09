import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import apiService from "../../services/api";

const WeatherImpactForm = ({ onClose, onSuccess, crops = [] }) => {
  const [formData, setFormData] = useState({
    crop: "",
    impact_date: new Date().toISOString().split("T")[0],
    impact_type: "drought",
    severity: "low",
    description: "",
    estimated_yield_loss: "",
    financial_loss: "",
    recovery_strategy: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const impactTypes = [
    { value: "drought", label: "Drought" },
    { value: "flood", label: "Flood" },
    { value: "hail", label: "Hail" },
    { value: "frost", label: "Frost" },
    { value: "pest_outbreak", label: "Pest Outbreak" },
    { value: "disease", label: "Disease" },
    { value: "excessive_rain", label: "Excessive Rain" },
    { value: "typhoon", label: "Typhoon" },
    { value: "other", label: "Other" },
  ];

  const severities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.crop) newErrors.crop = "Crop is required";
    if (!formData.impact_date) newErrors.impact_date = "Date is required";
    if (!formData.description) {
      newErrors.description = "Description is required";
    }
    if (!formData.estimated_yield_loss || parseFloat(formData.estimated_yield_loss) < 0) {
      newErrors.estimated_yield_loss = "Yield loss must be >= 0";
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
        impact_date: formData.impact_date,
        impact_type: formData.impact_type,
        severity: formData.severity,
        description: formData.description,
        estimated_yield_loss: parseFloat(formData.estimated_yield_loss),
        financial_loss: formData.financial_loss ? parseFloat(formData.financial_loss) : 0,
        recovery_strategy: formData.recovery_strategy,
        notes: formData.notes,
      };

      const response = await apiService.createWeatherImpactRecord(payload);

      if (response._error) {
        setSubmitError(response.detail || "Failed to create weather impact record");
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Record Weather Impact</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              Impact Date *
            </label>
            <input
              type="date"
              name="impact_date"
              value={formData.impact_date}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.impact_date ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.impact_date && (
              <p className="text-red-500 text-xs mt-1">{errors.impact_date}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Impact Type
              </label>
              <select
                name="impact_type"
                value={formData.impact_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {impactTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Severity
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {severities.map((sev) => (
                  <option key={sev.value} value={sev.value}>
                    {sev.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the weather impact..."
              rows="2"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                errors.description ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estimated Yield Loss (units) *
            </label>
            <input
              type="number"
              name="estimated_yield_loss"
              value={formData.estimated_yield_loss}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.estimated_yield_loss ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.estimated_yield_loss && (
              <p className="text-red-500 text-xs mt-1">{errors.estimated_yield_loss}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Financial Loss (₹)
            </label>
            <input
              type="number"
              name="financial_loss"
              value={formData.financial_loss}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recovery Strategy
            </label>
            <textarea
              name="recovery_strategy"
              value={formData.recovery_strategy}
              onChange={handleChange}
              placeholder="How to recover from this impact..."
              rows="2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiPlus size={18} />
              {isSubmitting ? "Saving..." : "Record Impact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeatherImpactForm;
