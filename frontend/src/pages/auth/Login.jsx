import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { authAPI } from '../../services';
import { isValidEmail } from '../../utils';
import { Button, Input } from '../../components';
import { Zap, Mail, Lock } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        login(response.user);
        // Navigate based on role
        const rolePath = {
          user: '/user/dashboard',
          operator: '/operator/dashboard',
          admin: '/admin/dashboard',
        };
        navigate(rolePath[response.user.role] || '/user/dashboard');
      } else {
        setApiError(response.error);
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials helper
  const demoCredentials = [
    { role: 'User', email: 'user@evpulse.com', password: 'user123' },
    { role: 'Operator', email: 'operator@evpulse.com', password: 'operator123' },
    { role: 'Admin', email: 'admin@evpulse.com', password: 'admin123' },
  ];

  const fillDemoCredentials = (email, password) => {
    setFormData({ email, password });
    setErrors({});
    setApiError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 mb-4">
            <Zap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">
            EV<span className="text-primary-500">Pulse</span>
          </h1>
          <p className="text-secondary-500 mt-2">Smart EV Charging Management</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Welcome back</h2>
          
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-500" />
                <span className="text-secondary-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-secondary-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-white/80 backdrop-blur rounded-xl border border-secondary-200">
          <p className="text-sm font-medium text-secondary-700 mb-3">Demo Credentials:</p>
          <div className="space-y-2">
            {demoCredentials.map((cred) => (
              <button
                key={cred.role}
                onClick={() => fillDemoCredentials(cred.email, cred.password)}
                className="w-full text-left px-3 py-2 bg-secondary-50 hover:bg-secondary-100 rounded-lg text-sm transition-colors"
              >
                <span className="font-medium text-secondary-900">{cred.role}:</span>{' '}
                <span className="text-secondary-600">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
