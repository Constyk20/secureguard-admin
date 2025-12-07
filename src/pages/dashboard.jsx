import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Users, 
  Shield, 
  RefreshCw, 
  Activity, 
  Smartphone, 
  Wifi, 
  Battery,
  BarChart3,
  Globe,
  Clock,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';
import DeviceCard from '../components/DeviceCard';
import Header from '../components/Header';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'compliant', 'nonCompliant'
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDevices = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    
    try {
      const res = await api.get('/api/admin/devices');
      const devicesData = res.data;
      
      // Sort devices: non-compliant first, then by last check time
      const sortedDevices = devicesData.sort((a, b) => {
        if (a.isCompliant !== b.isCompliant) {
          return a.isCompliant ? 1 : -1;
        }
        return new Date(b.lastChecked) - new Date(a.lastChecked);
      });
      
      setDevices(sortedDevices);
      setLastUpdated(new Date());
      
      if (showToast) {
        toast.success(`${sortedDevices.length} devices updated`);
      }
    } catch (err) {
      console.error('Fetch devices error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }, 1500);
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    fetchDevices();
    const interval = setInterval(fetchDevices, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter devices based on active tab and search term
  const filteredDevices = devices.filter(device => {
    // Search filter
    const matchesSearch = 
      device.deviceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.deviceModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.osVersion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Tab filter
    if (activeTab === 'compliant') return device.isCompliant;
    if (activeTab === 'nonCompliant') return !device.isCompliant;
    return true; // 'all' tab
  });

  const total = devices.length;
  const compliant = devices.filter(d => d.isCompliant).length;
  const nonCompliant = total - compliant;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

  // Calculate additional stats
  const onlineDevices = devices.filter(d => d.isConnected).length;
  const offlineDevices = total - onlineDevices;
  const lockedDevices = devices.filter(d => d.isLocked).length;

  const getComplianceColor = (rate) => {
    if (rate >= 90) return 'from-green-500 to-emerald-600';
    if (rate >= 70) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getConnectionStatusColor = (rate) => {
    if (rate >= 80) return 'from-blue-500 to-indigo-600';
    if (rate >= 60) return 'from-cyan-500 to-sky-600';
    return 'from-gray-500 to-slate-600';
  };

  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: 'white',
            borderRadius: '12px',
            border: '1px solid #374151',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
            style: {
              background: '#064e3b',
              border: '1px solid #047857',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
            style: {
              background: '#7f1d1d',
              border: '1px solid #991b1b',
            },
          },
        }} 
      />
      <Header />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                  <Shield className="text-white" size={24} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Device Management Dashboard</h1>
              </div>
              <p className="text-gray-600 flex items-center gap-2">
                <Activity size={16} className="text-green-500 animate-pulse" />
                <span className="font-medium">Real-time monitoring</span>
                <span className="text-gray-500">•</span>
                <span>{total} registered devices</span>
                <span className="text-gray-500">•</span>
                {lastUpdated && (
                  <span className="text-sm text-gray-500">
                    Updated {formatLastUpdate(lastUpdated)}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Smartphone size={16} className="text-gray-400" />
                </div>
              </div>
              
              <button
                onClick={() => fetchDevices(true)}
                disabled={refreshing}
                className="px-5 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-gray-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
            {[
              { id: 'all', label: 'All Devices', count: total },
              { id: 'compliant', label: 'Compliant', count: compliant },
              { id: 'nonCompliant', label: 'At Risk', count: nonCompliant },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Devices */}
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Total Devices</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{total}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{compliant} compliant</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                  <Users size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Compliance Rate */}
            <div className={`bg-gradient-to-br ${getComplianceColor(complianceRate)} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-opacity-90 text-sm font-semibold uppercase tracking-wide mb-1">Compliance Rate</p>
                  <p className="text-4xl font-bold text-white mb-2">{complianceRate}%</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-white bg-opacity-30 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-700" 
                        style={{ width: `${complianceRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-white text-opacity-90">
                      {complianceRate >= 90 ? 'Excellent' : complianceRate >= 70 ? 'Good' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                  <Shield size={28} className="text-white" />
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Connection Status</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{onlineDevices}/{total}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-700">{onlineDevices} online</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-700">{offlineDevices} offline</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                  <Wifi size={28} className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Locked Devices */}
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Locked Devices</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{lockedDevices}</p>
                  <p className="text-sm text-gray-600">
                    {lockedDevices === 0 ? 'All devices operational' : 'Requires attention'}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-100 to-rose-200 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                  <ShieldAlert size={28} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Devices Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {activeTab === 'all' ? 'All Devices' : 
                     activeTab === 'compliant' ? 'Compliant Devices' : 'At Risk Devices'}
                    <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {searchTerm ? `Search results for "${searchTerm}"` : 'Monitor and manage all connected devices'}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                      <span className="text-gray-700">Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-full animate-pulse"></div>
                      <span className="text-gray-700">At Risk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                      <Smartphone className="absolute inset-0 m-auto text-red-600" size={32} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900 mb-2">Loading Devices</p>
                      <p className="text-gray-600 max-w-md">
                        Fetching real-time device data from SecureGuard network...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {filteredDevices.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredDevices.map(device => (
                        <DeviceCard key={device._id || device.deviceId} device={device} refresh={fetchDevices} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="inline-flex flex-col items-center gap-6 max-w-md mx-auto">
                        <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-inner">
                          <Smartphone size={56} className="text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {searchTerm ? 'No Matching Devices' : 'No Devices Found'}
                          </h3>
                          <p className="text-gray-600 mb-6">
                            {searchTerm 
                              ? `No devices match your search for "${searchTerm}". Try a different search term.`
                              : 'No devices are currently registered in the system. Devices will appear here once they register with the mobile app.'
                            }
                          </p>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm('')}
                              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors duration-200"
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-10 rounded-lg">
                  <Globe size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">SecureGuard Network Status</p>
                  <p className="text-white text-opacity-80 text-sm">All systems operational</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-white text-opacity-80" />
                  <span className="text-white text-opacity-80 text-sm">
                    Auto-refresh: <span className="font-medium">8s</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-white text-opacity-80" />
                  <span className="text-white text-opacity-80 text-sm">
                    Active devices: <span className="font-medium">{onlineDevices}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-white text-opacity-80" />
                  <span className="text-white text-opacity-80 text-sm">
                    Compliance: <span className="font-medium">{complianceRate}%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}