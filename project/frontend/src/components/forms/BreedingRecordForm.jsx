import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import apiService from "../../services/api";

const BreedingRecordForm = ({ onClose, onSuccess, animals = [] }) => {
  const [formData, setFormData] = useState({
    sire: "",
    dam: "",
    breeding_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    number_of_offspring: "1",
    breeding_status: "planned",
    genetics_notes: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const breedingStatuses = [
    { value: "planned", label: "Planned" },
    { value: "in_progress", label: "In Progress" },
    { value: "successful", label: "Successful" },
    { value: "failed", label: "Failed" },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sire) newErrors.sire = "Sire is required";
    if (!formData.dam) newErrors.dam = "Dam is required";
    if (formData.sire === formData.dam) {
      newErrors.dam = "Sire and Dam must be different animals";
    }
    if (!formData.breeding_date) {
      newErrors.breeding_date = "Breeding date is required";
    }
    if (!formData.number_of_offspring || parseInt(formData.number_of_offspring) <= 0) {
      newErrors.number_of_offspring = "Number of offspring must be greater than 0";
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
        sire: formData.sire,
        dam: formData.dam,
        breeding_date: formData.breeding_date,
        expected_delivery_date: formData.expected_delivery_date,
        number_of_offspring: parseInt(formData.number_of_offspring),
        breeding_status: formData.breeding_status,
        genetics_notes: formData.genetics_notes,
        notes: formData.notes,
      };

      const response = await apiService.createBreedingRecord(payload);

      if (response._error) {
        setSubmitError(response.detail || "Failed to create breeding record");
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
          <h2 className="text-lg font-bold text-slate-800">Record Breeding</h2>
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
              Sire (Male) *
            </label>
            <select
              name="sire"
              value={formData.sire}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.sire ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">Select sire</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name || `Animal ${animal.id}`}
                </option>
              ))}
            </select>
            {errors.sire && (
              <p className="text-red-500 text-xs mt-1">{errors.sire}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dam (Female) *
            </label>
            <select
              name="dam"
              value={formData.dam}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.dam ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">Select dam</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name || `Animal ${animal.id}`}
                </option>
              ))}
            </select>
            {errors.dam && (
              <p className="text-red-500 text-xs mt-1">{errors.dam}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Breeding Date *
              </label>
              <input
                type="date"
                name="breeding_date"
                value={formData.breeding_date}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.breeding_date ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expected Delivery
              </label>
              <input
                type="date"
                name="expected_delivery_date"
                value={formData.expected_delivery_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expected Offspring *
              </label>
              <input
                type="number"
                name="number_of_offspring"
                value={formData.number_of_offspring}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  errors.number_of_offspring ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                name="breeding_status"
                value={formData.breeding_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {breedingStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Genetics Notes
            </label>
            <textarea
              name="genetics_notes"
              value={formData.genetics_notes}
              onChange={handleChange}
              placeholder="e.g., Genetic traits, health considerations..."
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
              {isSubmitting ? "Saving..." : "Record Breeding"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BreedingRecordForm;
