import { useState } from 'react';
import { FiEdit2, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion } from 'framer-motion';

function AnimalCard({ animal, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  
  // Calculate animal age
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    
    const birth = new Date(birthDate);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} yr${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} mo` : ''}`;
    } else {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'healthy':
        return 'bg-success-100 text-success-800';
      case 'sick':
        return 'bg-error-100 text-error-800';
      case 'injured':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h3 className="text-xl font-bold">{animal.name}</h3>
              <span className={`ml-3 badge ${getStatusColor(animal.status)}`}>
                {animal.status}
              </span>
            </div>
            <div className="mt-1 text-gray-600">
              {animal.isGroup ? (
                <span>{animal.count} {animal.breed} {animal.type}</span>
              ) : (
                <span>{animal.breed} {animal.type}</span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => onEdit(animal)}
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-full"
            >
              <FiEdit2 size={18} />
            </button>
            <button 
              onClick={() => onDelete(animal.id)}
              className="p-2 text-gray-500 hover:text-error-500 hover:bg-error-50 rounded-full"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Basic Details */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {animal.isGroup ? (
            <>
              <div>
                <p className="text-gray-500 mb-1">Count</p>
                <p className="font-medium">{animal.count}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Average Weight</p>
                <p className="font-medium">{animal.avgWeight} {animal.type === 'Fish' ? 'lb' : 'kg'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Established</p>
                <p className="font-medium">{new Date(animal.establishedDate || animal.birthDate).toLocaleDateString()}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-gray-500 mb-1">Age</p>
                <p className="font-medium">{calculateAge(animal.birthDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Weight</p>
                <p className="font-medium">{animal.weight} {animal.type === 'Fish' ? 'lb' : 'kg'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Gender</p>
                <p className="font-medium">{animal.gender}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Birth Date</p>
                <p className="font-medium">{new Date(animal.birthDate).toLocaleDateString()}</p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Expandable Details */}
      <div>
        <button
          className="w-full py-3 px-6 flex justify-between items-center border-b focus:outline-none hover:bg-gray-50"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="font-medium text-gray-700">
            {expanded ? 'Hide Details' : 'Show Details'}
          </span>
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {expanded && (
          <div className="p-6">
            {animal.isGroup ? (
              <>
                {/* Group-specific details */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Sample Weights</h4>
                  {animal.sampleWeights && animal.sampleWeights.length > 0 ? (
                    <div className="space-y-4">
                      {animal.sampleWeights.map((sample, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium">Sample from {new Date(sample.date).toLocaleDateString()}</p>
                            <span className="text-sm text-gray-500">
                              Average: {sample.samples.reduce((sum, val) => sum + val, 0) / sample.samples.length} {animal.type === 'Fish' ? 'lb' : 'kg'}
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {sample.samples.map((weight, i) => (
                              <div key={i} className="text-center p-2 bg-white rounded border">
                                {weight} {animal.type === 'Fish' ? 'lb' : 'kg'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No sample data available</p>
                  )}
                </div>
                
                {/* Feed consumption */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Feed Consumption</h4>
                  {animal.foodConsumption && animal.foodConsumption.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-right py-2 px-3">Amount (lbs)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {animal.foodConsumption.map((record, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-3">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="text-right py-2 px-3">{record.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No feed data available</p>
                  )}
                </div>
                
                {/* Additional data for fish */}
                {animal.type === 'Fish' && animal.waterQuality && (
                  <div>
                    <h4 className="text-lg font-medium mb-3">Water Quality</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-center py-2 px-3">pH</th>
                            <th className="text-center py-2 px-3">Temp (°F)</th>
                            <th className="text-center py-2 px-3">Oxygen (mg/L)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {animal.waterQuality.map((record, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-3">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="text-center py-2 px-3">{record.ph}</td>
                              <td className="text-center py-2 px-3">{record.temperature}</td>
                              <td className="text-center py-2 px-3">{record.oxygen}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Individual animal details */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Weight History</h4>
                  {animal.weightHistory && animal.weightHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-right py-2 px-3">Weight ({animal.type === 'Fish' ? 'lb' : 'kg'})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {animal.weightHistory.map((record, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-3">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="text-right py-2 px-3">{record.weight}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No weight history available</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Medical History</h4>
                  {animal.medicalHistory && animal.medicalHistory.length > 0 ? (
                    <div className="space-y-3">
                      {animal.medicalHistory.map((record, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <h5 className="font-medium">{record.treatment}</h5>
                            <span className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm mt-1">{record.notes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No medical history available</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3">Feed Consumption</h4>
                  {animal.foodConsumption && animal.foodConsumption.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-right py-2 px-3">Amount (lbs)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {animal.foodConsumption.map((record, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-3">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="text-right py-2 px-3">{record.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No feed data available</p>
                  )}
                </div>
              </>
            )}
            
            {/* Notes for all animals */}
            {animal.notes && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-lg font-medium mb-2">Notes</h4>
                <p className="text-gray-700">{animal.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AnimalCard;