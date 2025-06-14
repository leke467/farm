import { useState } from 'react';
import { useFarmData } from '../../context/FarmDataContext';
import { FiCheck, FiClock, FiX, FiCalendar, FiFlag } from 'react-icons/fi';

function TaskList({ limit = 5 }) {
  const { tasks, updateTask } = useFarmData();
  const [filter, setFilter] = useState('upcoming');
  
  // Sort tasks by due date
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  // Filter tasks
  const filteredTasks = sortedTasks.filter(task => {
    if (filter === 'upcoming') {
      return task.status !== 'completed';
    } else if (filter === 'completed') {
      return task.status === 'completed';
    } else if (filter === 'high') {
      return task.priority === 'high';
    }
    return true;
  });
  
  // Get limited number of tasks
  const displayTasks = filteredTasks.slice(0, limit);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle status toggle
  const handleStatusToggle = (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateTask(id, { status: newStatus });
  };
  
  // Priority badge
  const PriorityBadge = ({ priority }) => {
    const colors = {
      high: 'bg-error-100 text-error-800',
      medium: 'bg-warning-100 text-warning-800',
      low: 'bg-success-100 text-success-800'
    };
    
    return (
      <span className={`badge ${colors[priority] || colors.medium}`}>
        {priority}
      </span>
    );
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Tasks</h3>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'upcoming' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'completed' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'high' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => setFilter('high')}
          >
            High Priority
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {displayTasks.length > 0 ? (
          displayTasks.map(task => (
            <div 
              key={task.id} 
              className={`flex items-start p-3 rounded-lg border ${
                task.status === 'completed' 
                  ? 'border-gray-200 bg-gray-50' 
                  : new Date(task.dueDate) < new Date() 
                    ? 'border-error-200 bg-error-50'
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <button 
                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                  task.status === 'completed' 
                    ? 'bg-success-100 text-success-600 border border-success-200' 
                    : 'border border-gray-300 hover:border-primary-500'
                }`}
                onClick={() => handleStatusToggle(task.id, task.status)}
              >
                {task.status === 'completed' && <FiCheck size={14} />}
              </button>
              
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : ''}`}>
                    {task.title}
                  </h4>
                  <PriorityBadge priority={task.priority} />
                </div>
                
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <FiCalendar size={12} className="mr-1" />
                  <span>{formatDate(task.dueDate)}</span>
                  
                  {task.assignedTo && (
                    <span className="ml-4 bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {task.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FiClock size={32} className="mx-auto mb-3 text-gray-400" />
            <p>No {filter} tasks found</p>
          </div>
        )}
      </div>
      
      {filteredTasks.length > limit && (
        <div className="mt-4 text-center">
          <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
            View all {filteredTasks.length} tasks
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskList;