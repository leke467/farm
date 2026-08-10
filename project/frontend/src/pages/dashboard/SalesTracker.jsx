import React, { useState, useEffect } from "react";
import { FiPlus, FiFilter, FiSearch, FiDollarSign, FiShoppingBag, FiTrendingUp, FiCalendar, FiEye, FiTrash2 } from "react-icons/fi";
import { useFarmData } from "../../context/FarmDataContext";
import { formatFarmCurrency } from "../../utils/formatters";
import apiService from "../../services/api";
import RecordSaleModal from "../../components/forms/RecordSaleModal";
import SaleDetailModal from "../../components/sales/SaleDetailModal";

export default function SalesTracker() {
  const { activeFarm } = useFarmData();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (activeFarm?.id) {
      fetchSales();
    }
  }, [activeFarm?.id]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await apiService.get(`/expenses/revenues/?farm=${activeFarm.id}`);
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];
      setSales(list);
    } catch (err) {
      console.error("Failed to load sales history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (id) => {
    try {
      await apiService.delete(`/expenses/revenues/${id}/`);
      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete sale record:", err);
      alert("Failed to delete sale record. Please try again.");
    }
  };

  const filteredSales = sales.filter((sale) => {
    const matchesCategory =
      categoryFilter === "all" ||
      (sale.source && sale.source.toLowerCase() === categoryFilter.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      (sale.item_sold && sale.item_sold.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.buyer && sale.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.notes && sale.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Calculate Summary Statistics
  const totalRevenue = filteredSales.reduce(
    (sum, s) => sum + Number(s.total_amount || s.amount || 0),
    0
  );
  const totalTransactions = filteredSales.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <span>💰 Farm Sales & Revenue Ledger</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review past farm sales, track revenue streams, and view detailed transaction receipts for your livestock and crops.
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 self-start md:self-auto"
        >
          <FiPlus size={16} />
          <span>+ Record New Sale</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Sales Revenue</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {formatFarmCurrency(totalRevenue, activeFarm)}
            </p>
            <span className="text-[10px] text-gray-400">{totalTransactions} recorded sales</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            <FiDollarSign />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Transactions</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {totalTransactions} <span className="text-xs font-normal text-gray-400">sales</span>
            </p>
            <span className="text-[10px] text-gray-400">Completed receipts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            <FiShoppingBag />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Avg. Order Value</p>
            <p className="text-2xl font-black text-purple-600 mt-1">
              {formatFarmCurrency(avgTransaction, activeFarm)}
            </p>
            <span className="text-[10px] text-gray-400">Per transaction sale</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
            <FiTrendingUp />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by produce, buyer, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <FiFilter className="text-gray-400 text-xs" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">All Sales Categories</option>
            <option value="animal_sales">Livestock Sales</option>
            <option value="crop_sales">Crop Harvest Sales</option>
            <option value="inventory_sales">Feed & Inventory Item Sales</option>
            <option value="animal_products">Animal Products (Eggs/Milk)</option>
            <option value="services">Farm Services</option>
            <option value="other">Other Revenue</option>
          </select>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Sales Records & Receipts</h2>
          <span className="text-xs text-gray-500 font-medium">Showing {filteredSales.length} items</span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
            <p className="mt-3 text-xs text-gray-500">Loading sales records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Produce / Item Sold</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Quantity & Unit</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {sale.date ? new Date(sale.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {sale.item_sold || "Farm Produce"}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 capitalize font-medium">
                        {(sale.source || "sales").replace("_", " ")}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-800">
                        {sale.quantity || "1"} {sale.unit || "unit"}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 font-medium">
                        {sale.unit_price ? formatFarmCurrency(sale.unit_price, activeFarm) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                        {formatFarmCurrency(sale.total_amount || sale.amount, activeFarm)}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {sale.buyer || "Walk-in Buyer"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all text-xs font-semibold flex items-center space-x-1"
                            title="View Details"
                          >
                            <FiEye size={14} />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Delete this sale record?")) {
                                handleDeleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-gray-500">
                      No sales records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      <RecordSaleModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => {
          fetchSales();
          setIsRecordModalOpen(false);
        }}
      />

      {/* Sale Details Modal */}
      <SaleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        sale={selectedSale}
        activeFarm={activeFarm}
        onDelete={(id) => {
          handleDeleteSale(id);
          setIsDetailModalOpen(false);
        }}
      />
    </div>
  );
}
