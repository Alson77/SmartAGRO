import React, { useState, useEffect } from 'react';

interface ScrapedSubsidy {
  _id: string;
  title: string;
  description: string;
  subsidyType: string;
  eligibleCrops: string[];
  maximumAmount?: number;
  sourceUrl: string;
  sourceName: string;
  lastUpdated: string;
  isActive: boolean;
  region: string;
  category: string;
}

const ScrapedSubsidyManagement: React.FC = () => {
  const [subsidies, setSubsidies] = useState<ScrapedSubsidy[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState({
    subsidyType: '',
    region: '',
    isActive: true
  });

  const fetchSubsidies = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filter.subsidyType) queryParams.append('subsidyType', filter.subsidyType);
      if (filter.region) queryParams.append('region', filter.region);

      const res = await fetch(`/api/subsidy/scraped?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setSubsidies(data.subsidies);
      }
    } catch (error) {
      console.error('Error fetching subsidies:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/subsidy/scraped/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch('/api/subsidy/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        alert(`Scraping completed! ${data.message}`);
        fetchSubsidies();
        fetchStats();
      } else {
        alert(`Scraping failed: ${data.message}`);
      }
    } catch (error) {
      alert('Error during scraping');
      console.error('Scraping error:', error);
    }
    setScraping(false);
  };

  const toggleSubsidyStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/subsidy/scraped/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        fetchSubsidies();
      } else {
        alert('Failed to update subsidy status');
      }
    } catch (error) {
      alert('Error updating subsidy status');
      console.error('Toggle error:', error);
    }
  };

  useEffect(() => {
    fetchSubsidies();
    fetchStats();
  }, [filter]);

  const formatAmount = (amount?: number) => {
    if (!amount) return 'N/A';
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Scraped Subsidy Management</h2>
        <button
          onClick={handleScrape}
          disabled={scraping}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {scraping ? '🔄 Scraping...' : '🔍 Scrape Now'}
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Subsidies</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-green-600">{stats.byType?.length || 0}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.bySource?.length || 0}</div>
            <div className="text-sm text-gray-600">Sources</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-lg font-bold text-gray-600">
              {stats.lastUpdated ? formatDate(stats.lastUpdated) : 'Never'}
            </div>
            <div className="text-sm text-gray-600">Last Updated</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subsidy Type</label>
            <select
              value={filter.subsidyType}
              onChange={(e) => setFilter({...filter, subsidyType: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="Seeds">Seeds</option>
              <option value="Fertilizer">Fertilizer</option>
              <option value="Equipment">Equipment</option>
              <option value="Irrigation">Irrigation</option>
              <option value="Crops">Crops</option>
              <option value="General Agricultural">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <select
              value={filter.region}
              onChange={(e) => setFilter({...filter, region: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Regions</option>
              <option value="Nepal">Nepal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filter.isActive.toString()}
              onChange={(e) => setFilter({...filter, isActive: e.target.value === 'true'})}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subsidies List */}
      <div className="bg-white rounded shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Scraped Subsidies ({subsidies.length})</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">Loading subsidies...</div>
        ) : subsidies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No subsidies found. Try scraping or adjusting filters.
          </div>
        ) : (
          <div className="divide-y">
            {subsidies.map((subsidy) => (
              <div key={subsidy._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold">{subsidy.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        subsidy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {subsidy.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {subsidy.subsidyType}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-2">{subsidy.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                      <span>💰 Amount: {formatAmount(subsidy.maximumAmount)}</span>
                      <span>🌾 Crops: {subsidy.eligibleCrops.join(', ') || 'All Crops'}</span>
                      <span>📍 Region: {subsidy.region}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>🔗 Source: {subsidy.sourceName}</span>
                      <span>📅 Updated: {formatDate(subsidy.lastUpdated)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleSubsidyStatus(subsidy._id)}
                      className={`px-3 py-1 text-sm rounded ${
                        subsidy.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {subsidy.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <a
                      href={subsidy.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View Source
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapedSubsidyManagement;