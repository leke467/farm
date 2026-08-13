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

  const handleQuickDemoLogin = async (demoUsername, demoPassword) => {
    setFormData({ username: demoUsername, password: demoPassword });
    setLoading(true);
    setError("");

    try {
      const response = await apiService.login({
        username: demoUsername,
        password: demoPassword,
      });
      if (response.token) {
        const mustChangePassword = Boolean(
          response.user?.must_change_password ?? response.user?.mustChangePassword
        );
        handleLogin({
          username: demoUsername,
          token: response.token,
          ...response.user,
        });
        setLoading(false);
        navigate(mustChangePassword ? "/force-password-change" : "/dashboard");
        return;
      }
    } catch (err) {
      // Fallback to mock demo user if offline
    }

    const demoUser = users.find(
      (u) => u.username === demoUsername || u.password === demoPassword
    );
    if (demoUser) {
      const { password, ...userData } = demoUser;
      userData.isDemo = true;
      handleLogin(userData);
      setLoading(false);
      navigate("/dashboard");
    } else {
      setError("Demo login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        Sign in to your account
      </h2>

      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 text-red-700 text-xs sm:text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label
            htmlFor="username"
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
          >
            Username or Email
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
            className="input text-sm sm:text-base py-2 sm:py-2.5"
            placeholder="Enter your username or email address"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs sm:text-sm text-primary-500 hover:text-primary-600"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="input text-sm sm:text-base py-2 sm:py-2.5"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-500 focus:ring-primary-400 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-xs sm:text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn btn-primary text-base sm:text-lg py-2.5 sm:py-3 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin("demo1234", "password1234")}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 sm:py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>⚡ 1-Click Demo Account Login</span>
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
            <span className="px-2 bg-white text-gray-500">Quick Demo Credentials (Click to Autofill & Login)</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-center">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("demo1234", "password1234")}
            className="w-full text-xs sm:text-sm text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 p-2.5 rounded-xl transition-all flex items-center justify-between"
          >
            <span>Demo User: <strong className="font-mono text-emerald-800">demo1234</strong></span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Auto Login →</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin("admin", "admin123")}
            className="w-full text-xs sm:text-sm text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 p-2.5 rounded-xl transition-all flex items-center justify-between"
          >
            <span>Admin User: <strong className="font-mono text-emerald-800">admin</strong></span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Auto Login →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
