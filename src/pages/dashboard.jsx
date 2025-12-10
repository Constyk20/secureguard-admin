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
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    lockdownDevices: 0,
    offlineDevices: 0,
    complianceRate: 0
  });

  const fetchDevices = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching devices from API...');
      console.log('📍 API URL:', import.meta.env.VITE_API_URL);
      console.log('🔑 Token:', localStorage.getItem('adminToken')?.substring(0, 20) + '...');
      
      // Try to get stats first
      const statsRes = await api.get('/api/admin/stats');
      console.log('📊 Stats response:', statsRes.data);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      
      // Get devices
      const res = await api.get('/api/admin/devices');
      
      console.log('✅ Devices API Response:', res);
      console.log('📦 Response structure:', {
        success: res.data.success,
        count: res.data.count,
        hasDevices: !!res.data.devices,
        devicesLength: res.data.devices?.length
      });
      
      let devicesData = [];
      
      // Handle different response formats
      if (res.data.success && res.data.devices) {
        devicesData = res.data.devices;
      } else if (Array.isArray(res.data)) {
        devicesData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        devicesData = res.data.data;
      } else {
        console.warn('⚠️ Unexpected response format:', res.data);
        devicesData = [];
      }
      
      console.log('📱 Processed devices:', devicesData.length);
      
      if (devicesData.length > 0) {
        // Map the backend device format to frontend format
        const mappedDevices = devicesData.map(device => ({
          id: device._id || device.id,
          deviceId: device._id || device.id,
          name: device.name || `Device-${(device._id || '').substring(0, 8)}`,
          status: device.status || 'offline',
          isCompliant: device.status === 'active' && (!device.lockdown || !device.lockdown.active),
          isConnected: device.status === 'active' || device.status === 'lockdown',
          isLocked: device.lockdown?.active || false,
          lastChecked: device.lastSeen || new Date(),
          deviceModel: device.model || 'Unknown',
          osVersion: device.osVersion || 'Unknown',
          battery: device.battery?.level || 0,
          location: device.location,
          user: device.user || { name: 'Unknown', rollNo: 'Unknown' },
          lockdown: device.lockdown || { active: false, reason: '' }
        }));
        
        setDevices(mappedDevices);
        setLastUpdated(new Date());
        
        if (showToast) {
          toast.success(`${mappedDevices.length} devices loaded`);
        }
        
        console.log('✅ Devices loaded successfully');
      } else {
        console.log('ℹ️ No devices found in response');
        setDevices([]);
        if (showToast) {
          toast.info('No devices registered yet');
        }
      }
      
    } catch (err) {
      console.error('❌ Fetch devices error:', err);
      console.error('❌ Full error:', {
        message: err.message,
        code: err.code,
        status: err.status,
        response: err.response?.data
      });
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load devices';
      setError(errorMessage);
      
      if (err.status === 401) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }, 1500);
        return;
      }
      
      // Network errors
      if (err.message?.includes('Network Error') || err.status === 0) {
        toast.error(
          <div>
            <strong>Cannot connect to backend server</strong>
            <br />
            <small>Please check if backend is running at: {import.meta.env.VITE_API_URL}</small>
          </div>,
          { duration: 5000 }
        );
      } else if (err.status === 403) {
        toast.error('Access denied. Admin privileges required.');
      } else if (err.status === 404) {
        toast.error('API endpoint not found. Check backend routes.');
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    console.log('🔐 Initial dashboard load...');
    
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      toast.error('Please login first');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }
    
    // Test connection first
    const testConnection = async () => {
      try {
        console.log('🔌 Testing backend connection...');
        const testRes = await api.get('/health');
        console.log('✅ Backend connection successful:', testRes.data);
        fetchDevices();
      } catch (err) {
        console.error('❌ Backend connection failed:', err);
        setError('Backend server is not responding. Please check if it\'s running.');
        toast.error(
          <div>
            <strong>Backend server not reachable</strong>
            <br />
            <small>Check: {import.meta.env.VITE_API_URL}/health</small>
          </div>,
          { duration: 10000 }
        );
      }
    };
    
    testConnection();
    
    // Refresh every 30 seconds instead of 8
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchDevices();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      (device.deviceId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (device.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (device.deviceModel?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (device.user?.rollNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (device.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'compliant') return device.isCompliant;
    if (activeTab === 'nonCompliant') return !device.isCompliant;
    return true;
  });

  const total = stats.totalDevices || devices.length;
  const compliant = devices.filter(d => d.isCompliant).length;
  const nonCompliant = total - compliant;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const onlineDevices = stats.activeDevices || devices.filter(d => d.isConnected).length;
  const offlineDevices = stats.offlineDevices || total - onlineDevices;
  const lockedDevices = stats.lockdownDevices || devices.filter(d => d.isLocked).length;

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

      <div className="dashboard-content">
        {/* Debug Connection Status */}
        <div className="connection-status-banner">
          <div className="connection-status-content">
            <div className={`status-indicator ${error ? 'error' : 'success'}`}></div>
            <span>
              {error ? `Connection Error: ${error}` : 'Connected to backend'}
            </span>
            {import.meta.env.VITE_API_URL && (
              <small className="api-url">
                API: {import.meta.env.VITE_API_URL}
              </small>
            )}
          </div>
        </div>

        {/* Header Section */}
        <div className="dashboard-header-section">
          <div className="header-content">
            <div className="header-title">
              <h1 className="gradient-text">Device Management Dashboard</h1>
              <p className="header-subtitle">
                <Activity size={16} className="text-green-500" />
                <span>Real-time monitoring • {total} devices</span>
                {lastUpdated && (
                  <span className="text-gray-500">• Updated {formatLastUpdate(lastUpdated)}</span>
                )}
              </p>
            </div>
            
            <div className="header-actions">
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
              
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  window.location.href = '/login';
                }}
                className="logout-button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Connection Test Button (Dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-tools">
            <button
              onClick={async () => {
                try {
                  const test = await api.get('/health');
                  console.log('✅ Health check:', test.data);
                  toast.success(`Backend OK: ${test.data.environment}`);
                } catch (err) {
                  console.error('❌ Health check failed:', err);
                  toast.error(`Health check failed: ${err.message}`);
                }
              }}
              className="test-button"
            >
              Test Backend Connection
            </button>
            <button
              onClick={() => {
                console.log('Current state:', {
                  devices,
                  stats,
                  apiUrl: import.meta.env.VITE_API_URL,
                  token: localStorage.getItem('adminToken')?.substring(0, 20)
                });
                toast.success('State logged to console');
              }}
              className="test-button"
            >
              Log State
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
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
        <div className="stats-grid">
          {/* Total Devices */}
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-card-info">
                <p className="stats-label">Total Devices</p>
                <p className="stats-value">{total}</p>
                <div className="stats-meta">
                  <div className="status-dot compliant"></div>
                  <span>{compliant} compliant</span>
                </div>
              </div>
              <div className="stats-icon bg-blue-50">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Compliance Rate */}
          <div className={`stats-card ${getComplianceCardClass(complianceRate)}`}>
            <div className="stats-card-content">
              <div className="stats-card-info">
                <p className="stats-label-white">Compliance Rate</p>
                <p className="stats-value-white">{complianceRate}%</p>
                <div className="stats-meta-white">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${complianceRate}%` }}
                    ></div>
                  </div>
                  <span>
                    {complianceRate >= 90 ? 'Excellent' : complianceRate >= 70 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
              </div>
              <div className="stats-icon-white">
                <Shield size={24} />
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-card-info">
                <p className="stats-label">Connection Status</p>
                <p className="stats-value">{onlineDevices}/{total}</p>
                <div className="stats-meta">
                  <div className="connection-indicators">
                    <div className="indicator">
                      <div className="status-dot online"></div>
                      <span>{onlineDevices} online</span>
                    </div>
                    <div className="indicator">
                      <div className="status-dot offline"></div>
                      <span>{offlineDevices} offline</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="stats-icon bg-green-50">
                <Wifi className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Locked Devices */}
          <div className="stats-card">
            <div className="stats-card-content">
              <div className="stats-card-info">
                <p className="stats-label">Locked Devices</p>
                <p className="stats-value">{lockedDevices}</p>
                <p className="stats-description">
                  {lockedDevices === 0 ? 'All operational' : 'Requires attention'}
                </p>
              </div>
              <div className="stats-icon bg-red-50">
                <ShieldAlert className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Devices Section */}
        <div className="devices-section">
          <div className="devices-header">
            <div className="devices-header-content">
              <div>
                <h2 className="devices-title">
                  {activeTab === 'all' ? 'All Devices' : 
                   activeTab === 'compliant' ? 'Compliant Devices' : 'At Risk Devices'}
                  <span className="devices-count">
                    {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <p className="devices-subtitle">
                  {searchTerm ? `Search results for "${searchTerm}"` : 'Monitor and manage all connected devices'}
                </p>
              </div>
              <div className="legend">
                <div className="legend-item">
                  <div className="status-dot compliant"></div>
                  <span>Compliant</span>
                </div>
                <div className="legend-item">
                  <div className="status-dot at-risk"></div>
                  <span>At Risk</span>
                </div>
              </div>
            </div>
          </div>

          <div className="devices-body">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <div>
                  <p className="loading-title">Loading Devices</p>
                  <p className="loading-subtitle">Connecting to backend...</p>
                </div>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <AlertTriangle size={48} className="text-red-500" />
                </div>
                <h3 className="empty-state-title">Connection Error</h3>
                <p className="empty-state-description">
                  Cannot connect to backend server at:<br />
                  <code>{import.meta.env.VITE_API_URL}</code>
                </p>
                <div className="empty-state-actions">
                  <button
                    onClick={() => fetchDevices(true)}
                    className="clear-search-button"
                  >
                    Try Again
                  </button>
                  <a
                    href={`${import.meta.env.VITE_API_URL}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="health-check-link"
                  >
                    Check Backend Health
                  </a>
                </div>
              </div>
            ) : filteredDevices.length > 0 ? (
              <div className="devices-grid">
                {filteredDevices.map(device => (
                  <DeviceCard 
                    key={device.id || device.deviceId} 
                    device={device} 
                    refresh={fetchDevices} 
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Smartphone size={48} />
                </div>
                <h3 className="empty-state-title">
                  {searchTerm ? 'No Matching Devices' : 'No Devices Found'}
                </h3>
                <p className="empty-state-description">
                  {searchTerm 
                    ? `No devices match your search for "${searchTerm}"`
                    : 'No devices are currently registered in the system. Register devices first.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="clear-search-button"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <div className="footer-content">
            <div className="footer-status">
              <div className="footer-icon">
                <Globe size={20} />
              </div>
              <div>
                <p className="footer-title">SecureGuard Network Status</p>
                <p className="footer-subtitle">
                  {error ? 'Connection issues detected' : 'All systems operational'}
                </p>
              </div>
            </div>
            
            <div className="footer-stats">
              <div className="footer-stat">
                <Clock size={16} />
                <span>Auto-refresh: <strong>30s</strong></span>
              </div>
              <div className="footer-stat">
                <Cpu size={16} />
                <span>Active: <strong>{onlineDevices}</strong></span>
              </div>
              <div className="footer-stat">
                <BarChart3 size={16} />
                <span>Compliance: <strong>{complianceRate}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}