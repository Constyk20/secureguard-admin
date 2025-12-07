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
import '../styles/dashboard.css'; // Import the CSS file

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

  const getComplianceCardClass = (rate) => {
    if (rate >= 90) return 'compliance-card';
    if (rate >= 70) return 'connection-card';
    return 'at-risk-card';
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
            className: 'toast-success',
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
            className: 'toast-error',
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

      <div className="dashboard-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                  <Shield className="text-white" size={24} />
                </div>
                <h1 className="text-3xl font-bold gradient-text">Device Management Dashboard</h1>
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
              <div className="search-input-container flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <div className="search-icon">
                  <Smartphone size={16} />
                </div>
              </div>
              
              <button
                onClick={() => fetchDevices(true)}
                disabled={refreshing}
                className="refresh-button"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container mb-6 w-fit">
            {[
              { id: 'all', label: 'All Devices', count: total },
              { id: 'compliant', label: 'Compliant', count: compliant },
              { id: 'nonCompliant', label: 'At Risk', count: nonCompliant },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span>{tab.label}</span>
                <span className="tab-badge">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Devices */}
            <div className="stats-card hover-scale">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Total Devices</p>
                  <p className="stats-card-value mb-2">{total}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="status-dot compliant"></div>
                      <span className="text-gray-700">{compliant} compliant</span>
                    </div>
                  </div>
                </div>
                <div className="stats-card-icon hover-rotate">
                  <Users size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Compliance Rate */}
            <div className={`stats-card ${getComplianceCardClass(complianceRate)} hover-scale`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-opacity-90 text-sm font-semibold uppercase tracking-wide mb-1">Compliance Rate</p>
                  <p className="text-4xl font-bold text-white mb-2">{complianceRate}%</p>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar w-20">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${complianceRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-white text-opacity-90">
                      {complianceRate >= 90 ? 'Excellent' : complianceRate >= 70 ? 'Good' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl hover-rotate">
                  <Shield size={28} className="text-white" />
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="stats-card hover-scale">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Connection Status</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{onlineDevices}/{total}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="status-dot online"></div>
                      <span className="text-gray-700">{onlineDevices} online</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <div className="status-dot offline"></div>
                      <span className="text-gray-700">{offlineDevices} offline</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl hover-rotate">
                  <Wifi size={28} className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Locked Devices */}
            <div className="stats-card hover-scale">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-1">Locked Devices</p>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{lockedDevices}</p>
                  <p className="text-sm text-gray-600">
                    {lockedDevices === 0 ? 'All devices operational' : 'Requires attention'}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-100 to-rose-200 rounded-xl hover-rotate">
                  <ShieldAlert size={28} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Devices Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="card-header px-6 py-4">
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
                      <div className="status-dot compliant"></div>
                      <span className="text-gray-700">Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="status-dot at-risk"></div>
                      <span className="text-gray-700">At Risk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="empty-state">
                  <div className="inline-flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="loading-spinner w-20 h-20"></div>
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
                    <div className="devices-grid">
                      {filteredDevices.map(device => (
                        <DeviceCard key={device._id || device.deviceId} device={device} refresh={fetchDevices} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="inline-flex flex-col items-center gap-6 max-w-md mx-auto">
                        <div className="empty-state-icon">
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
          <div className="dashboard-footer mt-8">
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