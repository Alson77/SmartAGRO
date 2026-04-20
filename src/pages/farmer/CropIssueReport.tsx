import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FarmerLayout from '../../components/Layout/FarmerLayout';
import { AlertTriangle, Camera, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';

interface IssueReply {
  message: string;
  senderType: 'admin' | 'farmer';
  admin?: { name: string; email: string; role?: string };
  farmer?: { name: string; email: string; _id?: string };
  createdAt: string;
}

interface IssueReport {
  id: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reportedDate: Date;
  location: string;
  description: string;
  images?: string[];
  replies?: IssueReply[];
}

const categories = [
  'Pest',
  'Disease',
  'Soil',
  'Weather',
  'Irrigation',
  'Other',
];

// Helper functions for status/severity UI
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'open':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'resolved':
      return <CheckCircle className="h-4 w-4" />;
    case 'in_progress':
      return <Clock className="h-4 w-4" />;
    case 'open':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const CropIssueReport: React.FC = () => {
  // ...existing code...
  // Persist activeTab in localStorage
  const [activeTab, setActiveTab] = useState<'report' | 'history'>(() => {
    return (localStorage.getItem('farmer_issue_activeTab') as 'report' | 'history') || 'report';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    severity: '',
    location: '',
    description: '',
    urgency: false,
    images: [] as (string | File)[],
  });
  const [issueHistory, setIssueHistory] = useState<IssueReport[]>([]);
  
  // Validation states
  const [fieldErrors, setFieldErrors] = useState({
    title: '',
    category: '',
    severity: '',
    location: '',
    description: ''
  });
  const [touched, setTouched] = useState({
    title: false,
    category: false,
    severity: false,
    location: false,
    description: false
  });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // Persist activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('farmer_issue_activeTab', activeTab);
  }, [activeTab]);

  // Fetch issue history from backend API, with polling for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchHistory = () => {
      if (activeTab !== 'history') return;
      setLoadingHistory(true);
      setHistoryError(null);
      // Use authenticated endpoint to get only this farmer's issues
      fetch('/api/issues/my-issues', { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch issue history');
          const data = await res.json();
          setIssueHistory(
            data.map((item: any) => ({
              id: item._id,
              title: item.title,
              category: item.category,
              severity: item.severity,
              status: item.status,
              reportedDate: item.reportedDate ? new Date(item.reportedDate) : null,
              location: item.location,
              description: item.description,
              images: item.images || [],
              replies: item.replies || [],
            }))
          );
          setLoadingHistory(false);
        })
        .catch((err) => {
          setHistoryError(err.message || 'Error loading history');
          setLoadingHistory(false);
        });
    };
    if (activeTab === 'history') {
      fetchHistory();
      // Removed auto-refresh from history list - only refresh modal
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);
  const [viewIssue, setViewIssue] = useState<IssueReport | null>(null);
  // Disable page scroll when modal is open
  useEffect(() => {
    if (viewIssue) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewIssue]);

  // Auto-refresh only when viewing a specific issue in modal
  useEffect(() => {
    if (viewIssue) {
      const refreshIssue = async () => {
        try {
          const res = await fetch('/api/issues/my-issues', { 
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            const updatedIssue = data.find((item: any) => item._id === viewIssue.id);
            if (updatedIssue) {
              setViewIssue({
                id: updatedIssue._id,
                title: updatedIssue.title,
                category: updatedIssue.category,
                severity: updatedIssue.severity,
                status: updatedIssue.status,
                reportedDate: updatedIssue.reportedDate ? new Date(updatedIssue.reportedDate) : new Date(),
                location: updatedIssue.location,
                description: updatedIssue.description,
                images: updatedIssue.images || [],
                replies: updatedIssue.replies || [],
              });
            }
          }
        } catch (err) {
          console.error('Error refreshing issue:', err);
        }
      };

      const interval = setInterval(refreshIssue, 5000); // Refresh every 5 seconds when modal is open
      return () => clearInterval(interval);
    }
  }, [viewIssue?.id]);
  const { user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  
  // Validation function
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'title':
        if (!value.trim()) return 'Issue title is required';
        if (value.trim().length < 5) return 'Title must be at least 5 characters';
        if (value.trim().length > 100) return 'Title must be less than 100 characters';
        return '';
      case 'category':
        if (!value) return 'Please select a category';
        return '';
      case 'severity':
        if (!value) return 'Please select severity level';
        return '';
      case 'location':
        if (!value.trim()) return 'Location is required';
        if (value.trim().length < 3) return 'Location must be at least 3 characters';
        return '';
      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.trim().length < 20) return 'Description must be at least 20 characters';
        if (value.trim().length > 1000) return 'Description must be less than 1000 characters';
        return '';
      default:
        return '';
    }
  };

  // Real-time validation for description
  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    if (touched.description) {
      setFieldErrors(prev => ({ ...prev, description: validateField('description', value) }));
    }
  };

  const handleDescriptionBlur = () => {
    setTouched(prev => ({ ...prev, description: true }));
    setFieldErrors(prev => ({ ...prev, description: validateField('description', formData.description) }));
  };

  // Farmer reply submit handler
  // Handler for submitting a new issue report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      title: true,
      category: true,
      severity: true,
      location: true,
      description: true
    });

    // Validate all fields
    const errors = {
      title: validateField('title', formData.title),
      category: validateField('category', formData.category),
      severity: validateField('severity', formData.severity),
      location: validateField('location', formData.location),
      description: validateField('description', formData.description)
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get farmerId - prioritize user.id from auth context
      const farmerId = user?.id || localStorage.getItem('farmerId') || sessionStorage.getItem('farmerId');
      if (!farmerId) {
        alert('Error: User not properly authenticated. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      // Build FormData for file upload
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('category', formData.category);
      fd.append('severity', formData.severity);
      fd.append('location', formData.location);
      fd.append('description', formData.description);
      fd.append('urgency', String(formData.urgency));
      fd.append('farmerId', farmerId);
      // Append image files
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((img: any) => {
          if (img instanceof File) {
            fd.append('images', img);
          }
        });
      }
      const res = await fetch('/api/issues', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Failed to submit issue report. Please try again.');
        setIsSubmitting(false);
        return;
      }
      setFormData({
        title: '',
        category: '',
        severity: '',
        location: '',
        description: '',
        urgency: false,
        images: [],
      });
      setFieldErrors({
        title: '',
        category: '',
        severity: '',
        location: '',
        description: ''
      });
      setTouched({
        title: false,
        category: false,
        severity: false,
        location: false,
        description: false
      });
      setActiveTab('history');
    } catch (err) {
      alert('Network error. Please try again.');
    }
    setIsSubmitting(false);
  };

  // Handler for submitting a reply to an issue
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id || !viewIssue) return;
    setIsReplying(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/issues/${viewIssue.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, farmerId: user.id })
      });
      if (!res.ok) {
        const data = await res.json();
        setReplyError(data.message || 'Failed to send reply');
        setIsReplying(false);
        return;
      }
      const data = await res.json();
      setViewIssue({ ...viewIssue, replies: data.issue.replies });
      setReplyText('');
    } catch (err) {
      setReplyError('Network error');
    }
    setIsReplying(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Store image files directly for FormData upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...Array.from(files)] }));
  };

  // Helper functions for status/severity UI
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'open':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 min-h-screen bg-white bg-opacity-40 backdrop-blur-sm">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Crop Issue Reporting</h1>
          <p className="text-lg text-gray-700">
            Report farming problems and get expert assistance from agricultural specialists
          </p>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('report')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'report'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="inline-block w-4 h-4 mr-2" /> Report Issue
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="inline-block w-4 h-4 mr-2" /> Issue History
              </button>
            </nav>
          </div>
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'report' ? (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                      touched.title && fieldErrors.title
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                    placeholder="Brief title describing the issue"
                  />
                  {touched.title && fieldErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>
                  )}
                </div>
                {/* Category & Severity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                        touched.category && fieldErrors.category
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {touched.category && fieldErrors.category && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.category}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                      Severity *
                    </label>
                    <select
                      id="severity"
                      name="severity"
                      value={formData.severity}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                        touched.severity && fieldErrors.severity
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                      }`}
                    >
                      <option value="">Select severity</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    {touched.severity && fieldErrors.severity && (
                      <p className="text-red-500 text-sm mt-1">{fieldErrors.severity}</p>
                    )}
                  </div>
                </div>
                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                        touched.location && fieldErrors.location
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                      }`}
                      placeholder="Village, District, etc."
                    />
                  </div>
                  {touched.location && fieldErrors.location && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.location}</p>
                  )}
                </div>
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description * (min 20 characters)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                      touched.description && fieldErrors.description
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
                    }`}
                    placeholder="Describe the issue in detail..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      {touched.description && fieldErrors.description && (
                        <p className="text-red-500 text-sm">{fieldErrors.description}</p>
                      )}
                    </div>
                    <p className={`text-xs ${
                      formData.description.length < 20 
                        ? 'text-red-500' 
                        : formData.description.length > 1000 
                        ? 'text-red-500' 
                        : 'text-gray-500'
                    }`}>
                      {formData.description.length}/1000 characters
                    </p>
                  </div>
                </div>
                {/* Urgency Checkbox */}
                <div className="flex items-center mb-2">
                  <input
                    id="urgency"
                    name="urgency"
                    type="checkbox"
                    checked={formData.urgency}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="urgency" className="ml-2 block text-sm text-gray-700">
                    Mark as urgent
                  </label>
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-md file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.images.map((img, idx) => {
                      let src = '';
                      if (typeof img === 'object' && img !== null && 'name' in img) {
                        src = URL.createObjectURL(img as File);
                      } else if (typeof img === 'string') {
                        src = img;
                      }
                      return (
                        <div key={idx} className="relative group">
                          <img
                            src={src}
                            alt={`upload-${idx}`}
                            className="h-20 w-20 object-cover rounded-md border"
                          />
                          <span
                            className="absolute bottom-1 right-1 bg-white bg-opacity-80 rounded-full p-1 shadow text-xs opacity-0 group-hover:opacity-100 cursor-zoom-in select-none"
                            onClick={e => { e.stopPropagation(); window.open(src, '_blank'); }}
                            title="View full image"
                          >🔍</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }))
                            }
                            className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
                            title="Remove image"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex">
                  <Camera className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3 text-sm text-blue-700">
                    <h3 className="text-xl font-bold text-blue-800">Tips for Better Assistance</h3>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Take clear photos of affected plants/areas</li>
                      <li>Note when the problem first appeared</li>
                      <li>Mention any recent changes in farming practices</li>
                      <li>Include weather conditions if relevant</li>
                    </ul>
                  </div>
                </div>
                {/* Submit */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    ) : (
                      'Submit Issue Report'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {loadingHistory ? (
                  <div className="text-center py-12 text-gray-500">Loading issue history...</div>
                ) : historyError ? (
                  <div className="text-center py-12 text-red-500">{historyError}</div>
                ) : issueHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No Issues Reported Yet</h3>
                    <p className="mt-1 text-gray-500">Report your first crop issue to get expert assistance</p>
                  </div>
                ) : (
                  <>
                    {issueHistory.map((issue) => (
                      <div
                        key={issue.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition relative"
                        onClick={() => setViewIssue(issue)}
                      >
                        <span className="absolute top-3 right-4 bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-orange-200">
                          Click to show expert advice
                        </span>
                        <div className="flex items-center mb-4 gap-3">
                          <h3 className="text-2xl font-bold text-gray-900">{issue.title}</h3>
                        </div>
                        <div className="mb-3 flex items-center gap-3 text-xs min-h-[32px]">
                          {/* Category badge: pill, shadow, border, gradient */}
                          <span className="inline-flex items-center px-4 h-8 rounded-full bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 text-blue-800 font-semibold shadow border border-blue-200 whitespace-nowrap">
                            {issue.category}
                          </span>
                          <span className={`inline-flex items-center px-4 h-8 rounded-full font-semibold shadow border whitespace-nowrap ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-4 h-8 rounded-full whitespace-nowrap ${getStatusColor(issue.status)}`}>{getStatusIcon(issue.status)} <span className="ml-1">{issue.status.replace('_',' ')}</span></span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {issue.description.length > 175
                            ? issue.description.slice(0, 175) + '...'
                            : issue.description}
                        </p>
                        <div className="mt-2 flex text-xs text-gray-500 space-x-4">
                          <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{issue.location}</span>
                          <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />
                            {issue.reportedDate instanceof Date && !isNaN(issue.reportedDate.getTime())
                              ? issue.reportedDate.toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {/* Issue Details Modal */}
                    {viewIssue && (
                      <div className="fixed inset-0 z-50 flex items-start justify-center bg-white bg-opacity-40 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-12 w-full max-w-6xl relative border border-gray-200 text-lg" style={{ minHeight: '80vh' }}>
                          <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setViewIssue(null)}
                          >
                            &times;
                          </button>
                          <h2 className="text-3xl font-extrabold mb-2 text-orange-700">{viewIssue.title}</h2>
                          <div className="flex flex-wrap gap-2 mb-2 text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{viewIssue.category}</span>
                            <span className={`px-2 py-0.5 rounded-full ${getSeverityColor(viewIssue.severity)}`}>{viewIssue.severity.toUpperCase()}</span>
                            <span className={`px-2 py-0.5 rounded-full ${getStatusColor(viewIssue.status)}`}>{viewIssue.status.replace('_', ' ')}</span>
                          </div>
                          <textarea
                            className="mt-8 mb-4 text-xl text-gray-800 w-full bg-gray-50 p-4 rounded-md resize-none"
                            value={viewIssue.description}
                            disabled
                            readOnly
                          />
                          <div className="mb-2 text-xs text-gray-500">
                            <span className="mt-4 text-base text-gray-600 block">Location: {viewIssue.location}</span>
                          </div>
                          <div className="mb-2 text-xs text-gray-500">
                            <span className="mt-4 text-base text-gray-600 block">
                              {viewIssue.reportedDate instanceof Date && !isNaN(viewIssue.reportedDate.getTime())
                                ? `Reported: ${viewIssue.reportedDate.toLocaleString()}`
                                : 'Reported: N/A'}
                            </span>
                          </div>
                          {viewIssue.images && viewIssue.images.length > 0 && (
                            <div className="mb-4">
                              <div className="inline-block font-semibold text-base text-gray-700 mb-2 px-4 py-1 rounded-full bg-orange-50 border border-orange-200 shadow">Uploaded Images</div>
                              <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-md">
                                {viewIssue.images.map((img, idx) => {
                                  let src = '';
                                  if (typeof img === 'object' && img !== null && 'name' in img) {
                                    src = URL.createObjectURL(img as File);
                                  } else if (typeof img === 'string') {
                                    src = img && !/^https?:\/+/.test(img) && img.startsWith('/uploads/') ? `http://localhost:5000${img}` : img;
                                  }
                                  return (
                                    <div key={idx} className="relative group">
                                      <img
                                        src={src}
                                        alt={`issue-img-${idx}`}
                                        className="h-24 w-24 object-cover rounded-md border cursor-pointer bg-white"
                                        onClick={() => window.open(src, '_blank')}
                                        title="View full image"
                                      />
                                      <span className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded-full p-1 shadow text-xs opacity-0 group-hover:opacity-100">🔍</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {/* Conversations */}
                          <div className="mt-6">
                            <div className="font-semibold text-gray-700 mb-2 text-base">Conversations</div>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                              {viewIssue.replies && viewIssue.replies.length > 0 ? (
                                viewIssue.replies.map((reply, idx) => {
                                  let byText = '';
                                  if (reply.senderType === 'farmer') {
                                    byText = 'By You';
                                  } else if (reply.senderType === 'admin') {
                                    byText = 'By Admin';
                                  } else {
                                    byText = '';
                                  }
                                  return (
                                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                      <div className="text-sm text-gray-800">{reply.message}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {byText ? `${byText} | ` : ''}{new Date(reply.createdAt).toLocaleString()}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-xs text-gray-500">No conversations yet.</div>
                              )}
                            </div>
                            {/* Farmer Reply Form - only show if issue is not resolved/closed */}
                            {viewIssue.status !== 'resolved' && viewIssue.status !== 'closed' ? (
                              <form onSubmit={handleReplySubmit} className="mt-4 flex gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  placeholder="Type your reply..."
                                  aria-label="Type your reply"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                  disabled={isReplying}
                                  required
                                />
                                <button
                                  type="submit"
                                  aria-label="Send reply"
                                  disabled={isReplying || !replyText.trim()}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 disabled:opacity-50"
                                >
                                  {isReplying ? 'Sending...' : 'Send'}
                                </button>
                              </form>
                            ) : (
                              <div className="mt-4 text-xs text-gray-500">Conversations are disabled for resolved/closed issues.</div>
                            )}
                            {replyError && <div className="text-xs text-red-500 mt-2">{replyError}</div>}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
export default CropIssueReport;