import { Link } from 'react-router-dom';
import { ArrowRight, Battery, Zap } from 'lucide-react';

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
              <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-8 mx-auto">
                <div className="space-y-6 text-center">
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                    <div className="text-white">Charge Smarter</div>
                    <div style={{ color: '#c8ff00' }}>Drive Farther</div>
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Powering smarter EV charging with one intelligent platform
                  </p>
                </div>
                <div className="flex justify-center">
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


      {/* Footer Section */}
      <footer className="bg-gradient-to-br from-green-900 via-emerald-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Battery className="w-7 h-7" style={{ color: '#c8ff00' }} />
                <span className="text-xl font-bold">EvPulse</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Powering smarter EV charging with one intelligent platform.
              </p>
            </div>
            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} EvPulse. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function LandingWrapper() {
  return <Landing manImage="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeMb8PTnzvk5k1NXwWxfazwm4d9A_6mzYODg&s" />;
}