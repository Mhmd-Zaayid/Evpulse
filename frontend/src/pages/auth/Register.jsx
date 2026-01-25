import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { authAPI } from '../../services';
import { isValidEmail, isValidPassword, isValidPhone } from '../../utils';
import { Button, Input, Select } from '../../components';
import { Zap, Mail, Lock, User, Phone, Building2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    company: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const roleOptions = [
    { value: 'user', label: 'EV User - Charge your vehicle' },
    { value: 'operator', label: 'Station Operator - Manage charging stations' },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.role === 'operator' && !formData.company.trim()) {
      newErrors.company = 'Company name is required for operators';
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
      const { confirmPassword, ...userData } = formData;
      const response = await authAPI.register(userData);
      
      if (response.success) {
        login(response.user);
        const rolePath = {
          user: '/user/dashboard',
          operator: '/operator/dashboard',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30 mb-4">
            <Zap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">
            EV<span className="text-primary-500">Pulse</span>
          </h1>
          <p className="text-secondary-500 mt-2">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Sign Up</h2>
          
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              icon={User}
            />

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
              label="Phone Number"
              name="phone"
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              icon={Phone}
            />

            <Select
              label="Account Type"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
            />

            {formData.role === 'operator' && (
              <Input
                label="Company Name"
                name="company"
                placeholder="Enter your company name"
                value={formData.company}
                onChange={handleChange}
                error={errors.company}
                icon={Building2}
              />
            )}

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={Lock}
            />

            <div className="flex items-start gap-2">
              <input 
                type="checkbox" 
                required
                className="w-4 h-4 mt-0.5 rounded border-secondary-300 text-primary-500 focus:ring-primary-500" 
              />
              <span className="text-sm text-secondary-600">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
              </span>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-secondary-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
