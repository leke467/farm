import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiX, FiDownload, FiTrendingDown } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FormField, SelectField, DateField, NumberField, TextAreaField } from "../../components/forms/FormComponents";
import apiService from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";

const InventoryManagement = () => {
  const { token } = useUser();
  const { activeFarm } = useFarmData();
  
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    register: registerItem,
    handleSubmit: handleItemSubmit,
    formState: { errors: itemErrors, isSubmitting: isItemSubmitting },
    reset: resetItem,
    setValue: setItemValue,
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
    }
  }, [activeFarm?.id, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, transRes] = await Promise.all([
        apiService.get("/api/inventory/"),
        apiService.get("/api/inventory/transactions/"),
      ]);
      setItems(itemsRes.data);
      setTransactions(transRes.data);
    } catch (error) {
      setApiError("Failed to load inventory data");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onItemSubmit = async (data) => {
    try {
      if (selectedItem) {
        await apiService.patch(`/api/inventory/${selectedItem.id}/`, data);
        setApiSuccess("Item updated successfully!");
      } else {
        await apiService.post("/api/inventory/", data);
        setApiSuccess("Item added successfully!");
      }
      resetItem();
      setIsAddModalOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to save item");
    }
  };

  const onTransactionSubmit = async (data) => {
    if (!selectedItem) {
      setApiError("Please select an item");
      return;
    }

    try {
      await apiService.post("/api/inventory/transactions/", {
        ...data,
        item: selectedItem.id,
      });
      setApiSuccess("Transaction recorded successfully!");
      resetTransaction();
      setIsTransactionModalOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setApiSuccess(""), 3000);
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to record transaction");
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
  let filteredItems = items.filter((item) => {
    let matches = true;
    if (filterCategory !== "all") matches = matches && item.category === filterCategory;
    if (filterLowStock) matches = matches && item.quantity <= item.min_quantity;
    if (searchQuery) {
      matches = matches && (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return matches;
  });

  // Calculate totals
  const totalValue = filteredItems.reduce((sum, item) => sum + item.total_value, 0);
  const lowStockCount = items.filter((item) => item.quantity <= item.min_quantity).length;
  const expiringCount = items.filter((item) => 
    item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  const categoryOptions = [
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
          <p className="text-3xl font-bold text-primary-600">${totalValue.toFixed(2)}</p>
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
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            filterLowStock ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          <FiTrendingDown /> Low Stock Only
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Min Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.quantity <= item.min_quantity ? "bg-orange-50" : ""}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className={item.quantity <= item.min_quantity ? "text-orange-600 font-bold" : ""}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.min_quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">${item.cost_per_unit?.toFixed(2) || "N/A"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${item.total_value?.toFixed(2) || "0.00"}</td>
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
                        errors={itemErrors}
                      />
                      <SelectField
                        register={registerItem}
                        name="category"
                        label="Category"
                        options={categoryOptions}
                        errors={itemErrors}
                      />
                      <NumberField
                        register={registerItem}
                        name="quantity"
                        label="Current Quantity"
                        errors={itemErrors}
                      />
                      <SelectField
                        register={registerItem}
                        name="unit"
                        label="Unit"
                        options={unitOptions}
                        errors={itemErrors}
                      />
                      <NumberField
                        register={registerItem}
                        name="min_quantity"
                        label="Minimum Quantity"
                        errors={itemErrors}
                      />
                      <NumberField
                        register={registerItem}
                        name="cost_per_unit"
                        label="Cost Per Unit ($)"
                        errors={itemErrors}
                      />
                      <FormField
                        register={registerItem}
                        name="supplier"
                        label="Supplier (Optional)"
                        type="text"
                        errors={itemErrors}
                      />
                      <FormField
                        register={registerItem}
                        name="location"
                        label="Location (Optional)"
                        type="text"
                        errors={itemErrors}
                      />
                      <DateField
                        register={registerItem}
                        name="purchase_date"
                        label="Purchase Date (Optional)"
                        errors={itemErrors}
                      />
                      <DateField
                        register={registerItem}
                        name="expiry_date"
                        label="Expiry Date (Optional)"
                        errors={itemErrors}
                      />
                    </div>

                    <TextAreaField
                      register={registerItem}
                      name="notes"
                      label="Notes (Optional)"
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
                      label="Cost Per Unit ($)"
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
