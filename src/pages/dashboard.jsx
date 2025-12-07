import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Users, 
  Shield, 
  RefreshCw, 
  Activity, 
  Smartphone, 
  Wifi,
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
import '../styles/dashboard.css';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDevices = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    
    try {
      const res = await api.get('/api/admin/devices');
      const devicesData = res.data;
      
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

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.deviceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.deviceModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.osVersion?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'compliant') return device.isCompliant;
    if (activeTab === 'nonCompliant') return !device.isCompliant;
    return true;
  });

  const total = devices.length;
  const compliant = devices.filter(d => d.isCompliant).length;
  const nonCompliant = total - compliant;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
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
    <div className="dashboard-container">
      <Toaster position="top-right" />
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold gradient-text mb-2">Device Management Dashboard</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Activity size={16} className="text-green-500" />
                <span>Real-time monitoring • {total} devices</span>
                {lastUpdated && (
                  <span className="text-gray-500">• Updated {formatLastUpdate(lastUpdated)}</span>
                )}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="search-input-container">
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
        </div>

        {/* Tabs */}
        <div className="tabs-container mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          >
            All Devices
            <span className="tab-badge">{total}</span>
          </button>
          <button
            onClick={() => setActiveTab('compliant')}
            className={`tab-button ${activeTab === 'compliant' ? 'active' : ''}`}
          >
            Compliant
            <span className="tab-badge">{compliant}</span>
          </button>
          <button
            onClick={() => setActiveTab('nonCompliant')}
            className={`tab-button ${activeTab === 'nonCompliant' ? 'active' : ''}`}
          >
            At Risk
            <span className="tab-badge">{nonCompliant}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Devices */}
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Devices</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{total}</p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="status-dot compliant"></div>
                  <span className="text-gray-600">{compliant} compliant</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Compliance Rate */}
          <div className={`stats-card ${getComplianceCardClass(complianceRate)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-medium mb-1">Compliance Rate</p>
                <p className="text-3xl font-bold text-white mb-2">{complianceRate}%</p>
                <div className="flex items-center gap-3">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${complianceRate}%` }}
                    ></div>
                  </div>
                  <span className="text-white/90 text-sm">
                    {complianceRate >= 90 ? 'Excellent' : complianceRate >= 70 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Shield className="text-white" size={24} />
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Connection Status</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{onlineDevices}/{total}</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="status-dot online"></div>
                    <span className="text-gray-600">{onlineDevices} online</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="status-dot offline"></div>
                    <span className="text-gray-600">{offlineDevices} offline</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Wifi className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Locked Devices */}
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Locked Devices</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{lockedDevices}</p>
                <p className="text-gray-600 text-sm">
                  {lockedDevices === 0 ? 'All operational' : 'Requires attention'}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <ShieldAlert className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Devices Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="card-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {activeTab === 'all' ? 'All Devices' : 
                   activeTab === 'compliant' ? 'Compliant Devices' : 'At Risk Devices'}
                  <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {searchTerm ? `Search results for "${searchTerm}"` : 'Monitor and manage all connected devices'}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-3 sm:mt-0">
                <div className="flex items-center gap-4 text-sm">
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
              <div className="text-center py-16">
                <div className="inline-flex flex-col items-center gap-4">
                  <div className="loading-spinner"></div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Loading Devices</p>
                    <p className="text-gray-600 text-sm mt-1">Fetching real-time device data...</p>
                  </div>
                </div>
              </div>
            ) : filteredDevices.length > 0 ? (
              <div className="devices-grid">
                {filteredDevices.map(device => (
                  <DeviceCard key={device._id || device.deviceId} device={device} refresh={fetchDevices} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Smartphone size={48} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No Matching Devices' : 'No Devices Found'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-4">
                  {searchTerm 
                    ? `No devices match your search for "${searchTerm}"`
                    : 'No devices are currently registered in the system.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="dashboard-footer mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium">SecureGuard Network Status</p>
                <p className="text-white/80 text-sm">All systems operational</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-white/80" />
                <span className="text-white/80 text-sm">Auto-refresh: <span className="font-medium">8s</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-white/80" />
                <span className="text-white/80 text-sm">Active: <span className="font-medium">{onlineDevices}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-white/80" />
                <span className="text-white/80 text-sm">Compliance: <span className="font-medium">{complianceRate}%</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}