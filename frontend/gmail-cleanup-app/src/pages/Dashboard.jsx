import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService, gmailService } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import PreviewModal from '../components/PreviewModal';
import 'boxicons/css/boxicons.min.css';
import './Dashboard.css';

function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewGroups, setPreviewGroups] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({
    cleanUnread: false,
    cleanSpam: false,
    cleanTrash: false,
    cleanOldEmails: false,
    oldEmailsMonths: 12,
  });

  useEffect(() => {
    if (!sessionId) {
      navigate('/login');
      return;
    }

    loadUserData();
    loadStats();

    // Load dark mode preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Load auto-refresh preference
    const savedAutoRefresh = localStorage.getItem('autoRefresh');
    if (savedAutoRefresh === 'true') {
      setAutoRefresh(true);
    }
  }, [sessionId, navigate]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !sessionId) return;

    const interval = setInterval(() => {
      loadStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, sessionId]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleAutoRefresh = () => {
    const newValue = !autoRefresh;
    setAutoRefresh(newValue);
    localStorage.setItem('autoRefresh', newValue.toString());
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setTimeout(() => setRefreshing(false), 500);
  };

  const loadUserData = async () => {
    try {
      const userData = await authService.getUser(sessionId);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      navigate('/login?error=session_expired');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await gmailService.getStats(sessionId);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleCleanup = async () => {
    if (!Object.values(selectedOptions).some((v) => v === true)) {
      alert('Please select at least one cleanup option');
      return;
    }

    try {
      setPreviewLoading(true);
      setShowPreviewModal(true);
      const previewResult = await gmailService.getPreview(sessionId, selectedOptions);

      if (previewResult.success && previewResult.groups) {
        setPreviewGroups(previewResult.groups);
      } else {
        alert('Failed to load preview: ' + (previewResult.message || 'Unknown error'));
        setShowPreviewModal(false);
      }
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to load preview. Please try again.');
      setShowPreviewModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewConfirm = async (selectedMessageIds) => {
    setShowPreviewModal(false);
    setShowConfirmModal(true);
  };

  const confirmCleanup = async () => {
    setShowConfirmModal(false);

    try {
      setCleaning(true);
      setCleanupResult(null);
      const result = await gmailService.cleanup(sessionId, selectedOptions);
      setCleanupResult(result);
      await loadStats();
      setSelectedOptions({
        cleanUnread: false,
        cleanSpam: false,
        cleanTrash: false,
        cleanOldEmails: false,
        oldEmailsMonths: 12,
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed. Please try again.');
    } finally {
      setCleaning(false);
    }
  };

  const getConfirmationDetails = () => {
    const details = [];
    if (selectedOptions.cleanUnread && stats?.unreadCount > 0) {
      details.push(`${stats.unreadCount} unread emails`);
    }
    if (selectedOptions.cleanSpam && stats?.spamCount > 0) {
      details.push(`${stats.spamCount} spam messages`);
    }
    if (selectedOptions.cleanTrash && stats?.trashCount > 0) {
      details.push(`${stats.trashCount} trash items`);
    }
    if (selectedOptions.cleanOldEmails && stats?.oldEmailsCount > 0) {
      details.push(`${stats.oldEmailsCount} old emails (${selectedOptions.oldEmailsMonths}+ months)`);
    }
    return details;
  };

  const handleLogout = async () => {
    try {
      await authService.logout(sessionId);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  if (loading && !user) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard ${darkMode ? 'dark' : ''}`}>
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <i className='bx bxs-envelope-open'></i>
            <span>Gmail Cleanup</span>
          </div>

          <div className="navbar-actions">
            <button
              className="refresh-button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh stats"
            >
              <i className={`bx bx-refresh ${refreshing ? 'spinning' : ''}`}></i>
            </button>

            <button
              className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}
              onClick={toggleAutoRefresh}
              title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
            >
              <i className='bx bx-time-five'></i>
              {autoRefresh && <span className="refresh-indicator"></span>}
            </button>

            <button className="theme-toggle" onClick={toggleDarkMode} title="Toggle theme">
              <i className={`bx ${darkMode ? 'bxs-sun' : 'bxs-moon'}`}></i>
            </button>

            {user && (
              <>
                <div className="user-menu">
                  <img src={user.picture} alt={user.name} className="user-avatar-small" />
                  <div className="user-info-small">
                    <span className="user-name-small">{user.name}</span>
                    <span className="user-email-small">{user.email}</span>
                  </div>
                </div>

                <button className="logout-button" onClick={handleLogout}>
                  <i className='bx bx-log-out'></i>
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p>Manage and clean up your Gmail inbox with ease</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon unread">
                <i className='bx bx-envelope'></i>
              </div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats?.unreadCount || 0}</h3>
                <p>Unread Emails</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon spam">
                <i className='bx bxs-shield-x'></i>
              </div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats?.spamCount || 0}</h3>
                <p>Spam Messages</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon trash">
                <i className='bx bxs-trash'></i>
              </div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats?.trashCount || 0}</h3>
                <p>In Trash</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon old">
                <i className='bx bx-time-five'></i>
              </div>
              <div className="stat-content">
                <h3>{loading ? '...' : stats?.oldEmailsCount || 0}</h3>
                <p>Old Emails (12+ mo)</p>
              </div>
            </div>
          </div>

          {/* Cleanup Section */}
          <div className="cleanup-card">
            <div className="card-header">
              <div className="header-content">
                <i className='bx bx-trash-alt'></i>
                <div>
                  <h2>Cleanup Options</h2>
                  <p>Select what you want to clean from your Gmail</p>
                </div>
              </div>
            </div>

            <div className="cleanup-options">
              <label className={`option-card ${!stats?.unreadCount ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedOptions.cleanUnread}
                  onChange={() => handleCheckboxChange('cleanUnread')}
                  disabled={cleaning || !stats?.unreadCount}
                />
                <div className="option-content">
                  <div className="option-icon unread">
                    <i className='bx bx-envelope'></i>
                  </div>
                  <div className="option-info">
                    <h4>Delete all unread emails</h4>
                    <p>{stats?.unreadCount || 0} unread messages</p>
                  </div>
                </div>
                <div className="option-check">
                  <i className='bx bx-check'></i>
                </div>
              </label>

              <label className={`option-card ${!stats?.spamCount ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedOptions.cleanSpam}
                  onChange={() => handleCheckboxChange('cleanSpam')}
                  disabled={cleaning || !stats?.spamCount}
                />
                <div className="option-content">
                  <div className="option-icon spam">
                    <i className='bx bxs-shield-x'></i>
                  </div>
                  <div className="option-info">
                    <h4>Empty spam folder</h4>
                    <p>{stats?.spamCount || 0} spam messages</p>
                  </div>
                </div>
                <div className="option-check">
                  <i className='bx bx-check'></i>
                </div>
              </label>

              <label className={`option-card ${!stats?.trashCount ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedOptions.cleanTrash}
                  onChange={() => handleCheckboxChange('cleanTrash')}
                  disabled={cleaning || !stats?.trashCount}
                />
                <div className="option-content">
                  <div className="option-icon trash">
                    <i className='bx bxs-trash'></i>
                  </div>
                  <div className="option-info">
                    <h4>Empty trash folder</h4>
                    <p>{stats?.trashCount || 0} items in trash</p>
                  </div>
                </div>
                <div className="option-check">
                  <i className='bx bx-check'></i>
                </div>
              </label>

              <label className={`option-card ${!stats?.oldEmailsCount ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedOptions.cleanOldEmails}
                  onChange={() => handleCheckboxChange('cleanOldEmails')}
                  disabled={cleaning || !stats?.oldEmailsCount}
                />
                <div className="option-content">
                  <div className="option-icon old">
                    <i className='bx bx-time-five'></i>
                  </div>
                  <div className="option-info">
                    <h4>Delete old emails</h4>
                    <p>{stats?.oldEmailsCount || 0} old messages</p>
                    <select
                      value={selectedOptions.oldEmailsMonths}
                      onChange={(e) =>
                        setSelectedOptions((prev) => ({
                          ...prev,
                          oldEmailsMonths: parseInt(e.target.value),
                        }))
                      }
                      disabled={!selectedOptions.cleanOldEmails || cleaning}
                      className="months-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="6">Older than 6 months</option>
                      <option value="12">Older than 12 months</option>
                      <option value="24">Older than 24 months</option>
                      <option value="36">Older than 36 months</option>
                    </select>
                  </div>
                </div>
                <div className="option-check">
                  <i className='bx bx-check'></i>
                </div>
              </label>
            </div>

            <button
              className="cleanup-button"
              onClick={handleCleanup}
              disabled={cleaning || !Object.values(selectedOptions).some((v) => v === true)}
            >
              {cleaning ? (
                <>
                  <div className="button-spinner"></div>
                  <span>Cleaning...</span>
                </>
              ) : (
                <>
                  <i className='bx bx-trash'></i>
                  <span>Clean Up Now</span>
                </>
              )}
            </button>
          </div>

          {/* Result Section */}
          {cleanupResult && (
            <div className={`result-card ${cleanupResult.success ? 'success' : 'error'}`}>
              <div className="result-icon">
                <i className={`bx ${cleanupResult.success ? 'bx-check-circle' : 'bx-error-circle'}`}></i>
              </div>
              <div className="result-content">
                <h3>{cleanupResult.success ? 'Cleanup Successful!' : 'Cleanup Failed'}</h3>
                <p>{cleanupResult.message}</p>
                {cleanupResult.success && cleanupResult.details && (
                  <div className="result-details">
                    {cleanupResult.details.unreadDeleted > 0 && (
                      <div className="detail-item">
                        <i className='bx bx-check'></i>
                        <span>{cleanupResult.details.unreadDeleted} unread emails deleted</span>
                      </div>
                    )}
                    {cleanupResult.details.spamDeleted > 0 && (
                      <div className="detail-item">
                        <i className='bx bx-check'></i>
                        <span>{cleanupResult.details.spamDeleted} spam emails deleted</span>
                      </div>
                    )}
                    {cleanupResult.details.trashDeleted > 0 && (
                      <div className="detail-item">
                        <i className='bx bx-check'></i>
                        <span>{cleanupResult.details.trashDeleted} trash emails deleted</span>
                      </div>
                    )}
                    {cleanupResult.details.oldEmailsDeleted > 0 && (
                      <div className="detail-item">
                        <i className='bx bx-check'></i>
                        <span>{cleanupResult.details.oldEmailsDeleted} old emails deleted</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handlePreviewConfirm}
        groups={previewGroups}
        loading={previewLoading}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCleanup}
        title="Confirm Cleanup"
        message="Are you sure you want to delete these emails? This action cannot be undone!"
        details={getConfirmationDetails()}
        confirmText="Delete Now"
        cancelText="Cancel"
        danger={true}
      />
    </div>
  );
}

export default Dashboard;
