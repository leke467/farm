import { useState } from "react";
import { FiX, FiFilter } from "react-icons/fi";

const FilterBar = ({ onFilter, onReset, filterOptions = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "",
    search: "",
    ...Object.keys(filterOptions).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {}),
  });

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleReset = () => {
    const resetFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    setFilters(resetFilters);
    onReset?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-2 text-slate-700">
          <FiFilter className="text-lg" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {Object.values(filters).filter((v) => v !== "").length}
            </span>
          )}
        </div>
        <span className={`transform transition ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="px-6 py-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            name="search"
            placeholder="Search..."
            value={filters.search}
            onChange={handleChange}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Date Range */}
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Status Filter */}
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
          </select>

          {/* Custom Filters */}
          {Object.entries(filterOptions).map(([key, options]) => (
            <select
              key={key}
              name={key}
              value={filters[key]}
              onChange={handleChange}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{`All ${key.replace(/_/g, " ")}`}</option>
              {options.map((opt) => (
                <option key={opt.id || opt} value={opt.id || opt}>
                  {opt.name || opt}
                </option>
              ))}
            </select>
          ))}

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-slate-700 px-3 py-2 rounded-lg font-medium transition"
            >
              <FiX /> Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
