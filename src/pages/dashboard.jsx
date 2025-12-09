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
      
      // Handle both response formats
      const devicesData = res.data.success ? res.data.data : res.data;
      
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
      if (err.status === 401) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('adminToken');
          window.location.href = '/login';
        }, 1500);
        return;
      }
      toast.error(err.message || 'Failed to load devices');
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
      device.osVersion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.user?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

      <div className="dashboard-content">
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
            </div>
          </div>
        </div>

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
                  <p className="loading-subtitle">Fetching real-time device data...</p>
                </div>
              </div>
            ) : filteredDevices.length > 0 ? (
              <div className="devices-grid">
                {filteredDevices.map(device => (
                  <DeviceCard 
                    key={device._id || device.deviceId} 
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
                    : 'No devices are currently registered in the system.'
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
                <p className="footer-subtitle">All systems operational</p>
              </div>
            </div>
            
            <div className="footer-stats">
              <div className="footer-stat">
                <Clock size={16} />
                <span>Auto-refresh: <strong>8s</strong></span>
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