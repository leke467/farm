import { motion } from 'framer-motion';

function SummaryCard({ title, value, icon, change, color = 'primary' }) {
  const isPositiveChange = change > 0;
  
  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-md p-6 border-t-4 border-${color}-500`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 font-medium text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          
          {change !== undefined && (
            <div className={`mt-2 flex items-center text-sm font-medium ${isPositiveChange ? 'text-success-600' : 'text-error-600'}`}>
              <span className="mr-1">
                {isPositiveChange ? '↑' : '↓'}
              </span>
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 bg-${color}-100 text-${color}-600 rounded-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default SummaryCard;