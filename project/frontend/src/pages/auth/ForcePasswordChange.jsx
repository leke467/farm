import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import apiService from "../../services/api";

function ForcePasswordChange() {
  const navigate = useNavigate();
  const { user, updateUserProfile, handleLogout } = useUser();

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const response = await apiService.changePassword({
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    });

    if (response?._error) {
      const message =
        response.detail ||
        response.current_password?.[0] ||
        response.new_password?.[0] ||
        response.confirm_password?.[0] ||
        "Failed to change password";
      setError(message);
      setLoading(false);
      return;
    }

    if (response?.user) {
      updateUserProfile(response.user);
    } else {
      updateUserProfile({
        ...user,
        must_change_password: false,
        mustChangePassword: false,
      });
    }

    setLoading(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h2>
      <p className="text-sm text-gray-600 mb-6">
        Your account requires a password update before you can continue.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-600 rounded-lg border border-error-200">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="newPassword" className="label">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            value={passwordData.newPassword}
            onChange={handleChange}
            className="input"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            value={passwordData.confirmPassword}
            onChange={handleChange}
            className="input"
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full btn btn-primary ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 w-full btn btn-outline"
        onClick={handleLogout}
      >
        Sign out
      </button>
    </div>
  );
}

export default ForcePasswordChange;
