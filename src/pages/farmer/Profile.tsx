function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
  const token = localStorage.getItem('smartagro_token');
      const res = await fetch('/api/farmer/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch {
      setError('Network error');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">Change Password</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm text-center">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm text-center">{success}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-green-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                tabIndex={-1}
                onClick={() => setShowCurrent(v => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-300" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-green-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                tabIndex={-1}
                onClick={() => setShowNew(v => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-300" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-green-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                tabIndex={-1}
                onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-300" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-300" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center transition-all duration-200"
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState, ChangeEvent, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import FarmerLayout from '../../components/Layout/FarmerLayout';
import { useAuth } from '../../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [farmerType, setFarmerType] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [farmSizeValue, setFarmSizeValue] = useState('');
  const [farmSizeUnit, setFarmSizeUnit] = useState('Kattha');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Validation states
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    location: '',
    phone: '',
    farmerType: '',
    farmSizeValue: '',
    gender: '',
    dob: ''
  });
  const [touched, setTouched] = useState({
    name: false,
    location: false,
    phone: false,
    farmerType: false,
    farmSizeValue: false,
    gender: false,
    dob: false
  });

  // Fetch profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      const res = await fetch(`/api/farmer/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setLocation(data.location || '');
        setPhone(data.phone || '');
        setFarmerType(data.farmerType || '');
        setFarmSize(data.farmSize || '');
        // Parse farm size for editing
        if (data.farmSize) {
          const match = data.farmSize.match(/^([\d.]+)\s*(.+)?$/);
          if (match) {
            setFarmSizeValue(match[1]);
            setFarmSizeUnit(match[2] || 'Kattha');
          }
        }
        setGender(data.gender || '');
        setDob(data.dob || '');
        // If profilePic is a relative path, prepend backend URL
        if (data.profilePic && data.profilePic.startsWith('/uploads/')) {
          // Always use http://localhost:5000 for uploads
          setProfilePicUrl(`http://localhost:5000${data.profilePic}`);
        } else {
          setProfilePicUrl(data.profilePic || '');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (profilePic) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(profilePic);
    } else {
      setPreview('');
    }
  }, [profilePic]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  // Validation function
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'location':
        if (!value.trim()) return 'Location is required';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^[9][0-9]{9}$/.test(value)) return 'Phone must be 10 digits starting with 9';
        return '';
      case 'farmerType':
        if (!value) return 'Farmer type is required';
        return '';
      case 'farmSizeValue':
        if (!value.trim()) return 'Farm size is required';
        if (parseFloat(value) <= 0) return 'Farm size must be greater than 0';
        return '';
      case 'gender':
        if (!value) return 'Gender is required';
        return '';
      case 'dob':
        if (!value) return 'Date of birth is required';
        const today = new Date();
        const birthDate = new Date(value);
        if (birthDate >= today) return 'Date of birth must be in the past';
        return '';
      default:
        return '';
    }
  };

  // Real-time validation for phone
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (touched.phone) {
      setFieldErrors(prev => ({ ...prev, phone: validateField('phone', value) }));
    }
  };

  const handlePhoneBlur = () => {
    setTouched(prev => ({ ...prev, phone: true }));
    setFieldErrors(prev => ({ ...prev, phone: validateField('phone', phone) }));
  };

  // Real-time validation for farm size value
  const handleFarmSizeValueChange = (value: string) => {
    setFarmSizeValue(value);
    if (touched.farmSizeValue) {
      setFieldErrors(prev => ({ ...prev, farmSizeValue: validateField('farmSizeValue', value) }));
    }
  };

  const handleFarmSizeValueBlur = () => {
    setTouched(prev => ({ ...prev, farmSizeValue: true }));
    setFieldErrors(prev => ({ ...prev, farmSizeValue: validateField('farmSizeValue', farmSizeValue) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      location: true,
      phone: true,
      farmerType: true,
      farmSizeValue: true,
      gender: true,
      dob: true
    });

    // Validate all fields
    const errors = {
      name: validateField('name', name),
      location: validateField('location', location),
      phone: validateField('phone', phone),
      farmerType: validateField('farmerType', farmerType),
      farmSizeValue: validateField('farmSizeValue', farmSizeValue),
      gender: validateField('gender', gender),
      dob: validateField('dob', dob)
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('location', location);
    formData.append('phone', phone);
    formData.append('farmerType', farmerType);
    // Combine farm size value and unit
    const combinedFarmSize = farmSizeValue && farmSizeUnit ? `${farmSizeValue} ${farmSizeUnit}` : '';
    formData.append('farmSize', combinedFarmSize);
    formData.append('gender', gender);
    formData.append('dob', dob);
    if (profilePic) formData.append('profilePic', profilePic);
    const res = await fetch(`/api/farmer/${user?.id}`, {
      method: 'PUT',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      setName(data.name || '');
      setLocation(data.location || '');
      setPhone(data.phone || '');
      setFarmerType(data.farmerType || '');
      setFarmSize(data.farmSize || '');
      // Parse farm size for editing
      if (data.farmSize) {
        const match = data.farmSize.match(/^([\d.]+)\s*(.+)?$/);
        if (match) {
          setFarmSizeValue(match[1]);
          setFarmSizeUnit(match[2] || 'Kattha');
        }
      }
      setGender(data.gender || '');
      setDob(data.dob || '');
      // If profilePic is a relative path, prepend backend URL
      if (data.profilePic && data.profilePic.startsWith('/uploads/')) {
        setProfilePicUrl(`http://localhost:5000${data.profilePic}`);
      } else {
        setProfilePicUrl(data.profilePic || '');
      }
      setProfilePic(null);
      setPreview('');
      setEditMode(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleCancel = () => {
    // Reset form values to original data
    if (user) {
      setName(user.name || '');
      setLocation(user.location || '');
      setPhone(user.phone || '');
      setFarmerType(user.farmerType || '');
      setGender(user.gender || '');
      setDob(user.dob || '');
      
      // Re-parse farm size
      if (user.farmSize) {
        const match = user.farmSize.match(/^([\d.]+)\s*(.+)?$/);
        if (match) {
          setFarmSizeValue(match[1]);
          setFarmSizeUnit(match[2] || 'Kattha');
        }
      } else {
        setFarmSizeValue('');
        setFarmSizeUnit('Kattha');
      }
    }
    
    setEditMode(false);
    setProfilePic(null);
    setPreview('');
    // Reset validation states
    setFieldErrors({
      name: '',
      location: '',
      phone: '',
      farmerType: '',
      farmSizeValue: '',
      gender: '',
      dob: ''
    });
    setTouched({
      name: false,
      location: false,
      phone: false,
      farmerType: false,
      farmSizeValue: false,
      gender: false,
      dob: false
    });
  };

  return (
    <FarmerLayout>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            {!editMode && (
              <div className="flex gap-4">
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded-md font-semibold shadow hover:bg-green-700 transition text-sm"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md font-semibold shadow transition flex items-center text-sm"
                >
                  Change Login Password
                </button>
      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
              </div>
            )}
        </div>

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 shadow-md">
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : profilePicUrl ? (
              <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          {editMode && (
            <label className="mt-4 cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Upload New Picture
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Profile Info/Form */}
        {!editMode ? (
          loading ? <div>Loading...</div> : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{name}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{email}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{dob}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{gender}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{location}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{phone}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type of Farmer</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{farmerType}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Farm Size (Kattha/Acres/Hectares)</label>
              <div className="text-lg font-semibold text-gray-900 bg-gray-50 rounded-xl p-3 border border-gray-200">{farmSize}</div>
            </div>
              {/* Removed duplicate Change Password Button */}
          </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-2 w-full border rounded-xl p-3 focus:outline-none focus:ring-2 transition ${
                  touched.name && fieldErrors.name
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder="Enter your name"
              />
              {touched.name && fieldErrors.name && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-2 w-full border border-gray-300 rounded-xl p-3 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={`mt-2 w-full border rounded-xl p-3 focus:outline-none focus:ring-2 transition ${
                  touched.dob && fieldErrors.dob
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
              />
              {touched.dob && fieldErrors.dob && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.dob}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`mt-2 w-full border rounded-xl p-3 focus:outline-none focus:ring-2 transition ${
                  touched.gender && fieldErrors.gender
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {touched.gender && fieldErrors.gender && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`mt-2 w-full border rounded-xl p-3 focus:outline-none focus:ring-2 transition ${
                  touched.location && fieldErrors.location
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder="Enter your location"
              />
              {touched.location && fieldErrors.location && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.location}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={handlePhoneBlur}
                className={`mt-2 w-full border rounded-xl p-3 focus:outline-none focus:ring-2 transition ${
                  touched.phone && fieldErrors.phone
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder="98XXXXXXXX | 97XXXXXXXX"
              />
              {touched.phone && fieldErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type of Farmer *</label>
              <select
                value={farmerType}
                onChange={(e) => setFarmerType(e.target.value)}
                className={`mt-2 w-full border rounded-xl p-3 focus:outline-none focus:ring-2 transition ${
                  touched.farmerType && fieldErrors.farmerType
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
              >
                <option value="">Select type</option>
                <option value="crop">Crop</option>
                <option value="livestock">Livestock</option>
                <option value="both">Both</option>
              </select>
              {touched.farmerType && fieldErrors.farmerType && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.farmerType}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Farm Size *</label>
              <div className="mt-2 relative">
                <input
                  type="number"
                  value={farmSizeValue}
                  onChange={(e) => handleFarmSizeValueChange(e.target.value)}
                  onBlur={handleFarmSizeValueBlur}
                  className={`w-full border rounded-xl p-3 pr-32 focus:outline-none focus:ring-2 transition ${
                    touched.farmSizeValue && fieldErrors.farmSizeValue
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder="Enter size"
                  step="0.01"
                  min="0"
                />
                <select
                  value={farmSizeUnit}
                  onChange={(e) => setFarmSizeUnit(e.target.value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="Kattha">Kattha</option>
                  <option value="Acres">Acres</option>
                  <option value="Hectares">Hectares</option>
                </select>
              </div>
              {touched.farmSizeValue && fieldErrors.farmSizeValue && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.farmSizeValue}</p>
              )}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition shadow"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300 transition shadow"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    {/* Success Popup */}
    {showSuccess && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 relative flex flex-col items-center">
          <div className="text-green-600 dark:text-green-300 text-4xl mb-2">✓</div>
          <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Profile Updated!</h2>
          <p className="text-gray-700 dark:text-gray-300 text-center mb-4">Your profile was updated successfully.</p>
        </div>
      </div>
    )}
    </FarmerLayout>
  );
};

export default Profile;