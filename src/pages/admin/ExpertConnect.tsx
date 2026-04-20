import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import FarmerLayout from '../../components/Layout/FarmerLayout';
import { Phone, Mail, MessageCircle, Search, RefreshCw, Star, Clock, Award, Filter, Plus, Edit, Trash2, X, CreditCard, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PaymentService from '../../services/PaymentService';

interface Expert {
  _id: string;
  name: string;
  role: string;
  crops: string[];
  specialization: string[];
  phone: string;
  whatsapp: string;
  email: string;
  isOnline: boolean;
  district: string;
  bio: string;
  experience: number;
  rating: number;
  totalReviews: number;
  languages: string[];
  certifications: string[];
  consultationFee: number;
  responseTime: number;
  totalConsultations: number;
  isActive?: boolean;
  stats?: {
    totalConsultations: number;
    avgResponseTime: number | null;
    isAvailable: boolean;
  };
}

const ExpertConnect: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalExpert, setModalExpert] = useState<Expert | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [filterCrop, setFilterCrop] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [bookingExpert, setBookingExpert] = useState<Expert | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookedExperts, setBookedExperts] = useState<Set<string>>(new Set()); // Track which experts user has booked
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'bank_transfer'>('esewa');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bankList, setBankList] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'responseTime'>('rating');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    crops: '',
    phone: '',
    email: '',
    whatsapp: '',
    district: '',
    bio: '',
    experience: 0,
    consultationFee: 0
  });

  const token = sessionStorage.getItem('smartagro_admin_token') || localStorage.getItem('token') || localStorage.getItem('smartagro_token');

  // Load supported banks on component mount
  useEffect(() => {
    setBankList(PaymentService.getSupportedBanks());
  }, []);

  // ── fetch experts ──────────────────────────────
  const fetchExperts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCrop) params.append('crop', filterCrop);
      if (filterDistrict) params.append('district', filterDistrict);
      if (showOnlineOnly) params.append('onlineOnly', 'true');

      const queryString = params.toString();
      const url = `/api/experts${queryString ? `?${queryString}` : ''}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { _t: Date.now() } // Cache busting
      });

      let expertsData = res.data.experts || res.data || [];

      console.log('Raw response:', res.data);
      console.log('Fetched experts count:', expertsData.length);
      console.log('First expert phone:', expertsData[0]?.phone);

      // Sort experts based on sortBy
      expertsData.sort((a: Expert, b: Expert) => {
        switch (sortBy) {
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'experience':
            return (b.experience || 0) - (a.experience || 0);
          case 'responseTime':
            return (a.responseTime || 24) - (b.responseTime || 24);
          default:
            return 0;
        }
      });

      setExperts([...expertsData]); // Force re-render with new array reference
    } catch (err: any) {
      console.error('Expert fetch error:', err);
      setError('Failed to load experts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Add new expert ────────────────────────────
  const handleAddExpert = async () => {
    if (!formData.name || !formData.role || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const newExpertData = {
        ...formData,
        experience: parseInt(formData.experience.toString()),
        consultationFee: parseInt(formData.consultationFee.toString()),
        crops: formData.crops.split(',').map(c => c.trim()).filter(c => c),
        isActive: true
      };
      const res = await axios.post('/api/experts', newExpertData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExperts([...experts, res.data.expert]);
      setFormData({ name: '', role: '', crops: '', phone: '', email: '', whatsapp: '', district: '', bio: '', experience: 0, consultationFee: 0 });
      setShowAddForm(false);
      alert('Expert added successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add expert');
    }
  };

  // ── Update expert ────────────────────────────
  const handleUpdateExpert = async () => {
    if (!editingExpert) return;
    
    // Validation
    if (!formData.name || !formData.role || !formData.email || !formData.phone) {
      alert('Please fill in all required fields (Name, Role, Email, Phone Number)');
      return;
    }
    
    console.log('=== UPDATE EXPERT DEBUG ===');
    console.log('Original expert phone:', editingExpert.phone);
    console.log('Form data phone:', formData.phone);
    console.log('Phone changed:', editingExpert.phone !== formData.phone);
    console.log('Current formData:', formData);
    console.log('Editing expert:', editingExpert);
    
    try {
      const updateData = {
        ...formData,
        experience: parseInt(formData.experience.toString()),
        consultationFee: parseInt(formData.consultationFee.toString()),
        crops: formData.crops.split(',').map(c => c.trim()).filter(c => c)
      };
      
      console.log('Final updateData being sent:', updateData);
      console.log('Phone in updateData:', updateData.phone);
      console.log('Token being used:', token ? 'Present' : 'Missing');
      
      const res = await axios.put(`/api/experts/${editingExpert._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Backend response:', res.data);
      console.log('Updated expert phone from response:', res.data.expert?.phone);
      
      // Update the local state immediately with the response
      if (res.data.expert) {
        console.log('Updating local state with:', res.data.expert);
        console.log('New phone number in state:', res.data.expert.phone);
        setExperts(prevExperts => 
          prevExperts.map(e => {
            if (e._id === editingExpert._id) {
              console.log('Replacing expert:', e.phone, 'with:', res.data.expert.phone);
              return res.data.expert;
            }
            return e;
          })
        );
      }
      
      // Clear form and editing state
      setEditingExpert(null);
      setFormData({ name: '', role: '', crops: '', phone: '', email: '', whatsapp: '', district: '', bio: '', experience: 0, consultationFee: 0 });
      
      // Also fetch fresh data as backup
      setTimeout(async () => {
        console.log('Fetching fresh data...');
        await fetchExperts();
      }, 1000);
      
      alert('Expert updated successfully!');
    } catch (err: any) {
      console.error('Update error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to update expert');
    }
  };

  // ── Delete expert ────────────────────────────
  const handleDeleteExpert = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expert?')) return;
    try {
      await axios.delete(`/api/experts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExperts(experts.filter(e => e._id !== id));
      alert('Expert deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete expert');
    }
  };

  // ── Start editing ────────────────────────────
  const startEdit = (expert: Expert) => {
    setEditingExpert(expert);
    setFormData({
      name: expert.name,
      role: expert.role,
      crops: expert.crops.join(', '),
      phone: expert.phone,
      email: expert.email,
      whatsapp: expert.whatsapp || '',
      district: expert.district,
      bio: expert.bio,
      experience: expert.experience,
      consultationFee: expert.consultationFee
    });
  };

  useEffect(() => {
    fetchExperts();
  }, [search, filterCrop, filterDistrict, showOnlineOnly, sortBy]);

  // ── search on enter ────────────────────────────
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchExperts();
  };

  // ── send message ───────────────────────────────
  const handleSend = async () => {
    if (!message.trim() || !modalExpert) return;
    setSending(true);
    try {
      await axios.post(
        '/api/experts/message',
        { expertId: modalExpert._id, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSent(true);
      setTimeout(() => {
        setModalExpert(null);
        setMessage('');
        setSent(false);
      }, 1500);
    } catch (err) {
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── handle payment and booking ──────────────────
  const handleProcessPayment = async () => {
    if (!bookingExpert) return;
    if (paymentMethod === 'bank_transfer' && !selectedBank) {
      alert('Please select a bank for transfer');
      return;
    }

    setProcessingPayment(true);

    try {
      const transactionId = PaymentService.generateTransactionId();
      const amount = bookingExpert.consultationFee || 100;
      const bookingData = {
        expertId: bookingExpert._id,
        farmerId: user?.id || 'farmer_' + Date.now(),
        farmerName: user?.name || 'Anonymous Farmer',
        farmerEmail: user?.email || 'farmer@smartagro.local',
        expertName: bookingExpert.name,
        expertise: bookingExpert.role,
        consultationFee: amount,
        scheduledDate: new Date(),
        scheduledTime: new Date().toLocaleTimeString(),
        topic: 'Expert Consultation',
        description: 'Booking through SmartAGRO Expert Connect',
        paymentMethod: paymentMethod,
        selectedBank: paymentMethod === 'bank_transfer' ? selectedBank : null,
        amount: amount,
        paymentTransactionId: transactionId
      };

      // Initiate payment based on method
      let paymentResult;
      if (paymentMethod === 'esewa') {
        paymentResult = PaymentService.initiateEsewaPayment(amount, transactionId, bookingData);
      } else {
        paymentResult = PaymentService.initiateBankTransfer(amount, selectedBank, bookingData);
      }

      if (!paymentResult.success) {
        alert('Payment initiation failed: ' + (paymentResult.error || 'Unknown error'));
        setProcessingPayment(false);
        return;
      }

      // Process the payment and create booking
      const response = await PaymentService.processPayment(bookingData, paymentMethod, amount, transactionId);

      if (response.success) {
        alert(`Payment of Rs. ${amount} processed successfully! Booking confirmed for ${bookingExpert.name}.`);
        setBookedExperts(prev => new Set([...prev, bookingExpert._id]));
        setShowBookingModal(false);
        setBookingExpert(null);
        setPaymentMethod('esewa');
        setSelectedBank('');
      } else {
        alert('Booking creation failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessingPayment(false);
    }
  };

  // ── avatar initials ────────────────────────────
  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const avatarColors = [
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-amber-100', text: 'text-amber-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
  ];

  const getColor = (index: number) => avatarColors[index % avatarColors.length];

  return (
    <>
      {isAdmin ? (
        <AdminLayout>
          <div className="space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expert Connect</h1>
            <p className="text-gray-600">
              Connect directly with agriculture & crop experts
            </p>
          </div>
          {isAdmin && (
          <div className="mt-3 md:mt-0 flex items-center gap-2">
            <button
              onClick={() => { setShowAddForm(!showAddForm); setEditingExpert(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Expert
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
              {experts.filter((e) => e.isOnline).length} experts online
            </span>
            <button
              onClick={fetchExperts}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          )}
        </div>

        {/* ── Add/Edit Form ── */}
        {isAdmin && (showAddForm || editingExpert) && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editingExpert ? 'Edit Expert' : 'Add New Expert'}</h2>
              <button onClick={() => { setShowAddForm(false); setEditingExpert(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" placeholder="Enter expert name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <input type="text" placeholder="e.g., Agronomist, Soil Scientist" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" placeholder="expert@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" placeholder="+977-9801234567" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input type="tel" placeholder="+977-9801234567" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input type="text" placeholder="e.g., Kathmandu, Pokhara" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input type="number" placeholder="5" value={formData.experience} onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (NPR)</label>
                <input type="number" placeholder="500" value={formData.consultationFee} onChange={(e) => setFormData({...formData, consultationFee: parseInt(e.target.value) || 0})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea placeholder="Brief description of the expert's background and expertise" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Crops (comma-separated)</label>
                <input type="text" placeholder="Rice, Wheat, Maize, Potato" value={formData.crops} onChange={(e) => setFormData({...formData, crops: e.target.value})} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 w-full" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={editingExpert ? handleUpdateExpert : handleAddExpert} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingExpert ? 'Update' : 'Add'}</button>
              <button onClick={() => { setShowAddForm(false); setEditingExpert(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search by name, crop, or specialization... (press Enter)"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Crops</option>
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Corn">Corn</option>
              <option value="Tomato">Tomato</option>
              <option value="Potato">Potato</option>
              <option value="Apple">Apple</option>
              <option value="Grape">Grape</option>
            </select>

            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Districts</option>
              <option value="Kathmandu">Kathmandu</option>
              <option value="Pokhara">Pokhara</option>
              <option value="Itahari">Itahari</option>
              <option value="Dharan">Dharan</option>
              <option value="Urlabari">Urlabari</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Online only
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'experience' | 'responseTime')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="rating">Sort by Rating</option>
              <option value="experience">Sort by Experience</option>
              <option value="responseTime">Sort by Response Time</option>
            </select>
          </div>
        </div>
        {loading && (
          <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
            Loading experts...
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* ── Expert Cards ── */}
        {!loading && !error && (
          <div className="space-y-4">
            {experts.length === 0 && (
              <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
                No experts found.
              </div>
            )}

            {experts.map((expert, index) => {
              const color = getColor(index);
              return (
                <div key={expert._id} className="bg-white rounded-xl shadow-sm border p-5">

                  {/* Top row */}
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${color.bg} ${color.text}`}
                    >
                      {getInitials(expert.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold text-gray-900">
                          {expert.name}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            expert.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        ></span>
                        <span className="text-xs text-gray-500">
                          {expert.isOnline ? 'Online' : 'Offline'}
                        </span>
                        {expert.district && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {expert.district}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{expert.role}</p>
                      {expert.bio && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{expert.bio}</p>
                      )}

                      {/* Rating and Experience */}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {expert.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="font-medium text-gray-700">{expert.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({expert.totalReviews || 0})</span>
                          </div>
                        )}
                        {expert.experience && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-blue-500" />
                            <span className="text-gray-700">{expert.experience} years</span>
                          </div>
                        )}
                        {expert.responseTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-green-500" />
                            <span className="text-gray-700">{expert.responseTime}h response</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {expert.crops.map((crop) => (
                          <span
                            key={crop}
                            className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact info - only show for admins or booked experts */}
                  {isAdmin || bookedExperts.has(expert._id) ? (
                    <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {expert.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {expert.email}
                      </span>
                      {expert.consultationFee && (
                        <span className="flex items-center gap-1">
                          <span className="text-green-600 font-medium">Rs. {expert.consultationFee}</span>
                          <span className="text-gray-400">/consultation</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <span className="text-green-600 font-medium">Rs. {expert.consultationFee || 100}</span>
                        <span className="text-gray-400">/consultation</span>
                      </span>
                      <span className="text-orange-600 text-xs">Book consultation to view contact details</span>
                    </div>
                  )}

                  {/* Contact buttons */}
                  <div className="border-t pt-3 flex flex-wrap gap-2">

                    {/* Message - only for admins or booked experts */}
                    {(isAdmin || bookedExperts.has(expert._id)) && (
                      <button
                        onClick={() => setModalExpert(expert)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-800 text-sm font-medium hover:bg-purple-100 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                    )}

                    {isAdmin && (
                    <>
                    {/* Edit */}
                    <button
                      onClick={() => startEdit(expert)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteExpert(expert._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm font-medium hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    </>
                    )}

                    {/* Book Consultation or Direct Contact */}
                    {isAdmin || bookedExperts.has(expert._id) ? (
                    <>
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${(expert.whatsapp || expert.phone).replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-400 bg-green-50 text-green-800 text-sm font-medium hover:bg-green-100 transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>

                    {/* Call */}
                    <a
                      href={`tel:${expert.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:${expert.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                    </>
                    ) : (
                    /* Book Consultation Button */
                    <button
                      onClick={() => {
                        setBookingExpert(expert);
                        setShowBookingModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-500 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                    >
                      <Clock className="w-4 h-4" />
                      Book Consultation
                    </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
      )}

      {/* ── Message Modal ── */}
      {modalExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-semibold text-sm">
                {getInitials(modalExpert.name)}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Message {modalExpert.name}
                </h2>
                <p className="text-xs text-gray-500">{modalExpert.role}</p>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 font-medium">Message sent successfully!</p>
                <p className="text-xs text-gray-500 mt-1">The expert will contact you soon.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your crop issue or question in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-32 focus:ring-purple-500 focus:border-purple-500"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => { setModalExpert(null); setMessage(''); }}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {sending ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
      ) : (
        <FarmerLayout>
          <div className="space-y-6">
            {/* ── Header ── */}
            <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expert Connect</h1>
                <p className="text-gray-600 mt-1">Connect with agricultural experts for guidance</p>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
                  {experts.filter((e) => e.isOnline).length} experts online
                </span>
                <button
                  onClick={fetchExperts}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* ── Search ── */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search experts by name, role, or crops..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex flex-wrap gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rating' | 'experience' | 'responseTime')}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="experience">Sort by Experience</option>
                  <option value="responseTime">Sort by Response Time</option>
                </select>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Districts</option>
                  <option value="Kathmandu">Kathmandu</option>
                  <option value="Pokhara">Pokhara</option>
                  <option value="Chitwan">Chitwan</option>
                  <option value="Dharan">Dharan</option>
                  <option value="Itahari">Itahari</option>
                  <option value="Urlabari">Urlabari</option>
                </select>
              </div>
            </div>

            {/* ── Experts List ── */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading experts...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {experts.map((expert) => (
                    <div key={expert._id} className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-semibold text-gray-900">
                              {expert.name}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                expert.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            ></span>
                            <span className="text-xs text-gray-500">
                              {expert.isOnline ? 'Online' : 'Offline'}
                            </span>
                            {expert.district && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                {expert.district}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{expert.role}</p>
                          {expert.bio && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{expert.bio}</p>
                          )}

                          {/* Rating and Experience */}
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            {expert.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="font-medium text-gray-700">{expert.rating.toFixed(1)}</span>
                                <span className="text-gray-500">({expert.totalReviews || 0})</span>
                              </div>
                            )}
                            {expert.experience && (
                              <div className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-blue-500" />
                                <span className="text-gray-700">{expert.experience} years</span>
                              </div>
                            )}
                            {expert.responseTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-green-500" />
                                <span className="text-gray-700">{expert.responseTime}h response</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {expert.crops.map((crop) => (
                              <span
                                key={crop}
                                className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100"
                              >
                                {crop}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Contact info - only show for admins or booked experts */}
                      {isAdmin || bookedExperts.has(expert._id) ? (
                        <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {expert.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {expert.email}
                          </span>
                          {expert.consultationFee && (
                            <span className="flex items-center gap-1">
                              <span className="text-green-600 font-medium">Rs. {expert.consultationFee}</span>
                              <span className="text-gray-400">/consultation</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <span className="text-green-600 font-medium">Rs. {expert.consultationFee || 100}</span>
                            <span className="text-gray-400">/consultation</span>
                          </span>
                          <span className="text-orange-600 text-xs">Book consultation to view contact details</span>
                        </div>
                      )}

                      {/* Contact buttons */}
                      <div className="border-t pt-3 flex flex-wrap gap-2">
                        {/* Message - only for admins or booked experts */}
                        {(isAdmin || bookedExperts.has(expert._id)) && (
                          <button
                            onClick={() => setModalExpert(expert)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-800 text-sm font-medium hover:bg-purple-100 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </button>
                        )}

                        {/* Book Consultation or Direct Contact */}
                        {isAdmin || bookedExperts.has(expert._id) ? (
                        <>
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/${(expert.whatsapp || expert.phone).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-400 bg-green-50 text-green-800 text-sm font-medium hover:bg-green-100 transition"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </a>

                        {/* Call */}
                        <a
                          href={`tel:${expert.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>

                        {/* Email */}
                        <a
                          href={`mailto:${expert.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </a>
                        </>
                        ) : (
                        /* Book Consultation Button */
                        <button
                          onClick={() => {
                            setBookingExpert(expert);
                            setShowBookingModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-500 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition"
                        >
                          <Clock className="w-4 h-4" />
                          Book Consultation
                        </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FarmerLayout>
      )}

      {/* ── Message Modal ── */}
      {modalExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-semibold text-sm">
                {getInitials(modalExpert.name)}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Message {modalExpert.name}
                </h2>
                <p className="text-xs text-gray-500">{modalExpert.role}</p>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 font-medium">Message sent successfully!</p>
                <p className="text-xs text-gray-500 mt-1">The expert will contact you soon.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your crop issue or question in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-32 focus:ring-purple-500 focus:border-purple-500"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => { setModalExpert(null); setMessage(''); }}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {sending ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Booking Modal ── */}
      {showBookingModal && bookingExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm">
                {getInitials(bookingExpert.name)}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Book Consultation with {bookingExpert.name}
                </h2>
                <p className="text-xs text-gray-500">{bookingExpert.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Consultation Fee</span>
                  <span className="text-lg font-bold text-green-600">Rs. {bookingExpert.consultationFee || 100}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Pay this fee to get direct access to {bookingExpert.name}'s contact information and schedule a consultation.
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-3">Select Payment Method</h3>
                
                <div className="space-y-2 mb-4">
                  <label className="flex items-center p-3 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition" style={{backgroundColor: paymentMethod === 'esewa' ? '#eff6ff' : 'transparent'}}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="esewa"
                      checked={paymentMethod === 'esewa'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'esewa' | 'bank_transfer')}
                      className="w-4 h-4 text-green-600 cursor-pointer"
                    />
                    <span className="ml-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">eSewa</span>
                    </span>
                  </label>

                  <label className="flex items-center p-3 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition" style={{backgroundColor: paymentMethod === 'bank_transfer' ? '#eff6ff' : 'transparent'}}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'esewa' | 'bank_transfer')}
                      className="w-4 h-4 text-green-600 cursor-pointer"
                    />
                    <span className="ml-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Bank Transfer</span>
                    </span>
                  </label>
                </div>

                {/* Bank Selection */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Select Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Choose a bank --</option>
                      {bankList.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* What You'll Get */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">What you'll get:</h3>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>✓ Direct phone number and WhatsApp</li>
                  <li>✓ Email address for detailed communication</li>
                  <li>✓ Priority response from the expert</li>
                  <li>✓ Personalized agricultural guidance</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingExpert(null);
                    setPaymentMethod('esewa');
                    setSelectedBank('');
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={processingPayment || (paymentMethod === 'bank_transfer' && !selectedBank)}
                  className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? 'Processing...' : paymentMethod === 'esewa' ? 'Pay with eSewa' : 'Confirm Bank Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpertConnect;