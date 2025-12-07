import { useState, useEffect, useRef } from 'react';
import { 
  LogOut, 
  Shield, 
  User, 
  Settings,
  Bell,
  Search,
  Menu,
  ChevronDown,
  X
} from 'lucide-react';
import '../styles/header.css';

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const adminUser = {
    name: 'Administrator',
    role: 'System Admin',
    id: 'ADM001'
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile search when clicking outside on mobile
  useEffect(() => {
    const handleMobileSearchClick = (event) => {
      const mobileSearch = document.querySelector('.header-mobile-search');
      const searchButton = document.querySelector('.header-search-button');
      
      if (showMobileSearch && 
          mobileSearch && 
          !mobileSearch.contains(event.target) &&
          !searchButton?.contains(event.target)) {
        setShowMobileSearch(false);
      }
    };

    document.addEventListener('mousedown', handleMobileSearchClick);
    return () => document.removeEventListener('mousedown', handleMobileSearchClick);
  }, [showMobileSearch]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.reload();
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Perform search action
      console.log('Searching for:', searchQuery);
      setShowMobileSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowMobileSearch(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* Left Section */}
          <div className="header-left">
            <button 
              className="header-mobile-menu"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              ref={mobileMenuRef}
            >
              <Menu className="header-button-icon" />
            </button>
            
            <div className="header-logo">
              <div className="header-logo-icon">
                <Shield style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div className="header-brand">
                <div className="header-title">SecureGuard</div>
                <div className="header-subtitle">Admin Portal</div>
              </div>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="header-center">
            <div className="header-search">
              <Search className="header-search-icon" />
              <input
                type="text"
                placeholder="Search devices, users, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                className="header-search-input"
              />
              {searchQuery && (
                <button 
                  className="header-search-clear"
                  onClick={clearSearch}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  <X size={16} color="#9ca3af" />
                </button>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="header-right">
            {/* Mobile Search Button */}
            <button 
              className="header-button header-search-button"
              onClick={() => setShowMobileSearch(true)}
              style={{ display: 'none' }}
            >
              <Search className="header-button-icon" />
            </button>

            {/* Notifications */}
            <div className="header-user" ref={notificationsRef}>
              <button 
                className="header-button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
              >
                <Bell className="header-button-icon" />
                <div className="header-notification-badge"></div>
              </button>

              {showNotifications && (
                <div className="header-dropdown">
                  <div className="header-dropdown-section">
                    <div style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      color: '#6b7280',
                      fontSize: '0.875rem'
                    }}>
                      No new notifications
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button className="header-button">
              <Settings className="header-button-icon" />
            </button>

            {/* User Menu */}
            <div className="header-user" ref={userMenuRef}>
              <button 
                className="header-user-button"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
              >
                <div className="header-user-avatar">
                  <User className="header-user-avatar-icon" />
                </div>
                <div className="header-user-info">
                  <div className="header-user-name">{adminUser.name}</div>
                  <div className="header-user-role">{adminUser.role}</div>
                </div>
                <ChevronDown className={`header-user-chevron ${showUserMenu ? 'open' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="header-dropdown">
                  {/* User Info */}
                  <div className="header-dropdown-section">
                    <div className="header-dropdown-user">
                      <div className="header-dropdown-avatar">
                        <User className="header-dropdown-avatar-icon" />
                      </div>
                      <div className="header-dropdown-user-info">
                        <div className="header-dropdown-user-name">{adminUser.name}</div>
                        <div className="header-dropdown-user-id">{adminUser.id}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="header-dropdown-section">
                    <button className="header-dropdown-item">
                      <User className="header-dropdown-item-icon" />
                      <span>Profile Settings</span>
                    </button>
                    <button className="header-dropdown-item">
                      <Settings className="header-dropdown-item-icon" />
                      <span>System Preferences</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="header-dropdown-section">
                    <button 
                      className="header-dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <LogOut className="header-dropdown-item-icon" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search */}
      {showMobileSearch && (
        <div className="header-mobile-search">
          <div className="header-search">
            <Search className="header-search-icon" />
            <input
              type="text"
              placeholder="Search devices, users, or actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className="header-search-input"
              autoFocus
            />
            <button 
              className="header-search-clear"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem'
              }}
            >
              <X size={16} color="#9ca3af" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="header-dropdown" style={{
          position: 'fixed',
          top: '3.5rem',
          left: '1rem',
          width: 'calc(100% - 2rem)',
          zIndex: 1001
        }}>
          <div className="header-dropdown-section">
            <button className="header-dropdown-item">
              <User className="header-dropdown-item-icon" />
              <span>Profile Settings</span>
            </button>
            <button className="header-dropdown-item">
              <Settings className="header-dropdown-item-icon" />
              <span>System Preferences</span>
            </button>
            <div className="header-dropdown-divider"></div>
            <button 
              className="header-dropdown-item logout"
              onClick={handleLogout}
            >
              <LogOut className="header-dropdown-item-icon" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {(showUserMenu || showNotifications || showMobileMenu || showMobileSearch) && (
        <div 
          className="header-overlay"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
            setShowMobileMenu(false);
            setShowMobileSearch(false);
          }}
        />
      )}

      {/* Add CSS for mobile search button */}
      <style jsx>{`
        @media (max-width: 767px) {
          .header-search-button {
            display: flex !important;
          }
          .header-center {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}