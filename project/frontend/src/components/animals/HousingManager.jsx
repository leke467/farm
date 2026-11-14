import { useState, useEffect, useMemo } from "react";
import { FiHome, FiArrowRight, FiArrowLeft, FiPlus, FiRefreshCw, FiClock, FiCheckCircle, FiChevronRight } from "react-icons/fi";
import apiService from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function HousingManager({ activeFarm, animals, onRefreshAnimals, onLogFeed, onAddAnimal }) {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAnimalForTransfer, setSelectedAnimalForTransfer] = useState(null);
  
  // Drill-down state: null = All Buildings Overview; string = Selected Building name
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Transfer form state
  const [transferType, setTransferType] = useState("pen"); // "pen" | "building"
  const [targetBuilding, setTargetBuilding] = useState("");
  const [targetPen, setTargetPen] = useState("");
  const [transferCount, setTransferCount] = useState(1);
  const [transferReason, setTransferReason] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

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
  const buildingsMap = useMemo(() => {
    const map = {};
    const defaultBuildings = ["Building 1", "Building 2", "Building 3"];
    defaultBuildings.forEach((b) => {
      map[b] = { pens: {}, unassigned: [] };
    });

    (animals || []).forEach((animal) => {
      const bName = animal.building ? animal.building.trim() : "Unassigned Building";
      if (!map[bName]) {
        map[bName] = { pens: {}, unassigned: [] };
      }
      const penName = animal.pen ? animal.pen.trim() : null;
      if (penName) {
        if (!map[bName].pens[penName]) {
          map[bName].pens[penName] = [];
        }
        map[bName].pens[penName].push(animal);
      } else {
        map[bName].unassigned.push(animal);
      }
    });

    return map;
  }, [animals]);

  const buildingKeys = Object.keys(buildingsMap);

  // Helper to get pens for a building (sorted Pen 1 to Pen 15 + existing)
  const getPensForBuilding = (bName) => {
    const bData = buildingsMap[bName] || { pens: {}, unassigned: [] };
    const allPenNames = new Set();
    for (let i = 1; i <= 15; i++) {
      allPenNames.add(`Pen ${i}`);
    }
    Object.keys(bData.pens).forEach((p) => {
      if (p) allPenNames.add(p);
    });

    const sorted = Array.from(allPenNames).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    return sorted.map((pName) => {
      const keyMatch = Object.keys(bData.pens).find(
        (k) => k.trim().toLowerCase() === pName.trim().toLowerCase()
      );
      const penAnimals = keyMatch ? bData.pens[keyMatch] : [];
      const totalCount = penAnimals.reduce(
        (sum, a) => sum + (a.is_group || a.isGroup ? a.count || 1 : 1),
        0
      );
      return {
        penName: pName,
        animals: penAnimals,
        count: totalCount,
      };
    });
  };

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
        to_building:
          transferType === "building"
            ? targetBuilding
            : selectedAnimalForTransfer.building || targetBuilding,
        to_pen: targetPen,
        count: Number(transferCount) || 1,
        reason:
          transferReason ||
          `${
            transferType === "pen"
              ? "Pen internal relocation"
              : "Building group transfer"
          }`,
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

  const selectedBuildingData = selectedBuilding ? buildingsMap[selectedBuilding] : null;
  const selectedBuildingPens = selectedBuilding ? getPensForBuilding(selectedBuilding) : [];
  const selectedBuildingTotalAnimals = selectedBuildingData
    ? Object.keys(selectedBuildingData.pens).reduce(
        (acc, p) =>
          acc +
          selectedBuildingData.pens[p].reduce(
            (sum, a) => sum + (a.is_group || a.isGroup ? a.count || 1 : 1),
            0
          ),
        0
      ) +
      selectedBuildingData.unassigned.reduce(
        (sum, a) => sum + (a.is_group || a.isGroup ? a.count || 1 : 1),
        0
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* View 1: ALL BUILDINGS OVERVIEW */}
      {!selectedBuilding && (
        <>
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiHome className="text-emerald-600" />
                Animal Housing & Facilities
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select a building below to open it and view all its pens, rooms (2–5 pigs per pen), and animals.
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

          {/* Buildings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildingKeys.map((buildingName) => {
              const bData = buildingsMap[buildingName];
              const penKeys = Object.keys(bData.pens);
              const totalAnimalsInBuilding =
                penKeys.reduce(
                  (acc, pen) =>
                    acc +
                    bData.pens[pen].reduce(
                      (sum, a) => sum + (a.is_group || a.isGroup ? a.count || 1 : 1),
                      0
                    ),
                  0
                ) +
                bData.unassigned.reduce(
                  (sum, a) => sum + (a.is_group || a.isGroup ? a.count || 1 : 1),
                  0
                );

              return (
                <div
                  key={buildingName}
                  onClick={() => setSelectedBuilding(buildingName)}
                  className="group bg-white border-2 border-emerald-100 hover:border-emerald-500 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden"
                >
                  {/* Building Header */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-emerald-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-emerald-950 flex items-center gap-1.5 group-hover:text-emerald-700 transition-colors">
                        🏛️ {buildingName}
                      </h3>
                      <p className="text-xs text-emerald-800 font-medium mt-0.5">
                        {penKeys.length} Active Pens • ~15 Rooms
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-white text-emerald-900 border border-emerald-200 text-xs font-bold rounded-full shadow-2xs">
                      {totalAnimalsInBuilding} {totalAnimalsInBuilding === 1 ? "Pig" : "Pigs"}
                    </span>
                  </div>

                  {/* Body Preview */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                        <span>Pen Occupancy</span>
                        <span>{penKeys.length} of 15 Pens Occupied</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((penKeys.length / 15) * 100))}%`,
                          }}
                        ></div>
                      </div>

                      {penKeys.length > 0 ? (
                        <div className="pt-2 text-xs text-gray-600 space-y-1">
                          <span className="font-semibold text-gray-700">Pens with animals:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {penKeys.slice(0, 5).map((p) => {
                              const count = bData.pens[p].reduce(
                                (sum, a) => sum + (a.is_group || a.isGroup ? a.count || 1 : 1),
                                0
                              );
                              return (
                                <span
                                  key={p}
                                  className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-semibold"
                                >
                                  {p}: {count}
                                </span>
                              );
                            })}
                            {penKeys.length > 5 && (
                              <span className="text-gray-400 text-[11px] self-center">
                                +{penKeys.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="pt-2 text-xs text-gray-400 italic">
                          No animals currently placed in this building.
                        </p>
                      )}
                    </div>

                    {/* Actions bar */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      {totalAnimalsInBuilding > 0 && onLogFeed ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const firstAnimal =
                              (penKeys.length > 0 && bData.pens[penKeys[0]][0]) ||
                              bData.unassigned[0];
                            if (firstAnimal) {
                              onLogFeed(firstAnimal);
                              toast.info(`Feeding entire ${buildingName}`);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                          title={`Feed all animals in ${buildingName} as a group`}
                        >
                          🌾 Feed Building
                        </button>
                      ) : <span />}

                      <button
                        type="button"
                        onClick={() => setSelectedBuilding(buildingName)}
                        className="px-3 py-1.5 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors ml-auto"
                      >
                        View Pens ({penKeys.length}) <FiChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* View 2: DRILLED-DOWN BUILDING VIEW (SHOWING ALL PENS/ROOMS IN THIS BUILDING) */}
      {selectedBuilding && (
        <>
          {/* Breadcrumb Navigation & Building Header */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedBuilding(null)}
                className="btn btn-secondary flex items-center gap-1.5 text-xs sm:text-sm font-bold"
              >
                <FiArrowLeft /> Back to All Buildings
              </button>

              <div className="flex items-center gap-2">
                {selectedBuildingTotalAnimals > 0 && onLogFeed && (
                  <button
                    onClick={() => {
                      const firstAnimal =
                        (selectedBuildingPens.find((p) => p.animals.length > 0)?.animals[0]) ||
                        selectedBuildingData?.unassigned[0];
                      if (firstAnimal) {
                        onLogFeed(firstAnimal);
                        toast.info(`Feeding entire ${selectedBuilding}`);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                  >
                    🌾 Feed Entire Building
                  </button>
                )}
                {onAddAnimal && (
                  <button
                    onClick={() => onAddAnimal(selectedBuilding, "Pen 1")}
                    className="btn btn-primary flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <FiPlus /> Add Animal to {selectedBuilding}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  🏛️ {selectedBuilding}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Showing all pens & rooms in this building. Suggested occupancy: <strong>2–5 pigs per pen</strong>.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                  {selectedBuildingTotalAnimals} Total Pigs/Animals
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
                  {selectedBuildingPens.filter((p) => p.count > 0).length} Occupied Pens
                </span>
              </div>
            </div>
          </div>

          {/* Unassigned Animals warning banner if any */}
          {selectedBuildingData?.unassigned && selectedBuildingData.unassigned.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>⚠️</span> Assigned to {selectedBuilding}, but not placed in a specific pen ({selectedBuildingData.unassigned.length} animals):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {selectedBuildingData.unassigned.map((anim) => (
                  <div
                    key={anim.id}
                    className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{anim.name}</span>
                      <span className="text-gray-500 ml-1.5">({anim.count || 1} pigs)</span>
                    </div>
                    <button
                      onClick={() => openTransferModal(anim)}
                      className="text-amber-800 font-bold hover:underline"
                    >
                      Assign Pen →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid of All Pens/Rooms inside this building */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedBuildingPens.map((pen) => {
              const isOccupied = pen.count > 0;
              const isFull = pen.count >= 5;

              return (
                <div
                  key={pen.penName}
                  className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    isOccupied
                      ? isFull
                        ? "border-amber-200 bg-gradient-to-b from-white to-amber-50/20"
                        : "border-emerald-200 bg-gradient-to-b from-white to-emerald-50/20 shadow-xs"
                      : "border-gray-200 bg-gray-50/40 opacity-90"
                  }`}
                >
                  <div>
                    {/* Pen Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                      <span className="font-bold text-sm text-gray-900 flex items-center gap-1">
                        🚪 {pen.penName}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          !isOccupied
                            ? "bg-gray-100 text-gray-600"
                            : isFull
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isOccupied ? `${pen.count} ${pen.count === 1 ? "Pig" : "Pigs"}` : "Empty"}
                      </span>
                    </div>

                    {/* Pen Occupants */}
                    {isOccupied ? (
                      <div className="space-y-2">
                        {pen.animals.map((anim) => (
                          <div
                            key={anim.id}
                            className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-900">
                                {anim.is_group || anim.isGroup
                                  ? `${anim.count || 1}x ${anim.breed ? anim.breed + " " : ""}${anim.type || anim.animal_type || "Pigs"}`
                                  : anim.name}
                              </span>
                              <button
                                onClick={() => openTransferModal(anim)}
                                className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline"
                                title="Transfer to another pen or building"
                              >
                                Transfer
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Batch/Tag: <span className="font-semibold text-gray-700">{anim.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-gray-400">
                        Pen is empty (ready for 2–5 pigs)
                      </div>
                    )}
                  </div>

                  {/* Pen Footer Actions */}
                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-gray-400 font-medium">
                      {isFull ? "⚠️ Capacity alert" : "Target: 2-5 pigs"}
                    </span>
                    {onAddAnimal && (
                      <button
                        onClick={() => onAddAnimal(selectedBuilding, pen.penName)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
                      >
                        <FiPlus /> Add Pig
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          t.transfer_type === "pen"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {t.transfer_type === "pen" ? "🚪 Pen Transfer" : "🏛️ Building Transfer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                      {t.from_building || "N/A"} {t.from_pen ? `(Pen ${t.from_pen})` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <FiArrowRight className="text-gray-400" />
                        {t.to_building || "N/A"} {t.to_pen ? `(Pen ${t.to_pen})` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                      {t.count}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {t.reason || "—"}
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
                  placeholder="e.g. Pen 2 or Room 7"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Animal Count */}
              {(selectedAnimalForTransfer.isGroup || selectedAnimalForTransfer.is_group) && (
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
