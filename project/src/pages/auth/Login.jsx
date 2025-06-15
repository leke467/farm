import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { users } from '../../data/mockData';
import apiService from '../../services/api';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
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
    setError('');

    // Demo login (mock data)
    const demoUser = users.find(
      (u) => u.username === formData.username && u.password === formData.password
    );
    if (demoUser) {
      const { password, ...userData } = demoUser;
      handleLogin(userData);
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    // Real backend login
    try {
      const response = await apiService.login({
        username: formData.username,
        password: formData.password,
      });
      if (response.token) {
        handleLogin({
          username: formData.username,
          token: response.token,
          ...response.user // include user info if available
        });
        setLoading(false);
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    } catch (err) {
      setError('Invalid username or password');
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in to your account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-error-50 text-error-600 rounded-lg border border-error-200">
          {error}
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
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
            placeholder="Username"
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
            value={formData.password}
            onChange={handleChange}
            className="input"
            placeholder="Password"
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
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn btn-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-500 hover:text-primary-600">
              Sign up
            </Link>
          </p>
        </div>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Demo accounts</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-3">
          <div className="text-sm text-gray-600 text-center">
            <p>Username: <span className="font-mono">demo</span> | Password: <span className="font-mono">demo123</span></p>
            <p>Username: <span className="font-mono">admin</span> | Password: <span className="font-mono">admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;