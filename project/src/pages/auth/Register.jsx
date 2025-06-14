import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'Manager',
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulate API call delay
    setTimeout(() => {
      // Simulate successful registration
      const newUser = {
        id: Date.now().toString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        lastLogin: new Date().toISOString(),
      };
      
      // Login the new user
      handleLogin(newUser);
      navigate('/dashboard');
      
      setLoading(false);
    }, 1000);
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>
      
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
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Worker">Worker</option>
          </select>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn btn-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Register;