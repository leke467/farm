import { useState, useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import apiService from "../../services/api";

const ProductionRecordForm = ({ animalId, onClose, onSuccess, animals = [] }) => {
  const [formData, setFormData] = useState({
    animal: animalId || "",
    date: new Date().toISOString().split("T")[0],
    production_type: "milk",
    quantity: "",
    unit: "liters",
    quality_grade: "good",
    market_price_per_unit: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const productionTypes = [
    { value: "milk", label: "Milk" },
    { value: "eggs", label: "Eggs" },
    { value: "wool", label: "Wool" },
    { value: "meat", label: "Meat" },
    { value: "honey", label: "Honey" },
    { value: "dairy", label: "Dairy Products" },
    { value: "other", label: "Other" },
  ];

  const units = {
    milk: ["liters", "gallons", "kg"],
    eggs: ["units", "dozen"],
    wool: ["kg", "lbs"],
    meat: ["kg", "lbs"],
    honey: ["liters", "kg", "lbs"],
    dairy: ["units", "kg"],
    other: ["units", "kg", "lbs"],
  };

  const qualityGrades = [
    { value: "premium", label: "Premium" },
    { value: "good", label: "Good" },
    { value: "standard", label: "Standard" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.animal) {
      newErrors.animal = "Animal is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!formData.market_price_per_unit || parseFloat(formData.market_price_per_unit) < 0) {
      newErrors.market_price_per_unit = "Market price must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset unit if production type changes
      ...(name === "production_type" && { unit: units[value]?.[0] || prev.unit }),
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        animal: formData.animal,
        date: formData.date,
        production_type: formData.production_type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        quality_grade: formData.quality_grade,
        market_price_per_unit: parseFloat(formData.market_price_per_unit),
        notes: formData.notes,
      };

      const response = await apiService.createProductionRecord(payload);

      if (response._error) {
        setSubmitError(response.detail || "Failed to create production record");
      } else {
        // Success
        setFormData({
          animal: animalId || "",
          date: new Date().toISOString().split("T")[0],
          production_type: "milk",
          quantity: "",
          unit: "liters",
          quality_grade: "good",
          market_price_per_unit: "",
          notes: "",
        });
        onSuccess?.();
        if (onClose) {
          onClose();
        }
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
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Record Production</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Animal Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Animal *
            </label>
            <select
              name="animal"
              value={formData.animal}
              onChange={handleChange}
              disabled={!!animalId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.animal ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">Select an animal</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name || `Animal ${animal.id}`}
                </option>
              ))}
            </select>
            {errors.animal && (
              <p className="text-red-500 text-xs mt-1">{errors.animal}</p>
            )}
          </div>

          {/* Date */}
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.date ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Production Type & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type *
              </label>
              <select
                name="production_type"
                value={formData.production_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {productionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {(units[formData.production_type] || []).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.quantity ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Quality Grade */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quality Grade
            </label>
            <select
              name="quality_grade"
              value={formData.quality_grade}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {qualityGrades.map((grade) => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
          </div>

          {/* Market Price */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Market Price per Unit (₹) *
            </label>
            <input
              type="number"
              name="market_price_per_unit"
              value={formData.market_price_per_unit}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.market_price_per_unit ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.market_price_per_unit && (
              <p className="text-red-500 text-xs mt-1">{errors.market_price_per_unit}</p>
            )}
          </div>

          {/* Notes */}
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          {/* Buttons */}
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
              {isSubmitting ? "Saving..." : "Record Production"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductionRecordForm;
