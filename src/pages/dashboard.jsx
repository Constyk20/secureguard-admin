import { useState, useEffect } from 'react';
import { AlertTriangle, Users, Shield, RefreshCw, Activity, Smartphone, Battery, Wifi } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';
import DeviceCard from '../components/DeviceCard';
import Header from '../components/Header';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDevices = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    
    try {
      const res = await api.get('/api/admin/devices');
      setDevices(res.data);
      setLastUpdated(new Date());
      if (showToast) {
        toast.success('Devices updated successfully');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.reload();
      }
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      window.location.href = '/login';
    }
    fetchDevices();
    const interval = setInterval(fetchDevices, 8000);
    return () => clearInterval(interval);
  }, []);

  const compliant = devices.filter(d => d.isCompliant).length;
  const nonCompliant = devices.length - compliant;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const total = devices.length;

  const getComplianceColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-amber-600';
    return 'text-red-600';
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
          },
          success: {
            style: {
              background: '#065f46',
              border: '1px solid #047857',
            },
          },
          error: {
            style: {
              background: '#7f1d1d',
              border: '1px solid #991b1b',
            },
          },
        }} 
      />
      <Header />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Management Dashboard</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Activity size={16} className="text-green-500" />
                Real-time monitoring of {total} registered devices
                {lastUpdated && (
                  <span className="text-sm text-gray-500 ml-2">
                    • Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            
            <button
              onClick={() => fetchDevices(true)}
              disabled={refreshing}
              className="mt-4 lg:mt-0 px-6 py-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Devices */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Devices</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
                  <p className="text-xs text-gray-500 mt-1">Registered in system</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Users size={28} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Compliant Devices */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border-2 border-green-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-semibold uppercase tracking-wide">Compliant</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">{compliant}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${complianceRate}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-green-700">{complianceRate}%</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Shield size={28} className="text-green-600" />
                </div>
              </div>
            </div>

            {/* At Risk Devices */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-semibold uppercase tracking-wide">At Risk</p>
                  <p className="text-3xl font-bold text-red-700 mt-2">{nonCompliant}</p>
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    {nonCompliant > 0 ? 'Requires attention' : 'All clear'}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle size={28} className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Compliance Rate */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-semibold uppercase tracking-wide">Compliance Rate</p>
                  <p className={`text-3xl font-bold mt-2 ${getComplianceColor(complianceRate)}`}>
                    {complianceRate}%
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {complianceRate >= 90 ? 'Excellent' : complianceRate >= 70 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Activity size={28} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Devices Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">Managed Devices</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Compliant ({compliant})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>At Risk ({nonCompliant})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                      <Smartphone className="absolute inset-0 m-auto text-red-600" size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Loading Devices</p>
                      <p className="text-gray-600 text-sm mt-1">Fetching real-time device data...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {devices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {devices.map(device => (
                        <DeviceCard key={device._id} device={device} refresh={fetchDevices} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex flex-col items-center gap-4 max-w-md">
                        <div className="p-4 bg-gray-100 rounded-2xl">
                          <Smartphone size={48} className="text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No Devices Found</h3>
                          <p className="text-gray-600">
                            No devices are currently registered in the system. Devices will appear here once they register with the mobile app.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer Info */}
          {devices.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Wifi size={14} />
                Auto-refreshing every 8 seconds • Last update: {lastUpdated?.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}