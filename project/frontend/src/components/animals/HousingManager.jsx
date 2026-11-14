import { useState, useEffect } from "react";
import { FiHome, FiArrowRight, FiPlus, FiRefreshCw, FiClock, FiCheckCircle } from "react-icons/fi";
import apiService from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function HousingManager({ activeFarm, animals, onRefreshAnimals, onLogFeed, onAddAnimal }) {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAnimalForTransfer, setSelectedAnimalForTransfer] = useState(null);
  
  // Transfer form state
  const [transferType, setTransferType] = useState("pen"); // "pen" | "building"
  const [targetBuilding, setTargetBuilding] = useState("");
  const [targetPen, setTargetPen] = useState("");
  const [transferCount, setTransferCount] = useState(1);
  const [transferReason, setTransferReason] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Quick Add Housing / Preset Buildings
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState("all");

  const fetchTransfers = async () => {
    if (!activeFarm?.id) return;
    setIsLoadingTransfers(true);
    try {
      const res = await apiService.getAnimalTransfers({ farm: activeFarm.id });
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];
      setTransfers(list);
    } catch (err) {
      console.error("Failed to load transfers:", err);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [activeFarm?.id]);

  // Group animals by building & pen
  const buildingsMap = {};
  
  // Default suggested buildings if none explicitly assigned yet
  const defaultBuildings = ["Building 1", "Building 2", "Building 3"];
  defaultBuildings.forEach(b => {
    buildingsMap[b] = { pens: {}, unassigned: [] };
  });

  animals.forEach((animal) => {
    const bName = animal.building ? animal.building.trim() : "Unassigned Building";
    if (!buildingsMap[bName]) {
      buildingsMap[bName] = { pens: {}, unassigned: [] };
    }
    const penName = animal.pen ? animal.pen.trim() : null;
    if (penName) {
      if (!buildingsMap[bName].pens[penName]) {
        buildingsMap[bName].pens[penName] = [];
      }
      buildingsMap[bName].pens[penName].push(animal);
    } else {
      buildingsMap[bName].unassigned.push(animal);
    }
  });

  const openTransferModal = (animal) => {
    setSelectedAnimalForTransfer(animal);
    setTargetBuilding(animal.building || "Building 1");
    setTargetPen(animal.pen || "");
    setTransferCount(animal.count && animal.count > 1 ? animal.count : 1);
    setTransferReason("");
    setTransferType("pen");
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!selectedAnimalForTransfer) return;

    if (transferType === "pen" && !targetPen.trim()) {
      toast.error("Please enter a destination pen/room number.");
      return;
    }
    if (transferType === "building" && !targetBuilding.trim()) {
      toast.error("Please enter a destination building.");
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const payload = {
        farm: activeFarm.id,
        animal: selectedAnimalForTransfer.id,
        transfer_type: transferType,
        from_building: selectedAnimalForTransfer.building || "",
        from_pen: selectedAnimalForTransfer.pen || "",
        to_building: transferType === "building" ? targetBuilding : (selectedAnimalForTransfer.building || targetBuilding),
        to_pen: targetPen,
        count: Number(transferCount) || 1,
        reason: transferReason || `${transferType === "pen" ? "Pen internal relocation" : "Building group transfer"}`
      };

      const res = await apiService.createAnimalTransfer(payload);
      if (res?._error) {
        toast.error(res.detail || "Failed to execute transfer");
        return;
      }

      toast.success(
        transferType === "pen"
          ? `Transferred ${selectedAnimalForTransfer.name} to Pen ${targetPen}!`
          : `Moved ${selectedAnimalForTransfer.name} to ${targetBuilding}!`
      );
      setIsTransferModalOpen(false);
      setSelectedAnimalForTransfer(null);
      if (onRefreshAnimals) onRefreshAnimals();
      fetchTransfers();
    } catch (err) {
      toast.error("Error executing transfer: " + err.message);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const buildingKeys = Object.keys(buildingsMap);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiHome className="text-emerald-600" />
            Animal Housing & Pen Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage buildings, rooms/pens (2-5 pigs per pen), group-level feeding, and multi-tier transfers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onAddAnimal && (
            <button
              onClick={() => onAddAnimal("Building 1", "Pen 1")}
              className="btn btn-primary flex items-center gap-1.5 text-sm"
            >
              <FiPlus /> Add Animal / Pig
            </button>
          )}
          <button
            onClick={() => {
              if (onRefreshAnimals) onRefreshAnimals();
              fetchTransfers();
            }}
            className="btn btn-secondary flex items-center gap-2 text-sm"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Buildings Cards View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {buildingKeys.map((buildingName) => {
          const bData = buildingsMap[buildingName];
          const penKeys = Object.keys(bData.pens);
          const totalAnimalsInBuilding = penKeys.reduce(
            (acc, pen) => acc + bData.pens[pen].reduce((sum, a) => sum + (a.count || 1), 0),
            0
          ) + bData.unassigned.reduce((sum, a) => sum + (a.count || 1), 0);

          return (
            <div
              key={buildingName}
              className="bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all"
            >
              {/* Building Header */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-emerald-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-1.5">
                    🏛️ {buildingName}
                  </h3>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    {penKeys.length} Active Pens • {totalAnimalsInBuilding} Pigs/Animals
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {onAddAnimal && (
                    <button
                      onClick={() => onAddAnimal(buildingName, "")}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
                      title={`Add animal to ${buildingName}`}
                    >
                      <FiPlus /> Add Animal
                    </button>
                  )}
                  {/* Group Feed Button */}
                  {totalAnimalsInBuilding > 0 && onLogFeed && (
                    <button
                      onClick={() => {
                        const firstAnimal = (penKeys.length > 0 && bData.pens[penKeys[0]][0]) || bData.unassigned[0];
                        if (firstAnimal) {
                          onLogFeed(firstAnimal);
                          toast.info(`Feeding Group for ${buildingName}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                      title={`Feed all animals in ${buildingName} as a group`}
                    >
                      🌾 Feed Building
                    </button>
                  )}
                </div>
              </div>

              {/* Pens Grid */}
              <div className="p-4 flex-1 space-y-4">
                {penKeys.length === 0 && bData.unassigned.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm space-y-2">
                    <p>No animals currently assigned to this building.</p>
                    {onAddAnimal && (
                      <button
                        onClick={() => onAddAnimal(buildingName, "Pen 1")}
                        className="btn btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
                      >
                        <FiPlus /> Add first animal to {buildingName}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {penKeys.map((penNum) => {
                      const penAnimals = bData.pens[penNum];
                      const penCount = penAnimals.reduce((sum, a) => sum + (a.count || 1), 0);
                      return (
                        <div
                          key={penNum}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-emerald-50/50 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                            <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                              🚪 {penNum.toLowerCase().startsWith("pen") ? penNum : `Pen ${penNum}`}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full font-semibold ${penCount >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {penCount} {penCount === 1 ? 'Pig' : 'Pigs'}
                              </span>
                              {onAddAnimal && (
                                <button
                                  type="button"
                                  onClick={() => onAddAnimal(buildingName, penNum)}
                                  className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded hover:bg-emerald-100"
                                  title={`Add animal directly to ${penNum}`}
                                >
                                  <FiPlus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {penAnimals.map((anim) => (
                              <div
                                key={anim.id}
                                className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-gray-100"
                              >
                                <span className="font-medium text-gray-800 truncate" title={anim.name}>
                                  {anim.name} {anim.count > 1 ? `(${anim.count})` : ''}
                                </span>
                                <button
                                  onClick={() => openTransferModal(anim)}
                                  className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline ml-2 shrink-0"
                                  title="Transfer to another pen or building"
                                >
                                  Transfer
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Unassigned pen animals */}
                {bData.unassigned.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <div className="text-xs font-bold text-amber-800 mb-2">
                      ⚠️ Assigned to Building, No Specific Pen ({bData.unassigned.length} animals)
                    </div>
                    <div className="space-y-1">
                      {bData.unassigned.map((anim) => (
                        <div
                          key={anim.id}
                          className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-amber-100"
                        >
                          <span className="font-medium text-gray-800 truncate">{anim.name}</span>
                          <button
                            onClick={() => openTransferModal(anim)}
                            className="text-amber-800 font-bold hover:underline"
                          >
                            Assign Pen
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer History Audit Log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FiClock className="text-emerald-600" />
            Animal Relocation & Transfer History
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {transfers.length} Recorded Transfers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Animal / Group</th>
                <th className="px-4 py-3">Transfer Type</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                    No animal transfers recorded yet. Use the "Transfer" button on any animal pen to relocate.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {t.transfer_date}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {t.animal_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.transfer_type === 'pen' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {t.transfer_type === 'pen' ? '🚪 Pen Transfer' : '🏛️ Building Transfer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                      {t.from_building || 'N/A'} {t.from_pen ? `(Pen ${t.from_pen})` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <FiArrowRight className="text-gray-400" />
                        {t.to_building || 'N/A'} {t.to_pen ? `(Pen ${t.to_pen})` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                      {t.count}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {t.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Tier Transfer Modal */}
      {isTransferModalOpen && selectedAnimalForTransfer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4">
              <h3 className="font-bold text-lg">Animal Transfer / Relocation</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Relocate <strong>{selectedAnimalForTransfer.name}</strong>
              </p>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4">
              {/* Transfer Tier Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Transfer Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferType("pen")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                      transferType === "pen"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    🚪 Internal Pen Move
                    <span className="block text-[10px] font-normal text-gray-500">Same building</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType("building")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                      transferType === "building"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    🏛️ Higher-Level Move
                    <span className="block text-[10px] font-normal text-gray-500">Group / Building</span>
                  </button>
                </div>
              </div>

              {/* Current Location readout */}
              <div className="p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                <span className="font-bold text-gray-800">Current Location:</span>{" "}
                {selectedAnimalForTransfer.building || "Unassigned Building"} • Pen{" "}
                {selectedAnimalForTransfer.pen || "Unassigned"}
              </div>

              {/* Destination Building */}
              {transferType === "building" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Destination Building *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetBuilding}
                    onChange={(e) => setTargetBuilding(e.target.value)}
                    placeholder="e.g. Building 2 or Group 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Destination Pen */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Destination Pen / Room Number *
                </label>
                <input
                  type="text"
                  required
                  value={targetPen}
                  onChange={(e) => setTargetPen(e.target.value)}
                  placeholder="e.g. 7 or Pen 7"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Animal Count */}
              {selectedAnimalForTransfer.isGroup && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Number of Animals to Move
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAnimalForTransfer.count || 50}
                    value={transferCount}
                    onChange={(e) => setTransferCount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Reason for Transfer (Optional)
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Weaning, growth stage progression, room balancing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  {isSubmittingTransfer ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
