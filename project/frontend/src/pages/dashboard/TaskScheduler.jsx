import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiPlus, FiFilter, FiSearch, FiCalendar, FiTrash2 } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  FormField,
  SelectField,
  FormError,
  FormSuccess,
  SubmitButton,
} from "../../components/forms/FormComponents";
import { taskSchema } from "../../components/forms/validationSchemas";

function TaskScheduler() {
  const { tasks, addTask, updateTask, deleteTask } = useFarmData();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: "",
      priority: "medium",
      assigned_to: "",
      category: "Daily Care",
      status: "pending",
    },
  });

  const onSubmit = async (data) => {
    setApiError("");
    setApiSuccess("");
    try {
      const taskData = {
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        priority: data.priority,
        assigned_to: data.assigned_to || null,
        category: data.category,
        status: data.status,
      };

      if (isEditModalOpen && currentTask) {
        updateTask(currentTask.id, taskData);
        setApiSuccess(`Task "${data.title}" updated successfully!`);
        setIsEditModalOpen(false);
        setCurrentTask(null);
      } else {
        addTask(taskData);
        setApiSuccess(`Task "${data.title}" created successfully!`);
        setIsAddModalOpen(false);
      }
      reset();
    } catch (error) {
      setApiError(
        error.message || "An error occurred. Please try again."
      );
    }
  };

  const handleEdit = (task) => {
    setCurrentTask(task);
    setValue("title", task.title || "");
    setValue("description", task.description || "");
    setValue("due_date", task.due_date || "");
    setValue("priority", task.priority || "medium");
    setValue("assigned_to", task.assigned_to || "");
    setValue("category", task.category || "Daily Care");
    setValue("status", task.status || "pending");
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(id);
    }
  };

  const resetForm = () => {
    reset();
    setApiError("");
    setApiSuccess("");
  };

  // Close handlers
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentTask(null);
    resetForm();
  };

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const categoryOptions = [
    { value: "Daily Care", label: "Daily Care" },
    { value: "Feeding", label: "Feeding" },
    { value: "Health", label: "Health" },
    { value: "Maintenance", label: "Maintenance" },
    { value: "Harvest", label: "Harvest" },
    { value: "Other", label: "Other" },
  ];

  // Defensive: ensure tasks is an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Filter tasks
  const filteredTasks = safeTasks
    .filter((task) => {
      if (filter === "completed") return task.status === "completed";
      if (filter === "pending") return task.status === "pending";
      if (filter === "high") return task.priority === "high";
      return true;
    })
    .filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Task Scheduler</h1>
          <p className="text-gray-600">Manage and track farm tasks</p>
        </div>

        <div className="mt-4 md:mt-0">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            className="pl-10 input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 items-center">
          <FiFilter className="text-gray-500" />
          <select
            className="input max-w-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="high">High Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {/* Render task cards or a message if no tasks */}
        {filteredTasks.length === 0 ? (
          <div className="text-gray-500">No tasks to display.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  task.status === "completed" ? "opacity-75" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() =>
                        updateTask(task.id, {
                          status:
                            task.status === "completed"
                              ? "pending"
                              : "completed",
                        })
                      }
                      className="mt-1 h-5 w-5 text-primary-600 rounded"
                    />
                    <div>
                      <h3
                        className={`font-medium ${
                          task.status === "completed"
                            ? "line-through text-gray-500"
                            : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="flex items-center text-gray-500">
                          <FiCalendar className="mr-1" size={14} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        <span
                          className={`badge ${
                            task.priority === "high"
                              ? "badge-error"
                              : task.priority === "medium"
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.assignedTo && (
                          <span className="badge bg-gray-100 text-gray-800">
                            {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-gray-500 hover:text-error-500 hover:bg-error-50 rounded-full"
                    aria-label="Delete task"
                    title="Delete task"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCalendar size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== "all"
                ? "Try adjusting your filters or search terms"
                : "Add your first task to get started"}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus className="mr-2" />
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
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

          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900 mb-4"
            >
              {isEditModalOpen ? "Edit Task" : "Add New Task"}
            </Dialog.Title>

            {apiError && (
              <FormError message={apiError} onDismiss={() => setApiError("")} />
            )}

            {apiSuccess && (
              <FormSuccess message={apiSuccess} onDismiss={() => setApiSuccess("")} />
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <FormField
                  label="Title"
                  type="text"
                  register={register}
                  name="title"
                  errors={errors}
                  required
                />

                <div>
                  <label className="label">Description</label>
                  <textarea
                    {...register("description")}
                    className="input h-24"
                    placeholder="Task description"
                  />
                  {errors.description && (
                    <span className="text-error-500 text-sm">
                      {errors.description.message}
                    </span>
                  )}
                </div>

                <FormField
                  label="Due Date"
                  type="date"
                  register={register}
                  name="due_date"
                  errors={errors}
                  required
                />

                <SelectField
                  label="Priority"
                  register={register}
                  name="priority"
                  errors={errors}
                  options={priorityOptions}
                />

                <FormField
                  label="Assigned To"
                  type="text"
                  register={register}
                  name="assigned_to"
                  errors={errors}
                  placeholder="Enter name or ID"
                />

                <SelectField
                  label="Category"
                  register={register}
                  name="category"
                  errors={errors}
                  options={categoryOptions}
                />

                <SelectField
                  label="Status"
                  register={register}
                  name="status"
                  errors={errors}
                  options={statusOptions}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
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

export default TaskScheduler;
