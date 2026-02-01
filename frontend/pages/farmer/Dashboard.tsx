import React, { useEffect, useState } from 'react';
import FarmerLayout from '../../components/Layout/FarmerLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getWeatherData, CurrentWeather, ForecastDay, AgriculturalData } from '../../services/weatherService';

interface WeatherData {
  current: CurrentWeather | null;
  forecast: ForecastDay[];
  agricultural: AgriculturalData | null;
}
import { 
  Camera, 
  MessageCircle, 
  AlertTriangle, 
  User, 
  ArrowRight,
  BarChart3,
  Activity,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Eye,
  Gauge
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';


import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatSessionsCount, setChatSessionsCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const res = await fetch(`/api/farmer/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('krishisathi_token');
        
        // Fetch all dashboard data including chat sessions count and disease scans
        // ...existing code...
        const [subsidiesRes, issuesRes, marketRes, chatCountRes, diseaseScansRes] = await Promise.all([
          fetch('/api/subsidy/history', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/issues/my-issues', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/market-prices'),
          fetch('/api/chat/sessions/count', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/disease/recent?limit=1000', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        // ...existing code...

        // Log response status
        // ...existing code...

        let subsidies = [];
        let issues = [];
        let marketPrices = [];
        let chatCount = 0;
        let diseaseScans = [];

        if (subsidiesRes.ok) {
          const subsidyData = await subsidiesRes.json();
          // ...existing code...
          subsidies = subsidyData.applications || subsidyData.subsidies || subsidyData || [];
        } else {
          const errorText = await subsidiesRes.text();
          console.error('Subsidies API error:', subsidiesRes.status, errorText);
        }

        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          // ...existing code...
          issues = issuesData.issues || issuesData || [];
        } else {
          const errorText = await issuesRes.text();
          console.error('Issues API error:', issuesRes.status, errorText);
        }

        if (marketRes.ok) {
          marketPrices = await marketRes.json();
        } else {
          const errorText = await marketRes.text();
          console.error('Market API error:', marketRes.status, errorText);
        }

        if (chatCountRes.ok) {
          const chatData = await chatCountRes.json();
          // ...existing code...
          chatCount = chatData.count || 0;
          // ...existing code...
          setChatSessionsCount(chatCount);
        } else {
          console.error('❌ Chat count API error:', chatCountRes.status);
          const errorText = await chatCountRes.text();
          console.error('❌ Chat count error details:', errorText);
        }

        if (diseaseScansRes.ok) {
          const scansData = await diseaseScansRes.json();
          // ...existing code...
          diseaseScans = Array.isArray(scansData) ? scansData : [];
          // ...existing code...
        } else {
          console.error('❌ Disease scans API error:', diseaseScansRes.status);
          const errorText = await diseaseScansRes.text();
          console.error('❌ Disease scans error details:', errorText);
        }

        // ...existing code...

        // Sort by most recent first
        const sortedIssues = Array.isArray(issues) 
          ? issues.sort((a: any, b: any) => new Date(b.reportedDate || b.createdAt).getTime() - new Date(a.reportedDate || a.createdAt).getTime())
          : [];
        const sortedSubsidies = Array.isArray(subsidies)
          ? subsidies.sort((a: any, b: any) => new Date(b.appliedDate || b.createdAt).getTime() - new Date(a.appliedDate || a.createdAt).getTime())
          : [];

        setDashboardStats({
          subsidies: sortedSubsidies,
          issues: sortedIssues,
          marketPrices,
          diseaseScans: diseaseScans,
          totalScans: diseaseScans.length || 0,
          totalIssues: sortedIssues.length || 0,
          totalSubsidies: sortedSubsidies.length || 0,
          totalChatSessions: chatCount,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        // Use farmer's location from user context or profile, otherwise default to Kathmandu
        const city = user?.location || profile?.location || 'Kathmandu';
        const data = await getWeatherData(city);
        setWeatherData(data);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    };

    // Only fetch weather if we have user data
    if (user) {
      fetchWeather();
      // Refresh weather every 10 minutes for real-time updates
      const interval = setInterval(fetchWeather, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, user?.location, profile?.location]);

  // Use real weather data or fallback to sample data
  const currentWeather = weatherData?.current || {
    temp: 28,
    condition: 'Loading...',
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    pressure: 1013,
    feelsLike: 30,
  };

  const weeklyForecast = weatherData?.forecast && weatherData.forecast.length > 0 
    ? weatherData.forecast 
    : [
        { day: 'Mon', temp: 28, condition: 'Sunny', icon: 'sun', minTemp: 18, maxTemp: 30 },
        { day: 'Tue', temp: 27, condition: 'Cloudy', icon: 'cloud', minTemp: 19, maxTemp: 29 },
        { day: 'Wed', temp: 25, condition: 'Rainy', icon: 'rain', minTemp: 20, maxTemp: 27 },
        { day: 'Thu', temp: 26, condition: 'Partly Cloudy', icon: 'cloud', minTemp: 19, maxTemp: 28 },
        { day: 'Fri', temp: 29, condition: 'Sunny', icon: 'sun', minTemp: 20, maxTemp: 31 },
      ];

  // Smart Weather Analysis - Computed from actual weather data
  const weatherAnalysis = React.useMemo(() => {
    if (!weatherData?.current) return null;

    const temp = currentWeather.temp;
    const humidity = currentWeather.humidity;
    const windSpeed = currentWeather.windSpeed;
    const forecast = weeklyForecast;

    // Temperature Analysis
    let tempAdvice = '';
    if (temp < 15) {
      tempAdvice = 'Cold conditions - protect sensitive crops, delay watering until afternoon';
    } else if (temp > 35) {
      tempAdvice = 'Very hot - increase watering frequency, provide shade for seedlings';
    } else if (temp > 28) {
      tempAdvice = 'Warm weather - ideal for most crops, ensure adequate irrigation';
    } else {
      tempAdvice = 'Moderate temperature - excellent for all farming activities';
    }

    // Humidity Analysis
    let humidityAdvice = '';
    if (humidity > 80) {
      humidityAdvice = 'High humidity - increased fungal disease risk, avoid late evening watering';
    } else if (humidity < 40) {
      humidityAdvice = 'Low humidity - increase irrigation, mulch to retain moisture';
    } else {
      humidityAdvice = 'Optimal humidity levels for healthy crop growth';
    }

    // Wind Analysis
    let windAdvice = '';
    if (windSpeed > 25) {
      windAdvice = 'Strong winds - postpone pesticide spraying, secure young plants';
    } else if (windSpeed > 15) {
      windAdvice = 'Moderate winds - good for pest control, ideal for spraying';
    } else {
      windAdvice = 'Calm conditions - perfect for all field operations';
    }

    // Rain Forecast Analysis
    const hasRain = forecast.some((d: any) => 
      d.condition?.toLowerCase().includes('rain') || 
      d.condition?.toLowerCase().includes('storm') ||
      (d.pop && d.pop > 50)
    );
    
    let rainAdvice = '';
    if (hasRain) {
      rainAdvice = 'Rain expected in coming days - complete irrigation early, harvest mature crops, apply fungicide preventively';
    } else {
      rainAdvice = 'No rain forecasted - ensure regular irrigation, check soil moisture daily, apply mulch';
    }

    // Temperature Trend Analysis
    const firstTemp = forecast[0]?.maxTemp || temp;
    const lastTemp = forecast[forecast.length - 1]?.maxTemp || temp;
    let trendAdvice = '';
    
    if (lastTemp > firstTemp + 3) {
      trendAdvice = 'Rising temperatures - increase watering, monitor for heat stress';
    } else if (lastTemp < firstTemp - 3) {
      trendAdvice = 'Cooling trend - reduce irrigation, protect cold-sensitive plants';
    } else {
      trendAdvice = 'Stable conditions - maintain regular farming schedule';
    }

    // Best Activities Based on Conditions
    let bestActivities = '';
    if (temp > 28 && humidity < 60) {
      bestActivities = 'Early morning/evening work, harvesting, light irrigation';
    } else if (temp < 20 && !hasRain) {
      bestActivities = 'Planting, transplanting, soil preparation, fertilizer application';
    } else if (hasRain) {
      bestActivities = 'Indoor work, equipment maintenance, planning next season';
    } else {
      bestActivities = 'All farming activities, planting, harvesting, field maintenance';
    }

    // Critical Alerts
    const alerts = [];
    if (temp > 35) {
      alerts.push({
        type: 'heat',
        severity: 'high',
        title: 'Heat Warning',
        message: 'Extreme heat detected! Increase irrigation, avoid midday field work, protect livestock and sensitive crops.'
      });
    }
    
    if (hasRain && forecast.some((d: any) => d.pop && d.pop > 60)) {
      alerts.push({
        type: 'rain',
        severity: 'medium',
        title: 'Heavy Rain Expected',
        message: 'Prepare drainage, harvest ripe crops, delay fertilizer application, cover exposed soil.'
      });
    }

    if (humidity > 85 && temp > 25) {
      alerts.push({
        type: 'disease',
        severity: 'medium',
        title: 'Disease Risk High',
        message: 'High humidity + warm temperature = increased fungal disease risk. Monitor crops closely, consider preventive treatment.'
      });
    }

    if (windSpeed > 30) {
      alerts.push({
        type: 'wind',
        severity: 'high',
        title: 'Strong Wind Alert',
        message: 'High winds detected! Secure structures, delay spraying operations, protect young plants and climbing crops.'
      });
    }

    if (temp < 10) {
      alerts.push({
        type: 'cold',
        severity: 'high',
        title: 'Cold Weather Warning',
        message: 'Frost risk! Cover sensitive plants, delay watering, protect seedlings and young crops.'
      });
    }

    return {
      tempAdvice,
      humidityAdvice,
      windAdvice,
      rainAdvice,
      trendAdvice,
      bestActivities,
      hasRain,
      alerts
    };
  }, [weatherData, currentWeather, weeklyForecast]);

  // Calculate monthly activity data from real data
  const monthlyActivityData = React.useMemo(() => {
    if (!dashboardStats) {
      return [
        { month: 'Jan', scans: 0, issues: 0, subsidies: 0, chatSessions: 0 },
        { month: 'Feb', scans: 0, issues: 0, subsidies: 0, chatSessions: 0 },
        { month: 'Mar', scans: 0, issues: 0, subsidies: 0, chatSessions: 0 },
        { month: 'Apr', scans: 0, issues: 0, subsidies: 0, chatSessions: 0 },
        { month: 'May', scans: 0, issues: 0, subsidies: 0, chatSessions: 0 },
        { month: 'Jun', scans: 0, issues: 0, subsidies: 0, chatSessions: 0 },
      ];
    }

    // Group data by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      // Count issues for this month
      const issuesInMonth = (dashboardStats.issues || []).filter((issue: any) => {
        const issueDate = new Date(issue.reportedDate || issue.createdAt);
        return issueDate.getMonth() === monthIndex && issueDate.getFullYear() === year;
      }).length;
      
      // Count subsidies for this month
      const subsidiesInMonth = (dashboardStats.subsidies || []).filter((subsidy: any) => {
        const subsidyDate = new Date(subsidy.appliedDate || subsidy.createdAt);
        return subsidyDate.getMonth() === monthIndex && subsidyDate.getFullYear() === year;
      }).length;
      
      // Count disease scans for this month
      const scansInMonth = (dashboardStats.diseaseScans || []).filter((scan: any) => {
        const scanDate = new Date(scan.scannedAt || scan.createdAt);
        return scanDate.getMonth() === monthIndex && scanDate.getFullYear() === year;
      }).length;
      
      last6Months.push({
        month: monthNames[monthIndex],
        scans: scansInMonth,
        issues: issuesInMonth,
        subsidies: subsidiesInMonth,
        chatSessions: 0, // No chat sessions by month data yet
      });
    }
    
    return last6Months;
  }, [dashboardStats]);

  // Subsidy status data from real data
  const subsidyStatusData = React.useMemo(() => {
    const subsidies = dashboardStats?.subsidies || [];
    const approved = subsidies.filter((s: any) => s.status === 'approved').length;
    const pending = subsidies.filter((s: any) => s.status === 'pending').length;
    const rejected = subsidies.filter((s: any) => s.status === 'rejected').length;

    // Always show all statuses, even if 0
    return [
      { name: 'Approved', value: approved, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Rejected', value: rejected, color: '#ef4444' },
    ];
  }, [dashboardStats]);

  const getWeatherIcon = (condition: string) => {
    switch(condition.toLowerCase()) {
      case 'sunny': return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'rainy': return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'cloudy': 
      case 'partly cloudy': 
      default: return <Cloud className="h-8 w-8 text-gray-500" />;
    }
  };

  const features = [
    {
      title: 'Crop Disease Detection',
      description: 'Upload photos of your crops to detect diseases early',
      icon: Camera,
      href: '/crop-disease',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'AI Chatbot',
      description: 'Get instant farming advice and support',
      icon: MessageCircle,
      href: '/chatbot',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'Subsidy Application',
      description: 'Apply for government subsidies and support',
      icon: Activity,
      href: '/subsidy',
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600'
    },
    {
      title: 'Report Crop Issues',
      description: 'Report problems and get expert help',
      icon: AlertTriangle,
      href: '/crop-issues',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      title: 'Market Prices',
      description: 'Check current market prices for your crops',
      icon: BarChart3,
      href: '/market-prices',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: 'Profile Management',
      description: 'Update your personal info and profile picture',
      icon: User,
      href: '/profile',
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600'
    }
  ];

  return (
    <FarmerLayout>
      <div className="space-y-6">

        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Picture */}
            <Link to="/profile">
              <img
                src={
                  profile?.profilePic
                    ? profile.profilePic.startsWith('http')
                      ? profile.profilePic
                      : `http://localhost:5000${profile.profilePic}`
                    : '/default-avatar.png'
                }
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}! 🌾
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your farming activities and get expert support
              </p>
              {/* Edit Profile link removed as requested */}
            </div>
          </div>
          {/* Location and phone removed as per user request */}
        </div>

        {/* Weather Widget - Compact with Expand */}
        <div className="bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl shadow-lg text-gray-800 overflow-hidden border border-sky-200">
          {/* Compact View - Always Visible */}
          <div 
            className="p-4 cursor-pointer hover:bg-sky-200 transition-colors"
            onClick={() => setWeatherExpanded(!weatherExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {weatherLoading ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                ) : (
                  getWeatherIcon(currentWeather.condition)
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {weatherLoading ? 'Loading...' : `${currentWeather.temp}°C`}
                  </h2>
                  <p className="text-sm text-gray-700">
                    {weatherLoading ? 'Fetching weather...' : currentWeather.condition}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    📍 {user?.location || profile?.location || 'Kathmandu'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {!weatherLoading && (
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-700">Humidity: {currentWeather.humidity}%</p>
                    <p className="text-sm text-gray-700">Wind: {currentWeather.windSpeed} km/h</p>
                  </div>
                )}
                <div className="text-sm font-semibold bg-sky-200 text-blue-700 px-3 py-1 rounded-full">
                  {weatherExpanded ? '▲ Hide' : '▼ View Details'}
                </div>
              </div>
            </div>
          </div>

          {/* Expanded View - Shows on Click */}
          {weatherExpanded && (
            <div className="border-t border-white border-opacity-20 p-6 animate-slideDown">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Current Weather Details + Today's Conditions */}
            <div className="space-y-4">
              {/* Current Weather Details */}
              <div>
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-bold">{currentWeather.temp}°C</span>
                  <span className="ml-3 text-lg opacity-90">{currentWeather.condition}</span>
                </div>
                <p className="text-sm opacity-80 mb-4">Feels like {currentWeather.feelsLike}°C</p>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-2">
                    <Droplets className="h-4 w-4" />
                    <div>
                      <p className="text-xs opacity-80">Humidity</p>
                      <p className="font-semibold">{currentWeather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-2">
                    <Wind className="h-4 w-4" />
                    <div>
                      <p className="text-xs opacity-80">Wind</p>
                      <p className="font-semibold">{currentWeather.windSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <p className="text-xs opacity-80">Visibility</p>
                      <p className="font-semibold">{currentWeather.visibility} km</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-2">
                    <Gauge className="h-4 w-4" />
                    <div>
                      <p className="text-xs opacity-80">Pressure</p>
                      <p className="font-semibold">{currentWeather.pressure} mb</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Conditions */}
              {!weatherLoading && weatherData?.agricultural && weatherAnalysis && (
                <div className="bg-white bg-opacity-30 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-900 border-b border-gray-200 pb-2">
                    🌤️ Today's Conditions
                  </h4>
                  <div className="space-y-3 text-sm">
                    {/* Temperature Analysis */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">🌡️</span>
                        <span className="font-semibold text-gray-700">Temperature</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-6">{weatherAnalysis.tempAdvice}</p>
                    </div>
                    
                    {/* Humidity Analysis */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">💧</span>
                        <span className="font-semibold text-gray-700">Humidity</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-6">{weatherAnalysis.humidityAdvice}</p>
                    </div>

                    {/* Wind Analysis */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">💨</span>
                        <span className="font-semibold text-gray-700">Wind</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-6">{weatherAnalysis.windAdvice}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5-Day Action Plan */}
              {!weatherLoading && weatherData?.agricultural && weatherAnalysis && (
                <div className="bg-white bg-opacity-30 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3 text-gray-900 border-b border-gray-200 pb-2">
                    📅 5-Day Action Plan
                  </h4>
                  <div className="space-y-3 text-sm">
                    {/* Rain Forecast Analysis */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{weatherAnalysis.hasRain ? '☔' : '☀️'}</span>
                        <span className="font-semibold text-gray-700">{weatherAnalysis.hasRain ? 'Rain Alert' : 'Dry Period'}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-6">{weatherAnalysis.rainAdvice}</p>
                    </div>

                    {/* Temperature Trend */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">📈</span>
                        <span className="font-semibold text-gray-700">Temperature Trend</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-6">{weatherAnalysis.trendAdvice}</p>
                    </div>

                    {/* Best Activities */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">✅</span>
                        <span className="font-semibold text-gray-700">Best Activities</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-6">{weatherAnalysis.bestActivities}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: 7-Day Forecast Only */}
            <div className="space-y-4">
              {/* 7-Day Forecast */}
              <div>
                <h3 className="text-sm font-semibold mb-3 opacity-90">
                  {weatherLoading ? 'Loading Forecast...' : '5-Day Forecast'}
                </h3>
                <div className="space-y-2">
                  {weatherLoading ? (
                    <div className="text-center text-sm opacity-80 py-4">Loading weather data...</div>
                  ) : (
                    weeklyForecast.map((day: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-2">
                        <span className="text-sm font-medium w-12">{day.day}</span>
                        <div className="flex items-center space-x-2">
                          {getWeatherIcon(day.condition)}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">{day.maxTemp}°</span>
                          <span className="text-xs opacity-70 ml-1">{day.minTemp}°</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Action Cards Below Forecast - 2x2 Flex Layout */}
              {!weatherLoading && weatherData?.agricultural && weatherAnalysis && (
                <div className="bg-white bg-opacity-30 border border-gray-200 rounded-lg" style={{ padding: '24px' }}>
                  <h4 className="text-sm font-semibold mb-5 text-gray-900 border-b border-gray-200 pb-2">
                    🌾 Quick Actions
                  </h4>
                  <div className="flex flex-col gap-9 text-sm">
                    <div className="flex justify-evenly gap-4">
                      <div className="flex-1 bg-white bg-opacity-40 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">🚜</span>
                          <span className="font-semibold text-gray-700">Irrigation</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-6">{weatherData.agricultural.irrigationRecommendation}</p>
                      </div>
                      <div className="flex-1 bg-white bg-opacity-40 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">💧</span>
                          <span className="font-semibold text-gray-700">Soil Moisture</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-6">{weatherData.agricultural.soilMoisture}</p>
                      </div>
                    </div>
                    <div className="flex justify-evenly gap-4">
                      <div className="flex-1 bg-white bg-opacity-40 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">🐛</span>
                          <span className="font-semibold text-gray-700">Pest Risk</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-6">{weatherData.agricultural.pestRisk}</p>
                      </div>
                      <div className="flex-1 bg-white bg-opacity-40 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">🌱</span>
                          <span className="font-semibold text-gray-700">Planting</span>
                        </div>
                        <p className="text-gray-600 leading-relaxed pl-6">{weatherData.agricultural.plantingCondition}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Critical Weather Alerts - Dynamic based on analysis */}
          {!weatherLoading && weatherAnalysis && weatherAnalysis.alerts.length > 0 && (
            <>
              {weatherAnalysis.alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`mt-3 rounded-lg p-3 border ${
                    alert.severity === 'high' 
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        alert.severity === 'high' ? 'text-red-800' : 'text-amber-800'
                      }`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        alert.severity === 'high' ? 'text-red-700' : 'text-amber-700'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <Camera className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Disease Scans</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : dashboardStats?.totalScans || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Chat Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : chatSessionsCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-orange-100 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Issues Reported</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : dashboardStats?.totalIssues || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
          <Activity className="h-6 w-6 text-gray-400" />
        </div>

        {/* Important Charts - Monthly Activity & Subsidy Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Activity Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Activity</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="scans" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Disease Scans" />
                <Area type="monotone" dataKey="chatSessions" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Chat Sessions" />
                <Area type="monotone" dataKey="issues" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Issues" />
                <Area type="monotone" dataKey="subsidies" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Subsidies" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Subsidy Application Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Subsidy Applications</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subsidyStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {subsidyStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.href}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>

      </div>
    </FarmerLayout>
  );
};

export default Dashboard;