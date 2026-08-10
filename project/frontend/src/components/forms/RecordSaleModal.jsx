import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { FiX, FiDollarSign, FiPlusCircle, FiUsers, FiGrid, FiPackage } from "react-icons/fi";
import apiService from "../../services/api";
import { useFarmData } from "../../context/FarmDataContext";
import { getFarmCurrencySymbol } from "../../utils/formatters";
import { formatNumberWithCommas, cleanCommaNumber } from "./FormComponents";

import { useToast } from "../../context/ToastContext";

export default function RecordSaleModal({ isOpen, onClose, onSuccess, initialType = "crop_sales", defaultItem = "" }) {
  const { activeFarm, inventory: contextInventory = [], refreshData, updateAnimal } = useFarmData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [animalsList, setAnimalsList] = useState([]);
  const [cropsList, setCropsList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);

  const [formData, setFormData] = useState({
    source: initialType, // 'animal_sales', 'animal_products', 'crop_sales', 'inventory_sales', 'services', 'other'
    animal_id: "",
    crop_id: "",
    inventory_id: "",
    head_sold: 1,
    weight_sold: "",
    weight_unit: "ton", // 'ton' or 'kg'
    price_basis: "per_head", // 'per_head', 'per_kg', 'per_ton', 'lump_sum'
    item_sold: defaultItem,
    quantity: 1,
    unit: "head",
    unit_price: "",
    total_amount: "",
    buyer: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const currencySymbol = getFarmCurrencySymbol(activeFarm);

  // Combine fetched list and context inventory for robust fallback
  const rawCombinedInventory = [...inventoryList, ...(Array.isArray(contextInventory) ? contextInventory : [])];
  const availableInventory = Array.from(
    new Map(rawCombinedInventory.map((item) => [String(item.id), item])).values()
  );

  useEffect(() => {
    if (isOpen && activeFarm?.id) {
      fetchFarmAssets();
    }
  }, [isOpen, activeFarm?.id]);

  const fetchFarmAssets = async () => {
    try {
      const [animRes, cropRes, invRes] = await Promise.all([
        apiService.getAnimals({ farm: activeFarm.id }),
        apiService.getCrops({ farm: activeFarm.id }),
        apiService.getInventory({ farm: activeFarm.id }),
      ]);
      const anims = Array.isArray(animRes) ? animRes : animRes?.results || animRes?.data || [];
      const crps = Array.isArray(cropRes) ? cropRes : cropRes?.results || cropRes?.data || [];
      const invs = Array.isArray(invRes) ? invRes : invRes?.results || invRes?.data || [];
      setAnimalsList(anims.filter((a) => a.status !== "sold"));
      setCropsList(crps);
      setInventoryList(invs);
    } catch (err) {
      console.error("Failed to load farm assets for sale:", err);
    }
  };

  const handleSourceChange = (newSource) => {
    setFormData((prev) => ({
      ...prev,
      source: newSource,
      animal_id: "",
      crop_id: "",
      inventory_id: "",
      unit: newSource === "animal_sales" ? "head" : newSource === "crop_sales" ? "kg" : newSource === "inventory_sales" ? "kg" : "unit",
    }));
    setSelectedAnimal(null);
    setSelectedCrop(null);
    setSelectedInventoryItem(null);
  };

  const handleAnimalSelect = (animalId) => {
    const found = animalsList.find((a) => String(a.id) === String(animalId));
    setSelectedAnimal(found || null);
    if (found) {
      const initialCount = found.count || 1;
      const initialWeight = found.weight || found.avg_weight || "";
      setFormData((prev) => ({
        ...prev,
        source: "animal_sales",
        animal_id: animalId,
        head_sold: 1,
        quantity: 1,
        weight_sold: "",
        weight_unit: initialWeight && Number(initialWeight) >= 1000 ? "ton" : "kg",
        item_sold: `${found.name} (${found.animal_type || found.type})`,
        unit: "head",
      }));
    }
  };

  const handleCropSelect = (cropId) => {
    const found = cropsList.find((c) => String(c.id) === String(cropId));
    setSelectedCrop(found || null);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        crop_id: cropId,
        item_sold: `${found.name} Harvest`,
        unit: "kg",
      }));
    }
  };

  const handleInventorySelect = (itemId) => {
    const found = availableInventory.find((i) => String(i.id) === String(itemId));
    setSelectedInventoryItem(found || null);
    if (found) {
      const unit = found.unit || "kg";
      const costPerUnit = found.cost_per_unit ?? found.costPerUnit;
      setFormData((prev) => ({
        ...prev,
        inventory_id: itemId,
        item_sold: `${found.name} (${found.category || "Feed"})`,
        unit: unit,
        unit_price: costPerUnit ? String(costPerUnit) : prev.unit_price,
      }));
    }
  };

  const updateAnimalSalesPricing = (updatedFields) => {
    setFormData((prev) => {
      const next = { ...prev, ...updatedFields };

      const head = Number(cleanCommaNumber(next.head_sold)) || 0;
      const weight = Number(cleanCommaNumber(next.weight_sold)) || 0;
      const price = Number(cleanCommaNumber(next.unit_price)) || 0;

      const weightKg = next.weight_unit === "ton" ? weight * 1000 : weight;
      const weightTons = next.weight_unit === "ton" ? weight : weight / 1000;

      let computedTotal = 0;
      let effectiveQty = head;
      let effectiveUnit = "head";

      if (next.price_basis === "per_head") {
        effectiveQty = head;
        effectiveUnit = "head";
        computedTotal = head * price;
      } else if (next.price_basis === "per_kg") {
        effectiveQty = weightKg;
        effectiveUnit = "kg";
        computedTotal = weightKg * price;
      } else if (next.price_basis === "per_ton") {
        effectiveQty = weightTons;
        effectiveUnit = "ton";
        computedTotal = weightTons * price;
      } else if (next.price_basis === "lump_sum") {
        effectiveQty = head > 0 ? head : 1;
        effectiveUnit = "unit";
        computedTotal = price || Number(cleanCommaNumber(next.total_amount)) || 0;
      }

      // Generate clear item description (e.g. "64 Head Catfish Pond 1 (2,000 kgs)")
      let desc = next.item_sold;
      if (selectedAnimal) {
        desc = `${head > 0 ? `${formatNumberWithCommas(head)} Head ` : ""}${selectedAnimal.name} (${weight > 0 ? `${formatNumberWithCommas(weight)} ${next.weight_unit}s` : ""})`.trim();
      }

      return {
        ...next,
        quantity: formatNumberWithCommas(effectiveQty),
        unit: effectiveUnit,
        total_amount: computedTotal > 0 ? formatNumberWithCommas(computedTotal.toFixed(2)) : next.total_amount,
        item_sold: desc || next.item_sold,
      };
    });
  };

  const handleQuantityOrPriceChange = (qtyVal, priceVal) => {
    const cleanQtyStr = cleanCommaNumber(qtyVal);
    const cleanPriceStr = cleanCommaNumber(priceVal);

    const qty = Number(cleanQtyStr) || 0;
    const price = Number(cleanPriceStr) || 0;
    const computedTotal = qty * price;

    setFormData((prev) => ({
      ...prev,
      quantity: formatNumberWithCommas(cleanQtyStr),
      unit_price: formatNumberWithCommas(cleanPriceStr),
      total_amount: computedTotal > 0 ? formatNumberWithCommas(computedTotal.toFixed(2)) : prev.total_amount,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeFarm?.id) {
      setError("No active farm selected.");
      return;
    }
    if (!formData.item_sold || !formData.total_amount) {
      setError("Please fill in the item sold and total sales amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanQty = Number(cleanCommaNumber(formData.quantity)) || 1;
      const cleanUnitPrice = Number(cleanCommaNumber(formData.unit_price)) || 0;
      const cleanTotal = Number(cleanCommaNumber(formData.total_amount)) || 0;

      // 1. Post Revenue Record
      const payload = {
        farm: activeFarm.id,
        date: formData.date,
        source: formData.source,
        item_sold: formData.item_sold,
        quantity: cleanQty,
        unit: formData.unit,
        unit_price: cleanUnitPrice || cleanTotal,
        total_amount: cleanTotal,
        buyer: formData.buyer || "",
        notes: formData.notes || "",
      };

      const res = await apiService.post("/expenses/revenues/", payload);
      if (res?._error) {
        setError(res._error || "Failed to record sale.");
        setLoading(false);
        return;
      }

      // 2. Perform Stock Deduction on Selected Animal / Group
      // 2. Perform Stock Deduction on Selected Animal / Group
      if (selectedAnimal) {
        const currentCount = Number(selectedAnimal.count || 1);
        const cleanHeadSold = Number(cleanCommaNumber(formData.head_sold)) || 1;
        const soldHead = Math.min(Math.max(1, cleanHeadSold), currentCount);
        const remainingCount = Math.max(0, currentCount - soldHead);

        const currentAvgWeight = selectedAnimal.avg_weight ?? selectedAnimal.avgWeight ?? null;

        let animalUpdatePayload;
        if (remainingCount <= 0) {
          animalUpdatePayload = {
            status: "sold",
            count: 0,
            weight: 0,
            avg_weight: 0,
          };
        } else {
          animalUpdatePayload = {
            count: remainingCount,
            status: selectedAnimal.status || "healthy",
          };
          if (currentAvgWeight !== null && currentAvgWeight !== undefined) {
            const avgW = Number(currentAvgWeight);
            if (!isNaN(avgW) && avgW > 0) {
              animalUpdatePayload.avg_weight = avgW;
              animalUpdatePayload.weight = Number((remainingCount * avgW).toFixed(2));
            }
          }
        }

        try {
          if (updateAnimal) {
            await updateAnimal(selectedAnimal.id, animalUpdatePayload);
          } else {
            await apiService.updateAnimal(selectedAnimal.id, animalUpdatePayload);
          }
        } catch (updateErr) {
          console.error("ANIMAL UPDATE FAILED:", updateErr);
        }

        if (refreshData) {
          try { await refreshData(); } catch (e) {}
        }
      }

      // 3. Perform Stock Deduction on Selected Inventory Item / Feed
      if (formData.source === "inventory_sales" && selectedInventoryItem) {
        const currentQty = Number(selectedInventoryItem.quantity || 0);
        const remainingQty = Math.max(0, currentQty - cleanQty);

        await apiService.updateInventoryItem(selectedInventoryItem.id, {
          quantity: remainingQty,
        }).catch((e) => console.error("Failed to update inventory stock:", e));

        await apiService.post("/inventory/transactions/", {
          item: selectedInventoryItem.id,
          transaction_type: "out",
          quantity: cleanQty,
          reason: `Inventory Sale to ${formData.buyer || "Customer"}`,
          notes: `Sold ${cleanQty} ${formData.unit} for ${currencySymbol}${cleanTotal}`,
        }).catch((e) => console.error("Failed to log inventory transaction:", e));

        if (refreshData) {
          try { refreshData(); } catch (e) {}
        }
      }

      toast.success("Farm sale recorded successfully!");
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error("Failed to record revenue sale:", err);
      setError("Failed to save sale transaction.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                <FiDollarSign size={24} />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">
                  Record Farm Sale / Revenue
                </Dialog.Title>
                <p className="text-xs text-gray-500">Log income from selling crops, animals, or farm products</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sale Category *
              </label>
              <select
                value={formData.source}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="animal_sales">Animal Sales (Livestock / Poultry / Fish)</option>
                <option value="crop_sales">Crop Sales (Harvested Produce / Grains)</option>
                <option value="inventory_sales">📦 Feed & Inventory Sales (Feed, Seeds, Supplies)</option>
                <option value="animal_products">Animal Products (Milk / Eggs / Honey)</option>
                <option value="equipment_rental">Equipment Rental Income</option>
                <option value="services">Farm Services & Consulting</option>
                <option value="other">Other Income</option>
              </select>
            </div>

            {/* Animal Selection & Dual Quantity (Head + Weight) Section */}
            {formData.source === "animal_sales" && (
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1 flex items-center space-x-1">
                    <FiUsers className="text-emerald-600" />
                    <span>Select Animal / Group to Sell *</span>
                  </label>
                  <select
                    value={formData.animal_id}
                    onChange={(e) => handleAnimalSelect(e.target.value)}
                    className="w-full text-sm border border-emerald-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Choose Animal / Group from Farm --</option>
                    {animalsList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.animal_type || a.type}) - {a.is_group ? `${a.count} head` : "Individual"}{" "}
                        {a.weight || a.avg_weight ? `(${a.weight || a.avg_weight} kg)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAnimal && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs text-emerald-800 bg-white p-2.5 rounded-lg border border-emerald-100 font-medium">
                      <span>Available Stock: <strong>{selectedAnimal.count || 1} head</strong></span>
                      {selectedAnimal.weight && <span>Total Weight: <strong>{selectedAnimal.weight} kg ({(Number(selectedAnimal.weight)/1000).toFixed(2)} tons)</strong></span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Head Count Sold (Qty) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(formData.head_sold)}
                          onChange={(e) => updateAnimalSalesPricing({ head_sold: cleanCommaNumber(e.target.value) })}
                          className="w-full text-sm font-mono border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          placeholder="e.g. 64"
                        />
                        <span className="text-[10px] text-gray-500">Number of animals sold</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Total Weight Sold
                        </label>
                        <div className="flex space-x-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formatNumberWithCommas(formData.weight_sold)}
                            onChange={(e) => updateAnimalSalesPricing({ weight_sold: cleanCommaNumber(e.target.value) })}
                            className="w-full text-sm font-mono border border-gray-300 rounded-l-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="e.g. 2"
                          />
                          <select
                            value={formData.weight_unit}
                            onChange={(e) => updateAnimalSalesPricing({ weight_unit: e.target.value })}
                            className="text-xs border border-l-0 border-gray-300 rounded-r-xl px-2 bg-gray-50 font-bold focus:outline-none"
                          >
                            <option value="ton">ton(s)</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {formData.weight_sold ? `(${formData.weight_unit === "ton" ? (Number(cleanCommaNumber(formData.weight_sold))*1000).toLocaleString() + " kg" : (Number(cleanCommaNumber(formData.weight_sold))/1000).toFixed(2) + " tons"})` : "Optional total weight"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Pricing Basis *
                      </label>
                      <select
                        value={formData.price_basis}
                        onChange={(e) => updateAnimalSalesPricing({ price_basis: e.target.value })}
                        className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="per_head">Priced Per Head (Animal)</option>
                        <option value="per_ton">Priced Per Ton</option>
                        <option value="per_kg">Priced Per Kg</option>
                        <option value="lump_sum">Total Lump Sum Price</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Crop Selection Dropdown */}
            {formData.source === "crop_sales" && (
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <label className="block text-xs font-semibold text-emerald-900 mb-1 flex items-center space-x-1">
                  <FiGrid className="text-emerald-600" />
                  <span>Select Crop Produce *</span>
                </label>
                <select
                  value={formData.crop_id}
                  onChange={(e) => handleCropSelect(e.target.value)}
                  className="w-full text-sm border border-emerald-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Crop Field / Produce --</option>
                  {cropsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type || c.category || "Crop"}) - Field: {c.field_location || c.fieldLocation || "Main"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Inventory Item / Feed Selection Dropdown */}
            {formData.source === "inventory_sales" && (
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1 flex items-center space-x-1">
                    <FiPackage className="text-emerald-600" />
                    <span>Select Feed / Inventory Stock Item to Sell *</span>
                  </label>
                  <select
                    value={formData.inventory_id}
                    onChange={(e) => handleInventorySelect(e.target.value)}
                    className="w-full text-sm border border-emerald-200 bg-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Choose Feed or Supply Item from Inventory Stock --</option>
                    {availableInventory.length > 0 ? (
                      availableInventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.category || "Feed"}) — {item.quantity} {item.unit || "unit"} in stock {item.cost_per_unit || item.costPerUnit ? `@ ${currencySymbol}${item.cost_per_unit || item.costPerUnit}/${item.unit || "unit"}` : ""}
                        </option>
                      ))
                    ) : (
                      <option disabled value="">No inventory stock items found for this farm</option>
                    )}
                  </select>
                </div>

                {selectedInventoryItem && (
                  <div className="flex items-center justify-between text-xs text-emerald-800 bg-white p-2.5 rounded-lg border border-emerald-100 font-medium">
                    <span>Available Stock: <strong>{selectedInventoryItem.quantity} {selectedInventoryItem.unit || "unit"}</strong></span>
                    {(selectedInventoryItem.cost_per_unit || selectedInventoryItem.costPerUnit) && (
                      <span>Stock Unit Cost: <strong>{currencySymbol}{selectedInventoryItem.cost_per_unit || selectedInventoryItem.costPerUnit} / {selectedInventoryItem.unit || "unit"}</strong></span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Item / Description Sold *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5 Broiler Chickens, 50 Bags of Hybrid Maize, 10 Crates of Eggs"
                value={formData.item_sold}
                onChange={(e) => setFormData({ ...formData, item_sold: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quantity & Unit of Measurement Fields */}
            {formData.source === "animal_sales" ? (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-700">
                <span>Calculated Billing Quantity:</span>
                <span className="font-bold font-mono text-emerald-800 bg-white px-3 py-1 rounded-lg border border-gray-200">
                  {formatNumberWithCommas(formData.quantity)} {formData.unit}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quantity Sold
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatNumberWithCommas(formData.quantity)}
                    onChange={(e) => handleQuantityOrPriceChange(e.target.value, formData.unit_price)}
                    className="w-full text-sm font-mono border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="head">head (Animals / Livestock / Poultry)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="bag">bag (Bags of Grain / Produce)</option>
                    <option value="crate">crate (Crates of Eggs / Fruits)</option>
                    <option value="liter">liter (Liters of Milk / Liquid)</option>
                    <option value="ton">ton (Metric Tons)</option>
                    <option value="bunch">bunch (Plantains / Bananas)</option>
                    <option value="bale">bale (Hay / Straw)</option>
                    <option value="unit">unit / piece (Services / Equipment / Other)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Price per {formData.unit || "Unit"} ({currencySymbol}) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formatNumberWithCommas(formData.unit_price)}
                  onChange={(e) => {
                    const cleanVal = cleanCommaNumber(e.target.value);
                    if (formData.source === "animal_sales") {
                      updateAnimalSalesPricing({ unit_price: cleanVal });
                    } else {
                      handleQuantityOrPriceChange(formData.quantity, cleanVal);
                    }
                  }}
                  className="w-full text-sm font-mono border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total Sales Value ({currencySymbol}) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  value={formatNumberWithCommas(formData.total_amount)}
                  onChange={(e) => {
                    const cleanVal = cleanCommaNumber(e.target.value);
                    setFormData({ ...formData, total_amount: formatNumberWithCommas(cleanVal) });
                  }}
                  className="w-full text-sm font-mono font-bold border border-emerald-300 text-emerald-700 bg-emerald-50/40 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Buyer Name / Business
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central Market Trader"
                  value={formData.buyer}
                  onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date of Sale
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="Add any payment notes, batch details, or delivery info..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <FiPlusCircle size={16} />
                <span>{loading ? "Recording..." : "Record Sale & Gain"}</span>
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
