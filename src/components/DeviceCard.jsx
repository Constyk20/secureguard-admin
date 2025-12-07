import { Lock, Unlock, Smartphone, Trash2, Shield, MapPin, Clock, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useState } from 'react';

export default function DeviceCard({ device, refresh }) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState(null);
  const isCompliant = device.isCompliant;
  const isLocked = device.isLocked;

  const handleAction = async (action, confirmMessage, successMessage, apiEndpoint) => {
    if (!window.confirm(confirmMessage)) return;
    
    setIsLoading(true);
    setActionType(action);
    
    try {
      await api.post(apiEndpoint, {
        deviceId: device.deviceId,
        reason: `${action} by admin via dashboard`
      });
      toast.success(successMessage);
      refresh();
    } catch (err) {
      toast.error(`Failed to ${action.toLowerCase()} device`);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const lockDevice = () => handleAction(
    'lock',
    `Lock device: ${device.user?.name || 'Unknown'}?`,
    'Device locked successfully!',
    '/api/admin/lock'
  );

  const unlockDevice = () => handleAction(
    'unlock',
    `Unlock device: ${device.user?.name || 'Unknown'}?`,
    'Device unlocked successfully!',
    '/api/admin/unlock'
  );

  const wipeDevice = () => handleAction(
    'wipe',
    `WIPE ${device.user?.name || 'Unknown'}'s device? This action cannot be undone!`,
    'Device wiped successfully!',
    '/api/admin/wipe'
  );

  const getStatusColor = () => {
    if (!isCompliant) return 'red';
    if (isLocked) return 'amber';
    return 'green';
  };

  const getStatusConfig = () => {
    const colors = {
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800 border-red-300',
        icon: 'text-red-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-800 border-green-300',
        icon: 'text-green-500'
      },
      amber: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: 'text-amber-500'
      }
    };
    return colors[getStatusColor()];
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${statusConfig.bg} ${statusConfig.border}`}>
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${statusConfig.badge}`}>
          {!isCompliant ? (
            <AlertTriangle size={14} className="flex-shrink-0" />
          ) : isLocked ? (
            <Lock size={14} className="flex-shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="flex-shrink-0" />
          )}
          <span>
            {!isCompliant ? 'NON-COMPLIANT' : isLocked ? 'LOCKED' : 'COMPLIANT'}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl ${statusConfig.bg} border ${statusConfig.border}`}>
          <Smartphone size={32} className={statusConfig.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 truncate">
            {device.user?.name || 'Unknown User'}
          </h3>
          <p className="text-sm text-gray-600 font-medium">{device.user?.rollNo || 'No ID'}</p>
          <p className="text-xs text-gray-500 font-mono mt-1">{device.deviceId}</p>
        </div>
      </div>

      {/* Device Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <User size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">User:</span>
          <span className="font-semibold text-gray-900 truncate">
            {device.user?.name || 'Unknown'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">Last Seen:</span>
          <span className="font-semibold text-gray-900">
            {new Date(device.lastComplianceCheck).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">Geofence:</span>
          <span className={`font-semibold ${
            device.geofenceStatus === 'inside' ? 'text-green-600' : 'text-red-600'
          }`}>
            {device.geofenceStatus?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Shield size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">Status:</span>
          <span className={`font-semibold ${statusConfig.text}`}>
            {!isCompliant ? 'Violation' : isLocked ? 'Locked' : 'Secure'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={isLocked ? unlockDevice : lockDevice}
          disabled={isLoading}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
            isLoading && actionType === 'lock' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : isLocked
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-200'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-200'
          }`}
        >
          {isLoading && actionType === 'lock' ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isLocked ? (
            <Unlock size={18} />
          ) : (
            <Lock size={18} />
          )}
          {isLocked ? 'Unlock' : 'Lock Device'}
        </button>

        <button
          onClick={wipeDevice}
          disabled={isLoading}
          className={`p-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
            isLoading && actionType === 'wipe'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-lg hover:shadow-red-200'
          }`}
          title="Wipe Device Data"
        >
          {isLoading && actionType === 'wipe' ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={18} />
          )}
          <span className="hidden sm:inline">Wipe</span>
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-gray-700">
              {actionType === 'lock' ? 'Locking...' : actionType === 'wipe' ? 'Wiping...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}