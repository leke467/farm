import React from "react";
import { Dialog } from "@headlessui/react";
import { FiX, FiDollarSign, FiCalendar, FiUser, FiTag, FiFileText, FiCheckCircle, FiTrash2, FiEdit3 } from "react-icons/fi";
import { formatFarmCurrency } from "../../utils/formatters";

export default function SaleDetailModal({ isOpen, onClose, sale, activeFarm, onDelete, onEdit }) {
  if (!isOpen || !sale) return null;

  const formattedDate = sale.date ? new Date(sale.date).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }) : "N/A";

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl border border-gray-100">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                💰
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Sales Record Details</h3>
                <p className="text-xs text-gray-500">Transaction ID #{sale.id || "N/A"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Revenue Amount Hero Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-4 mb-5 text-center">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Sales Income Received</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {formatFarmCurrency(sale.total_amount || sale.amount || 0, activeFarm)}
            </p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 capitalize">
              {(sale.source || "Farm Sale").replace("_", " ")}
            </span>
          </div>

          {/* Transaction Details Grid */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500 font-medium flex items-center space-x-1.5">
                <FiTag className="text-gray-400" />
                <span>Item / Produce Sold</span>
              </span>
              <span className="font-bold text-gray-900 text-right">{sale.item_sold || "Farm Produce"}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500 font-medium flex items-center space-x-1.5">
                <FiCalendar className="text-gray-400" />
                <span>Transaction Date</span>
              </span>
              <span className="font-semibold text-gray-800">{formattedDate}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium">Quantity Sold</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  {sale.quantity || "1"} <span className="text-xs font-normal text-gray-500">{sale.unit || "unit"}</span>
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium">Unit Price</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  {sale.unit_price ? formatFarmCurrency(sale.unit_price, activeFarm) : "N/A"}
                </p>
              </div>
            </div>

            {/* Buyer & Quality Info */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500 font-medium flex items-center space-x-1.5">
                <FiUser className="text-gray-400" />
                <span>Customer / Buyer</span>
              </span>
              <span className="font-semibold text-gray-900">{sale.buyer || "General Market / Walk-in Buyer"}</span>
            </div>

            {sale.quality_grade && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 font-medium flex items-center space-x-1.5">
                  <FiCheckCircle className="text-gray-400" />
                  <span>Quality Grade</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                  Grade {sale.quality_grade}
                </span>
              </div>
            )}

            {/* Notes Section */}
            {sale.notes && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium flex items-center space-x-1.5 mb-1">
                  <FiFileText className="text-gray-400" />
                  <span>Sale Notes</span>
                </p>
                <p className="text-xs text-gray-700 italic leading-relaxed">{sale.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between space-x-3">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this sale record?")) {
                    onDelete(sale.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1"
              >
                <FiTrash2 />
                <span>Delete Sale</span>
              </button>
            )}

            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
