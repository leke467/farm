import { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiSearch, FiUsers, FiUserPlus } from 'react-icons/fi';
import { useFarmData } from '../../context/FarmDataContext';
import AnimalCard from '../../components/animals/AnimalCard';
import { Dialog } from '@headlessui/react';

function AnimalManagement() {
  const { animals, addAnimal, updateAnimal, deleteAnimal, addAnimalGroup, farmType, setFarmType } = useFarmData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(null);
  
  // New animal form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Cow',
    breed: '',
    birthDate: '',
    gender: 'Female',
    weight: '',
    status: 'Healthy',
    notes: '',
    isGroup: false,
    count: 1,
  });
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isAddModalOpen && !isEditModalOpen) {
      setFormData({
        name: '',
        type: 'Cow',
        breed: '',
        birthDate: '',
        gender: 'Female',
        weight: '',
        status: 'Healthy',
        notes: '',
        isGroup: false,
        count: 1,
      });
    }
  }, [isAddModalOpen, isEditModalOpen]);
  
  // Fill form when editing
  useEffect(() => {
    if (currentAnimal && isEditModalOpen) {
      setFormData({
        ...currentAnimal,
        birthDate: formatDateForInput(currentAnimal.birthDate || currentAnimal.establishedDate || ''),
      });
    }
  }, [currentAnimal, isEditModalOpen]);
  
  // Format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const animalData = {
      ...formData,
      weight: formData.isGroup ? '' : parseFloat(formData.weight),
      count: formData.isGroup ? parseInt(formData.count) : 1,
      avgWeight: formData.isGroup ? parseFloat(formData.weight) : 0,
    };
    
    if (isEditModalOpen && currentAnimal) {
      updateAnimal(currentAnimal.id, animalData);
      setIsEditModalOpen(false);
      setCurrentAnimal(null);
    } else {
      if (formData.isGroup) {
        addAnimalGroup(animalData);
      } else {
        addAnimal(animalData);
      }
      setIsAddModalOpen(false);
    }
  };
  
  // Handle edit button click
  const handleEdit = (animal) => {
    setCurrentAnimal(animal);
    setIsEditModalOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      deleteAnimal(id);
    }
  };
  
  // Filter animals
  const filterAnimals = () => {
    let filteredAnimals = animals;
    
    // Apply type filter
    if (currentFilter !== 'all') {
      filteredAnimals = filteredAnimals.filter(animal => animal.type === currentFilter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredAnimals = filteredAnimals.filter(animal => 
        animal.name.toLowerCase().includes(term) || 
        animal.type.toLowerCase().includes(term) || 
        animal.breed.toLowerCase().includes(term)
      );
    }
    
    return filteredAnimals;
  };
  
  const filteredAnimals = filterAnimals();
  
  // Get unique animal types for filter
  const animalTypes = ['all', ...new Set(animals.map(animal => animal.type))];
  
  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Animal Management</h1>
          <p className="text-gray-600">Track and manage your livestock</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <button 
            className="btn btn-primary flex items-center"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            {farmType === 'large' ? 'Add Group' : 'Add Animal'}
          </button>
          
          <div className="flex space-x-2 items-center">
            <button 
              className={`btn py-2 px-4 ${farmType === 'small' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFarmType('small')}
            >
              <FiUserPlus className="mr-2" />
              Individual
            </button>
            <button 
              className={`btn py-2 px-4 ${farmType === 'large' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFarmType('large')}
            >
              <FiUsers className="mr-2" />
              Group
            </button>
          </div>
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
            placeholder="Search animals..."
            className="pl-10 input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 items-center">
          <FiFilter className="text-gray-500" />
          <select
            className="input max-w-xs"
            value={currentFilter}
            onChange={(e) => setCurrentFilter(e.target.value)}
          >
            {animalTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Animal List */}
      {filteredAnimals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <AnimalCard 
              key={animal.id} 
              animal={animal} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No animals found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || currentFilter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'Add your first animal to get started'
            }
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FiPlus className="mr-2" />
            {farmType === 'large' ? 'Add Group' : 'Add Animal'}
          </button>
        </div>
      )}
      
      {/* Add/Edit Animal Modal */}
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
                {isEditModalOpen ? 'Edit Animal' : `Add ${formData.isGroup ? 'Group' : 'Animal'}`}
              </Dialog.Title>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Group/Individual toggle */}
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isGroup"
                        checked={formData.isGroup}
                        onChange={handleChange}
                        className="h-5 w-5 text-primary-600 rounded"
                      />
                      <span className="font-medium">This is a group of animals (flock, herd, etc.)</span>
                    </label>
                  </div>
                  
                  {/* Name field */}
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      placeholder={formData.isGroup ? "Group name (e.g., Flock A)" : "Animal name"}
                      required
                    />
                  </div>
                  
                  {/* Type field */}
                  <div>
                    <label className="label">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      <option value="Cow">Cow</option>
                      <option value="Goat">Goat</option>
                      <option value="Sheep">Sheep</option>
                      <option value="Pig">Pig</option>
                      <option value="Chicken">Chicken</option>
                      <option value="Duck">Duck</option>
                      <option value="Turkey">Turkey</option>
                      <option value="Fish">Fish</option>
                      <option value="Horse">Horse</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Breed field */}
                  <div>
                    <label className="label">Breed</label>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="input"
                      placeholder="Breed"
                    />
                  </div>
                  
                  {/* Date field (birth or established) */}
                  <div>
                    <label className="label">
                      {formData.isGroup ? 'Established Date' : 'Birth Date'}
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>
                  
                  {/* Status field */}
                  <div>
                    <label className="label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      <option value="Healthy">Healthy</option>
                      <option value="Sick">Sick</option>
                      <option value="Injured">Injured</option>
                      <option value="Pregnant">Pregnant</option>
                      <option value="Nursing">Nursing</option>
                      <option value="Quarantined">Quarantined</option>
                    </select>
                  </div>
                  
                  {formData.isGroup ? (
                    // Group-specific fields
                    <>
                      <div>
                        <label className="label">Count</label>
                        <input
                          type="number"
                          name="count"
                          value={formData.count}
                          onChange={handleChange}
                          className="input"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Average Weight ({formData.type === 'Fish' ? 'lb' : 'kg'})</label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          className="input"
                          min="0"
                          step="0.1"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    // Individual animal fields
                    <>
                      <div>
                        <label className="label">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="input"
                          required
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Weight ({formData.type === 'Fish' ? 'lb' : 'kg'})</label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          className="input"
                          min="0"
                          step="0.1"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Notes field - spans full width */}
                  <div className="md:col-span-2">
                    <label className="label">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="input h-24"
                      placeholder="Additional notes, health information, etc."
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

export default AnimalManagement;