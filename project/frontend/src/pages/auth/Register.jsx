import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import apiService from "../../services/api";
import { users } from "../../data/mockData";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "manager", // default to lowercase as required by backend
    phone: "", // added phone field
    farmName: "",
    farmLocation: "",
    farmSize: "medium",
    farmType: "mixed",
    farmAddress: "",
    farmTotalArea: "1.0",
    farmDescription: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { handleLogin } = useUser();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);

    // Demo registration (mock data)
    if (
      (formData.username === "demo" && formData.password === "demo123") ||
      (formData.username === "admin" && formData.password === "admin123")
    ) {
      const demoUser = users.find(
        (u) =>
          u.username === formData.username && u.password === formData.password
      );
      if (demoUser) {
        handleLogin(demoUser);
        navigate("/dashboard");
        setLoading(false);
        return;
      }
    }

    // Real backend registration
    try {
      const response = await apiService.register({
        username: formData.username,
        password: formData.password,
        confirm_password: formData.confirmPassword, // add this line
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        phone: formData.phone, // send phone field
        farm_name: formData.farmName,
        farm_location: formData.farmLocation,
        farm_size: formData.farmSize,
        farm_type: formData.farmType,
        farm_address: formData.farmAddress,
        farm_total_area: formData.farmTotalArea,
        farm_description: formData.farmDescription,
      });
      if (response.token) {
        handleLogin({ username: formData.username, token: response.token });
        navigate("/dashboard");
      } else if (response._error) {
        // Show all backend errors if present
        const errorMsg = Object.values(response)
          .filter((v) => Array.isArray(v) || typeof v === "string")
          .flat()
          .join(" ");
        setError(errorMsg || "Registration failed");
      } else {
        setError("Registration failed");
      }
    } catch (err) {
      setError("Registration failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Create your account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-600 rounded-lg border border-error-200">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="label">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="label">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="username" className="label">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="role" className="label">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            value={formData.role}
            onChange={handleChange}
            className="input"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="worker">Worker</option>
          </select>
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Phone (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            value={formData.phone}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="farmName" className="label">
            Farm Name
          </label>
          <input
            id="farmName"
            name="farmName"
            type="text"
            required
            value={formData.farmName}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="farmLocation" className="label">
            Farm Location
          </label>
          <input
            id="farmLocation"
            name="farmLocation"
            type="text"
            value={formData.farmLocation}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="farmSize" className="label">
            Farm Size
          </label>
          <select
            id="farmSize"
            name="farmSize"
            value={formData.farmSize}
            onChange={handleChange}
            className="input"
          >
            <option value="small">Small (&lt; 50 acres)</option>
            <option value="medium">Medium (50-500 acres)</option>
            <option value="large">Large (&gt; 500 acres)</option>
          </select>
        </div>
        <div>
          <label htmlFor="farmType" className="label">
            Farm Type
          </label>
          <select
            id="farmType"
            name="farmType"
            value={formData.farmType}
            onChange={handleChange}
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
          <label htmlFor="farmAddress" className="label">
            Farm Address
          </label>
          <input
            id="farmAddress"
            name="farmAddress"
            type="text"
            value={formData.farmAddress}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="farmTotalArea" className="label">
            Farm Total Area (acres)
          </label>
          <input
            id="farmTotalArea"
            name="farmTotalArea"
            type="number"
            min="0.1"
            step="0.1"
            value={formData.farmTotalArea}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="farmDescription" className="label">
            Farm Description
          </label>
          <textarea
            id="farmDescription"
            name="farmDescription"
            value={formData.farmDescription}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn btn-primary ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary-500 hover:text-primary-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Register;
