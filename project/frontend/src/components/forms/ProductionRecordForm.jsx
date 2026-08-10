import { useState, useEffect } from "react";
import { FiPlus, FiX, FiCheckCircle } from "react-icons/fi";
import apiService from "../../services/api";
import { useFarmData } from "../../context/FarmDataContext";
import { useToast } from "../../context/ToastContext";

const ProductionRecordForm = ({ animalId, onClose, onSuccess, animals = [] }) => {
  const { activeFarm } = useFarmData();
  const { toast } = useToast();
  const currencySymbol = activeFarm?.currency_symbol || "₦";

  const [formData, setFormData] = useState({
    animal: animalId || "",
    date: new Date().toISOString().split("T")[0],
    production_type: "milk",
    quantity: "",
    unit: "liters",
    quality_grade: "A",
    market_price_per_unit: "",
    notes: "",
  });

  const [looseQuantity, setLooseQuantity] = useState("");
  const [unitsPerCrate, setUnitsPerCrate] = useState(30);

  const [addToInventory, setAddToInventory] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isEggOrCrate = formData.production_type === "eggs" || formData.unit === "crates";

  const productionTypes = [
    { value: "eggs", label: "Eggs 🥚" },
    { value: "milk", label: "Milk 🥛" },
    { value: "wool", label: "Wool 🧶" },
    { value: "meat", label: "Meat 🥩" },
    { value: "honey", label: "Honey 🍯" },
    { value: "dairy", label: "Dairy Products 🧀" },
    { value: "manure", label: "Manure / Fertilizer 🌾" },
    { value: "other", label: "Other 📦" },
  ];

  const units = {
    eggs: ["crates", "pieces", "dozen", "units"],
    milk: ["liters", "gallons", "kg"],
    wool: ["kg", "lbs"],
    meat: ["kg", "lbs"],
    honey: ["liters", "kg", "lbs"],
    dairy: ["units", "kg"],
    manure: ["bags", "kg", "tons"],
    other: ["units", "kg", "lbs"],
  };

  const qualityGrades = [
    { value: "A", label: "Grade A (Premium)" },
    { value: "B", label: "Grade B (Good)" },
    { value: "C", label: "Grade C (Standard)" },
  ];

  const validateForm = () => {
    const newErrors = {};
    const mainQty = parseFloat(formData.quantity) || 0;
    const looseQty = parseFloat(looseQuantity) || 0;

    if (!formData.animal) {
      newErrors.animal = "Animal is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (mainQty <= 0 && looseQty <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "production_type" && { unit: units[value]?.[0] || prev.unit }),
    }));
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
      const mainQty = parseFloat(formData.quantity) || 0;
      const looseQty = parseFloat(looseQuantity) || 0;
      const pcsPerCrate = parseFloat(unitsPerCrate) || 30;

      let finalQuantity = mainQty;
      let summaryNote = "";

      if (isEggOrCrate && (mainQty > 0 || looseQty > 0)) {
        if (formData.unit === "crates") {
          finalQuantity = Number((mainQty + looseQty / pcsPerCrate).toFixed(2));
          const totalEggs = Math.round(mainQty * pcsPerCrate + looseQty);
          summaryNote = `[Yield: ${mainQty} crates + ${looseQty} loose pieces = ${finalQuantity} crates (${totalEggs} eggs total)]`;
        } else if (formData.unit === "pieces") {
          finalQuantity = Math.round(mainQty + looseQty * pcsPerCrate);
          summaryNote = `[Yield: ${mainQty} pieces + ${looseQty} crates = ${finalQuantity} eggs total]`;
        }
      }

      const payload = {
        animal: formData.animal,
        recorded_date: formData.date,
        production_type: formData.production_type,
        quantity: finalQuantity,
        unit: formData.unit,
        quality_grade: formData.quality_grade,
        market_price_per_unit: formData.market_price_per_unit ? parseFloat(formData.market_price_per_unit) : 0,
        notes: formData.notes ? `${formData.notes}\n${summaryNote}`.trim() : summaryNote,
        add_to_inventory: addToInventory,
      };

      const response = await apiService.createProductionRecord(payload);

      if (response._error) {
        setSubmitError(response.detail || "Failed to create production record");
      } else {
        toast.success(
          `Recorded ${finalQuantity} ${formData.unit} of ${formData.production_type}! ${
            addToInventory ? "Added to Farm Inventory (Stock In)." : ""
          }`
        );
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md sm:max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">Record Production</h2>
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
          {/* Animal Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Animal *
            </label>
            <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">Select animal or group producing this yield.</p>
            <select
              name="animal"
              value={formData.animal}
              onChange={handleChange}
              disabled={!!animalId}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Date *
            </label>
            <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">Date output was collected or recorded.</p>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.date ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Production Type & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Type *
              </label>
              <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">Product type (Milk, Eggs, etc.).</p>
              <select
                name="production_type"
                value={formData.production_type}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {productionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Unit
              </label>
              <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">Measurement unit.</p>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              {isEggOrCrate ? "Yield Quantity (Crates & Loose Pieces) *" : "Quantity *"}
            </label>
            <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">
              {isEggOrCrate
                ? "Enter full crates and loose pieces collected (e.g. 3 crates and 16 pieces)."
                : "Total output collected on this date."}
            </p>

            {isEggOrCrate ? (
              <div className="space-y-3 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      Full Crates 📦
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="e.g. 3"
                      step="1"
                      min="0"
                      className="w-full px-3 py-2 text-base border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-bold text-amber-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      Loose Pieces 🥚
                    </label>
                    <input
                      type="number"
                      value={looseQuantity}
                      onChange={(e) => setLooseQuantity(e.target.value)}
                      placeholder="e.g. 16"
                      step="1"
                      min="0"
                      className="w-full px-3 py-2 text-base border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-bold text-amber-950"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 border-t border-amber-200/80 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">Pieces / crate:</span>
                    <input
                      type="number"
                      value={unitsPerCrate}
                      onChange={(e) => setUnitsPerCrate(e.target.value)}
                      className="w-12 px-1.5 py-0.5 text-xs text-center border border-amber-300 rounded bg-white font-bold text-slate-800"
                    />
                  </div>

                  {((parseFloat(formData.quantity) || 0) > 0 || (parseFloat(looseQuantity) || 0) > 0) && (
                    <div className="font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                      = {Number(((parseFloat(formData.quantity) || 0) + (parseFloat(looseQuantity) || 0) / (parseFloat(unitsPerCrate) || 30)).toFixed(2))} Crates ({Math.round((parseFloat(formData.quantity) || 0) * (parseFloat(unitsPerCrate) || 30) + (parseFloat(looseQuantity) || 0))} Eggs)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                min="0"
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.quantity ? "border-red-500" : "border-slate-300"
                }`}
              />
            )}

            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Quality Grade */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Quality Grade
            </label>
            <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">Assessed quality standard of the batch.</p>
            <select
              name="quality_grade"
              value={formData.quality_grade}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
              Market Price per Unit ({currencySymbol})
            </label>
            <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">Estimated market value or selling price per unit.</p>
            <input
              type="number"
              name="market_price_per_unit"
              value={formData.market_price_per_unit}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.market_price_per_unit ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.market_price_per_unit && (
              <p className="text-red-500 text-xs mt-1">{errors.market_price_per_unit}</p>
            )}
          </div>

          {/* Add to Farm Inventory Checkbox */}
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-base shadow-xs flex-shrink-0">
                📦
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Add to Farm Inventory</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-full">
                    Green / Yield
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                  Automatically adds output (e.g. {formData.production_type || "milk"}) to stock inventory as Green yield.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={addToInventory}
              onChange={(e) => setAddToInventory(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer flex-shrink-0 ml-2"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows="2"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <span className="hidden sm:inline">{isSubmitting ? "Saving..." : "Record Production"}</span>
              <span className="sm:hidden">{isSubmitting ? "Saving..." : "Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductionRecordForm;
