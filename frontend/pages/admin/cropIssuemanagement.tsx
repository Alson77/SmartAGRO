import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';
import { AlertTriangle, Search, Filter, Calendar, Clock, CheckCircle, XCircle, Eye, User, MapPin } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface IssueReply {
  message: string;
  senderType: 'admin' | 'farmer';
  admin?: { name: string; email: string; role?: string };
  farmer?: { name: string; email: string; _id?: string };
  createdAt: string;
}

interface CropIssue {
  id: string;
  farmer?: {
    name?: string;
    email?: string;
    [key: string]: any;
  };
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  urgency?: boolean;
  reportedDate: Date;
  resolvedDate?: Date;
  location: string;
  description: string;
  images?: string[];
  replies?: IssueReply[];
}

const CropIssueManagement: React.FC = () => {
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [issues, setIssues] = useState<CropIssue[]>([]);
  const [viewIssue, setViewIssue] = useState<CropIssue | null>(null);

  // Freeze page scroll when modal is open
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
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  
  // Chart data and filters
  const [issueTrends, setIssueTrends] = useState<Array<{ month: string; count: number }>>([]);
  const [issuesPeriod, setIssuesPeriod] = useState<number>(12);
  const [severityStats, setSeverityStats] = useState<{ low: number; medium: number; high: number }>({ low: 0, medium: 0, high: 0 });

  // No localStorage persistence for filters

  // Fetch issues from backend
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await fetch('/api/issues');
        const data = await res.json();
        const issuesWithReplies = data.map((issue: any) => ({
          id: issue._id,
          farmer: issue.farmer || null,
          title: issue.title,
          category: issue.category,
          severity: issue.severity,
          status: issue.status,
          urgency: issue.urgency,
          reportedDate: new Date(issue.reportedDate),
          resolvedDate: issue.resolvedDate ? new Date(issue.resolvedDate) : undefined,
          location: issue.location,
          description: issue.description,
          images: Array.isArray(issue.images) ? issue.images : [],
          replies: (issue.replies || []).map((r: any) => ({
            message: r.message,
            senderType: r.senderType,
            admin: r.admin ? { name: r.admin.name, email: r.admin.email, role: r.admin.role } : undefined,
            farmer: r.farmer ? { name: r.farmer.name, email: r.farmer.email, _id: r.farmer._id } : undefined,
            createdAt: r.createdAt
          }))
        }));
        setIssues(issuesWithReplies);
      } catch {
        setIssues([]);
      }
    };
    fetchIssues();
  }, []);

  // Auto-refresh only when viewing a specific issue in modal
  useEffect(() => {
    if (viewIssue) {
      const refreshIssue = async () => {
        try {
          const res = await fetch(`/api/issues/${viewIssue.id}`);
          if (res.ok) {
            const updatedIssue = await res.json();
            // Always preserve farmer info if present in the original viewIssue
            // Merge farmer info from both updatedIssue and viewIssue, preferring the most complete
            let mergedFarmer = updatedIssue.farmer || viewIssue.farmer || null;
            if (updatedIssue.farmer && viewIssue.farmer) {
              mergedFarmer = {
                ...viewIssue.farmer,
                ...updatedIssue.farmer,
                name: updatedIssue.farmer.name || viewIssue.farmer.name,
                email: updatedIssue.farmer.email || viewIssue.farmer.email
              };
            }
            const formattedIssue = {
              id: updatedIssue._id,
              farmer: mergedFarmer,
              title: updatedIssue.title,
              category: updatedIssue.category,
              severity: updatedIssue.severity,
              status: updatedIssue.status,
              urgency: updatedIssue.urgency,
              reportedDate: new Date(updatedIssue.reportedDate),
              resolvedDate: updatedIssue.resolvedDate ? new Date(updatedIssue.resolvedDate) : undefined,
              location: updatedIssue.location,
              description: updatedIssue.description,
              images: Array.isArray(updatedIssue.images) ? updatedIssue.images : [],
              replies: (updatedIssue.replies || []).map((r: any) => ({
                message: r.message,
                senderType: r.senderType,
                admin: r.admin ? { name: r.admin.name, email: r.admin.email, role: r.admin.role } : undefined,
                farmer: r.farmer ? { name: r.farmer.name, email: r.farmer.email, _id: r.farmer._id } : undefined,
                createdAt: r.createdAt
              }))
            };
            setViewIssue(formattedIssue);
            setIssues(prev => prev.map(issue => 
              issue.id === viewIssue.id 
                ? formattedIssue
                : issue
            ));
          }
        } catch (err) {
          console.error('Error refreshing issue:', err);
        }
      };
      const interval = setInterval(refreshIssue, 5000);
      return () => clearInterval(interval);
    }
  }, [viewIssue]);

  // Fetch chart data when period changes
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`/api/admin/issue-trends?period=${issuesPeriod}`);
        const data = await res.json();
        setIssueTrends(Array.isArray(data) ? data : []);
      } catch {
        setIssueTrends([]);
      }
    };
    fetchTrends();
  }, [issuesPeriod]);

  // Fetch severity stats
  useEffect(() => {
    const fetchSeverityStats = () => {
      fetch('/api/admin/issue-severity-stats')
        .then(res => res.json())
        .then(data => setSeverityStats(data))
        .catch(() => setSeverityStats({ low: 0, medium: 0, high: 0 }));
    };
    fetchSeverityStats();
    const interval = setInterval(fetchSeverityStats, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.farmer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

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
      case 'closed':
        return 'bg-gray-100 text-gray-800';
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
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // JWT token retrieval (customize as needed)
  const getToken = () => {
    return sessionStorage.getItem('krishisathi_admin_token');
  };

  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null); // issueId being updated

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    setStatusError(null);
    setStatusLoading(issueId);
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        setStatusError(data.message || 'Failed to update status');
        setStatusLoading(null);
        return;
      }
      const data = await res.json();
      setIssues(prev => prev.map(issue => issue.id === issueId ? {
        ...issue,
        status: data.issue.status
      } : issue));
    } catch (err: any) {
      setStatusError('Network error');
    }
    setStatusLoading(null);
  };

  const totalIssues = issues.length;
  const openIssues = issues.filter(issue => issue.status === 'open').length;
  const inProgressIssues = issues.filter(issue => issue.status === 'in_progress').length;
  const resolvedIssues = issues.filter(issue => issue.status === 'resolved').length;
  // Removed unused highPriorityIssues variable

  return (
    <AdminLayout>
      <div className="space-y-6 min-h-screen backdrop-blur-sm">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Crop Issue Management</h1>
          <p className="text-gray-600">Monitor and manage farmer-reported crop issues and problems</p>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Issue Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Crop Issues Trend</h2>
              <select
                value={issuesPeriod}
                onChange={(e) => setIssuesPeriod(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={1}>Last Month</option>
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </select>
            </div>
            <Line
              data={{
                labels: issueTrends.map(d => {
                  const [year, month] = d.month.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [
                  {
                    label: 'Reported Issues',
                    data: issueTrends.map(d => d.count),
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>

          {/* Severity Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Issues by Severity</h2>
            <Bar
              data={{
                labels: ['Low', 'Medium', 'High'],
                datasets: [
                  {
                    label: 'Number of Issues',
                    data: [severityStats.low, severityStats.medium, severityStats.high],
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.7)',  // green for low
                      'rgba(251, 191, 36, 0.7)', // yellow for medium
                      'rgba(239, 68, 68, 0.7)',  // red for high
                    ],
                    borderColor: [
                      'rgb(34, 197, 94)',
                      'rgb(251, 191, 36)',
                      'rgb(239, 68, 68)',
                    ],
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-orange-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Total Issues</p>
                <p className="text-lg font-semibold text-gray-900">{totalIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Open</p>
                <p className="text-lg font-semibold text-gray-900">{openIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">In Progress</p>
                <p className="text-lg font-semibold text-gray-900">{inProgressIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">Resolved</p>
                <p className="text-lg font-semibold text-gray-900">{resolvedIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-900">High Priority</p>
                <p className="text-lg font-semibold text-gray-900">
                  {
                    issues
                      .filter(issue =>
                        Boolean((issue as any).urgency) &&
                        issue.status !== 'resolved' &&
                        issue.status !== 'closed'
                      ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Search issues..."
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                id="severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issues Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Crop Issues</h2>
              <span className="text-sm text-gray-500">
                Showing {filteredIssues.length} of {totalIssues} issues
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farmer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium mb-1">{issue.title}</div>
                        <div className="text-xs text-blue-600 bg-blue-100 inline-block px-2 py-1 rounded-full mb-2">
                          {issue.category}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {issue.description.length > 30 ? issue.description.substring(0, 30) + '...' : issue.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-orange-700">{issue.farmer?.name || 'Unknown'}</div>
                          {issue.farmer?.email && <div className="text-xs text-gray-500">{issue.farmer.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="truncate">{issue.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {getStatusIcon(issue.status)}
                        <span className="ml-1 capitalize">{issue.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          {issue.reportedDate.toLocaleDateString()}
                        </div>
                        {issue.resolvedDate && (
                          <div className="flex items-center text-gray-500">
                            <CheckCircle className="h-3 w-3 text-gray-400 mr-1" />
                            {issue.resolvedDate.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center" onClick={() => { setViewIssue(issue); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        {/* STATUS BUTTONS: Now placed to the right of the View button */}
                        {issue.status !== 'resolved' && issue.status !== 'closed' && (
                          <>
                            {issue.status === 'open' && (
                              <button
                                onClick={() => handleStatusChange(issue.id, 'in_progress')}
                                className={`ml-1 px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition ${statusLoading === issue.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={statusLoading === issue.id}
                              >
                                {statusLoading === issue.id ? 'Starting...' : 'Start'}
                              </button>
                            )}
                            {issue.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusChange(issue.id, 'resolved')}
                                className={`ml-1 px-3 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition ${statusLoading === issue.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={statusLoading === issue.id}
                              >
                                {statusLoading === issue.id ? 'Resolving...' : 'Resolve'}
                              </button>
                            )}
                            {statusError && (
                              <div className="text-xs text-red-500 mt-1">{statusError}</div>
                            )}
                          </>
                        )}
      {/* Issue Details Modal */}
      {viewIssue && (
        <div className="fixed inset-0 z-50" style={{ pointerEvents: 'auto', overflow: 'hidden' }}>
          {/* Blurred background overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-5 backdrop-blur-md transition-all" style={{ zIndex: 40, pointerEvents: 'auto' }} />
          <div
            className="fixed left-1/2 top-2 transform -translate-x-1/2 w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-left transition-all"
            style={{ zIndex: 60, pointerEvents: 'auto', height: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold z-10" onClick={() => setViewIssue(null)}>&times;</button>
            <div className="flex flex-col md:flex-row h-full overflow-y-auto">
              {/* Left: Issue Details */}
              <div className="flex-1 p-8">
                <h2 className="text-3xl font-extrabold mb-4 text-orange-700 flex items-center gap-3">
                  <AlertTriangle className="h-7 w-7 text-orange-500" />
                  {viewIssue.title}
                </h2>
                {/* Farmer identification prominently in modal */}
                {viewIssue.farmer?.name && (
                  <div className="mb-4 text-lg text-gray-700 flex items-center gap-3">
                    <User className="h-6 w-6 text-orange-400" />
                    <span className="font-bold text-orange-700">{viewIssue.farmer.name}</span>
                    {viewIssue.farmer.email && <span className="text-gray-400">({viewIssue.farmer.email})</span>}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mb-4 text-base">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">{viewIssue.category}</span>
                  <span className={`px-3 py-1 rounded-full font-semibold ${getSeverityColor(viewIssue.severity)}`}>{viewIssue.severity.toUpperCase()}</span>
                  <span className={`px-3 py-1 rounded-full font-semibold ${getStatusColor(viewIssue.status)}`}>{viewIssue.status.replace('_', ' ')}</span>
                </div>
          {/* Uploaded Images Section */}
          {viewIssue.images && viewIssue.images.length > 0 && (
            <div className="mb-6">
              <div className="font-semibold text-base text-gray-700 mb-2 px-4 py-1 rounded-full bg-orange-50 border border-orange-200 shadow inline-block">Uploaded Images</div>
              <div className="mt-2 p-4 rounded-xl bg-gray-100 border border-gray-200 flex flex-wrap gap-3">
                {viewIssue.images.map((img, idx) => {
                  let src = '';
                  if (typeof img === 'object' && img !== null && 'name' in img) {
                    src = URL.createObjectURL(img);
                  } else if (typeof img === 'string') {
                    if (img.startsWith('/uploads/')) {
                      src = `http://localhost:5000${img}`;
                    } else if (/^https?:\/\//.test(img)) {
                      src = img;
                    } else {
                      src = `http://localhost:5000/uploads/${img}`;
                    }
                  }
                  if (!src) src = 'https://via.placeholder.com/96?text=No+Image';
                  return (
                    <div key={idx} className="relative group">
                      <img
                        src={src}
                        alt={`issue-img-${idx}`}
                        className="h-24 w-24 object-cover rounded-lg border-2 border-orange-200 cursor-pointer bg-white shadow-sm"
                        onClick={() => window.open(src, '_blank')}
                        title="View full image"
                        onError={e => { e.currentTarget.src = 'https://via.placeholder.com/96?text=No+Image'; }}
                      />
                      <span className="absolute bottom-2 right-2 bg-white bg-opacity-80 rounded-full p-1 shadow text-xs opacity-0 group-hover:opacity-100">🔍</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
                <div className="mb-4 text-gray-800 text-lg whitespace-pre-line border-l-4 border-orange-300 pl-5 font-medium leading-relaxed">
                  <div className="mb-2 inline-block px-4 py-1 rounded-full bg-orange-100 border border-orange-200 font-semibold text-base text-gray-700 shadow">Description</div>
                  <textarea
                    className="border-2 border-orange-300 bg-orange-50 min-h-[180px] w-[480px] p-4 text-lg text-gray-800 font-medium leading-relaxed resize-none"
                    value={viewIssue.description}
                    disabled
                    readOnly
                  />
                </div>
                <div className="mb-3 text-sm text-gray-500 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold text-gray-700">{viewIssue.location}</span>
                </div>
                <div className="mb-3 text-sm text-gray-500 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold text-gray-700">Reported: {viewIssue.reportedDate.toLocaleString()}</span>
                </div>
                {/* If farmer info exists but not in farmer object, fallback (shouldn't happen with new backend) */}
              </div>
              {/* Right: Replies & Reply Form */}
              <div className="w-full md:w-1/2 bg-gray-50 border-l border-gray-200 flex flex-col p-8">
                <div className="font-semibold text-gray-700 mb-3 text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" /> Conversations
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 mb-4">
                  {viewIssue.replies && viewIssue.replies.length > 0 ? (
                    viewIssue.replies.map((reply, idx) => {
                      let byText = '';
                      if (reply.senderType === 'farmer') {
                        byText = 'By Farmer';
                      } else if (reply.senderType === 'admin' && reply.admin?.name) {
                        byText = `By ${reply.admin.name}`;
                      } else {
                        byText = 'By Admin';
                      }
                      return (
                        <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div className="text-sm text-gray-800">{reply.message}</div>
                          <div className="text-xs text-gray-500 mt-1">{byText} | {new Date(reply.createdAt).toLocaleString()}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-500">No replies yet.</div>
                  )}
                </div>
                {/* Reply Form: Only show if issue is not resolved or closed */}
                {viewIssue.status !== 'resolved' && viewIssue.status !== 'closed' && (
                  <form className="mt-auto" onSubmit={async (e) => {
                    e.preventDefault();
                    setIsReplying(true);
                    // Use real admin ObjectId
                    const adminId = '68d276d742a09de45ffa1dcd';
                    const res = await fetch(`/api/issues/${viewIssue.id}/reply`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ message: replyText, adminId })
                    });
                    if (res.ok) {
                      // Refresh replies
                      const updated = await res.json();
                      const updatedReplies = updated.issue.replies.map((r: any) => ({
                        message: r.message,
                        admin: r.admin ? { name: r.admin.name, email: r.admin.email } : undefined,
                        createdAt: r.createdAt
                      }));
                      setViewIssue({ ...viewIssue, replies: updatedReplies });
                      // Update the issues array as well
                      setIssues(prev => prev.map(issue => 
                        issue.id === viewIssue.id 
                          ? { ...issue, replies: updatedReplies }
                          : issue
                      ));
                      setReplyText('');
                    } else {
                      alert('Failed to add reply');
                    }
                    setIsReplying(false);
                  }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Reply</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-2 mb-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      required
                    />
                    <div className="flex justify-center mt-2">
                      <button type="submit" disabled={isReplying || !replyText.trim()} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold shadow">
                        {isReplying ? 'Replying...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {filteredIssues.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No issues found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CropIssueManagement;