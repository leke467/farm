import { useEffect, useState } from "react";
import {
  FiUser,
  FiLock,
  FiSettings,
  FiGlobe,
  FiUserPlus,
} from "react-icons/fi";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import apiService from "../../services/api";

const getErrorMessage = (response, fallback) => {
  if (!response) return fallback;

  if (typeof response.detail === "string") {
    return response.detail;
  }

  const entries = Object.entries(response)
    .filter(([key]) => !["_error", "status"].includes(key))
    .map(([, value]) => {
      if (Array.isArray(value)) return value.join(" ");
      if (typeof value === "string") return value;
      return "";
    })
    .filter(Boolean);

  return entries[0] || fallback;
};

function Settings() {
  const { user, updateUserProfile } = useUser();
  const { farmSettings, updateFarmSettings, activeFarm, setActiveFarm } = useFarmData();

  const isAdmin = Boolean(user?.isAdmin ?? user?.is_admin);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
  });

  const [farmData, setFarmData] = useState({
    name: "",
    type: "mixed",
    size: "medium",
    location: "",
    totalArea: "1",
    address: "",
    description: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [memberData, setMemberData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "worker",
    password: "",
    confirmPassword: "",
    isAdmin: false,
  });

  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });
  const [farmStatus, setFarmStatus] = useState({ type: "", message: "" });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });
  const [memberStatus, setMemberStatus] = useState({ type: "", message: "" });

  const [profileLoading, setProfileLoading] = useState(false);
  const [farmLoading, setFarmLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    setProfileData({
      firstName: user?.firstName ?? user?.first_name ?? "",
      lastName: user?.lastName ?? user?.last_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      role: isAdmin ? "admin" : "member",
    });
  }, [user, isAdmin]);

  useEffect(() => {
    setFarmData({
      name: activeFarm?.name ?? farmSettings?.name ?? "",
      type:
        activeFarm?.farm_type ??
        activeFarm?.type ??
        farmSettings?.type ??
        "mixed",
      size: activeFarm?.size ?? farmSettings?.size ?? "medium",
      location: activeFarm?.location ?? farmSettings?.location ?? "",
      totalArea: String(activeFarm?.total_area ?? "1"),
      address: activeFarm?.address ?? "",
      description: activeFarm?.description ?? "",
    });
  }, [activeFarm, farmSettings]);

  const statusClass = (type) =>
    type === "success"
      ? "bg-success-50 border-success-200 text-success-700"
      : "bg-error-50 border-error-200 text-error-600";

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileStatus({ type: "", message: "" });
    setProfileLoading(true);

    const response = await apiService.updateProfile({
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      email: profileData.email,
      phone: profileData.phone,
    });

    if (response?._error) {
      setProfileStatus({
        type: "error",
        message: getErrorMessage(response, "Failed to update profile"),
      });
      setProfileLoading(false);
      return;
    }

    updateUserProfile(response);
    setProfileStatus({ type: "success", message: "Profile updated successfully" });
    setProfileLoading(false);
  };

  const handleFarmUpdate = async (e) => {
    e.preventDefault();
    setFarmStatus({ type: "", message: "" });
    setFarmLoading(true);

    if (!activeFarm?.id) {
      updateFarmSettings({
        name: farmData.name,
        type: farmData.type,
        size: farmData.size,
        location: farmData.location,
      });
      setFarmStatus({ type: "success", message: "Farm settings updated locally" });
      setFarmLoading(false);
      return;
    }

    const response = await apiService.updateFarm(activeFarm.id, {
      name: farmData.name,
      farm_type: farmData.type,
      size: farmData.size,
      location: farmData.location,
      total_area: farmData.totalArea || "1",
      address: farmData.address,
      description: farmData.description,
      established_date: activeFarm.established_date || null,
    });

    if (response?._error) {
      setFarmStatus({
        type: "error",
        message: getErrorMessage(response, "Failed to update farm settings"),
      });
      setFarmLoading(false);
      return;
    }

    setActiveFarm(response);
    updateFarmSettings({
      name: response.name,
      type: response.farm_type,
      size: response.size,
      location: response.location,
    });
    setFarmStatus({ type: "success", message: "Farm settings updated successfully" });
    setFarmLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: "", message: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match" });
      return;
    }

    setPasswordLoading(true);
    const response = await apiService.changePassword({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    });

    if (response?._error) {
      setPasswordStatus({
        type: "error",
        message: getErrorMessage(response, "Failed to change password"),
      });
      setPasswordLoading(false);
      return;
    }

    if (response?.user) {
      updateUserProfile(response.user);
    }

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordStatus({ type: "success", message: "Password changed successfully" });
    setPasswordLoading(false);
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setMemberStatus({ type: "", message: "" });

    if (!activeFarm?.id) {
      setMemberStatus({
        type: "error",
        message: "Select an active farm before creating members",
      });
      return;
    }

    if (memberData.password !== memberData.confirmPassword) {
      setMemberStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setMemberLoading(true);
    const response = await apiService.createFarmMember(activeFarm.id, {
      username: memberData.username,
      email: memberData.email,
      first_name: memberData.firstName,
      last_name: memberData.lastName,
      phone: memberData.phone,
      role: memberData.role,
      password: memberData.password,
      is_admin: memberData.isAdmin,
    });

    if (response?._error) {
      setMemberStatus({
        type: "error",
        message: getErrorMessage(response, "Failed to create farm member"),
      });
      setMemberLoading(false);
      return;
    }

    setMemberData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "worker",
      password: "",
      confirmPassword: "",
      isAdmin: false,
    });
    setMemberStatus({
      type: "success",
      message: "Member created. User must change password on first login.",
    });
    setMemberLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and farm settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg mr-4">
              <FiUser size={24} />
            </div>
            <h2 className="text-xl font-bold">Profile Settings</h2>
          </div>

          {profileStatus.message && (
            <div className={`mb-4 p-3 rounded-lg border ${statusClass(profileStatus.type)}`}>
              {profileStatus.message}
            </div>
          )}

          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">Role</label>
                <input type="text" value={profileData.role} className="input" disabled />
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full ${profileLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={profileLoading}
              >
                {profileLoading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-secondary-100 text-secondary-600 rounded-lg mr-4">
              <FiGlobe size={24} />
            </div>
            <h2 className="text-xl font-bold">Farm Settings</h2>
          </div>

          {farmStatus.message && (
            <div className={`mb-4 p-3 rounded-lg border ${statusClass(farmStatus.type)}`}>
              {farmStatus.message}
            </div>
          )}

          <form onSubmit={handleFarmUpdate}>
            <div className="space-y-4">
              <div>
                <label className="label">Farm Name</label>
                <input
                  type="text"
                  value={farmData.name}
                  onChange={(e) => setFarmData((prev) => ({ ...prev, name: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Farm Type</label>
                <select
                  value={farmData.type}
                  onChange={(e) => setFarmData((prev) => ({ ...prev, type: e.target.value }))}
                  className="input"
                >
                  <option value="mixed">Mixed</option>
                  <option value="livestock">Livestock</option>
                  <option value="crop">Crop</option>
                  <option value="dairy">Dairy</option>
                  <option value="poultry">Poultry</option>
                </select>
              </div>

              <div>
                <label className="label">Farm Size</label>
                <select
                  value={farmData.size}
                  onChange={(e) => setFarmData((prev) => ({ ...prev, size: e.target.value }))}
                  className="input"
                >
                  <option value="small">Small (&lt; 50 acres)</option>
                  <option value="medium">Medium (50-500 acres)</option>
                  <option value="large">Large (&gt; 500 acres)</option>
                </select>
              </div>

              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={farmData.location}
                  onChange={(e) =>
                    setFarmData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="input"
                  placeholder="City, State"
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full ${farmLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={farmLoading}
              >
                {farmLoading ? "Updating..." : "Update Farm Settings"}
              </button>
            </div>
          </form>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-primary-100 text-primary-600 rounded-lg mr-4">
                <FiUserPlus size={24} />
              </div>
              <h2 className="text-xl font-bold">Create Farm Member</h2>
            </div>

            {memberStatus.message && (
              <div className={`mb-4 p-3 rounded-lg border ${statusClass(memberStatus.type)}`}>
                {memberStatus.message}
              </div>
            )}

            <form onSubmit={handleCreateMember}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      value={memberData.firstName}
                      onChange={(e) =>
                        setMemberData((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      value={memberData.lastName}
                      onChange={(e) =>
                        setMemberData((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Username</label>
                    <input
                      type="text"
                      value={memberData.username}
                      onChange={(e) =>
                        setMemberData((prev) => ({ ...prev, username: e.target.value }))
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={memberData.email}
                      onChange={(e) =>
                        setMemberData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    value={memberData.phone}
                    onChange={(e) =>
                      setMemberData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Role</label>
                    <select
                      value={memberData.role}
                      onChange={(e) =>
                        setMemberData((prev) => ({ ...prev, role: e.target.value }))
                      }
                      className="input"
                    >
                      <option value="manager">Manager</option>
                      <option value="worker">Worker</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={memberData.isAdmin}
                        onChange={(e) =>
                          setMemberData((prev) => ({ ...prev, isAdmin: e.target.checked }))
                        }
                        className="h-4 w-4"
                      />
                      Grant admin privileges
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Temporary Password</label>
                  <input
                    type="password"
                    value={memberData.password}
                    onChange={(e) =>
                      setMemberData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="input"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="label">Confirm Temporary Password</label>
                  <input
                    type="password"
                    value={memberData.confirmPassword}
                    onChange={(e) =>
                      setMemberData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    className="input"
                    minLength={8}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary w-full ${memberLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                  disabled={memberLoading}
                >
                  {memberLoading ? "Creating..." : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-accent-100 text-accent-600 rounded-lg mr-4">
              <FiLock size={24} />
            </div>
            <h2 className="text-xl font-bold">Change Password</h2>
          </div>

          {passwordStatus.message && (
            <div className={`mb-4 p-3 rounded-lg border ${statusClass(passwordStatus.type)}`}>
              {passwordStatus.message}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className="input"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="input"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full ${passwordLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>

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
