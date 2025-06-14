import { useFarmData } from '../../context/FarmDataContext';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

function AnimalSummary() {
  const { animals } = useFarmData();
  
  // Calculate total animals by type
  const animalCounts = animals.reduce((acc, animal) => {
    const type = animal.type;
    acc[type] = (acc[type] || 0) + (animal.isGroup ? animal.count : 1);
    return acc;
  }, {});
  
  // Prepare data for pie chart (in a real app, you'd use a charting library)
  const totalAnimals = Object.values(animalCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold mb-6">Animal Summary</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-4">
            <span className="text-xl font-bold">{totalAnimals}</span>
          </div>
          <div>
            <h4 className="font-medium">Total Animals</h4>
            <p className="text-sm text-gray-500">Across all categories</p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">By Type</h4>
          <div className="space-y-3">
            {Object.entries(animalCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className={`w-3 h-3 rounded-full mr-2 ${
                      type === 'Cow' ? 'bg-primary-500' :
                      type === 'Goat' ? 'bg-secondary-500' :
                      type === 'Chicken' ? 'bg-accent-500' :
                      type === 'Fish' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}
                  ></div>
                  <span className="text-sm">{type}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round((count / totalAnimals) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Health Status</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center bg-success-50 p-3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-success-100 text-success-700 flex items-center justify-center mr-3">
                <FiTrendingUp size={18} />
              </div>
              <div>
                <p className="text-success-700 font-medium">Healthy</p>
                <p className="text-sm text-success-600">
                  {animals.filter(a => a.status === 'Healthy').length} animals
                </p>
              </div>
            </div>
            
            <div className="flex items-center bg-warning-50 p-3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-warning-100 text-warning-700 flex items-center justify-center mr-3">
                <FiTrendingDown size={18} />
              </div>
              <div>
                <p className="text-warning-700 font-medium">Attention</p>
                <p className="text-sm text-warning-600">
                  {animals.filter(a => a.status !== 'Healthy').length} animals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimalSummary;