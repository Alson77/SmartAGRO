import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { Search, Filter, Calendar, CheckCircle, Clock, XCircle, Eye, User } from 'lucide-react';

interface SubsidyApplication {
  _id: string;
  user: { name?: string; email?: string } | string;
  subsidyType: string;
  cropType: string;
  farmArea: number;
  expectedAmount: number;
  purpose: string;
  description: string;
  contactNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  reviewedDate?: string;
  adminReplies?: string[];
}

const initialOngoingForm = { title: '', description: '' };

const SubsidyManagement: React.FC = () => {
  // ...existing code...
  // Ongoing Subsidy Management
  const [ongoingForm, setOngoingForm] = useState(initialOngoingForm);
  const [ongoingSubmitting, setOngoingSubmitting] = useState(false);
  const [ongoingSubsidies, setOngoingSubsidies] = useState<any[]>([]);
  const [showOngoingForm, setShowOngoingForm] = useState(false);
  // Track editing state
  const [editingOngoingId, setEditingOngoingId] = useState<string | null>(null);
  // Show all ongoing subsidy cards toggle
  const [showAll, setShowAll] = useState(false);

  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedApplication, setViewedApplication] = useState<SubsidyApplication | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Disable page scroll when view modal is open
  useEffect(() => {
    if (viewModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewModalOpen]);

    // ...existing code...

  const handleViewModal = (application: SubsidyApplication) => {
    // Fetch document/image URLs from backend for this application
    fetch(`http://localhost:5000/api/subsidy/documents/${application._id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.documents) {
          setViewedApplication({ ...application, ...data.documents });
        } else {
          setViewedApplication(application);
        }
        setAdminReply('');
        setViewModalOpen(true);
      })
      .catch(() => {
        setViewedApplication(application);
        setAdminReply('');
        setViewModalOpen(true);
      });
  };
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewedApplication(null);
  };

  // Edit ongoing subsidy handler
  const handleEditOngoing = (subsidy: any) => {
    setShowOngoingForm(true);
    setOngoingForm({
       title: subsidy.title || subsidy.name,
       description: subsidy.description
    });
    setEditingOngoingId(subsidy._id);
  };

  // Custom delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteOngoingId, setDeleteOngoingId] = useState<string | null>(null);

  // Open custom delete modal
  const openDeleteModal = (id: string) => {
    setDeleteOngoingId(id);
    setDeleteModalOpen(true);
  };

  // Close custom delete modal
  const closeDeleteModal = () => {
    setDeleteOngoingId(null);
    setDeleteModalOpen(false);
  };

  // Delete ongoing subsidy handler (no confirm)
  const handleDeleteOngoing = async () => {
    if (!deleteOngoingId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/subsidy/ongoing/${deleteOngoingId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchOngoingSubsidies();
      } else {
        alert(data.message || 'Failed to delete subsidy');
      }
    } catch {
      alert('Server error');
    }
    closeDeleteModal();
  };

  const handleOngoingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  setOngoingForm({ ...ongoingForm, [e.target.name]: e.target.value });
  };

  const handleOngoingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOngoingSubmitting(true);
    try {
      let res, data;
      if (editingOngoingId) {
        res = await fetch(`http://localhost:5000/api/subsidy/ongoing/${editingOngoingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ongoingForm)
        });
        data = await res.json();
      } else {
        res = await fetch('http://localhost:5000/api/subsidy/ongoing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ongoingForm)
        });
        data = await res.json();
      }
      if (data.success) {
        setOngoingForm(initialOngoingForm);
        setEditingOngoingId(null);
        fetchOngoingSubsidies();
      } else {
        alert(data.message || 'Failed to save subsidy');
      }
    } catch {
      alert('Server error');
    }
    setOngoingSubmitting(false);
  };

  const fetchOngoingSubsidies = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/subsidy/ongoing');
      const data = await res.json();
      if (data.success) setOngoingSubsidies(data.subsidies);
    } catch {}
  };

  useEffect(() => {
    fetchOngoingSubsidies();
  }, []);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Real subsidy applications from backend
  const [applications, setApplications] = useState<SubsidyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Disable page scroll when view modal is open
  useEffect(() => {
    if (viewModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewModalOpen]);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/subsidy/all');
        const data = await res.json();
        if (data.success && Array.isArray(data.applications)) {
          setApplications(data.applications);
        } else {
          setError(data.message || 'Failed to fetch applications');
        }
      } catch (err) {
        setError('Server error');
      }
      setLoading(false);
    };
    fetchApplications();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchApplications, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    // Use user.name, user.email, subsidyType, cropType, purpose, description for search
    const name = (app.user && typeof app.user === 'object' && app.user.name) ? app.user.name : '';
    const email = (app.user && typeof app.user === 'object' && app.user.email) ? app.user.email : '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.subsidyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`http://localhost:5000/api/subsidy/update-status/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setApplications(applications => applications.map(app =>
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Server error');
    }
  };

  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const approvedApplications = applications.filter(app => app.status === 'approved').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
  const totalAmount = applications
    .filter(app => app.status === 'approved')
    .reduce((sum, app) => sum + (app.expectedAmount || 0), 0);

  return (
    <AdminLayout>
  <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subsidy Management</h1>
          <p className="text-gray-600">Review and manage farmer subsidy applications</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                रु
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Total Applications</p>
                <p className="text-lg font-semibold text-gray-900">{totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Pending</p>
                <p className="text-lg font-semibold text-gray-900">{pendingApplications}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Approved</p>
                <p className="text-lg font-semibold text-gray-900">{approvedApplications}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Rejected</p>
                <p className="text-lg font-semibold text-gray-900">{rejectedApplications}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xl">
                रु
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Total Approved</p>
                <p className="text-lg font-semibold text-gray-900">NPR {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ongoing Subsidy Add/View Section (immediately after stats) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ongoing Subsidies</h2>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => setShowOngoingForm(v => !v)}
            >
              {showOngoingForm ? 'Hide Form' : 'Add Ongoing Subsidy'}
            </button>
          </div>
          {showOngoingForm && (
            <form onSubmit={handleOngoingSubmit} className="space-y-4 mb-8">
              <input name="title" value={ongoingForm.title} onChange={handleOngoingChange} required placeholder="Title" className="w-full border px-3 py-2 rounded" />
              <textarea name="description" value={ongoingForm.description} onChange={handleOngoingChange} required placeholder="Description" className="w-full border px-3 py-2 rounded" />
              <button type="submit" disabled={ongoingSubmitting} className="bg-green-600 text-white px-4 py-2 rounded">{ongoingSubmitting ? 'Adding...' : 'Add Subsidy'}</button>
            </form>
          )}
          <h3 className="text-lg font-semibold mb-2">Current Ongoing Subsidies</h3>
          <div className="space-y-3">
            {ongoingSubsidies.length === 0 ? (
              <p>No subsidies found.</p>
            ) : (
              <>
                {/* Show only the first card unless showAll is true */}
                <div key={ongoingSubsidies[0]._id} className="border rounded-xl p-4 bg-white shadow flex flex-col space-y-3 max-w-lg">
                  <div className="font-bold text-lg text-gray-900 mb-1">{ongoingSubsidies[0].title || ongoingSubsidies[0].name}</div>
                  <div className="break-words whitespace-pre-line text-gray-700 p-2 rounded bg-gray-50 border border-gray-200">{ongoingSubsidies[0].description}</div>
                  <div className="flex space-x-2 self-end">
                    <button
                      className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
                      onClick={() => handleEditOngoing(ongoingSubsidies[0])}
                    >Edit</button>
                    <button
                      className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
                      onClick={() => openDeleteModal(ongoingSubsidies[0]._id)}
                    >Delete</button>
                  </div>
                </div>
                {ongoingSubsidies.length > 1 && !showAll && (
                  <button className="mt-2 px-4 py-1 bg-green-600 text-white rounded" onClick={() => setShowAll(true)}>View All</button>
                )}
                {showAll && (
                  <>
                    {ongoingSubsidies.slice(1).map(sub => (
                      <div key={sub._id} className="border rounded-xl p-4 bg-white shadow flex flex-col space-y-3 max-w-lg">
                        <div className="font-bold text-lg text-gray-900 mb-1">{sub.title || sub.name}</div>
                        <div className="break-words whitespace-pre-line text-gray-700 p-2 rounded bg-gray-50 border border-gray-200">{sub.description}</div>
                        <div className="flex space-x-2 self-end">
                          <button
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
                            onClick={() => handleEditOngoing(sub)}
                          >Edit</button>
                          <button
                            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
                            onClick={() => openDeleteModal(sub._id)}
                          >Delete</button>
                        </div>
                      </div>
                    ))}
                    <button className="mt-2 px-4 py-1 bg-gray-300 text-gray-800 rounded" onClick={() => setShowAll(false)}>Hide</button>
                  </>
                )}
              </>
            )}
          </div>

        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Search applications..."
                />
              </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Subsidy Applications</h2>
              <span className="text-sm text-gray-500">
                Showing {filteredApplications.length} of {totalApplications} applications
                {loading && <span className="ml-2 text-xs text-gray-400">Loading...</span>}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farmer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subsidy Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farm Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{app.user && typeof app.user === 'object' && app.user.name ? app.user.name : ''}</div>
                          <div className="text-sm text-gray-500">{app.user && typeof app.user === 'object' && app.user.email ? app.user.email : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{app.subsidyType}</div>
                        <div className="text-gray-500">NPR {app.expectedAmount?.toLocaleString?.()}</div>
                        <div className="text-xs text-gray-400 mt-1">{app.purpose}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{app.cropType}</div>
                        <div className="text-gray-500">{app.farmArea} Kattha</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          Applied: {new Date(app.appliedDate).toLocaleDateString()}
                        </div>
                        {app.reviewedDate && (
                          <div className="flex items-center text-gray-500">
                            <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                            Reviewed: {new Date(app.reviewedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        <span className="ml-1 capitalize">{app.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center" onClick={() => handleViewModal(app)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <span className="mx-auto h-12 w-12 text-4xl text-gray-400 font-bold">Oops!</span>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      {/* View Modal */}
      {viewModalOpen && viewedApplication && (
  <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none', overflow: 'hidden' }}>
          {/* Blurred background overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-all" style={{ zIndex: 40, pointerEvents: 'auto' }} />
          <div
            className="fixed left-1/2 top-2 transform -translate-x-1/2 w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-left transition-all"
            style={{ zIndex: 60, pointerEvents: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold z-10" onClick={closeViewModal}>&times;</button>
            <div className="flex flex-col md:flex-row max-h-[65vh]">
              {/* Left Column - Application Details */}
              <div className="flex-1 p-8 flex flex-col justify-between bg-gradient-to-br from-green-50 via-blue-50 to-white rounded-l-2xl border-r-2 border-green-100 relative">
                <div>
                  <h2 className="text-3xl font-extrabold mb-4 text-green-800 flex items-center gap-2 drop-shadow-sm">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Application Details
                  </h2>
                  {viewedApplication.user && typeof viewedApplication.user === 'object' && viewedApplication.user.name && (
                    <div className="mb-3 text-lg text-gray-900 flex items-center gap-2 flex-nowrap font-semibold">
                      <User className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="font-bold text-green-700 text-lg flex items-center whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm">
                        {viewedApplication.user.name}
                        {viewedApplication.user.email && <span className="text-gray-500 text-base ml-2">({viewedApplication.user.email})</span>}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4 text-base">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">{viewedApplication.subsidyType}</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full font-semibold">{viewedApplication.cropType}</span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">{viewedApplication.status}</span>
                  </div>
                  <div className="mb-3 text-base text-gray-700 flex items-center gap-2 font-semibold">
                    <span className="font-bold">Farm Area:</span> {viewedApplication.farmArea} Kattha
                  </div>
                  <div className="mb-3 text-base text-gray-700 flex items-center gap-2 font-semibold">
                    <span className="font-bold">Expected Amount:</span> NPR {viewedApplication.expectedAmount?.toLocaleString?.()}
                  </div>
                  <div className="mb-3 text-base text-gray-700 flex items-center gap-2 font-semibold">
                    <span className="font-bold">Purpose:</span> {viewedApplication.purpose}
                  </div>
                  <div className="mb-3 text-base text-gray-700 flex items-center gap-2 font-semibold">
                    <span className="font-bold">Contact Number:</span> {viewedApplication.contactNumber}
                  </div>
                  <div className="mb-3 text-base text-gray-700 flex items-center gap-2 font-semibold">
                    <span className="font-bold">Applied Date:</span> {new Date(viewedApplication.appliedDate).toLocaleDateString()}
                  </div>
                  {viewedApplication.reviewedDate && (
                    <div className="mb-3 text-base text-gray-700 flex items-center gap-2 font-semibold">
                      <span className="font-bold">Reviewed Date:</span> {new Date(viewedApplication.reviewedDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="mb-1 text-base font-bold text-green-800 bg-green-100 rounded px-3 py-1 inline-block drop-shadow-sm">Description :</div>
                  <div className="mb-4 text-gray-900 text-lg whitespace-pre-line border-l-4 border-green-300 pl-4 max-h-32 min-h-24 overflow-y-auto font-medium drop-shadow-sm break-words" style={{wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflowY: 'auto'}}>{viewedApplication.description}</div>
                </div>
                {/* Approve/Reject buttons only if status is pending - now at upper right */}
                {viewedApplication.status === 'pending' && (
                  <div className="absolute top-12 right-8 flex gap-2 z-10">
                    <button
                      onClick={async () => {
                        await handleStatusChange(viewedApplication._id, 'approved');
                        setViewedApplication({ ...viewedApplication, status: 'approved' });
                      }}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 font-semibold shadow text-base"
                    >
                      Approve
                    </button>
                    <button
                      onClick={async () => {
                        await handleStatusChange(viewedApplication._id, 'rejected');
                        setViewedApplication({ ...viewedApplication, status: 'rejected' });
                      }}
                      className="bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 font-semibold shadow text-base"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
              {/* Right Column - Admin Reply Section */}
              <div className="w-full md:w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col p-6">
                <div className="font-semibold text-gray-700 mb-3 text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" /> Reply to Farmer
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4">
                  {viewedApplication.adminReplies && viewedApplication.adminReplies.length > 0 ? (
                    <div className="mt-1 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <div className="text-xs text-blue-700 font-semibold mb-1">Admin Replies:</div>
                      <ul className="list-disc pl-4">
                        {viewedApplication.adminReplies.map((reply, idx) => (
                          <li key={idx} className="text-sm text-blue-900 mb-1">{reply}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No replies yet.</div>
                  )}
                </div>
                {/* Reply Form: Only show if status is pending */}
                {viewedApplication.status === 'pending' && (
                  <form className="mt-auto" onSubmit={async (e) => {
                    e.preventDefault();
                    setReplySubmitting(true);
                    const res = await fetch(`http://localhost:5000/api/subsidy/reply/${viewedApplication._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reply: adminReply })
                    });
                    const data = await res.json();
                    if (data.success && data.application) {
                      setViewedApplication({
                        ...viewedApplication,
                        adminReplies: data.application.adminReplies
                      });
                      setApplications(applications.map(app =>
                        app._id === viewedApplication._id
                          ? { ...app, adminReplies: data.application.adminReplies }
                          : app
                      ));
                      setAdminReply('');
                    } else {
                      alert(data.message || 'Failed to send reply');
                    }
                    setReplySubmitting(false);
                  }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Reply</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-2 mb-2 focus:ring-green-500 focus:border-green-500"
                      rows={3}
                      placeholder="Type your reply..."
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                      required
                    />
                    <div className="flex justify-center mt-2">
                      <button type="submit" disabled={replySubmitting || !adminReply.trim()} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow">
                        {replySubmitting ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
            {/* Uploaded Documents Section: full width below both columns, horizontal layout */}
            {viewedApplication && (
              <div className="w-full px-8 pb-8 pt-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Documents</h3>
                <div className="flex flex-row gap-6 overflow-x-auto">
                  {[
                    { key: 'citizenshipFront', title: 'Citizenship (Front)' },
                    { key: 'citizenshipBack', title: 'Citizenship (Back)' },
                    { key: 'nidFront', title: 'National ID (Front)' },
                    { key: 'nidBack', title: 'National ID (Back)' },
                    { key: 'landOwnership', title: 'Land Ownership' },
                    { key: 'farmerReg', title: 'Farmer Registration' },
                    { key: 'other', title: 'Other Supporting Document' }
                  ].map(({ key, title }) => {
                    const filePath = (viewedApplication as any)[key];
                    if (!filePath) return null;
                    const backendUrl = `http://localhost:5000${filePath}`;
                    const isImage = backendUrl.match(/\.(jpg|jpeg|png)$/i);
                    return (
                      <div key={key} className="border rounded-lg p-3 bg-gray-50 min-w-[180px] flex flex-col items-center">
                        <div className={`font-medium text-gray-700 mb-2 text-center${key === 'farmerReg' ? ' whitespace-nowrap' : ''}`}>{title}</div>
                        {isImage ? (
                          <a href={backendUrl} target="_blank" rel="noopener noreferrer">
                            <img src={backendUrl} alt={typeof title === 'string' ? title : 'Document'} className="max-h-24 max-w-32 rounded mb-2 border cursor-pointer hover:scale-105 transition object-contain" />
                          </a>
                        ) : (
                          <div className="text-xs text-gray-500 mb-2">File: {backendUrl.split('/').pop()}</div>
                        )}
                        <a href={backendUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View</a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    {/* Custom Delete Confirmation Modal */}
    {deleteModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 p-8 max-w-md w-full z-10 flex flex-col items-center">
          <h2 className="text-xl font-bold text-red-700 mb-4">Delete Ongoing Subsidy</h2>
          <p className="text-gray-800 mb-6 text-center">Are you sure you want to delete this ongoing subsidy? This action cannot be undone.</p>
          <div className="flex gap-4">
            <button
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
              onClick={handleDeleteOngoing}
            >Delete</button>
            <button
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
              onClick={closeDeleteModal}
            >Cancel</button>
          </div>
        </div>
      </div>
    )}
    </AdminLayout>
  );
};

export default SubsidyManagement;