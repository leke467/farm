import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiX, FiDownload, FiTrendingDown } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FormField, SelectField, DateField, NumberField, TextAreaField } from "../../components/forms/FormComponents";
import CategoryCombobox from "../../components/CategoryCombobox";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import { formatFarmCurrency, getFarmCurrencySymbol } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

const InventoryManagement = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();
  const { toast } = useToast();
  
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryCategorySuggestions, setInventoryCategorySuggestions] = useState([]);

  const {
    register: registerItem,
    handleSubmit: handleItemSubmit,
    formState: { errors: itemErrors, isSubmitting: isItemSubmitting },
    reset: resetItem,
    setValue: setItemValue,
    control: itemControl,
  } = useForm({
    defaultValues: {
      name: "",
      category: "feed",
      quantity: 0,
      unit: "kg",
      min_quantity: 0,
      cost_per_unit: 0,
      supplier: "",
      location: "",
      purchase_date: "",
      expiry_date: "",
      notes: "",
    },
  });

  const {
    register: registerTransaction,
    handleSubmit: handleTransactionSubmit,
    formState: { errors: transErrors, isSubmitting: isTransSubmitting },
    reset: resetTransaction,
  } = useForm({
    defaultValues: {
      transaction_type: "in",
      quantity: 0,
      cost_per_unit: 0,
      transaction_date: "",
      reason: "",
      reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (activeFarm?.id) {
      fetchData();
      const loadCategories = async () => {
        try {
          const cats = await apiService.getFarmCategories(activeFarm.id, 'inventory_category');
          if (!cats._error) {
            setInventoryCategorySuggestions(cats);
          }
        } catch (error) {
          console.error("Failed to load categories:", error);
        }
      };
      loadCategories();
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, transRes] = await Promise.all([
        apiService.get("/inventory/"),
        apiService.get("/inventory/transactions/"),
      ]);
      const itemList = Array.isArray(itemsRes)
        ? itemsRes
        : itemsRes?.results || itemsRes?.data || [];
      const transList = Array.isArray(transRes)
        ? transRes
        : transRes?.results || transRes?.data || [];
      setItems(Array.isArray(itemList) ? itemList : []);
      setTransactions(Array.isArray(transList) ? transList : []);
    } catch (error) {
      setApiError("Failed to load inventory data");
      setItems([]);
      setTransactions([]);
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onItemSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        farm: activeFarm?.id,
        purchase_date: data.purchase_date && data.purchase_date.trim() ? data.purchase_date : null,
        expiry_date: data.expiry_date && data.expiry_date.trim() ? data.expiry_date : null,
        cost_per_unit: data.cost_per_unit !== "" && data.cost_per_unit !== null && !isNaN(parseFloat(data.cost_per_unit)) ? parseFloat(data.cost_per_unit) : 0,
        quantity: data.quantity !== "" && data.quantity !== null && !isNaN(parseFloat(data.quantity)) ? parseFloat(data.quantity) : 0,
        min_quantity: data.min_quantity !== "" && data.min_quantity !== null && !isNaN(parseFloat(data.min_quantity)) ? parseFloat(data.min_quantity) : 0,
      };

      if (selectedItem) {
        await apiService.patch(`/api/inventory/${selectedItem.id}/`, payload);
        const msg = "Item updated successfully!";
        toast.success(msg);
        setApiSuccess(msg);
      } else {
        await apiService.post("/api/inventory/", payload);
        const msg = "Item added successfully!";
        toast.success(msg);
        setApiSuccess(msg);
      }
      resetItem();
      setIsAddModalOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      const errDetail = error.response?.data ? JSON.stringify(error.response.data) : "Failed to save item";
      setApiError(errDetail);
    }
  };

  const onTransactionSubmit = async (data) => {
    if (!selectedItem) {
      setApiError("Please select an item");
      return;
    }

    const payload = {
      item: selectedItem.id,
      item_id: selectedItem.id,
      transaction_type: data.transaction_type || "in",
      quantity: Number(data.quantity || 0),
      cost_per_unit: data.cost_per_unit ? Number(data.cost_per_unit) : null,
      transaction_date: data.transaction_date || new Date().toISOString().split("T")[0],
      reason: data.reason || "",
      reference: data.reference || "",
      notes: data.notes || "",
    };

    try {
      await apiService.post("/inventory/transactions/", payload);
      const msg = "Transaction recorded successfully!";
      toast.success(msg);
      setApiSuccess(msg);
      resetTransaction();
      setIsTransactionModalOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      const errRes = error.response?.data;
      const errMsg = typeof errRes === "object" ? Object.values(errRes).flat().join(" ") : "Failed to record transaction";
      setApiError(errMsg || "Failed to record transaction");
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setItemValue("name", item.name);
    setItemValue("category", item.category);
    setItemValue("quantity", item.quantity);
    setItemValue("unit", item.unit);
    setItemValue("min_quantity", item.min_quantity);
    setItemValue("cost_per_unit", item.cost_per_unit || "");
    setItemValue("supplier", item.supplier);
    setItemValue("location", item.location);
    setItemValue("purchase_date", item.purchase_date || "");
    setItemValue("expiry_date", item.expiry_date || "");
    setItemValue("notes", item.notes);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      apiService.delete(`/api/inventory/${id}/`).then(() => {
        fetchData();
        setApiSuccess("Item deleted successfully!");
        setTimeout(() => setApiSuccess(""), 2000);
      });
    }
  };

  const handleOpenTransactionModal = (item) => {
    setSelectedItem(item);
    resetTransaction();
    setIsTransactionModalOpen(true);
  };

  // Filter and search logic
  const safeItems = Array.isArray(items) ? items : [];
  let filteredItems = safeItems.filter((item) => {
    if (!item) return false;
    let matches = true;
    if (filterCategory !== "all") matches = matches && item.category === filterCategory;
    if (filterStock === "low") matches = matches && Number(item.quantity || 0) <= Number(item.min_quantity || 0);
    if (filterStock === "expiring") {
      matches = matches && item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    if (filterLowStock) matches = matches && Number(item.quantity || 0) <= Number(item.min_quantity || 0);
    if (searchQuery) {
      matches = matches && (
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return matches;
  });

  // Calculate totals
  const totalValue = filteredItems.reduce((sum, item) => {
    const val = item.total_value != null ? Number(item.total_value) : (Number(item.quantity || 0) * Number(item.cost_per_unit || 0));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  const lowStockCount = safeItems.filter((item) => item && Number(item.quantity || 0) <= Number(item.min_quantity || 0)).length;
  const expiringCount = safeItems.filter((item) => 
    item && item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  const categoryOptions = [
    { value: "production", label: "Production / Yield 🥛" },
    { value: "feed", label: "Feed" },
    { value: "fertilizer", label: "Fertilizer" },
    { value: "medical", label: "Medical" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "fuel", label: "Fuel" },
    { value: "tools", label: "Tools" },
    { value: "seeds", label: "Seeds" },
    { value: "other", label: "Other" },
  ];

  const unitOptions = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "L", label: "Liters (L)" },
    { value: "gal", label: "Gallons (gal)" },
    { value: "m3", label: "Cubic Meters (m³)" },
    { value: "units", label: "Units" },
    { value: "bags", label: "Bags" },
    { value: "boxes", label: "Boxes" },
  ];

  const transactionTypeOptions = [
    { value: "in", label: "Stock In" },
    { value: "out", label: "Stock Out" },
    { value: "adjustment", label: "Adjustment" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Inventory Management</h1>
          <p className="text-gray-600">Track stock levels, costs, and transactions</p>
        </div>
        <button
          onClick={() => {
            setSelectedItem(null);
            resetItem();
            setIsAddModalOpen(true);
          }}
          className="mt-4 md:mt-0 btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" /> Add Item
        </button>
      </div>

      {/* Success/Error Messages */}
      {apiSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{apiSuccess}</span>
          <button onClick={() => setApiSuccess("")} className="text-green-600"><FiX /></button>
        </div>
      )}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{apiError}</span>
          <button onClick={() => setApiError("")} className="text-red-600"><FiX /></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">{items.length}</p>
          <p className="text-xs text-gray-500 mt-2">In stock</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm font-medium">Low Stock</p>
          <p className="text-3xl font-bold text-orange-600">{lowStockCount}</p>
          <p className="text-xs text-gray-500 mt-2">Below minimum</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Expiring Soon</p>
          <p className="text-3xl font-bold text-red-600">{expiringCount}</p>
          <p className="text-xs text-gray-500 mt-2">Within 30 days</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-primary-500">
          <p className="text-gray-600 text-sm font-medium">Total Value</p>
          <p className="text-3xl font-bold text-primary-600">{formatFarmCurrency(totalValue, activeFarm)}</p>
          <p className="text-xs text-gray-500 mt-2">Inventory value</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="feed">Feed</option>
          <option value="fertilizer">Fertilizer</option>
          <option value="medical">Medical</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="fuel">Fuel</option>
          <option value="tools">Tools</option>
          <option value="seeds">Seeds</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Stock Status</option>
          <option value="low">Low Stock</option>
          <option value="expiring">Expiring Soon</option>
        </select>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Min Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cost Per Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.category?.toLowerCase() === "production" || item.category?.toLowerCase().includes("yield") ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{item.category === "production" ? "Production / Yield" : item.category}</span>
                        </span>
                      ) : (
                        <span className="capitalize text-gray-800 font-medium">{item.category}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className={Number(item.quantity || 0) <= Number(item.min_quantity || 0) ? "text-orange-600 font-bold" : ""}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.min_quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatFarmCurrency(item.cost_per_unit || 0, activeFarm)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatFarmCurrency(item.total_value != null ? item.total_value : (Number(item.quantity || 0) * Number(item.cost_per_unit || 0)), activeFarm)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.supplier || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.location || "N/A"}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleOpenTransactionModal(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Transact
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        <FiEdit2 className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAddModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold mb-4">
                    {selectedItem ? "Edit Item" : "Add Inventory Item"}
                  </Dialog.Title>

                  <form onSubmit={handleItemSubmit(onItemSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        register={registerItem}
                        name="name"
                        label="Item Name"
                        type="text"
                        placeholder="e.g. Layer Mash Feed"
                        helperText="Name or description of the supply item."
                        errors={itemErrors}
                      />
                      <Controller
                        name="category"
                        control={itemControl}
                        render={({ field }) => (
                          <CategoryCombobox
                            id="category"
                            name="category"
                            value={field.value || ""}
                            onChange={field.onChange}
                            suggestions={inventoryCategorySuggestions}
                            placeholder="Type custom or select from dropdown..."
                            label="Category"
                            helperText="Type custom category or select preset suggestion."
                          />
                        )}
                      />
                      <NumberField
                        register={registerItem}
                        name="quantity"
                        label="Current Quantity"
                        helperText="Amount currently in stock on the farm."
                        errors={itemErrors}
                      />
                      <SelectField
                        register={registerItem}
                        name="unit"
                        label="Unit"
                        helperText="Unit of measurement (e.g. kg, Bags)."
                        options={unitOptions}
                        errors={itemErrors}
                      />
                      <NumberField
                        register={registerItem}
                        name="min_quantity"
                        label="Minimum Quantity"
                        helperText="Safety stock level. Triggers Low Stock alert when reached."
                        errors={itemErrors}
                      />
                      <NumberField
                        register={registerItem}
                        name="cost_per_unit"
                        label={`Cost Per Unit (${getFarmCurrencySymbol(activeFarm)})`}
                        helperText="Purchase price paid per single unit."
                        errors={itemErrors}
                      />
                      <FormField
                        register={registerItem}
                        name="supplier"
                        label="Supplier (Optional)"
                        type="text"
                        placeholder="e.g. AgriSupply Co."
                        helperText="Vendor or dealer where item was bought."
                        errors={itemErrors}
                      />
                      <FormField
                        register={registerItem}
                        name="location"
                        label="Location (Optional)"
                        type="text"
                        placeholder="e.g. Barn A / Shed 2"
                        helperText="Storage location on the farm."
                        errors={itemErrors}
                      />
                      <DateField
                        register={registerItem}
                        name="purchase_date"
                        label="Purchase Date (Optional)"
                        helperText="Date stock batch was acquired."
                        errors={itemErrors}
                      />
                      <DateField
                        register={registerItem}
                        name="expiry_date"
                        label="Expiry Date (Optional)"
                        helperText="Expiration date for perishable goods."
                        errors={itemErrors}
                      />
                    </div>

                    <TextAreaField
                      register={registerItem}
                      name="notes"
                      label="Notes (Optional)"
                      placeholder="Special storage instructions or details..."
                      helperText="Additional storage instructions or notes."
                      errors={itemErrors}
                      rows={3}
                    />

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={isItemSubmitting}
                        className="flex-1 btn btn-primary"
                      >
                        {isItemSubmitting ? "Saving..." : "Save Item"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          setSelectedItem(null);
                          resetItem();
                        }}
                        className="flex-1 btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Transaction Modal */}
      <Transition appear show={isTransactionModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsTransactionModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold mb-4">
                    Record Transaction - {selectedItem?.name}
                  </Dialog.Title>

                  <form onSubmit={handleTransactionSubmit(onTransactionSubmit)} className="space-y-4">
                    <SelectField
                      register={registerTransaction}
                      name="transaction_type"
                      label="Transaction Type"
                      options={transactionTypeOptions}
                      errors={transErrors}
                    />

                    <NumberField
                      register={registerTransaction}
                      name="quantity"
                      label="Quantity"
                      errors={transErrors}
                    />

                    <NumberField
                      register={registerTransaction}
                      name="cost_per_unit"
                      label={`Cost Per Unit (${getFarmCurrencySymbol(activeFarm)})`}
                      errors={transErrors}
                    />

                    <DateField
                      register={registerTransaction}
                      name="transaction_date"
                      label="Transaction Date"
                      errors={transErrors}
                    />

                    <FormField
                      register={registerTransaction}
                      name="reason"
                      label="Reason (Optional)"
                      type="text"
                      errors={transErrors}
                    />

                    <FormField
                      register={registerTransaction}
                      name="reference"
                      label="Reference Number (Optional)"
                      type="text"
                      errors={transErrors}
                    />

                    <TextAreaField
                      register={registerTransaction}
                      name="notes"
                      label="Notes (Optional)"
                      errors={transErrors}
                      rows={2}
                    />

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={isTransSubmitting}
                        className="flex-1 btn btn-primary"
                      >
                        {isTransSubmitting ? "Recording..." : "Record Transaction"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTransactionModalOpen(false);
                          setSelectedItem(null);
                          resetTransaction();
                        }}
                        className="flex-1 btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default InventoryManagement;
