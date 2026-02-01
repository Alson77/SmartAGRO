import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Users } from 'lucide-react';
import FarmerDetailsModal from '../../components/FarmerDetailsModal';

interface Farmer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  farmerType: string;
  farmSize: string;
  createdAt: Date;
  lastLogin: Date;
  profilePic?: string;
}

const FarmersList: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  // Persist UI state in localStorage
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('admin_farmers_searchTerm') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseURL = "http://localhost:5000"; // Replace with your server URL

  // Persist searchTerm in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin_farmers_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        setIsLoading(true);
  const token = localStorage.getItem('krishisathi_admin_token');
        const response = await fetch('/api/admin/farmers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch farmers');
        const data = await response.json();
        setFarmers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFarmers();
  }, []);

  // Polling for real-time farmers list
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchFarmers = async () => {
      setIsLoading(true);
      setError(null);
      try {
  const token = localStorage.getItem('krishisathi_admin_token');
        const response = await fetch('/api/admin/farmers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch farmers');
        const data = await response.json();
        setFarmers(data);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch farmers');
        setIsLoading(false);
      }
    };
    fetchFarmers();
    interval = setInterval(fetchFarmers, 10000);
    return () => { if (interval) clearInterval(interval); };
  }, []);
  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.includes(searchTerm)
  );

  const handleViewClick = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedFarmer(null);
    setIsModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registered Farmers</h1>
          <p className="text-gray-600">Manage and view farmers on Krishi Sathi</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Total Farmers</p>
              <p className="text-2xl font-semibold text-gray-900">{farmers.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Farmers Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading farmers...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : filteredFarmers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No farmers found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFarmers.map(farmer => (
              <div key={farmer._id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                <img
                  src={farmer.profilePic ? `${baseURL}${farmer.profilePic}` : `${baseURL}/default-avatar.png`}
                  alt={farmer.name}
                  className="w-20 h-20 rounded-full object-cover mb-3"
                />
                <h2 className="font-semibold text-lg">{farmer.name}</h2>
                <p className="text-gray-500 text-sm">{farmer.farmerType} Farmer</p>
                <p className="text-gray-500 text-sm">{farmer.farmSize}</p>
                <p className="text-gray-500 text-sm">{farmer.location}</p>
                <p className="text-gray-500 text-sm">{farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString() : 'N/A'}</p>
                <button
                  onClick={() => handleViewClick(farmer)}
                  className="mt-3 w-full bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedFarmer && (
          <FarmerDetailsModal
            farmer={{
              name: selectedFarmer.name,
              profilePic: selectedFarmer.profilePic || '/default-avatar.png',
              gender: (selectedFarmer as any).gender || 'N/A',
              dob: (selectedFarmer as any).dob || 'N/A',
              email: selectedFarmer.email,
              phone: selectedFarmer.phone,
              location: selectedFarmer.location,
              farmerType: selectedFarmer.farmerType,
              farmSize: selectedFarmer.farmSize,
              registrationDate: selectedFarmer.createdAt ? new Date(selectedFarmer.createdAt).toLocaleDateString() : 'N/A',
              lastLogin: selectedFarmer.lastLogin ? new Date(selectedFarmer.lastLogin).toLocaleString() : 'N/A',
              termsAgreed: (selectedFarmer as any).termsAgreed || false,
              subsidyApplications: (selectedFarmer as any).subsidyApplications || 0,
              issuesReported: (selectedFarmer as any).issuesReported || 0,
            }}
            isOpen={isModalOpen}
            onClose={closeModal}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default FarmersList;