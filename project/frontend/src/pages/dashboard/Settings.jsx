import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiGlobe,
  FiLock,
  FiSettings,
  FiUser,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { useUser } from "../../context/UserContext";
import { useFarmData } from "../../context/FarmDataContext";
import apiService from "../../services/api";

const createEmptyMemberPagination = () => ({
  count: 0,
  next: null,
  previous: null,
  totalPages: 1,
});

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

function SettingsAccordionSection({
  id,
  title,
  description,
  icon: Icon,
  openSection,
  onToggle,
  children,
}) {
  const isOpen = openSection === id;

  return (
    <section className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        aria-controls={`settings-section-${id}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
            <p className="text-sm text-gray-600 truncate">{description}</p>
          </div>
        </div>

        <div className="text-gray-500 ml-3" aria-hidden="true">
          {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </div>
      </button>

      {isOpen && (
        <div id={`settings-section-${id}`} className="border-t border-gray-100 p-5 sm:p-6">
          {children}
        </div>
      )}
    </section>
  );
}

function Settings() {
  const { user, updateUserProfile } = useUser();
  const { farmSettings, updateFarmSettings, activeFarm, setActiveFarm } = useFarmData();

  const isAdmin = Boolean(user?.isAdmin ?? user?.is_admin);

  const [openSection, setOpenSection] = useState("profile");

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
  const [membersViewStatus, setMembersViewStatus] = useState({ type: "", message: "" });

  const [profileLoading, setProfileLoading] = useState(false);
  const [farmLoading, setFarmLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);

  const [membersList, setMembersList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(10);
  const [memberPagination, setMemberPagination] = useState(createEmptyMemberPagination());

  const statusClass = (type) =>
    type === "success"
      ? "bg-success-50 border-success-200 text-success-700"
      : "bg-error-50 border-error-200 text-error-600";

  const toggleSection = (sectionId) => {
    setOpenSection((current) => (current === sectionId ? "" : sectionId));
  };

  const fetchFarmMembers = async (farmId, page = 1, pageSize = memberPageSize) => {
    setMembersLoading(true);
    setMembersViewStatus({ type: "", message: "" });

    const response = await apiService.getFarmMembers(farmId, {
      page,
      page_size: pageSize,
    });

    if (!response?._error) {
      if (Array.isArray(response)) {
        setMembersList(response);
        setMemberPagination({
          count: response.length,
          next: null,
          previous: null,
          totalPages: 1,
        });
      } else if (Array.isArray(response.results)) {
        const count = Number(response.count ?? 0);
        setMembersList(response.results);
        setMemberPagination({
          count,
          next: response.next ?? null,
          previous: response.previous ?? null,
          totalPages: Math.max(1, Math.ceil(count / pageSize)),
        });
      } else {
        setMembersList([]);
        setMemberPagination(createEmptyMemberPagination());
      }

      setMembersLoading(false);
      return;
    }

    setMembersList([]);
    setMemberPagination(createEmptyMemberPagination());
    setMembersViewStatus({
      type: "error",
      message: getErrorMessage(response, "Failed to fetch farm members"),
    });
    setMembersLoading(false);
  };

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

  useEffect(() => {
    setMemberPage(1);
  }, [activeFarm?.id]);

  useEffect(() => {
    if (!isAdmin || !activeFarm?.id) {
      setMembersList([]);
      setMemberPagination(createEmptyMemberPagination());
      setMembersViewStatus({ type: "", message: "" });
      return;
    }

    fetchFarmMembers(activeFarm.id, memberPage, memberPageSize);
  }, [activeFarm?.id, isAdmin, memberPage, memberPageSize]);

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

    setMemberPage(1);
    if (memberPage === 1 && activeFarm?.id) {
      fetchFarmMembers(activeFarm.id, 1, memberPageSize);
    }

    setMemberLoading(false);
  };

  const handleMembersPageSizeChange = (e) => {
    const nextPageSize = Number(e.target.value) || 10;
    setMemberPageSize(nextPageSize);
    setMemberPage(1);
  };

  const handleMembersPreviousPage = () => {
    if (memberPagination.previous && memberPage > 1) {
      setMemberPage((current) => current - 1);
    }
  };

  const handleMembersNextPage = () => {
    if (memberPagination.next && memberPage < memberPagination.totalPages) {
      setMemberPage((current) => current + 1);
    }
  };

  const membersRangeStart =
    memberPagination.count === 0 ? 0 : (memberPage - 1) * memberPageSize + 1;
  const membersRangeEnd = Math.min(memberPage * memberPageSize, memberPagination.count);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and farm settings</p>
      </div>

      <div className="space-y-4">
        <SettingsAccordionSection
          id="profile"
          title="Profile Settings"
          description="Name, email, contact details, and account role"
          icon={FiUser}
          openSection={openSection}
          onToggle={toggleSection}
        >
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
                className={`btn btn-primary w-full ${
                  profileLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={profileLoading}
              >
                {profileLoading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </SettingsAccordionSection>

        <SettingsAccordionSection
          id="farm"
          title="Farm Settings"
          description="Farm type, size, location, and metadata"
          icon={FiGlobe}
          openSection={openSection}
          onToggle={toggleSection}
        >
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
                className={`btn btn-primary w-full ${
                  farmLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={farmLoading}
              >
                {farmLoading ? "Updating..." : "Update Farm Settings"}
              </button>
            </div>
          </form>
        </SettingsAccordionSection>

        {isAdmin && (
          <SettingsAccordionSection
            id="create-member"
            title="Create Farm Member"
            description="Add users and assign role or admin privileges"
            icon={FiUserPlus}
            openSection={openSection}
            onToggle={toggleSection}
          >
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
                  className={`btn btn-primary w-full ${
                    memberLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={memberLoading}
                >
                  {memberLoading ? "Creating..." : "Create Member"}
                </button>
              </div>
            </form>
          </SettingsAccordionSection>
        )}

        {isAdmin && (
          <SettingsAccordionSection
            id="farm-members"
            title="Farm Members"
            description="View member details with pagination"
            icon={FiUsers}
            openSection={openSection}
            onToggle={toggleSection}
          >
            {!activeFarm?.id ? (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                Select an active farm to view members.
              </div>
            ) : (
              <>
                {membersViewStatus.message && (
                  <div
                    className={`mb-4 p-3 rounded-lg border ${statusClass(
                      membersViewStatus.type
                    )}`}
                  >
                    {membersViewStatus.message}
                  </div>
                )}

                {membersLoading ? (
                  <div className="flex justify-center py-8">
                    <p className="text-gray-500">Loading members...</p>
                  </div>
                ) : membersList.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <p className="text-gray-500">No members added yet</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Phone
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Admin
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {membersList.map((member) => {
                            const memberUser = member.user || {};
                            const firstName = memberUser.firstName ?? memberUser.first_name ?? "";
                            const lastName = memberUser.lastName ?? memberUser.last_name ?? "";
                            const fullName =
                              `${firstName} ${lastName}`.trim() || memberUser.username || "Unknown";
                            const email = memberUser.email || "";
                            const phone = memberUser.phone || "-";
                            const rowIsAdmin = Boolean(
                              memberUser.isAdmin ?? memberUser.is_admin
                            );
                            const roleLabel = member.role
                              ? member.role.charAt(0).toUpperCase() + member.role.slice(1)
                              : "Member";

                            return (
                              <tr
                                key={member.id}
                                className="border-b border-gray-200 hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 text-sm text-gray-900">{fullName}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{email}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                    {roleLabel}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{phone}</td>
                                <td className="px-4 py-3 text-sm">
                                  {rowIsAdmin ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800">
                                      Admin
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {membersRangeStart}-{membersRangeEnd} of {memberPagination.count} members
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm text-gray-600" htmlFor="members-page-size">
                          Rows
                        </label>
                        <select
                          id="members-page-size"
                          value={memberPageSize}
                          onChange={handleMembersPageSizeChange}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>

                        <button
                          type="button"
                          onClick={handleMembersPreviousPage}
                          disabled={!memberPagination.previous || membersLoading}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <span className="text-sm text-gray-600">
                          Page {memberPage} of {memberPagination.totalPages}
                        </span>

                        <button
                          type="button"
                          onClick={handleMembersNextPage}
                          disabled={!memberPagination.next || membersLoading}
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </SettingsAccordionSection>
        )}

        <SettingsAccordionSection
          id="password"
          title="Change Password"
          description="Update your account password"
          icon={FiLock}
          openSection={openSection}
          onToggle={toggleSection}
        >
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
                className={`btn btn-primary w-full ${
                  passwordLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={passwordLoading}
              >
                {passwordLoading ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </SettingsAccordionSection>

        <SettingsAccordionSection
          id="preferences"
          title="Preferences"
          description="Notification and reminder preferences"
          icon={FiSettings}
          openSection={openSection}
          onToggle={toggleSection}
        >
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
        </SettingsAccordionSection>
      </div>
    </div>
  );
}

export default Settings;
