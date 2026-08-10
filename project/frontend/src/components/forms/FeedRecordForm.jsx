import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  FormField,
  SelectField,
  NumberField,
  DateField,
  TextAreaField,
  FormError,
  FormSuccess,
  SubmitButton,
} from "./FormComponents";
import CategoryCombobox from "../CategoryCombobox";
import apiService from "../../services/api";
import { useToast } from "../../context/ToastContext";

const feedRecordSchema = yup.object().shape({
  animal: yup.string().required("Please select an animal or group"),
  date: yup.string().required("Date is required"),
  feed_type: yup.string().when("feed_mode", {
    is: "single",
    then: (schema) => schema.required("Feed type or name is required"),
    otherwise: (schema) => schema.nullable(),
  }),
  amount: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .required("Feed amount is required")
    .positive("Amount must be greater than 0"),
  unit: yup.string().required("Unit of measurement is required"),
  cost: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value))
    .nullable()
    .min(0, "Cost cannot be negative"),
  notes: yup.string().nullable(),
});

const DEFAULT_FEED_PRESETS = [
  { value: "Broiler Starter", label: "Broiler Starter", icon: "🌾" },
  { value: "Layer Mash", label: "Layer Mash", icon: "🐔" },
  { value: "Cattle Feed", label: "Cattle Feed / Concentrate", icon: "🐄" },
  { value: "Goat Feed", label: "Goat Feed", icon: "🐐" },
  { value: "Pig Grower", label: "Pig Grower", icon: "🐖" },
  { value: "Fish Pellets", label: "Fish Pellets", icon: "🐟" },
  { value: "Hay & Fodder", label: "Hay & Fodder", icon: "🌿" },
  { value: "Silage", label: "Silage", icon: "🚜" },
];

export default function FeedRecordForm({
  animals = [],
  activeFarmId,
  selectedAnimalId = "",
  onOpenFeedMixModal,
  onSuccess,
  onCancel,
}) {
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [inventoryFeeds, setInventoryFeeds] = useState([]);
  const [feedMixes, setFeedMixes] = useState([]);

  const [feedMode, setFeedMode] = useState("single"); // "single" | "mix"
  const [selectedMixId, setSelectedMixId] = useState("");
  const [deductFromInventory, setDeductFromInventory] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (activeFarmId) {
        try {
          const [invRes, mixRes] = await Promise.all([
            apiService.get(`/inventory/?farm=${activeFarmId}`),
            apiService.get(`/animals/feed-mixes/?farm=${activeFarmId}`),
          ]);
          const items = Array.isArray(invRes) ? invRes : invRes?.results || invRes?.data || [];
          const mixes = Array.isArray(mixRes) ? mixRes : mixRes?.results || mixRes?.data || [];

          const feeds = items
            .filter((item) => item.category === "feed" || item.name.toLowerCase().includes("feed"))
            .map((item) => ({
              value: item.name,
              label: `${item.name} (${item.quantity} ${item.unit} in stock)`,
              icon: "📦",
            }));

          setInventoryFeeds(feeds.length > 0 ? feeds : DEFAULT_FEED_PRESETS);
          setFeedMixes(mixes);
        } catch (err) {
          setInventoryFeeds(DEFAULT_FEED_PRESETS);
        }
      }
    };
    fetchData();
  }, [activeFarmId]);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(feedRecordSchema),
    defaultValues: {
      animal: selectedAnimalId ? String(selectedAnimalId) : "",
      date: new Date().toISOString().split("T")[0],
      feed_type: "",
      amount: "",
      unit: "kg",
      cost: "",
      notes: "",
    },
  });

  const amountVal = watch("amount");
  const unitVal = watch("unit");
  const selectedMix = feedMixes.find((m) => String(m.id) === String(selectedMixId));

  const onSubmit = async (data) => {
    setFormError("");
    setFormSuccess("");

    if (feedMode === "mix" && !selectedMixId) {
      setFormError("Please select a custom feed mix formulation.");
      return;
    }

    if (isRecurring && !endDate) {
      setFormError("Please select an end date for the daily recurring feeding schedule.");
      return;
    }

    try {
      const selectedAnim = animals.find((a) => String(a.id) === String(data.animal));
      const payload = {
        animal: data.animal,
        group_name: selectedAnim?.is_group ? selectedAnim.name : "",
        date: data.date,
        feed_type: feedMode === "mix" ? selectedMix?.name : data.feed_type,
        feed_mix: feedMode === "mix" ? selectedMixId : null,
        amount: parseFloat(data.amount),
        unit: data.unit,
        cost: data.cost ? parseFloat(data.cost) : 0,
        deduct_from_inventory: deductFromInventory,
        is_recurring: isRecurring,
        end_date: isRecurring ? endDate : null,
        notes: data.notes || "",
        farm: activeFarmId,
      };

      await apiService.post(`/animals/feed-records/`, payload);
      const msg = `Feed logged successfully! ${
        deductFromInventory
          ? feedMode === "mix"
            ? "Component ingredients auto-deducted from inventory!"
            : "Inventory stock auto-deducted."
          : "(Inventory deduction skipped)."
      }`;
      toast.success(msg);
      setFormSuccess(msg);
      reset();
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err) {
      setFormError(
        err.response?.data ? JSON.stringify(err.response.data) : "Failed to record feed consumption"
      );
    }
  };

  const animalOptions = animals.map((anim) => ({
    value: String(anim.id),
    label: anim.is_group
      ? `[Group] ${anim.name} (${anim.count || 0} count)`
      : `${anim.name || `Tag #${anim.tag_id}`} (${anim.animal_type || anim.type})`,
  }));

  const unitOptions = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "Bags", label: "Bags" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "L", label: "Liters (L)" },
    { value: "units", label: "Units" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <FormError message={formError} />
      <FormSuccess message={formSuccess} />

      <SelectField
        label="Select Animal or Group"
        register={register}
        name="animal"
        errors={errors}
        options={animalOptions}
        helperText="Choose individual animal or group/flock receiving feed."
        required
      />

      <DateField
        label="Feeding Date"
        register={register}
        name="date"
        errors={errors}
        helperText="Date when feed was provided to the animals."
        required
      />

      {/* Feed Mode Toggle: Single Feed vs Custom Ration Mix */}
      <div className="p-3 bg-slate-50 border rounded-xl">
        <label className="block text-xs font-semibold text-slate-700 mb-2">Feed Selection Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFeedMode("single")}
            className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
              feedMode === "single"
                ? "bg-white text-green-700 border-green-600 shadow-sm"
                : "bg-transparent text-slate-600 border-slate-200 hover:bg-white"
            }`}
          >
            📦 Single Feed Item
          </button>

          <button
            type="button"
            onClick={() => setFeedMode("mix")}
            className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
              feedMode === "mix"
                ? "bg-white text-green-700 border-green-600 shadow-sm"
                : "bg-transparent text-slate-600 border-slate-200 hover:bg-white"
            }`}
          >
            🥣 Custom Feed Mix / Blend
          </button>
        </div>
      </div>

      {feedMode === "single" ? (
        <Controller
          name="feed_type"
          control={control}
          render={({ field }) => (
            <CategoryCombobox
              label="Feed Type / Brand"
              value={field.value}
              onChange={field.onChange}
              suggestions={inventoryFeeds.length > 0 ? inventoryFeeds : DEFAULT_FEED_PRESETS}
              placeholder="e.g. Layer Mash, Broiler Starter"
              helperText="Single feed item name. Deducts full quantity from inventory."
              required
              error={errors.feed_type?.message}
            />
          )}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold text-gray-700">Select Custom Ration Mix *</label>
            {onOpenFeedMixModal && (
              <button
                type="button"
                onClick={onOpenFeedMixModal}
                className="text-xs text-green-600 hover:text-green-700 font-semibold"
              >
                + Create / Manage Mixes
              </button>
            )}
          </div>

          <select
            value={selectedMixId}
            onChange={(e) => setSelectedMixId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select a feed mix formulation...</option>
            {feedMixes.map((mix) => (
              <option key={mix.id} value={mix.id}>
                {mix.name} ({mix.ingredients?.map((i) => `${i.ingredient_name}: ${i.percentage}%`).join(", ")})
              </option>
            ))}
          </select>

          {selectedMix && amountVal > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1">
              <span className="font-bold text-green-800">Proportional Inventory Deductions:</span>
              <ul className="list-disc pl-4 text-green-700">
                {selectedMix.ingredients?.map((ing, idx) => {
                  const compQty = (parseFloat(amountVal) * (parseFloat(ing.percentage) / 100)).toFixed(2);
                  return (
                    <li key={idx}>
                      <strong>{ing.ingredient_name}</strong> ({ing.percentage}%): <strong>{compQty} {unitVal}</strong> will be deducted
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberField
          label="Amount Consumed"
          register={register}
          name="amount"
          errors={errors}
          placeholder="e.g., 2.5"
          min="0.1"
          step="0.1"
          helperText="Quantity of feed consumed in this feeding."
          required
        />

        <SelectField
          label="Unit"
          register={register}
          name="unit"
          errors={errors}
          options={unitOptions}
          helperText="Unit of measurement (Bags, kg)."
          required
        />
      </div>

      {/* Inventory Deduction Checkbox Toggle */}
      <div className="p-3 bg-gray-50 border rounded-xl">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={deductFromInventory}
            onChange={(e) => setDeductFromInventory(e.target.checked)}
            className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 block">Deduct from Inventory Stock</span>
            <span className="text-xs text-slate-500 block leading-tight">
              {deductFromInventory
                ? "Feed quantity will be subtracted from matching stock in store."
                : "Record feed intake without altering store inventory stock balances."}
            </span>
          </div>
        </label>
      </div>

      {/* Daily Recurring Schedule Toggle */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-xs font-bold text-blue-900 block">Set as Daily Recurring Feeding Schedule</span>
            <span className="text-xs text-blue-700 block leading-tight">
              Automates daily feed intake logging up to a specified end date.
            </span>
          </div>
        </label>

        {isRecurring && (
          <div>
            <label className="block text-xs font-semibold text-blue-900 mb-1">Feed Daily Until Date *</label>
            <input
              type="date"
              value={endDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}
      </div>

      <NumberField
        label="Total Cost (Optional)"
        register={register}
        name="cost"
        errors={errors}
        placeholder="e.g., 25.00"
        min="0"
        step="0.01"
        helperText="Optional cost of feed consumed. Auto-calculated if blank."
      />

      <TextAreaField
        label="Notes"
        register={register}
        name="notes"
        errors={errors}
        placeholder="e.g., Morning feeding. Animals ate enthusiastically."
        helperText="Any observations regarding appetite or feeding behavior."
        rows={2}
      />

      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
          >
            Cancel
          </button>
        )}
        <SubmitButton isSubmitting={isSubmitting}>Record Feed Intake</SubmitButton>
      </div>
    </form>
  );
}
