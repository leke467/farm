import { FiCloud, FiSun, FiCloudRain, FiCloudSnow } from 'react-icons/fi';
import { weatherData } from '../../data/mockData';

function WeatherWidget() {
  const { current, forecast } = weatherData;
  
  // Function to get weather icon based on condition
  const getWeatherIcon = (condition) => {
    const lowercaseCondition = condition.toLowerCase();
    
    if (lowercaseCondition.includes('sun') || lowercaseCondition.includes('clear')) {
      return <FiSun size={24} className="text-accent-500" />;
    } else if (lowercaseCondition.includes('rain') || lowercaseCondition.includes('shower')) {
      return <FiCloudRain size={24} className="text-primary-500" />;
    } else if (lowercaseCondition.includes('snow')) {
      return <FiCloudSnow size={24} className="text-blue-500" />;
    } else {
      return <FiCloud size={24} className="text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Current Weather */}
      <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium mb-1">Today's Weather</h3>
            <p className="text-sm text-primary-100">{current.date}</p>
          </div>
          <div className="text-4xl">
            {getWeatherIcon(current.condition)}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-end">
            <span className="text-4xl font-bold">{current.temperature}°F</span>
            <span className="ml-2 text-primary-100">{current.condition}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>Humidity: {current.humidity}%</div>
            <div>Wind: {current.windSpeed} mph {current.windDirection}</div>
            <div>Precipitation: {current.precipitation}%</div>
          </div>
        </div>
      </div>
      
      {/* Forecast */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">5-Day Forecast</h4>
        <div className="grid grid-cols-5 gap-2">
          {forecast.map((day, index) => (
            <div key={index} className="text-center">
              <p className="text-xs mb-1">{day.date.split('-').slice(1).join('/')}</p>
              <div className="mx-auto mb-1 text-lg">
                {getWeatherIcon(day.condition)}
              </div>
              <p className="text-sm font-medium">{day.highTemp}°</p>
              <p className="text-xs text-gray-500">{day.lowTemp}°</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;