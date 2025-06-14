import { useState } from 'react';
import { FiUser, FiLock, FiSettings, FiGlobe } from 'react-icons/fi';
import { useUser } from '../../context/UserContext';
import { useFarmData } from '../../context/FarmDataContext';

function Settings() {
  const { user, updateUserProfile } = useUser();
  const { farmSettings, updateFarmSettings } = useFarmData();
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || ''
  });
  
  // Farm settings state
  const [farmData, setFarmData] = useState({
    name: farmSettings?.name || '',
    type: farmSettings?.type || '',
    size: farmSettings?.size || '',
    location: farmSettings?.location || ''
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Handle profile update
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateUserProfile(profileData);
    alert('Profile updated successfully!');
  };
  
  // Handle farm settings update
  const handleFarmUpdate = (e) => {
    e.preventDefault();
    updateFarmSettings(farmData);
    alert('Farm settings updated successfully!');
  };
  
  // Handle password change
  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    // In a real app, you would call an API to change the password
    alert('Password changed successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and farm settings</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg mr-4">
              <FiUser size={24} />
            </div>
            <h2 className="text-xl font-bold">Profile Settings</h2>
          </div>
          
          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Role</label>
                <input
                  type="text"
                  value={profileData.role}
                  className="input"
                  disabled
                />
              </div>
              
              <button type="submit" className="btn btn-primary w-full">
                Update Profile
              </button>
            </div>
          </form>
        </div>
        
        {/* Farm Settings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-secondary-100 text-secondary-600 rounded-lg mr-4">
              <FiGlobe size={24} />
            </div>
            <h2 className="text-xl font-bold">Farm Settings</h2>
          </div>
          
          <form onSubmit={handleFarmUpdate}>
            <div className="space-y-4">
              <div>
                <label className="label">Farm Name</label>
                <input
                  type="text"
                  value={farmData.name}
                  onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Farm Type</label>
                <select
                  value={farmData.type}
                  onChange={(e) => setFarmData({ ...farmData, type: e.target.value })}
                  className="input"
                >
                  <option value="Mixed">Mixed</option>
                  <option value="Livestock">Livestock</option>
                  <option value="Crop">Crop</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Poultry">Poultry</option>
                </select>
              </div>
              
              <div>
                <label className="label">Farm Size</label>
                <select
                  value={farmData.size}
                  onChange={(e) => setFarmData({ ...farmData, size: e.target.value })}
                  className="input"
                >
                  <option value="Small">Small (&lt; 50 acres)</option>
                  <option value="Medium">Medium (50-500 acres)</option>
                  <option value="Large">Large (&gt; 500 acres)</option>
                </select>
              </div>
              
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={farmData.location}
                  onChange={(e) => setFarmData({ ...farmData, location: e.target.value })}
                  className="input"
                  placeholder="City, State"
                />
              </div>
              
              <button type="submit" className="btn btn-primary w-full">
                Update Farm Settings
              </button>
            </div>
          </form>
        </div>
        
        {/* Password Change */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-accent-100 text-accent-600 rounded-lg mr-4">
              <FiLock size={24} />
            </div>
            <h2 className="text-xl font-bold">Change Password</h2>
          </div>
          
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input"
                  required
                />
              </div>
              
              <button type="submit" className="btn btn-primary w-full">
                Change Password
              </button>
            </div>
          </form>
        </div>
        
        {/* Preferences */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg mr-4">
              <FiSettings size={24} />
            </div>
            <h2 className="text-xl font-bold">Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive email updates about your farm</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Task Reminders</h3>
                <p className="text-sm text-gray-500">Get notifications for upcoming tasks</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Weather Alerts</h3>
                <p className="text-sm text-gray-500">Receive local weather updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;