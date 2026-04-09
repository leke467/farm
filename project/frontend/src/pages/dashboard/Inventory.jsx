import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiPlus, FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  FormField,
  SelectField,
  NumberField,
  FormError,
  FormSuccess,
  SubmitButton,
} from "../../components/forms/FormComponents";
import { inventorySchema } from "../../components/forms/validationSchemas";

function Inventory() {
  const { inventory = [], addInventoryItem, updateInventoryItem, deleteInventoryItem } = useFarmData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(inventorySchema),
    defaultValues: {
      name: "",
      category: "Feed",
      quantity: "",
      unit: "kg",
      min_quantity: "",
      cost_per_unit: "",
      location: "",
      purchase_date: "",
      expiry_date: "",
    },
  });

  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess("");
    try {
      const itemData = {
        name: data.name,
        category: data.category,
        quantity: parseFloat(data.quantity),
        unit: data.unit,
        min_quantity: parseFloat(data.min_quantity),
        cost_per_unit: data.cost_per_unit ? parseFloat(data.cost_per_unit) : null,
        location: data.location,
        purchase_date: data.purchase_date || null,
        expiry_date: data.expiry_date || null,
      };

      if (isEditModalOpen && currentItem) {
        updateInventoryItem(currentItem.id, itemData);
        setApiSuccess(`Item "${data.name}" updated successfully!`);
        setIsEditModalOpen(false);
        setCurrentItem(null);
      } else {
        addInventoryItem(itemData);
        setApiSuccess(`Item "${data.name}" added successfully!`);
        setIsAddModalOpen(false);
      }
      reset();
    } catch (error) {
      setApiError(
        error.message || "An error occurred. Please try again."
      );
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setValue("name", item.name || "");
    setValue("category", item.category || "Feed");
    setValue("quantity", item.quantity ? String(item.quantity) : "");
    setValue("unit", item.unit || "kg");
    setValue("min_quantity", item.min_quantity ? String(item.min_quantity) : "");
    setValue("cost_per_unit", item.cost_per_unit ? String(item.cost_per_unit) : "");
    setValue("location", item.location || "");
    setValue("purchase_date", item.purchase_date || "");
    setValue("expiry_date", item.expiry_date || "");
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteInventoryItem(id);
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    reset();
    setApiError("");
    setApiSuccess("");
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentItem(null);
    reset();
    setApiError("");
    setApiSuccess("");
  };

  const categoryOptions = [
    { value: "Feed", label: "Feed" },
    { value: "Medicine", label: "Medicine" },
    { value: "Seeds", label: "Seeds" },
    { value: "Tools", label: "Tools" },
    { value: "Fertilizer", label: "Fertilizer" },
    { value: "Pesticide", label: "Pesticide" },
    { value: "Equipment", label: "Equipment" },
    { value: "Other", label: "Other" },
  ];

  const unitOptions = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "L", label: "Liters (L)" },
    { value: "gal", label: "Gallons (gal)" },
    { value: "units", label: "Units" },
    { value: "bags", label: "Bags" },
    { value: "boxes", label: "Boxes" },
    { value: "bottles", label: "Bottles" },
  ];

  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const filteredInventory = safeInventory.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = safeInventory.filter(
    (item) => item.quantity <= item.min_quantity
  );

  const totalValue = safeInventory.reduce((sum, item) => {
    const cost = item.cost_per_unit ? item.cost_per_unit * item.quantity : 0;
    return sum + cost;
  }, 0);

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Inventory</h1>
          <p className="text-gray-600">Manage your farm inventory and supplies</p>
        </div>

        <div className="mt-4 md:mt-0">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Items</h3>
          <p className="text-3xl font-bold text-primary-600">{safeInventory.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold text-warning-600">{lowStockItems.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Value</h3>
          <p className="text-3xl font-bold text-success-600">${totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 flex">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search inventory..."
            className="pl-10 input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory List */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No items in inventory</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Min Stock</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInventory.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.quantity} {item.unit}
                    {item.quantity <= item.min_quantity && (
                      <span className="ml-2 inline-block px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.min_quantity} {item.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.location || "—"}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full mr-2"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-500 hover:text-error-500 hover:bg-error-50 rounded-full"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <Dialog
        open={isAddModalOpen || isEditModalOpen}
        onClose={() =>
          isAddModalOpen ? closeAddModal() : closeEditModal()
        }
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="min-h-screen px-4 text-center">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900 mb-4"
            >
              {isEditModalOpen ? "Edit Item" : "Add New Item"}
            </Dialog.Title>

            {apiError && (
              <FormError message={apiError} onDismiss={() => setApiError("")} />
            )}

            {apiSuccess && (
              <FormSuccess message={apiSuccess} onDismiss={() => setApiSuccess("")} />
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  label="Item Name"
                  type="text"
                  register={register}
                  name="name"
                  errors={errors}
                  placeholder="e.g., Chicken Feed"
                  required
                />

                <SelectField
                  label="Category"
                  register={register}
                  name="category"
                  errors={errors}
                  options={categoryOptions}
                  required
                />

                <NumberField
                  label="Quantity"
                  register={register}
                  name="quantity"
                  errors={errors}
                  min="0"
                  required
                />

                <SelectField
                  label="Unit"
                  register={register}
                  name="unit"
                  errors={errors}
                  options={unitOptions}
                  required
                />

                <NumberField
                  label="Minimum Quantity"
                  register={register}
                  name="min_quantity"
                  errors={errors}
                  min="0"
                  required
                />

                <NumberField
                  label="Cost per Unit"
                  register={register}
                  name="cost_per_unit"
                  errors={errors}
                  min="0"
                  placeholder="Optional"
                />

                <FormField
                  label="Location/Storage"
                  type="text"
                  register={register}
                  name="location"
                  errors={errors}
                  placeholder="e.g., Barn, Shed A"
                />

                <FormField
                  label="Purchase Date"
                  type="date"
                  register={register}
                  name="purchase_date"
                  errors={errors}
                />

                <FormField
                  label="Expiry Date"
                  type="date"
                  register={register}
                  name="expiry_date"
                  errors={errors}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    isAddModalOpen ? closeAddModal() : closeEditModal()
                  }
                >
                  Cancel
                </button>
                <SubmitButton
                  label={isEditModalOpen ? "Update" : "Add"}
                  loading={isSubmitting}
                />
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Inventory;