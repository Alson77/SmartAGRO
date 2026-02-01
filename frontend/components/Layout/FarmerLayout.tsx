import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Camera, 
  MessageCircle, 
  AlertTriangle, 
  TrendingUp, 
  Menu, 
  X, 
  LogOut,
  Leaf,
  User
} from 'lucide-react';

// Nepali Rupee Sign as a styled span
const RupeeSign = ({ className = '' }) => (
  <span className={`font-bold text-gray-700 ${className}`} style={{ fontFamily: 'inherit', fontSize: '1.2rem', lineHeight: 1 }}>रु</span>
);
import { useAuth } from '../../contexts/AuthContext';

interface FarmerLayoutProps {
  children: React.ReactNode;
}

const FarmerLayout: React.FC<FarmerLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Crop Disease Detection', href: '/crop-disease', icon: Camera },
    { name: 'Chatbot', href: '/chatbot', icon: MessageCircle },
    { name: 'Subsidy Application', href: '/subsidy', icon: RupeeSign },
    { name: 'Crop Issues', href: '/crop-issues', icon: AlertTriangle },
    { name: 'Market Prices', href: '/market-prices', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-green-600">
          <div className="flex items-center">
            <Leaf className="h-8 w-8 text-white" />
            <span className="ml-2 text-lg font-semibold text-white">Krishi Sathi</span>
          </div>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-8">
          <nav className="px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

          <div className="mt-8 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold shadow-md hover:from-green-600 hover:to-green-800 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
          </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <Leaf className="h-6 w-6 text-green-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Krishi Sathi</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default FarmerLayout;