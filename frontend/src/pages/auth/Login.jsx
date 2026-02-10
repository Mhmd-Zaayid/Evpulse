import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { authAPI } from '../../services';
import { isValidEmail } from '../../utils';
import { Button, Input } from '../../components';
import { Battery, Mail, Lock, ArrowRight, Zap, BarChart3, Shield } from 'lucide-react';

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
        const rolePath = {
          user: '/dashboard',
          operator: '/operator',
          admin: '/admin',
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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
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
              Powering Smarter<br />
              <span style={{ color: '#c8ff00' }}>EV Charging</span>
            </h1>
            <p className="text-white/60 text-base max-w-sm leading-relaxed">
              One intelligent platform for EV owners, operators, and administrators.
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

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-[#f8f9fb]">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <Battery className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">EvPulse</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1.5 text-sm">Enter your credentials to access your account</p>
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
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0" />
                <span className="text-gray-500 text-sm group-hover:text-gray-700 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} className="h-11 text-sm font-semibold">
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-gray-500 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
