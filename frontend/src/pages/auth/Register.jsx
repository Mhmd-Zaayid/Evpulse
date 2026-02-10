import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { authAPI } from '../../services';
import { isValidEmail, isValidPassword, isValidPhone } from '../../utils';
import { Button, Input } from '../../components';
import { Battery, Mail, Lock, User, Phone, Building2, ArrowRight, Zap, BarChart3, Shield } from 'lucide-react';

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms';
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
          user: '/dashboard',
          operator: '/operator',
        };
        navigate(rolePath[response.user.role] || '/dashboard');
      } else {
        setApiError(response.error);
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { level: 0, text: '', color: '' };
    if (password.length < 6) return { level: 1, text: 'Weak', color: 'bg-red-500' };
    if (password.length < 8) return { level: 2, text: 'Fair', color: 'bg-yellow-500' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { level: 4, text: 'Strong', color: 'bg-green-500' };
    }
    return { level: 3, text: 'Good', color: 'bg-primary-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (same as Login) */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-green-900 via-emerald-800 to-gray-900 p-10 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-green-600/15 rounded-full blur-3xl pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <Battery className="w-8 h-8" style={{ color: '#c8ff00' }} />
            <span className="text-2xl font-bold text-white">EvPulse</span>
          </Link>
        </div>
        
        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Start Your Electric<br />
              <span style={{ color: '#c8ff00' }}>Journey Today</span>
            </h1>
            <p className="text-white/60 text-base max-w-sm leading-relaxed">
              Create an account and unlock smart EV charging for owners and operators.
            </p>
          </div>
          
          <div className="space-y-3">
            {[
              { icon: Zap, title: 'Smart Charging', desc: 'AI-powered recommendations for optimal charging' },
              { icon: BarChart3, title: 'Real-time Analytics', desc: 'Monitor performance and usage insights' },
              { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security for all transactions' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(200,255,0,0.15)' }}>
                  <feature.icon className="w-4.5 h-4.5" style={{ color: '#c8ff00' }} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{feature.title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} EvPulse. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-[#f8f9fb] overflow-y-auto">
        <div className="w-full max-w-[460px] py-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <Battery className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">EvPulse</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-1.5 text-sm">Join thousands of EV owners and operators</p>
          </div>
          
          {apiError && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs">!</span>
              </div>
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: 'user' } })}
                  className={`p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                    formData.role === 'user'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                    formData.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <p className={`font-semibold text-sm ${formData.role === 'user' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    EV Owner
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Find & book stations</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: 'operator' } })}
                  className={`p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                    formData.role === 'operator'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                    formData.role === 'operator' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <p className={`font-semibold text-sm ${formData.role === 'operator' ? 'text-emerald-700' : 'text-gray-900'}`}>
                    Operator
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Manage stations</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                icon={User}
              />
              <Input
                label="Phone Number"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                icon={Phone}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
            />

            {formData.role === 'operator' && (
              <Input
                label="Company Name"
                name="company"
                placeholder="Your company name"
                value={formData.company}
                onChange={handleChange}
                error={errors.company}
                icon={Building2}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={Lock}
                />
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      passwordStrength.level <= 1 ? 'text-red-500' :
                      passwordStrength.level === 2 ? 'text-yellow-600' :
                      passwordStrength.level === 3 ? 'text-emerald-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.text}
                    </p>
                  </div>
                )}
              </div>
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={Lock}
              />
            </div>

            <div className="flex items-start gap-2.5">
              <input 
                type="checkbox" 
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                }}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer" 
              />
              <label htmlFor="terms" className="text-sm text-gray-500 cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">Terms</Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-sm -mt-2 ml-1">{errors.terms}</p>
            )}

            <Button type="submit" fullWidth loading={loading} className="h-11 text-sm font-semibold">
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-gray-500 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
