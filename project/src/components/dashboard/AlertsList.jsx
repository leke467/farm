import { FiAlertTriangle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useFarmData } from '../../context/FarmDataContext';

function AlertsList() {
  const { animals, crops, inventory, tasks } = useFarmData();

  // Defensive: ensure all are arrays
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeCrops = Array.isArray(crops) ? crops : [];

  // Generate alerts based on data
  const alerts = [
    // Low inventory alerts
    ...safeInventory
      .filter(item => item.quantity <= item.minQuantity)
      .map(item => ({
        id: `inv-${item.id}`,
        type: 'warning',
        title: `Low inventory: ${item.name}`,
        description: `Current quantity: ${item.quantity} ${item.unit} (minimum: ${item.minQuantity} ${item.unit})`,
        date: new Date().toISOString()
      })),

    // Overdue tasks
    ...safeTasks
      .filter(task => new Date(task.dueDate) < new Date() && task.status !== 'completed')
      .map(task => ({
        id: `task-${task.id}`,
        type: 'high',
        title: `Overdue task: ${task.title}`,
        description: `Due on ${new Date(task.dueDate).toLocaleDateString()}`,
        date: task.dueDate
      })),

    // Upcoming harvests
    ...safeCrops
      .filter(crop => {
        const harvestStage = crop.growthStages && Array.isArray(crop.growthStages)
          ? crop.growthStages.find(stage => stage.stage === 'Harvest')
          : null;
        return harvestStage && !harvestStage.completed &&
          new Date(harvestStage.date) <= new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
      })
      .map(crop => ({
        id: `crop-${crop.id}`,
        type: 'info',
        title: `Upcoming harvest: ${crop.name}`,
        description: `Harvest expected by ${crop.growthStages.find(stage => stage.stage === 'Harvest')?.date}`,
        date: crop.growthStages.find(stage => stage.stage === 'Harvest')?.date
      })),
  ];

  // Sort alerts by date (most recent first)
  const sortedAlerts = alerts.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Alert icon based on type
  const getAlertIcon = (type) => {
    switch(type) {
      case 'high':
        return <FiAlertCircle size={20} className="text-error-500" />;
      case 'warning':
        return <FiAlertTriangle size={20} className="text-warning-500" />;
      case 'info':
      case 'low':
      default:
        return <FiInfo size={20} className="text-primary-500" />;
    }
  };
  
  // Alert style based on type
  const getAlertStyle = (type) => {
    switch(type) {
      case 'high':
        return 'border-l-4 border-error-500 bg-error-50';
      case 'warning':
        return 'border-l-4 border-warning-500 bg-warning-50';
      case 'info':
        return 'border-l-4 border-primary-500 bg-primary-50';
      case 'low':
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold mb-6">Alerts & Notifications</h3>
      
      <div className="space-y-4">
        {sortedAlerts.length > 0 ? (
          sortedAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-r-lg ${getAlertStyle(alert.type)}`}
            >
              <div className="flex">
                <div className="mr-3 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div>
                  <h4 className="font-medium mb-1">{alert.title}</h4>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                  {alert.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FiInfo size={32} className="mx-auto mb-3 text-gray-400" />
            <p>No alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsList;