import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Menu, 
  X, 
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { IndianRupee } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const NepaliRupeeIcon = () => (
    <span className="flex items-center justify-center mr-1 h-5 w-5 font-bold text-lg">रु</span>
  );

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Farmers List', href: '/admin/farmers', icon: Users },
    { name: 'Subsidy Management', href: '/admin/subsidies', icon: NepaliRupeeIcon },
    { name: 'Crop Issues', href: '/admin/crop-issues', icon: AlertTriangle },
    { name: 'Market Prices', href: '/admin/market-prices', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
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
      <>
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-4 bg-blue-600">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-white" />
              <span className="ml-2 text-lg font-semibold text-white">Admin Panel</span>
            </div>
            <button
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 py-6">
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>
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
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                    <span className="mr-3 flex items-center h-5 w-5">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="align-middle">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 px-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-md transition-all"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
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
                <Shield className="h-6 w-6 text-blue-600" />
                <span className="ml-2 text-lg font-semibold text-gray-900">Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </>
    </div>
  );
};

export default AdminLayout;