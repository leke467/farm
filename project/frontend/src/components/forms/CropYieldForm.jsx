import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import apiService from "../../services/api";

const CropYieldForm = ({ onClose, onSuccess, crops = [] }) => {
  const [formData, setFormData] = useState({
    crop: "",
    season: new Date().getFullYear(),
    expected_yield: "",
    actual_yield: "",
    yield_unit: "kg",
    sown_area: "",
    area_unit: "acres",
    roi_percentage: "",
    pest_management_cost: "0",
    irrigation_cost: "0",
    fertilizer_cost: "0",
    labor_cost: "0",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const yieldUnits = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "liters", label: "Liters (L)" },
    { value: "quintals", label: "Quintals (q)" },
    { value: "tons", label: "Metric Tons (MT)" },
    { value: "bags", label: "Bags/Sacks" },
  ];

  const areaUnits = [
    { value: "acres", label: "Acres" },
    { value: "hectares", label: "Hectares" },
    { value: "square_meters", label: "Square Meters" },
    { value: "square_feet", label: "Square Feet" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.crop) newErrors.crop = "Crop is required";
    if (!formData.season) newErrors.season = "Season/Year is required";
    if (!formData.expected_yield || parseFloat(formData.expected_yield) <= 0) {
      newErrors.expected_yield = "Expected yield must be greater than 0";
    }
    if (!formData.actual_yield || parseFloat(formData.actual_yield) < 0) {
      newErrors.actual_yield = "Actual yield must be >= 0";
    }
    if (!formData.sown_area || parseFloat(formData.sown_area) <= 0) {
      newErrors.sown_area = "Sown area must be greater than 0";
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
        season: parseInt(formData.season),
        expected_yield: parseFloat(formData.expected_yield),
        actual_yield: parseFloat(formData.actual_yield),
        yield_unit: formData.yield_unit,
        sown_area: parseFloat(formData.sown_area),
        area_unit: formData.area_unit,
        roi_percentage: formData.roi_percentage ? parseFloat(formData.roi_percentage) : 0,
        pest_management_cost: parseFloat(formData.pest_management_cost || 0),
        irrigation_cost: parseFloat(formData.irrigation_cost || 0),
        fertilizer_cost: parseFloat(formData.fertilizer_cost || 0),
        labor_cost: parseFloat(formData.labor_cost || 0),
        notes: formData.notes,
      };

      const response = await apiService.createCropYieldAnalysis(payload);

      if (response._error) {
        setSubmitError(response.detail || "Failed to create yield analysis");
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
          <h2 className="text-lg font-bold text-slate-800">Record Crop Yield</h2>
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
              Season/Year *
            </label>
            <input
              type="number"
              name="season"
              value={formData.season}
              onChange={handleChange}
              min="2000"
              max={new Date().getFullYear() + 1}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.season ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.season && (
              <p className="text-red-500 text-xs mt-1">{errors.season}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expected Yield *
              </label>
              <input
                type="number"
                name="expected_yield"
                value={formData.expected_yield}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.expected_yield ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Actual Yield *
              </label>
              <input
                type="number"
                name="actual_yield"
                value={formData.actual_yield}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.actual_yield ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Yield Unit
            </label>
            <select
              name="yield_unit"
              value={formData.yield_unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {yieldUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sown Area *
              </label>
              <input
                type="number"
                name="sown_area"
                value={formData.sown_area}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.sown_area ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Area Unit
              </label>
              <select
                name="area_unit"
                value={formData.area_unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {areaUnits.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ROI Percentage (%)
            </label>
            <input
              type="number"
              name="roi_percentage"
              value={formData.roi_percentage}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 text-sm">
            <label className="block font-medium text-slate-700">Costs (₹)</label>
            <input
              type="number"
              name="fertilizer_cost"
              value={formData.fertilizer_cost}
              onChange={handleChange}
              placeholder="Fertilizer cost"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="number"
              name="pest_management_cost"
              value={formData.pest_management_cost}
              onChange={handleChange}
              placeholder="Pest management cost"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="number"
              name="irrigation_cost"
              value={formData.irrigation_cost}
              onChange={handleChange}
              placeholder="Irrigation cost"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="number"
              name="labor_cost"
              value={formData.labor_cost}
              onChange={handleChange}
              placeholder="Labor cost"
              step="0.01"
              min="0"
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
              {isSubmitting ? "Saving..." : "Record Yield"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CropYieldForm;
