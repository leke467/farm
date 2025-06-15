import { useState } from "react";
import { FiPlus, FiFilter, FiSearch, FiCalendar } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";

function TaskScheduler() {
  const { tasks, addTask, updateTask, deleteTask } = useFarmData();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "",
    category: "Daily Care",
    status: "pending",
  });

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    addTask(formData);
    setIsAddModalOpen(false);
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      assignedTo: "",
      category: "Daily Care",
      status: "pending",
    });
  };

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
                    className="text-gray-400 hover:text-error-500"
                  >
                    Delete
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

      {/* Add Task Modal */}
      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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
              Add New Task
            </Dialog.Title>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input h-24"
                    required
                  />
                </div>

                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="label">Assigned To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="Daily Care">Daily Care</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Health">Health</option>
                    <option value="Crop Care">Crop Care</option>
                    <option value="Administrative">Administrative</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default TaskScheduler;
