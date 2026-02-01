
import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, User, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface FarmerDetailsModalProps {
  farmer: {
    name: string;
    profilePic: string;
    gender: string;
    dob: string;
    email: string;
    phone: string;
    location: string;
    farmerType: string;
    farmSize: string;
    registrationDate: string;
    lastLogin: string;
    termsAgreed: boolean;
    subsidyApplications: number;
    issuesReported: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

const FarmerDetailsModal: React.FC<FarmerDetailsModalProps> = ({ farmer, isOpen, onClose }) => {
  if (!isOpen) return null;

  const baseURL = "http://localhost:5000";
  const profilePicURL = `${baseURL}${farmer.profilePic}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header with gradient background */}
  <div className="relative bg-gradient-to-br from-blue-400 via-sky-400 to-indigo-400 px-8 pt-8 pb-24">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:rotate-90"
          >
            <X size={20} />
          </button>
          {/* Profile Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={profilePicURL}
                alt="Farmer Profile"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/150";
                }}
                className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
              />
              <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-3 border-white ${
                farmer.termsAgreed ? 'bg-blue-400' : 'bg-gray-400'
              }`} />
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">{farmer.name || 'N/A'}</h2>
            {/* Farm type removed from top header as requested */}
          </div>
        </div>
        {/* Stats Cards - Overlapping header */}
        <div className="relative -mt-16 px-8 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-blue-400 text-2xl font-bold">{farmer.subsidyApplications || 0}</div>
              <div className="text-gray-600 text-xs mt-1">Applications</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-sky-400 text-2xl font-bold">{farmer.issuesReported || 0}</div>
              <div className="text-gray-600 text-xs mt-1">Issues</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="text-indigo-400 text-2xl font-bold">{farmer.farmSize || 'N/A'}</div>
              <div className="text-gray-600 text-xs mt-1">Farm Size</div>
            </div>
          </div>
        </div>
        {/* Scrollable Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-96">
          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{farmer.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone size={18} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{farmer.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="p-2 bg-red-100 rounded-lg">
                  <MapPin size={18} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">{farmer.location || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-600 font-medium mb-1">Gender</p>
                <p className="text-sm font-semibold text-gray-900">{farmer.gender || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-600 font-medium mb-1">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-900">{farmer.dob || 'N/A'}</p>
              </div>
            </div>
          </div>
          {/* Farm Type Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Farm Type</h3>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-lg">
              {farmer.farmerType === 'both' ? 'Both' : (farmer.farmerType || 'N/A')}
            </div>
          </div>
          {/* Account Activity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Account Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Registration Date</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{farmer.registrationDate || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Last Login</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{farmer.lastLogin || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  {farmer.termsAgreed ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-600" />
                  )}
                  <span className="text-sm text-gray-700">Terms & Conditions</span>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  farmer.termsAgreed 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {farmer.termsAgreed ? 'Agreed' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FarmerDetailsModal;