import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { users } from "../../data/mockData";
import apiService from "../../services/api";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
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
    setLoading(true);
    setError("");

    // Demo login (mock data)
    const demoUser = users.find(
      (u) =>
        u.username === formData.username && u.password === formData.password
    );
    if (demoUser) {
      const { password, ...userData } = demoUser;
      userData.isDemo = true; // Mark as demo
      handleLogin(userData);
      setLoading(false);
      navigate("/dashboard");
      return;
    }

    // Real backend login
    try {
      const response = await apiService.login({
        username: formData.username,
        password: formData.password,
      });
      if (response.token) {
        const mustChangePassword = Boolean(
          response.user?.must_change_password ?? response.user?.mustChangePassword
        );

        handleLogin({
          username: formData.username,
          token: response.token,
          ...response.user, // include user info if available
        });
        setLoading(false);
        navigate(mustChangePassword ? "/force-password-change" : "/dashboard");
      } else {
        setError("Invalid username or password");
        setLoading(false);
      }
    } catch (err) {
      setError("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        Sign in to your account
      </h2>

      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-error-50 text-error-600 rounded-lg border border-error-200 text-sm sm:text-base">
          {error}
        </div>
      )}

      <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="label text-sm sm:text-base">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
            className="input text-base"
            placeholder="Username"
          />
        </div>

        <div>
          <label htmlFor="password" className="label text-sm sm:text-base">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="input text-base"
            placeholder="Password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-500 focus:ring-primary-400 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="block text-xs sm:text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn btn-primary text-base sm:text-lg py-2.5 sm:py-3 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>

        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-gray-600">
            Don't have an account?
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-1 justify-center items-center">
            <Link
              to="/register"
              className="font-medium text-primary-500 hover:text-primary-600 text-sm sm:text-base"
            >
              Create a farm
            </Link>
            <span className="hidden sm:inline text-xs sm:text-sm text-gray-500">or</span>
            <span className="text-xs sm:text-sm text-gray-600">contact your farm admin</span>
          </div>
        </div>
      </form>

      <div className="mt-6 sm:mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-2 bg-white text-gray-500">Demo accounts</span>
          </div>
        </div>

        <div className="mt-6 space-y-3 sm:space-y-4">
          <div className="text-xs sm:text-sm text-gray-600 text-center break-words">
            <p className="mb-2 sm:mb-3">
              Username: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">demo</span> | Password: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">demo123</span>
            </p>
            <p>
              Username: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">admin</span> | Password: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
