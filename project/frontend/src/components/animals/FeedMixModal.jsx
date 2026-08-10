import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import apiService from "../../services/api";

export default function FeedMixModal({ isOpen, onClose, activeFarmId, onSuccess }) {
  const [mixes, setMixes] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([
    { ingredient_name: "", percentage: 50 },
    { ingredient_name: "", percentage: 50 },
  ]);
  const [error, setError] = useState("");

  const fetchMixes = async () => {
    if (activeFarmId) {
      try {
        const res = await apiService.get(`/animals/feed-mixes/?farm=${activeFarmId}`);
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        setMixes(list);
      } catch (err) {
        console.error("Failed to load feed mixes", err);
      }
    }
  };

  useEffect(() => {
    if (isOpen && activeFarmId) {
      fetchMixes();
      const fetchInventory = async () => {
        try {
          const res = await apiService.get(`/inventory/?farm=${activeFarmId}`);
          const list = Array.isArray(res) ? res : res?.results || res?.data || [];
          setInventoryItems(list);
        } catch (err) {}
      };
      fetchInventory();
    }
  }, [isOpen, activeFarmId]);

  const handleAddIngredientRow = () => {
    setIngredients([...ingredients, { ingredient_name: "", percentage: 0 }]);
  };

  const handleRemoveIngredientRow = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const totalPercentage = ingredients.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);

  const handleSubmitMix = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please provide a name for this feed mix.");
      return;
    }

    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Ingredient percentages must equal 100%. Current total is ${totalPercentage.toFixed(1)}%`);
      return;
    }

    try {
      const payload = {
        farm: activeFarmId,
        name: name.trim(),
        description: description.trim(),
        ingredients: ingredients.map((ing) => ({
          ingredient_name: ing.ingredient_name.trim(),
          percentage: parseFloat(ing.percentage),
        })),
      };

      await apiService.post(`/animals/feed-mixes/`, payload);
      setName("");
      setDescription("");
      setIngredients([
        { ingredient_name: "", percentage: 50 },
        { ingredient_name: "", percentage: 50 },
      ]);
      setIsCreating(false);
      fetchMixes();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Failed to create feed mix");
    }
  };

  const handleDeleteMix = async (id) => {
    if (window.confirm("Are you sure you want to delete this feed mix formulation?")) {
      try {
        await apiService.delete(`/animals/feed-mixes/${id}/`);
        fetchMixes();
        if (onSuccess) onSuccess();
      } catch (err) {
        alert("Failed to delete feed mix");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
          <div className="flex justify-between items-center pb-3 mb-4 border-b">
            <div>
              <Dialog.Title as="h3" className="text-xl font-bold text-gray-900">
                🥣 Custom Feed Mixes & Blends
              </Dialog.Title>
              <p className="text-xs text-gray-500">
                Formulate custom ration blends (e.g. 60% Corn + 40% Soy). Deductions are split proportionally per ingredient!
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {!isCreating ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-gray-700">Existing Ration Formulations ({mixes.length})</span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <FiPlus /> Create New Feed Mix
                </button>
              </div>

              {mixes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {mixes.map((mix) => (
                    <div key={mix.id} className="p-4 border rounded-xl bg-slate-50 relative hover:border-green-500 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">{mix.name}</h4>
                          {mix.description && <p className="text-xs text-gray-500 mb-2">{mix.description}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteMix(mix.id)}
                          className="text-red-500 hover:text-red-700 text-xs p-1"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {mix.ingredients?.map((ing, idx) => (
                          <span key={idx} className="bg-white border text-xs px-2.5 py-1 rounded-full font-medium text-slate-700 shadow-sm">
                            🌾 {ing.ingredient_name}: <strong className="text-green-600">{ing.percentage}%</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl text-gray-500 text-sm">
                  No custom feed mixes created yet. Click <strong>"Create New Feed Mix"</strong> to set up a multi-ingredient ration blend!
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitMix} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feed Mix Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Broiler Finisher Blend"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 60% Corn, 30% Soybean Meal, 10% Fishmeal"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ingredients & Proportions (Total: <span className={Math.abs(totalPercentage - 100) < 0.01 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{totalPercentage}%</span>)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs text-green-600 hover:text-green-700 font-semibold"
                  >
                    + Add Ingredient
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Ingredient name (e.g. Maize, Soy)"
                        list="inventory-suggestions"
                        value={ing.ingredient_name}
                        onChange={(e) => handleIngredientChange(idx, "ingredient_name", e.target.value)}
                        className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                        required
                      />
                      <div className="flex items-center gap-1 w-28">
                        <input
                          type="number"
                          placeholder="%"
                          min="1"
                          max="100"
                          step="0.5"
                          value={ing.percentage}
                          onChange={(e) => handleIngredientChange(idx, "percentage", e.target.value)}
                          className="w-20 px-2 py-1.5 border rounded-lg text-xs font-bold text-right"
                          required
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                      {ingredients.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="text-red-500 hover:text-red-700 text-xs p-1"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <datalist id="inventory-suggestions">
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Feed Mix
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
}
