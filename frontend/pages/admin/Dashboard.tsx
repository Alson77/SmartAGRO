    // Removed duplicate fetch for issues list at the top. This logic is already inside useEffect after setStats is defined.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);
import AdminLayout from '../../components/Layout/AdminLayout';
import { Calendar } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // State for stats
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeIssues: 0,
    resolvedIssues: 0,
    pendingSubsidies: 0,
  });
  // State for trend charts
  const [subsidyTrends, setSubsidyTrends] = useState<Array<{ month: string; count: number }>>([]);
  const [farmerTrends, setFarmerTrends] = useState<Array<{ month: string; count: number }>>([]);
  const [issueTrends, setIssueTrends] = useState<Array<{ month: string; count: number }>>([]);
  // State for period filters
  const [subsidyPeriod, setSubsidyPeriod] = useState<number>(12);
  const [farmerPeriod, setFarmerPeriod] = useState<number>(12);
  const [issuesPeriod, setIssuesPeriod] = useState<number>(12);
  // State for recent activity
  const [recentFarmers, setRecentFarmers] = useState<any[]>([]);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [recentSubsidies, setRecentSubsidies] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = () => {
      // Fetch stats except totalFarmers and resolvedIssues
      fetch('/api/admin/dashboard-stats')
        .then(res => res.json())
        .then(data => setStats(prev => ({ ...prev, ...data })));
      // Fetch farmers list for totalFarmers
      fetch('/api/admin/farmers')
        .then(res => res.json())
        .then(data => setStats(prev => ({ ...prev, totalFarmers: Array.isArray(data) ? data.length : 0 })));
      // Fetch issues list for activeIssues and resolvedIssues
      fetch('/api/issues')
        .then(res => res.json())
        .then(data => {
          const activeCount = Array.isArray(data) ? data.filter((issue: any) => issue.status === 'open' || issue.status === 'in_progress').length : 0;
          const resolvedCount = Array.isArray(data) ? data.filter((issue: any) => issue.status === 'resolved').length : 0;
          setStats(prev => ({ ...prev, activeIssues: activeCount, resolvedIssues: resolvedCount }));
        });
      // Fetch recent activity
      fetch('/api/admin/recent-farmers')
        .then(res => res.json())
        .then(data => setRecentFarmers(data));
      fetch('/api/admin/recent-issues')
        .then(res => res.json())
        .then(data => setRecentIssues(data));
      fetch('/api/admin/recent-subsidies')
        .then(res => res.json())
        .then(data => setRecentSubsidies(data));
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch trend data when period changes
  useEffect(() => {
    fetch(`/api/admin/subsidy-trends?period=${subsidyPeriod}`)
      .then(res => res.json())
      .then(data => setSubsidyTrends(data));
  }, [subsidyPeriod]);

  useEffect(() => {
    fetch(`/api/admin/farmer-trends?period=${farmerPeriod}`)
      .then(res => res.json())
      .then(data => setFarmerTrends(data));
  }, [farmerPeriod]);

  useEffect(() => {
    fetch(`/api/admin/issue-trends?period=${issuesPeriod}`)
      .then(res => res.json())
      .then(data => setIssueTrends(data));
  }, [issuesPeriod]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of Krishi Sathi platform</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Total Farmers</span>
            <span className="text-2xl font-bold text-orange-600">{stats.totalFarmers}</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Active Crop Issues</span>
            <span className="text-2xl font-bold text-blue-600">{stats.activeIssues}</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Resolved Issues</span>
            <span className="text-2xl font-bold text-green-600">{stats.resolvedIssues}</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Pending Subsidies</span>
            <span className="text-2xl font-bold text-red-600">{stats.pendingSubsidies}</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Crop Issues Trend */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Crop Issues Trend</h2>
              <select
                value={issuesPeriod}
                onChange={(e) => setIssuesPeriod(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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

          {/* Farmer Registrations Trend */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">New Farmer Registrations</h2>
              <select
                value={farmerPeriod}
                onChange={(e) => setFarmerPeriod(Number(e.target.value))}
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
                labels: farmerTrends.map(d => {
                  const [year, month] = d.month.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [
                  {
                    label: 'New Farmers',
                    data: farmerTrends.map(d => d.count),
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
        </div>

        {/* Subsidy Applications Trend */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Subsidy Applications Trend</h2>
            <select
              value={subsidyPeriod}
              onChange={(e) => setSubsidyPeriod(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last Month</option>
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          <Line
            data={{
              labels: subsidyTrends.map(d => {
                const [year, month] = d.month.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }),
              datasets: [
                {
                  label: 'Subsidy Applications',
                  data: subsidyTrends.map(d => d.count),
                  borderColor: '#3B82F6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
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

        {/* Recent Activity List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Latest Farmer Registrations */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Latest Farmers</h3>
            <ul className="space-y-2">
              {recentFarmers.length === 0 ? (
                <li className="text-xs text-gray-500">No recent registrations.</li>
              ) : (
                recentFarmers.map((farmer, idx) => (
                  <li 
                    key={idx} 
                    className="text-sm text-gray-700 flex justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/admin/farmers')}
                  >
                    <span>{farmer.name}</span>
                    <span className="text-xs text-gray-400">{farmer.email}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          {/* Recently Reported Issues */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Issues</h3>
            <ul className="space-y-2">
              {recentIssues.length === 0 ? (
                <li className="text-xs text-gray-500">No recent issues.</li>
              ) : (
                recentIssues.map((issue, idx) => (
                  <li 
                    key={idx} 
                    className="text-sm text-gray-700 flex justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/admin/issues')}
                  >
                    <span>{issue.title}</span>
                    <span className="text-xs text-gray-400">{issue.status}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          {/* Recent Subsidy Applications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Subsidy Applications</h3>
            <ul className="space-y-2">
              {recentSubsidies.length === 0 ? (
                <li className="text-xs text-gray-500">No recent applications.</li>
              ) : (
                recentSubsidies.map((subsidy, idx) => (
                  <li 
                    key={idx} 
                    className="text-sm text-gray-700 flex justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/admin/subsidies')}
                  >
                    <span>{subsidy.farmerName}</span>
                    <span className="text-xs text-gray-400">{subsidy.status}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;