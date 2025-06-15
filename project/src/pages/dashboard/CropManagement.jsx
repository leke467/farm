import { useState } from 'react';
import { FiPlus, FiSearch, FiCalendar, FiGrid } from 'react-icons/fi';
import { useFarmData } from '../../context/FarmDataContext';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';

function CropManagement() {
  const { crops, addCrop, updateCrop, deleteCrop } = useFarmData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCrop, setCurrentCrop] = useState(null);
  
  // New crop form state
  const [formData, setFormData] = useState({
    name: '',
    field: '',
    area: '',
    plantedDate: '',
    expectedHarvestDate: '',
    status: 'Planning',
    stage: 'Planning',
    notes: '',
  });
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Calculate days until harvest
  const daysUntilHarvest = (plantedDate, harvestDate) => {
    const planted = new Date(plantedDate);
    const harvest = new Date(harvestDate);
    const today = new Date();
    
    if (today > harvest) {
      return 'Overdue';
    }
    
    const diffTime = Math.abs(harvest - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Calculate progress percentage
  const calculateProgress = (plantedDate, harvestDate) => {
    const planted = new Date(plantedDate);
    const harvest = new Date(harvestDate);
    const today = new Date();
    
    if (today < planted) return 0;
    if (today > harvest) return 100;
    
    const totalDuration = harvest - planted;
    const elapsed = today - planted;
    
    return Math.round((elapsed / totalDuration) * 100);
  };
  
  // Defensive: ensure crops is an array
  const safeCrops = Array.isArray(crops) ? crops : [];

  // Filter crops based on search
  const filteredCrops = safeCrops.filter(crop => 
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.field.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create growth stages if adding new crop
    let cropData = { ...formData };
    
    if (!isEditModalOpen) {
      // Generate simple growth stages
      cropData.growthStages = [
        { 
          stage: 'Planting', 
          date: formData.plantedDate,
          completed: true,
          notes: 'Initial planting'
        },
        { 
          stage: 'Early Growth', 
          date: new Date(new Date(formData.plantedDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
          notes: ''
        },
        { 
          stage: 'Maturation', 
          date: new Date(new Date(formData.plantedDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
          notes: ''
        },
        { 
          stage: 'Harvest', 
          date: formData.expectedHarvestDate,
          completed: false,
          notes: ''
        }
      ];
    }
    
    // Convert area to number
    cropData.area = parseFloat(cropData.area);
    
    if (isEditModalOpen && currentCrop) {
      updateCrop(currentCrop.id, cropData);
      setIsEditModalOpen(false);
    } else {
      addCrop(cropData);
      setIsAddModalOpen(false);
    }
    
    // Reset form
    setFormData({
      name: '',
      field: '',
      area: '',
      plantedDate: '',
      expectedHarvestDate: '',
      status: 'Planning',
      stage: 'Planning',
      notes: '',
    });
    
    setCurrentCrop(null);
  };
  
  // Handle edit button click
  const handleEdit = (crop) => {
    setCurrentCrop(crop);
    setFormData({
      name: crop.name,
      field: crop.field,
      area: crop.area.toString(),
      plantedDate: crop.plantedDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      status: crop.status,
      stage: crop.stage,
      notes: crop.notes,
    });
    setIsEditModalOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this crop?')) {
      deleteCrop(id);
    }
  };
  
  // Status badge color
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'planning':
        return 'bg-gray-100 text-gray-800';
      case 'growing':
        return 'bg-primary-100 text-primary-800';
      case 'harvesting':
        return 'bg-accent-100 text-accent-800';
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'failed':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Crop Management</h1>
          <p className="text-gray-600">Plan and monitor your crops</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <button 
            className="btn btn-primary flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            Add Crop
          </button>
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
            placeholder="Search crops by name or field..."
            className="pl-10 input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Crop List */}
      {filteredCrops.length === 0 ? (
        <div className="text-gray-500">No crops to display.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <motion.div 
              key={crop.id}
              className="bg-white rounded-xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-xl font-bold">{crop.name}</h3>
                      <span className={`ml-3 badge ${getStatusColor(crop.status)}`}>
                        {crop.status}
                      </span>
                    </div>
                    <div className="mt-1 text-gray-600">
                      {crop.field} ({crop.area} acres)
                    </div>
                  </div>
                  <div className="flex">
                    <button 
                      onClick={() => handleEdit(crop)}
                      className="text-gray-500 hover:text-primary-500 p-2"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(crop.id)}
                      className="text-gray-500 hover:text-error-500 p-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Planted</p>
                    <p className="font-medium">{formatDate(crop.plantedDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Expected Harvest</p>
                    <p className="font-medium">{formatDate(crop.expectedHarvestDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Current Stage</p>
                    <p className="font-medium">{crop.stage}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Days to Harvest</p>
                    <p className="font-medium">
                      {typeof daysUntilHarvest(crop.plantedDate, crop.expectedHarvestDate) === 'number' 
                        ? `${daysUntilHarvest(crop.plantedDate, crop.expectedHarvestDate)} days` 
                        : daysUntilHarvest(crop.plantedDate, crop.expectedHarvestDate)
                      }
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{calculateProgress(crop.plantedDate, crop.expectedHarvestDate)}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary-500 h-2"
                      style={{ width: `${calculateProgress(crop.plantedDate, crop.expectedHarvestDate)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Growth Stage Timeline */}
                <div className="mt-6">
                  <h4 className="font-medium text-sm mb-3">Growth Timeline</h4>
                  <div className="relative">
                    <div className="absolute top-3 left-3 h-full w-0.5 bg-gray-200 -z-10"></div>
                    <div className="space-y-4">
                      {crop.growthStages.map((stage, index) => (
                        <div key={index} className="flex">
                          <div className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center ${stage.completed ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}>
                            {stage.completed ? '✓' : ''}
                          </div>
                          <div className="ml-3">
                            <div className="flex justify-between">
                              <p className="font-medium">{stage.stage}</p>
                              <p className="text-xs text-gray-500">{formatDate(stage.date)}</p>
                            </div>
                            {stage.notes && <p className="text-sm text-gray-600 mt-1">{stage.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {crop.notes && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{crop.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Add/Edit Crop Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <Dialog 
          open={isAddModalOpen || isEditModalOpen} 
          onClose={() => isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            {/* Modal content */}
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <Dialog.Title 
                as="h3" 
                className="text-xl font-bold text-gray-900 mb-4"
              >
                {isEditModalOpen ? 'Edit Crop' : 'Add Crop'}
              </Dialog.Title>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Crop name */}
                  <div>
                    <label className="label">Crop Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Corn, Tomatoes"
                      required
                    />
                  </div>
                  
                  {/* Field location */}
                  <div>
                    <label className="label">Field/Location</label>
                    <input
                      type="text"
                      name="field"
                      value={formData.field}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Field A, Greenhouse 2"
                      required
                    />
                  </div>
                  
                  {/* Area */}
                  <div>
                    <label className="label">Area (acres)</label>
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., 5.5"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  {/* Status */}
                  <div>
                    <label className="label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      <option value="Planning">Planning</option>
                      <option value="Growing">Growing</option>
                      <option value="Harvesting">Harvesting</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                  
                  {/* Planted date */}
                  <div>
                    <label className="label">Planted Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="plantedDate"
                        value={formData.plantedDate}
                        onChange={handleChange}
                        className="pl-10 input"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Expected harvest date */}
                  <div>
                    <label className="label">Expected Harvest Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="expectedHarvestDate"
                        value={formData.expectedHarvestDate}
                        onChange={handleChange}
                        className="pl-10 input"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Current stage */}
                  <div>
                    <label className="label">Current Growth Stage</label>
                    <select
                      name="stage"
                      value={formData.stage}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      <option value="Planning">Planning</option>
                      <option value="Planting">Planting</option>
                      <option value="Emergence">Emergence</option>
                      <option value="Vegetative">Vegetative</option>
                      <option value="Flowering">Flowering</option>
                      <option value="Fruiting">Fruiting</option>
                      <option value="Maturation">Maturation</option>
                      <option value="Harvest">Harvest</option>
                    </select>
                  </div>
                  
                  {/* Notes field - spans full width */}
                  <div className="md:col-span-2">
                    <label className="label">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="input h-24"
                      placeholder="Additional notes, planting details, etc."
                    ></textarea>
                  </div>
                </div>
                
                {/* Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {isEditModalOpen ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default CropManagement;