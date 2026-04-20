import React, { useState, useEffect } from 'react';
import OngoingSubsidyList from './OngoingSubsidyList';
import FarmerLayout from '../../components/Layout/FarmerLayout';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, CheckCircle, Clock, AlertCircle
} from 'lucide-react';

interface SubsidyApplication {
  id?: string;
  _id?: string;
  type?: string;
  subsidyType?: string;
  cropType?: string;
  farmArea?: number;
  expectedAmount?: number;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: Date;
  description?: string;
  purpose?: string;
  contactNumber?: string;
  adminReplies?: string[];
}

const SubsidyApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    subsidyType: '',
    cropType: '',
    farmArea: '',
    farmAreaValue: '',
    farmAreaUnit: 'Kattha',
    expectedAmount: '',
    purpose: '',
    description: '',
    contactNumber: '',
    citizenshipFront: null as File | null,
    citizenshipBack: null as File | null,
    nidFront: null as File | null,
    nidBack: null as File | null,
    landOwnership: null as File | null,
    farmerReg: null as File | null,
    other: null as File | null
  });

  const [fieldErrors, setFieldErrors] = useState({
    subsidyType: '',
    cropType: '',
    farmArea: '',
    expectedAmount: '',
    purpose: '',
    description: '',
    contactNumber: '',
    citizenshipFront: '',
    citizenshipBack: '',
    nidFront: '',
    nidBack: '',
    landOwnership: '',
    farmerReg: ''
  });

  const [touched, setTouched] = useState({
    subsidyType: false,
    cropType: false,
    farmArea: false,
    expectedAmount: false,
    purpose: false,
    description: false,
    contactNumber: false,
    citizenshipFront: false,
    citizenshipBack: false,
    nidFront: false,
    nidBack: false,
    landOwnership: false,
    farmerReg: false
  });

  // Auto-fill farm area from user profile
  useEffect(() => {
    if (user?.farmSize) {
      // Extract numeric value and unit from farmSize (e.g., "10 Kattha" -> value: "10", unit: "Kattha")
      const match = user.farmSize.match(/^([\d.]+)\s*(.+)?$/);
      if (match) {
        const value = match[1];
        const unit = match[2] || 'Kattha';
        setFormData(prev => ({ 
          ...prev, 
          farmAreaValue: value,
          farmAreaUnit: unit,
          farmArea: `${value} ${unit}`
        }));
      }
    }
  }, [user?.farmSize]);

  // Validation functions
  const validatePhone = (phone: string) => /^[9][0-9]{9}$/.test(phone);
  
  const validateField = (name: string, value: string | File | null): string => {
    switch (name) {
      case 'subsidyType':
        return !value ? 'Subsidy type is required' : '';
      case 'cropType':
        return !value ? 'Crop type is required' : '';
      case 'farmArea':
        if (!value) return 'Farm area is required';
        if (parseFloat(value as string) <= 0) return 'Farm area must be greater than 0';
        return '';
      case 'expectedAmount':
        if (!value) return 'Expected amount is required';
        if (parseFloat(value as string) <= 0) return 'Amount must be greater than 0';
        return '';
      case 'purpose':
        return !value ? 'Purpose is required' : '';
      case 'description':
        if (!value) return 'Description is required';
        if ((value as string).length < 20) return 'Description must be at least 20 characters';
        return '';
      case 'contactNumber':
        if (!value) return 'Contact number is required';
        if (!validatePhone(value as string)) return 'Phone must be 10 digits starting with 9';
        return '';
      case 'citizenshipFront':
        return !value ? 'Citizenship front is required' : '';
      case 'citizenshipBack':
        return !value ? 'Citizenship back is required' : '';
      case 'nidFront':
        return !value ? 'NID front is required' : '';
      case 'nidBack':
        return !value ? 'NID back is required' : '';
      case 'landOwnership':
        return !value ? 'Land ownership certificate is required' : '';
      case 'farmerReg':
        return !value ? 'Farmer registration certificate is required' : '';
      default:
        return '';
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const value = formData[fieldName as keyof typeof formData];
    setFieldErrors(prev => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
  };

  // Handler to pre-fill form when applying for an ongoing subsidy
  const handleOngoingApply = (subsidy: any) => {
    setActiveTab('apply');
    setStep(1);
    setFormData(prev => ({
      ...prev,
      subsidyType: subsidy.type || '',
      expectedAmount: subsidy.amount?.toString() || '',
      description: subsidy.description || '',
      purpose: subsidy.name || '',
    }));
  };

  // Remove dummy application history, use live state

  const subsidyTypes = [
    'Seed Subsidy',
    'Fertilizer Subsidy',
    'Equipment Subsidy',
    'Crop Insurance',
    'Irrigation Subsidy',
    'Organic Farming Support',
    'Youth Farmer Incentive'
  ];

  const cropTypes = [
    'Rice', 'Wheat', 'Maize', 'Potato', 'Tomato', 'Onion',
    'Cabbage', 'Cauliflower', 'Other Vegetables', 'Fruits'
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Real-time validation for contact number only
    if (name === 'contactNumber' && touched.contactNumber) {
      setFieldErrors(prev => ({ ...prev, contactNumber: validateField('contactNumber', value) }));
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof formData
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, [field]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({
      subsidyType: true,
      cropType: true,
      farmArea: true,
      expectedAmount: true,
      purpose: true,
      description: true,
      contactNumber: true,
      citizenshipFront: true,
      citizenshipBack: true,
      nidFront: true,
      nidBack: true,
      landOwnership: true,
      farmerReg: true
    });

    // Validate all required fields
    const errors = {
      subsidyType: validateField('subsidyType', formData.subsidyType),
      cropType: validateField('cropType', formData.cropType),
      farmArea: validateField('farmArea', formData.farmArea),
      expectedAmount: validateField('expectedAmount', formData.expectedAmount),
      purpose: validateField('purpose', formData.purpose),
      description: validateField('description', formData.description),
      contactNumber: validateField('contactNumber', formData.contactNumber),
      citizenshipFront: validateField('citizenshipFront', formData.citizenshipFront),
      citizenshipBack: validateField('citizenshipBack', formData.citizenshipBack),
      nidFront: validateField('nidFront', formData.nidFront),
      nidBack: validateField('nidBack', formData.nidBack),
      landOwnership: validateField('landOwnership', formData.landOwnership),
      farmerReg: validateField('farmerReg', formData.farmerReg)
    };

    setFieldErrors(errors);

    // Check if any errors exist
    const hasErrors = Object.values(errors).some(err => err !== '');
    if (hasErrors) {
      setError('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);

    const form = new FormData();
    form.append('subsidyType', formData.subsidyType);
    form.append('cropType', formData.cropType);
    // Send only the numeric value for farmArea (backend expects a number)
    form.append('farmArea', formData.farmAreaValue);
    form.append('expectedAmount', formData.expectedAmount);
    form.append('purpose', formData.purpose);
    form.append('description', formData.description);
    form.append('contactNumber', formData.contactNumber);
    if (formData.citizenshipFront) form.append('citizenshipFront', formData.citizenshipFront);
    if (formData.citizenshipBack) form.append('citizenshipBack', formData.citizenshipBack);
    if (formData.nidFront) form.append('nidFront', formData.nidFront);
    if (formData.nidBack) form.append('nidBack', formData.nidBack);
    if (formData.landOwnership) form.append('landOwnership', formData.landOwnership);
    if (formData.farmerReg) form.append('farmerReg', formData.farmerReg);
    if (formData.other) form.append('other', formData.other);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/subsidy/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        setStep(1);
        setFormData({
          subsidyType: '',
          cropType: '',
          farmArea: '',
          farmAreaValue: '',
          farmAreaUnit: 'Kattha',
          expectedAmount: '',
          purpose: '',
          description: '',
          contactNumber: '',
          citizenshipFront: null,
          citizenshipBack: null,
          nidFront: null,
          nidBack: null,
          landOwnership: null,
          farmerReg: null,
          other: null
        });
        setActiveTab('history');
        // Optionally refetch history
        fetchHistory();
      } else {
        alert(data.message || 'Submission failed');
      }
    } catch (err) {
      alert('Server error');
    }
    setIsSubmitting(false);
  };

  // Fetch application history from backend
  const [history, setHistory] = useState<SubsidyApplication[]>([]);
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/subsidy/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      // ...existing code...
      if (data.success && Array.isArray(data.applications)) {
        setHistory(data.applications.map((app: any) => ({
          ...app,
          appliedDate: new Date(app.appliedDate)
        })));
      }
    } catch (err) {
      console.error('Error fetching subsidy history:', err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
      // Auto-refresh every 10 seconds when on history tab
      const interval = setInterval(fetchHistory, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <FarmerLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subsidy Applications</h1>
          <p className="text-gray-600">Apply for government subsidies and track your application status</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('apply')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'apply'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center"><span className="font-bold text-green-600 mr-2">रु</span>Apply for Subsidy</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="inline-block w-4 h-4 mr-2" />
                Application History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'apply' ? (
              showSuccess ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Application Submitted!</h3>
                  <p className="mt-1 text-gray-500">You’ll get updates via SMS and email shortly.</p>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Submit Another Application
                  </button>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  {/* Progress bar */}
                  <div className="flex justify-between items-center mb-6">
                    {[1, 2, 3].map(num => (
                      <div key={num} className="flex-1 flex items-center">
                        <div
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                            step >= num ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {num}
                        </div>
                        {num < 3 && <div className="flex-1 h-1 bg-gray-300 mx-2" />}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                      <>
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                            {error}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Subsidy Type *</label>
                          <select
                            name="subsidyType"
                            value={formData.subsidyType}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('subsidyType')}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                              fieldErrors.subsidyType && touched.subsidyType
                                ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            }`}
                          >
                            <option value="">Select subsidy type</option>
                            {subsidyTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          {fieldErrors.subsidyType && touched.subsidyType && (
                            <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.subsidyType}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Crop Type *</label>
                          <select
                            name="cropType"
                            value={formData.cropType}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('cropType')}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                              fieldErrors.cropType && touched.cropType
                                ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            }`}
                          >
                            <option value="">Select crop type</option>
                            {cropTypes.map(crop => (
                              <option key={crop} value={crop}>{crop}</option>
                            ))}
                          </select>
                          {fieldErrors.cropType && touched.cropType && (
                            <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.cropType}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            // Validate step 1 fields before proceeding
                            const step1Errors = {
                              subsidyType: validateField('subsidyType', formData.subsidyType),
                              cropType: validateField('cropType', formData.cropType)
                            };
                            setTouched(prev => ({ ...prev, subsidyType: true, cropType: true }));
                            setFieldErrors(prev => ({ ...prev, ...step1Errors }));
                            
                            if (!step1Errors.subsidyType && !step1Errors.cropType) {
                              setStep(2);
                              setError('');
                            } else {
                              setError('Please fill in all required fields');
                            }
                          }}
                          className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          Next
                        </button>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                            {error}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Farm Area *
                            {user?.farmSize && (
                              <span className="ml-2 text-xs text-green-600 font-normal">
                                (Auto-filled from profile: {user.farmSize})
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="farmAreaValue"
                              value={formData.farmAreaValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFormData({ 
                                  ...formData, 
                                  farmAreaValue: value,
                                  farmArea: value ? `${value} ${formData.farmAreaUnit}` : ''
                                });
                                if (touched.farmArea) {
                                  const farmAreaStr = value ? `${value} ${formData.farmAreaUnit}` : '';
                                  setFieldErrors(prev => ({ ...prev, farmArea: validateField('farmArea', farmAreaStr) }));
                                }
                              }}
                              onBlur={() => handleBlur('farmArea')}
                              min="0"
                              step="0.01"
                              className={`w-full pl-3 pr-32 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                                fieldErrors.farmArea && touched.farmArea
                                  ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                              }`}
                              placeholder="Enter size"
                            />
                            <select
                              name="farmAreaUnit"
                              value={formData.farmAreaUnit}
                              onChange={(e) => {
                                const unit = e.target.value;
                                setFormData({ 
                                  ...formData, 
                                  farmAreaUnit: unit,
                                  farmArea: formData.farmAreaValue ? `${formData.farmAreaValue} ${unit}` : ''
                                });
                                if (touched.farmArea && formData.farmAreaValue) {
                                  const farmAreaStr = `${formData.farmAreaValue} ${unit}`;
                                  setFieldErrors(prev => ({ ...prev, farmArea: validateField('farmArea', farmAreaStr) }));
                                }
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                            >
                              <option value="Kattha">Kattha</option>
                              <option value="Acres">Acres</option>
                              <option value="Hectares">Hectares</option>
                            </select>
                          </div>
                          {fieldErrors.farmArea && touched.farmArea && (
                            <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.farmArea}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Expected Amount (NPR) *</label>
                          <input
                            type="number"
                            name="expectedAmount"
                            value={formData.expectedAmount}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('expectedAmount')}
                            min="0"
                            step="1"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                              fieldErrors.expectedAmount && touched.expectedAmount
                                ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            }`}
                            placeholder="Enter expected amount in NPR"
                          />
                          {fieldErrors.expectedAmount && touched.expectedAmount && (
                            <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.expectedAmount}</p>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-1/2 mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              // Validate step 2 fields before proceeding
                              const step2Errors = {
                                farmArea: validateField('farmArea', formData.farmArea),
                                expectedAmount: validateField('expectedAmount', formData.expectedAmount)
                              };
                              setTouched(prev => ({ ...prev, farmArea: true, expectedAmount: true }));
                              setFieldErrors(prev => ({ ...prev, ...step2Errors }));
                              
                              if (!step2Errors.farmArea && !step2Errors.expectedAmount) {
                                setStep(3);
                                setError('');
                              } else {
                                setError('Please fill in all required fields correctly');
                              }
                            }}
                            className="w-1/2 mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                          >
                            Next
                          </button>
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                            {error}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Contact Number *</label>
                          <input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('contactNumber')}
                            placeholder="98XXXXXXXX"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                              fieldErrors.contactNumber && touched.contactNumber
                                ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            }`}
                          />
                          {fieldErrors.contactNumber && touched.contactNumber && (
                            <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.contactNumber}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Purpose *</label>
                          <input
                            type="text"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('purpose')}
                            placeholder="Enter purpose of subsidy"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                              fieldErrors.purpose && touched.purpose
                                ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            }`}
                          />
                          {fieldErrors.purpose && touched.purpose && (
                            <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.purpose}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Detailed Description * (minimum 20 characters)</label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            onBlur={() => handleBlur('description')}
                            rows={3}
                            placeholder="Provide detailed description of your needs and how the subsidy will be used..."
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                              fieldErrors.description && touched.description
                                ? 'border-red-500 focus:ring-red-400 focus:border-red-400'
                                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                            }`}
                          />
                          <p className="mt-1 text-xs text-gray-500">{formData.description.length}/20 characters minimum</p>
                          {fieldErrors.description && touched.description && (
                            <p className="mt-1 text-xs text-red-600 animate-fade-in">{fieldErrors.description}</p>
                          )}
                        </div>
                        {/* Modern Document Upload Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          {/* Citizenship Certificate (front & back) */}
                          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-gray-50 hover:bg-green-50 transition group relative w-full">
                            <span className="text-green-600 mb-2 text-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3m-9 4.5A2.25 2.25 0 0 1 6.75 7.5h10.5A2.25 2.25 0 0 1 19.5 9.75v4.5A2.25 2.25 0 0 1 17.25 16.5H6.75A2.25 2.25 0 0 1 4.5 14.25v-4.5z" />
                              </svg>
                            </span>
                            <span className="block text-sm font-medium text-gray-700 mb-1">Citizenship Certificate *</span>
                            <span className="text-xs text-gray-400 mb-2">(PDF, JPG, PNG)</span>
                            <div className="flex w-full gap-2">
                              <label className="flex-1 flex flex-col items-center cursor-pointer">
                                <span className="text-xs text-gray-500 mb-1">Front</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => handleFileUpload(e, 'citizenshipFront')}
                                  className="hidden"
                                />
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold group-hover:bg-green-200 transition">
                                  {formData.citizenshipFront ? (
                                    <span className="flex items-center gap-2">
                                      Uploaded: {formData.citizenshipFront.name}
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, citizenshipFront: null }))}
                                        className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                        title="Remove file"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ) : 'Upload front'}
                                </span>
                              </label>
                              <label className="flex-1 flex flex-col items-center cursor-pointer">
                                <span className="text-xs text-gray-500 mb-1">Back</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => handleFileUpload(e, 'citizenshipBack')}
                                  className="hidden"
                                />
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold group-hover:bg-green-200 transition">
                                  {formData.citizenshipBack ? (
                                    <span className="flex items-center gap-2">
                                      Uploaded: {formData.citizenshipBack.name}
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, citizenshipBack: null }))}
                                        className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                        title="Remove file"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ) : 'Upload back'}
                                </span>
                              </label>
                            </div>
                          </div>
                          {/* NID (front & back) */}
                          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-gray-50 hover:bg-green-50 transition group relative w-full">
                            <span className="text-green-600 mb-2 text-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3m-9 4.5A2.25 2.25 0 0 1 6.75 7.5h10.5A2.25 2.25 0 0 1 19.5 9.75v4.5A2.25 2.25 0 0 1 17.25 16.5H6.75A2.25 2.25 0 0 1 4.5 14.25v-4.5z" />
                              </svg>
                            </span>
                            <span className="block text-sm font-medium text-gray-700 mb-1">National Identity Card (NID) *</span>
                            <span className="text-xs text-gray-400 mb-2">(PDF, JPG, PNG)</span>
                            <div className="flex w-full gap-2">
                              <label className="flex-1 flex flex-col items-center cursor-pointer">
                                <span className="text-xs text-gray-500 mb-1">Front</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => handleFileUpload(e, 'nidFront')}
                                  className="hidden"
                                />
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold group-hover:bg-green-200 transition">
                                  {formData.nidFront ? (
                                    <span className="flex items-center gap-2">
                                      Uploaded: {formData.nidFront.name}
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, nidFront: null }))}
                                        className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                        title="Remove file"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ) : 'Upload front'}
                                </span>
                              </label>
                              <label className="flex-1 flex flex-col items-center cursor-pointer">
                                <span className="text-xs text-gray-500 mb-1">Back</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => handleFileUpload(e, 'nidBack')}
                                  className="hidden"
                                />
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold group-hover:bg-green-200 transition">
                                  {formData.nidBack ? (
                                    <span className="flex items-center gap-2">
                                      Uploaded: {formData.nidBack.name}
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, nidBack: null }))}
                                        className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                        title="Remove file"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ) : 'Upload back'}
                                </span>
                              </label>
                            </div>
                          </div>
                          {/* Land Ownership Certificate (front only) */}
                          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-gray-50 hover:bg-green-50 transition group relative w-full">
                            <span className="text-green-600 mb-2 text-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3m-9 4.5A2.25 2.25 0 0 1 6.75 7.5h10.5A2.25 2.25 0 0 1 19.5 9.75v4.5A2.25 2.25 0 0 1 17.25 16.5H6.75A2.25 2.25 0 0 1 4.5 14.25v-4.5z" />
                              </svg>
                            </span>
                            <span className="block text-sm font-medium text-gray-700 mb-1">Land Ownership Certificate *</span>
                            <span className="text-xs text-gray-400 mb-2">(PDF, JPG, PNG)</span>
                            <label className="w-full flex flex-col items-center cursor-pointer">
                              <span className="text-xs text-gray-500 mb-1">Front</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.png"
                                onChange={(e) => {
                                  handleFileUpload(e, 'landOwnership');
                                  setTouched(prev => ({ ...prev, landOwnership: true }));
                                }}
                                className="hidden"
                              />
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold group-hover:bg-green-200 transition">
                                {formData.landOwnership ? (
                                  <span className="flex items-center gap-2">
                                    Uploaded: {formData.landOwnership.name}
                                    <button
                                      type="button"
                                      onClick={() => setFormData(prev => ({ ...prev, landOwnership: null }))}
                                      className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                      title="Remove file"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ) : 'Upload front'}
                              </span>
                            </label>
                          </div>
                          {/* Farmer Registration Certificate (front only) */}
                          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-gray-50 hover:bg-green-50 transition group relative w-full">
                            <span className="text-green-600 mb-2 text-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3m-9 4.5A2.25 2.25 0 0 1 6.75 7.5h10.5A2.25 2.25 0 0 1 19.5 9.75v4.5A2.25 2.25 0 0 1 17.25 16.5H6.75A2.25 2.25 0 0 1 4.5 14.25v-4.5z" />
                              </svg>
                            </span>
                            <span className="block text-sm font-medium text-gray-700 mb-1">Farmer Registration Certificate *</span>
                            <span className="text-xs text-gray-400 mb-2">(PDF, JPG, PNG)</span>
                            <label className="w-full flex flex-col items-center cursor-pointer">
                              <span className="text-xs text-gray-500 mb-1">Front</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.png"
                                onChange={(e) => {
                                  handleFileUpload(e, 'farmerReg');
                                  setTouched(prev => ({ ...prev, farmerReg: true }));
                                }}
                                className="hidden"
                              />
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold group-hover:bg-green-200 transition">
                                {formData.farmerReg ? (
                                  <span className="flex items-center gap-2">
                                    Uploaded: {formData.farmerReg.name}
                                    <button
                                      type="button"
                                      onClick={() => setFormData(prev => ({ ...prev, farmerReg: null }))}
                                      className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                      title="Remove file"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ) : 'Upload front'}
                              </span>
                            </label>
                          </div>
                          {/* Other Supporting Document (front only) */}
                          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-gray-50 hover:bg-green-50 transition group relative w-full">
                            <span className="text-green-600 mb-2 text-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3m-9 4.5A2.25 2.25 0 0 1 6.75 7.5h10.5A2.25 2.25 0 0 1 19.5 9.75v4.5A2.25 2.25 0 0 1 17.25 16.5H6.75A2.25 2.25 0 0 1 4.5 14.25v-4.5z" />
                              </svg>
                            </span>
                            <span className="block text-sm font-medium text-gray-700 mb-1">Other Supporting Document (optional)</span>
                            <span className="text-xs text-gray-400 mb-2">(PDF, JPG, PNG)</span>
                            <label className="w-full flex flex-col items-center cursor-pointer">
                              <span className="text-xs text-gray-500 mb-1">Front</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.png"
                                onChange={(e) => handleFileUpload(e, 'other')}
                                className="hidden"
                              />
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold group-hover:bg-green-200 transition">
                                {formData.other ? (
                                  <span className="flex items-center gap-2">
                                    Uploaded: {formData.other.name}
                                    <button
                                      type="button"
                                      onClick={() => setFormData(prev => ({ ...prev, other: null }))}
                                      className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                      title="Remove file"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ) : 'Upload front'}
                              </span>
                            </label>
                          </div>
                        </div>
                        
                        {/* Document Upload Errors */}
                        {(fieldErrors.citizenshipFront || fieldErrors.citizenshipBack || fieldErrors.nidFront || fieldErrors.nidBack || fieldErrors.landOwnership || fieldErrors.farmerReg) && 
                         (touched.citizenshipFront || touched.citizenshipBack || touched.nidFront || touched.nidBack || touched.landOwnership || touched.farmerReg) && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            <p className="font-semibold mb-2">Required documents missing:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {fieldErrors.citizenshipFront && touched.citizenshipFront && <li>{fieldErrors.citizenshipFront}</li>}
                              {fieldErrors.citizenshipBack && touched.citizenshipBack && <li>{fieldErrors.citizenshipBack}</li>}
                              {fieldErrors.nidFront && touched.nidFront && <li>{fieldErrors.nidFront}</li>}
                              {fieldErrors.nidBack && touched.nidBack && <li>{fieldErrors.nidBack}</li>}
                              {fieldErrors.landOwnership && touched.landOwnership && <li>{fieldErrors.landOwnership}</li>}
                              {fieldErrors.farmerReg && touched.farmerReg && <li>{fieldErrors.farmerReg}</li>}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="w-1/3 mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-2/3 mt-4 bg-green-600 text-white py-2 rounded-lg disabled:opacity-50 hover:bg-green-700 transition"
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                  {/* Ongoing Subsidy List below the form, in a separate card */}
                  <div className="mt-8">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h2 className="text-lg font-semibold text-green-700 mb-4">Ongoing Available Subsidies</h2>
                      <OngoingSubsidyList onApply={handleOngoingApply} />
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
                {history.length === 0 ? (
                  <p className="text-gray-500">No applications found.</p>
                ) : (
                  history.map(app => (
                    <div key={app._id || app.id} className="bg-white p-6 rounded-xl border shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{app.subsidyType || app.type}</h3>
                          <div className="text-xs text-gray-500">Applied: {app.appliedDate?.toLocaleDateString?.()}</div>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}
                        >
                          {getStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                          <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Crop Type:</span> {app.cropType}</div>
                          <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Farm Area:</span> {app.farmArea} Kattha</div>
                          <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Expected Amount:</span> NPR {app.expectedAmount?.toLocaleString?.() || app.amount?.toLocaleString?.()}</div>
                          <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Purpose:</span> {app.purpose}</div>
                          <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Contact Number:</span> {app.contactNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 mb-1 break-words overflow-hidden"><span className="font-semibold">Description:</span> {app.description}</div>
                        </div>
                      </div>
                      {app.adminReplies && app.adminReplies.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <div className="text-xs text-blue-700 font-semibold mb-1">Admin Replies:</div>
                          <ul className="list-disc pl-4">
                            {app.adminReplies.map((reply, idx) => (
                              <li key={idx} className="text-sm text-blue-900 mb-1">{reply}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
};

export default SubsidyApplicationPage;