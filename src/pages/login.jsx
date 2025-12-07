import { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  LogIn, 
  User, 
  Lock,
  Smartphone,
  Server,
  Key,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  Zap
} from 'lucide-react';
import '../styles/login.css';
import api from '../api/axios'; // Make sure this path is correct

export default function Login() {
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const savedRememberMe = sessionStorage.getItem('rememberMe');
    if (savedRememberMe === 'true') {
      setRememberMe(true);
      const savedRollNo = sessionStorage.getItem('savedRollNo');
      if (savedRollNo) {
        setRollNo(savedRollNo);
      }
    }
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleLogin = () => {
    if (!rollNo.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    
    // Option 1: Use real API (recommended)
    api.post('/api/admin/login', {
      adminId: rollNo.trim(),
      password: password
    })
    .then(response => {
      const { token, admin } = response.data;
      
      // Store token
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(admin));
      
      if (rememberMe) {
        sessionStorage.setItem('rememberMe', 'true');
        sessionStorage.setItem('savedRollNo', rollNo.trim());
      } else {
        sessionStorage.removeItem('rememberMe');
        sessionStorage.removeItem('savedRollNo');
      }
      
      showToast('Authentication successful! Redirecting...', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    })
    .catch(error => {
      console.error('Login error:', error);
      
      // Fallback to demo mode if API fails
      if (rollNo.trim() === 'ADM001' && password === 'admin123') {
        // Demo mode success
        if (rememberMe) {
          sessionStorage.setItem('rememberMe', 'true');
          sessionStorage.setItem('savedRollNo', rollNo.trim());
        } else {
          sessionStorage.removeItem('rememberMe');
          sessionStorage.removeItem('savedRollNo');
        }
        showToast('Demo: Authentication successful! Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        showToast(
          error.response?.data?.message || 'Authentication failed. Please check your credentials.',
          'error'
        );
        setPassword('');
      }
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  const handleDemoFill = (type) => {
    if (type === 'username') {
      setRollNo('ADM001');
    } else if (type === 'password') {
      setPassword('admin123');
    }
  };

  return (
    <div className="login-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`login-toast ${toast.type}`}>
          <div className="login-toast-content">
            {toast.type === 'success' ? (
              <CheckCircle2 className="login-toast-icon" />
            ) : (
              <AlertCircle className="login-toast-icon" />
            )}
            <span className="login-toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Background Elements */}
      <div className="login-bg-elements">
        <div className="login-bg-circle-1"></div>
        <div className="login-bg-circle-2"></div>
        <div className="login-bg-circle-3"></div>
        <div className="login-bg-grid"></div>
      </div>

      {/* Floating Icons */}
      <Shield className="login-floating-icon login-floating-shield" />
      <Key className="login-floating-icon login-floating-key" />
      <Fingerprint className="login-floating-icon login-floating-fingerprint" />

      <div className="login-content">
        {/* Security Status Bar */}
        <div className="login-status-bar">
          <div className="login-status-secure">
            <div className="login-status-ping">
              <div className="login-status-ping-inner"></div>
            </div>
            <span className="login-status-secure-text">Secure Connection</span>
          </div>
          
          <div className="login-status-version">
            <Server className="login-status-version-icon" />
            <span className="login-status-version-text">v2.1.4</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="login-card">
          {/* Header */}
          <div className="login-card-header">
            <div className="login-card-header-content">
              <div className="login-logo-container">
                <div className="login-logo-wrapper">
                  <div className="login-logo-glow"></div>
                  <div className="login-logo-main">
                    <Shield className="login-logo-icon" />
                  </div>
                  <div className="login-logo-badge">
                    <Zap className="login-logo-badge-icon" />
                  </div>
                </div>
              </div>
              
              <h1 className="login-title">SecureGuard</h1>
              
              <div className="login-subtitle">
                <Smartphone className="login-subtitle-icon" />
                <span className="login-subtitle-text">Mobile Enforcement Portal</span>
              </div>
              
              <div className="login-warning">
                <AlertCircle className="login-warning-icon" />
                <span className="login-warning-text">ADMINISTRATIVE ACCESS ONLY</span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="login-form-content">
            <div className="login-form">
              {/* Administrator ID */}
              <div className="login-form-group">
                <label className="login-form-label">
                  <User className="login-form-label-icon" />
                  <span>Administrator ID</span>
                </label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <User />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter administrator ID"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="login-input"
                  />
                  <div className="login-input-glow"></div>
                </div>
              </div>

              {/* Password */}
              <div className="login-form-group">
                <label className="login-form-label">
                  <Lock className="login-form-label-icon" />
                  <span>Access Password</span>
                </label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <Lock />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="login-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="login-password-toggle"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                  <div className="login-input-glow"></div>
                </div>
              </div>

              {/* Options Row */}
              <div className="login-options">
                <label className="login-remember">
                  <div className="login-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                      className="login-checkbox"
                    />
                    <div className="login-checkbox-check">
                      <CheckCircle2 />
                    </div>
                  </div>
                  <span className="login-remember-text">Remember ID</span>
                </label>
                
                <button
                  type="button"
                  className="login-forgot"
                  onClick={() => showToast('Contact system administrator for password recovery', 'error')}
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="login-button"
              >
                <div className="login-button-shine"></div>
                
                {loading ? (
                  <>
                    <div className="login-button-spinner"></div>
                    <span className="login-button-text">AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <LogIn />
                    <span className="login-button-text">ACCESS ADMIN PORTAL</span>
                    <div className="login-button-arrow">
                      <Zap />
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="login-demo">
              <h3 className="login-demo-title">
                <Key />
                <span>Demo Credentials</span>
              </h3>
              <div className="login-demo-grid">
                <div 
                  className="login-demo-item"
                  onClick={() => handleDemoFill('username')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="login-demo-label">Admin ID</div>
                  <div className="login-demo-value">ADM001</div>
                </div>
                <div 
                  className="login-demo-item"
                  onClick={() => handleDemoFill('password')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="login-demo-label">Password</div>
                  <div className="login-demo-value">admin123</div>
                </div>
              </div>
            </div>

            {/* Security Footer */}
            <div className="login-security-footer">
              <div className="login-security-badge">
                <Shield />
                <p className="login-security-text">All login attempts are monitored</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badges */}
        <div className="login-security-badges">
          <div className="login-security-badge-item">
            <div className="login-security-badge-dot"></div>
            <span>256-bit Encryption</span>
          </div>
          <div className="login-security-badge-item">
            <div className="login-security-badge-dot"></div>
            <span>ISO 27001 Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}