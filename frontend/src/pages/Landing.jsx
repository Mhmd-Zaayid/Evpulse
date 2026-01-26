import { Link } from 'react-router-dom';
import { ArrowRight, Battery, MapPin, Users, BarChart3, DollarSign, Zap, Activity } from 'lucide-react';

const Landing = ({ manImage, stationImage }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Full Background */}
      <div className="relative min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-gray-900">

        {/* Navigation Header */}
        <nav className="relative z-50 bg-transparent">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <Battery className="w-8 h-8" style={{ color: '#c8ff00' }} />
                <span className="text-2xl font-bold text-white">EvPulse</span>
              </div>

              {/* Navigation Menu */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#home" className="text-white hover:opacity-80 transition-opacity">Home</a>
                <a href="#features" className="text-white hover:opacity-80 transition-opacity">Features</a>
                <a href="#dashboard" className="text-white hover:opacity-80 transition-opacity">Dashboard</a>
                <a href="#contact" className="text-white hover:opacity-80 transition-opacity">Contact</a>
              </div>

              {/* Login & Get Started */}
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-white hover:opacity-80 transition-opacity">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center min-h-screen pt-20 pb-20">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* No left image - removed for more text space */}

              {/* Center Content */}
              <div className="lg:col-span-6 flex flex-col items-start justify-center space-y-8 mx-auto lg:mx-0">
                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-left">
                    <div className="text-white">Charge Smarter</div>
                    <div style={{ color: '#c8ff00' }}>Drive Farther</div>
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl text-left">
                    Monitor, manage, and optimize your EV charging stations with a unified SaaS platform built for efficiency and scale.
                  </p>
                </div>
                <div className="flex justify-start">
                  <button 
                    className="px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center gap-2 justify-center whitespace-nowrap shadow-lg"
                    style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}
                  >
                    Get Started <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Right Side - Charging Station (Wider) */}
              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                <div className="relative flex items-center justify-center w-full h-full">
                  <img 
                    src="https://ekoenergetyka.com/wp-content/uploads/2024/11/c46ebcb54e12c38e69ecab6aa5eb0986335215209f546097ffd7c25681aa9338.png"
                    alt="EV Charging Station"
                    className="object-cover w-[400px] h-[120px] sm:w-[600px] sm:h-[180px] md:w-[800px] md:h-[220px] lg:w-[1000px] lg:h-[260px] xl:w-[1200px] xl:h-[300px] 2xl:w-[1400px] 2xl:h-[340px] rounded-3xl drop-shadow-2xl bg-white/10 border border-white/20 transition-all duration-300"
                    style={{ aspectRatio: '1232/512' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl font-bold">
              <span className="text-gray-900">Smarter Charging</span>
              <br />
              <span style={{ color: '#c8ff00' }}>Seamless</span>
              <span className="text-gray-900"> Experience</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to monitor, manage, and optimize your EV charging from one intuitive dashboard.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Smart Load Balancing */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="mb-6">
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl">
                  <svg className="w-full h-full p-4" viewBox="0 0 400 200">
                    {/* CPMS Center Node */}
                    <rect x="150" y="75" width="100" height="50" rx="10" fill="#10b981" />
                    <text x="200" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">CPMS</text>
                    
                    {/* EVSE Units */}
                    <rect x="50" y="30" width="60" height="30" rx="8" fill="#c8ff00" stroke="#10b981" strokeWidth="2" />
                    <text x="80" y="50" textAnchor="middle" fill="#0d3d2f" fontSize="12" fontWeight="bold">EVSE</text>
                    
                    <rect x="50" y="85" width="60" height="30" rx="8" fill="#c8ff00" stroke="#10b981" strokeWidth="2" />
                    <text x="80" y="105" textAnchor="middle" fill="#0d3d2f" fontSize="12" fontWeight="bold">EVSE</text>
                    
                    <rect x="50" y="140" width="60" height="30" rx="8" fill="#c8ff00" stroke="#10b981" strokeWidth="2" />
                    <text x="80" y="160" textAnchor="middle" fill="#0d3d2f" fontSize="12" fontWeight="bold">EVSE</text>
                    
                    <rect x="290" y="85" width="60" height="30" rx="8" fill="#c8ff00" stroke="#10b981" strokeWidth="2" />
                    <text x="320" y="105" textAnchor="middle" fill="#0d3d2f" fontSize="12" fontWeight="bold">EVSE</text>

                    {/* Connection Lines */}
                    <path d="M 110 45 L 150 90" stroke="#10b981" strokeWidth="3" fill="none" />
                    <path d="M 110 100 L 150 100" stroke="#10b981" strokeWidth="3" fill="none" />
                    <path d="M 110 155 L 150 110" stroke="#10b981" strokeWidth="3" fill="none" />
                    <path d="M 250 100 L 290 100" stroke="#10b981" strokeWidth="3" fill="none" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Load Balancing</h3>
              <p className="text-gray-600 leading-relaxed">
                Manages power across all charging points to prevent grid overloads and lower peak-time energy costs efficiently.
              </p>
            </div>

            {/* Centralized Billing */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="mb-6">
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl relative">
                  <div className="relative w-full h-full p-8">
                    {/* Central Circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center z-10 border-4 border-green-500">
                      <div className="text-center">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-1" />
                        <div className="text-xs font-bold text-gray-800">Centralized EV</div>
                        <div className="text-xs font-bold text-gray-800">Billing System</div>
                      </div>
                    </div>

                    {/* Surrounding Elements */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                      <div className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                        Install Platforms
                      </div>
                    </div>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                        LM Platforms
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-1/4">
                      <div className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                        Energy Partners
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-1/4">
                      <div className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                        Payment Partner
                      </div>
                    </div>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <div className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                        Future Eco
                      </div>
                    </div>

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="50%" y1="15%" x2="50%" y2="35%" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="85%" y1="50%" x2="65%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="70%" y1="85%" x2="58%" y2="68%" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="30%" y1="85%" x2="42%" y2="68%" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="15%" y1="50%" x2="35%" y2="50%" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Centralized Billing</h3>
              <p className="text-gray-600 leading-relaxed">
                Offers flexible tariffs and automated invoices, making payment management simple for both operators and users.
              </p>
            </div>

            {/* Energy Diagnostics */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="mb-6">
                <div className="h-48 flex flex-col justify-center bg-gray-50 rounded-xl p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Charging station status</h4>
                  </div>
                  <svg viewBox="0 0 400 120" className="w-full h-24">
                    {/* Grid lines */}
                    <line x1="40" y1="100" x2="360" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="40" y1="75" x2="360" y2="75" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="40" y1="50" x2="360" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="40" y1="25" x2="360" y2="25" stroke="#e5e7eb" strokeWidth="1" />

                    {/* Area gradient */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#c8ff00" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#c8ff00" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>

                    {/* Area path */}
                    <path
                      d="M 40 90 L 80 80 L 120 70 L 160 65 L 200 55 L 240 45 L 280 35 L 320 25 L 360 20 L 360 100 L 40 100 Z"
                      fill="url(#areaGradient)"
                    />

                    {/* Line */}
                    <path
                      d="M 40 90 L 80 80 L 120 70 L 160 65 L 200 55 L 240 45 L 280 35 L 320 25 L 360 20"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                  </svg>
                  
                  {/* Legend */}
                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-600">80% Positive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-gray-600">20% Negative</span>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Energy Diagnostics</h3>
              <p className="text-gray-600 leading-relaxed">
                Track real-time energy consumption and optimize charging schedules for maximum efficiency and cost savings.
              </p>
            </div>

            {/* Platform Integration */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="mb-6">
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl p-8">
                  <div className="relative w-full h-full">
                    {/* Map Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 rounded-lg"></div>
                    
                    {/* Platform Labels */}
                    <div className="relative h-full flex flex-col justify-between py-4">
                      <div className="flex justify-between items-start">
                        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Install Platforms
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg"></div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                          <BarChart3 className="w-4 h-4 inline mr-1" />
                          LM Platforms
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg"></div>
                        <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c8ff00', color: '#0d3d2f' }}>
                          <Activity className="w-4 h-4 inline mr-1" />
                          Energy Partners
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional pin markers */}
                    <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-green-500 shadow-lg"></div>
                    <div className="absolute top-2/3 right-1/3 w-2 h-2 rounded-full bg-green-500 shadow-lg"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Platform Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Seamlessly connect with multiple platforms and partners for comprehensive EV charging ecosystem management.
              </p>
            </div>

          </div>
        </div>
      </section>
      {/* Footer Section */}
      <footer className="bg-green-950 text-white py-10 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Battery className="w-6 h-6" style={{ color: '#c8ff00' }} />
            <span className="text-xl font-bold">EvPulse</span>
          </div>
          <div className="text-green-200 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} EvPulse. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="#features" className="hover:text-green-400 transition-colors">Features</a>
            <a href="#dashboard" className="hover:text-green-400 transition-colors">Dashboard</a>
            <a href="#contact" className="hover:text-green-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function LandingWrapper() {
  return <Landing manImage="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeMb8PTnzvk5k1NXwWxfazwm4d9A_6mzYODg&s" />;
}