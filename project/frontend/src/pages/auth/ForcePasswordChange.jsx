import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import apiService from "../../services/api";

function ForcePasswordChange() {
  const navigate = useNavigate();
  const { user, updateUserProfile, handleLogout } = useUser();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const response = await apiService.changePassword({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    });

    if (response?._error) {
      let message = "Failed to change password. Please check your inputs.";
      if (typeof response.detail === "string") {
        message = response.detail;
      } else if (Array.isArray(response.new_password)) {
        message = response.new_password.join(" ");
      } else if (typeof response.new_password === "string") {
        message = response.new_password;
      } else if (Array.isArray(response.current_password)) {
        message = response.current_password.join(" ");
      } else if (Array.isArray(response.confirm_password)) {
        message = response.confirm_password.join(" ");
      } else if (Array.isArray(response.non_field_errors)) {
        message = response.non_field_errors.join(" ");
      }
      setError(message);
      setLoading(false);
      return;
    }

    const updatedUser = response?.user || {
      ...user,
      must_change_password: false,
      mustChangePassword: false,
    };

    updateUserProfile({
      ...updatedUser,
      must_change_password: false,
      mustChangePassword: false,
    });

    setSuccessMsg("✓ Password updated successfully! Redirecting to dashboard...");
    setLoading(false);
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 800);
  };

  const hasMinLength = passwordData.newPassword.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(passwordData.newPassword);
  const hasNumbers = /[0-9]/.test(passwordData.newPassword);
  const passwordsMatch =
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword === passwordData.confirmPassword;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Your Password</h2>
      <p className="text-sm text-gray-600 mb-6">
        Your account requires a password update before you can continue.
      </p>

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-300 text-sm font-semibold shadow-2xs animate-fadeIn flex items-center gap-2">
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-medium shadow-2xs">
          <p className="font-bold text-rose-800 mb-1">Password Error:</p>
          <p>{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="currentPassword" className="label">
            Current / Temporary Password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handleChange}
            className="input"
            placeholder="Enter temporary / current password"
          />
          <p className="text-[11px] text-gray-400 mt-1">Optional for initial worker password setup.</p>
        </div>

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
            placeholder="Enter new password (e.g. Worker2026!)"
          />
        </div>

        {/* Live Password Requirements Checklist */}
        {passwordData.newPassword.length > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <p className="font-semibold text-slate-700 mb-1">Password Requirements:</p>
            <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-bold" : "text-slate-500"}`}>
              <span>{hasMinLength ? "✓" : "✗"}</span>
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLetters ? "text-emerald-700 font-bold" : "text-slate-500"}`}>
              <span>{hasLetters ? "✓" : "✗"}</span>
              <span>Must contain letters (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumbers ? "text-emerald-700 font-bold" : "text-slate-500"}`}>
              <span>{hasNumbers ? "✓" : "✗"}</span>
              <span>Must contain numbers (0-9)</span>
            </div>
          </div>
        )}

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
          {passwordData.confirmPassword.length > 0 && (
            <p className={`text-xs mt-1 font-semibold ${passwordsMatch ? "text-emerald-600" : "text-rose-500"}`}>
              {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}
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
