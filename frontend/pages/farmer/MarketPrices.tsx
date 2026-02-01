import React, { useState, useEffect } from 'react';
import FarmerLayout from '../../components/Layout/FarmerLayout';
import { Search, Calendar, Eye, RefreshCw } from 'lucide-react';

interface MarketPrice {
  commodityname: string;
  minprice: string;
  maxprice: string;
  avgprice: string;
  commodityunit: string;
}
const MarketPrices: React.FC = () => {
  // Persist UI state in localStorage
  const [selectedMarket, setSelectedMarket] = useState(() => localStorage.getItem('farmer_market_selectedMarket') || 'kalimati');
  // Only one option for now, but structure allows future options
  const marketOptions = [
    { value: 'kalimati', label: 'Kalimati Market' }
  ];
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('farmer_market_searchTerm') || '');
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(() => localStorage.getItem('farmer_market_showAll') === 'true');
  const [sortBy, setSortBy] = useState<'max' | 'min' | 'none'>(() => (localStorage.getItem('farmer_market_sortBy') as any) || 'none');

  // Persist UI state
  useEffect(() => { localStorage.setItem('farmer_market_selectedMarket', selectedMarket); }, [selectedMarket]);
  useEffect(() => { localStorage.setItem('farmer_market_searchTerm', searchTerm); }, [searchTerm]);
  useEffect(() => { localStorage.setItem('farmer_market_showAll', showAll ? 'true' : 'false'); }, [showAll]);
  useEffect(() => { localStorage.setItem('farmer_market_sortBy', sortBy); }, [sortBy]);

  const fetchPrices = () => {
    if (selectedMarket !== 'kalimati') {
      setPrices([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    fetch(`/api/market-prices?market=${selectedMarket}`)
      .then(res => res.json())
      .then(data => {
        setPrices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch prices');
        setLoading(false);
      });
  };
  useEffect(() => {
    if (selectedMarket !== 'kalimati') {
      setPrices([]);
      setLoading(false);
      setError('');
      return;
    }
    let interval: NodeJS.Timeout | null = null;
    fetchPrices();
    interval = setInterval(fetchPrices, 10000);
    return () => { if (interval) clearInterval(interval); };
  }, [selectedMarket]);

  // Convert minprice/maxprice to number for sorting
  const pricesWithNumber = prices.map((p, idx) => {
    const minNumber = parseFloat(p.minprice.replace(/,/g, '')) || 0;
    const maxNumber = parseFloat(p.maxprice.replace(/,/g, '')) || 0;
    return {
      ...p,
      minNumber,
      maxNumber,
      maxSortNumber: Math.max(minNumber, maxNumber),
      originalIndex: idx
    };
  });

  let filteredPrices = pricesWithNumber.filter(p =>
    p.commodityname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortBy === 'max') {
    filteredPrices = filteredPrices.slice().sort((a, b) => {
      if (b.maxSortNumber !== a.maxSortNumber) {
        return b.maxSortNumber - a.maxSortNumber;
      } else {
        return b.minNumber - a.minNumber;
      }
    });
  } else if (sortBy === 'min') {
    filteredPrices = filteredPrices.slice().sort((a, b) => {
      if (a.minNumber !== b.minNumber) {
        return a.minNumber - b.minNumber;
      } else {
        // If min prices are equal, show the more expensive (higher max) first
        return b.maxSortNumber - a.maxSortNumber;
      }
    });
  } else {
    // 'none' - original API order
    filteredPrices = filteredPrices.slice().sort((a, b) => a.originalIndex - b.originalIndex);
  }

  const displayPrices = showAll ? filteredPrices : filteredPrices.slice(0, 10);

  return (
    <FarmerLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Market Prices</h1>
            <p className="text-gray-600">Current wholesale prices from major markets in Nepal</p>
          </div>
          <div className="flex flex-col items-start md:items-end mt-4 md:mt-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Market</label>
            <select
              value={selectedMarket}
              onChange={e => setSelectedMarket(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            >
              {marketOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search, Sort */}
        {selectedMarket === 'kalimati' && (
          <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Commodity</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Search..."
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-end md:space-x-2 items-start">
              <div>
                <span className="text-xs text-gray-500 mb-2 block">Click again to reset to normal order</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSortBy(prev => prev === 'max' ? 'none' : 'max')}
                    className={`px-4 py-2 rounded-lg font-semibold ${sortBy === 'max' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-700 hover:text-white transition`}
                  >
                    Max Price (Expensive)
                  </button>
                  <button
                    onClick={() => setSortBy(prev => prev === 'min' ? 'none' : 'min')}
                    className={`px-4 py-2 rounded-lg font-semibold ${sortBy === 'min' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} hover:bg-blue-700 hover:text-white transition`}
                  >
                    Min Price (Cheap)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Info or No Data Message */}
        {selectedMarket === 'kalimati' ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-blue-800">Market Data Source:</span>
                  <span className="text-black">Kalimati Fruits and Vegetable Market, Kathmandu</span>
                </div>
                <div className="flex mt-4 md:mt-0 space-x-2">
                  {!showAll && filteredPrices.length > 10 && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-semibold shadow hover:from-green-500 hover:to-green-700 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 text-xs"
                    >
                      <Eye className="w-3 h-3" />
                      View All
                    </button>
                  )}
                  {showAll && filteredPrices.length > 10 && (
                    <button
                      onClick={() => setShowAll(false)}
                      className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white font-semibold shadow hover:from-gray-500 hover:to-gray-700 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs"
                    >
                      <Eye className="w-3 h-3 rotate-180" />
                      View Less
                    </button>
                  )}
                  <button
                    onClick={fetchPrices}
                    className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white font-semibold shadow hover:from-blue-500 hover:to-blue-700 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 text-xs"
                    disabled={loading}
                    title="Auto-updates every 10 seconds"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Updating...' : 'Refresh Now'}
                  </button>
                  <span className="text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                    Auto-updating
                  </span>
                </div>
              </div>
            </div>
            {/* Price Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mt-2">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commodity Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-red-500">{error}</td>
                    </tr>
                  ) : filteredPrices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">No results found</td>
                    </tr>
                  ) : (
                    displayPrices.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.commodityname}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{p.commodityunit}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">NPR {p.minprice}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">NPR {p.maxprice}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">NPR {p.avgprice}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="text-right text-xs text-gray-500 mt-2 pr-2">Showing ({displayPrices.length}) Records</div>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-yellow-800 font-semibold">
            No market available.
          </div>
        )}
      </div>
    </FarmerLayout>
  );
}

export default MarketPrices;