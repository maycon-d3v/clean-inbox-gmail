import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import 'boxicons/css/boxicons.min.css';
import './Login.css';

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
    }

    // Load dark mode preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [searchParams]);

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

  const handleLogin = async (forceAccountSelection = false) => {
    try {
      setLoading(true);
      setError('');
      const authUrl = await authService.getLoginUrl(forceAccountSelection);

      // Force redirect - better compatibility with mobile browsers
      setTimeout(() => {
        window.location.href = authUrl;
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError(`Failed to initiate login: ${err.message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  return (
    <div className={`login-container ${darkMode ? 'dark' : ''}`}>
      {/* Theme Toggle */}
      <button className="theme-toggle-login" onClick={toggleDarkMode} title="Toggle theme">
        <i className={`bx ${darkMode ? 'bxs-sun' : 'bxs-moon'}`}></i>
      </button>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <i className='bx bxs-envelope-open'></i>
          </div>
          <h1>Gmail Cleanup Dashboard</h1>
          <p>Clean up your Gmail inbox with ease</p>
        </div>

        <div className="login-content">
          <div className="features">
            <div className="feature">
              <div className="feature-icon unread">
                <i className='bx bx-envelope'></i>
              </div>
              <span>Delete unread emails</span>
            </div>
            <div className="feature">
              <div className="feature-icon spam">
                <i className='bx bxs-shield-x'></i>
              </div>
              <span>Empty spam & trash</span>
            </div>
            <div className="feature">
              <div className="feature-icon old">
                <i className='bx bx-time-five'></i>
              </div>
              <span>Remove old emails</span>
            </div>
            <div className="feature">
              <div className="feature-icon secure">
                <i className='bx bxs-lock-alt'></i>
              </div>
              <span>Secure OAuth2 authentication</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <i className='bx bx-error-circle'></i>
              {error}
            </div>
          )}

          <div className="login-buttons">
            <button
              className="google-login-btn primary"
              onClick={() => handleLogin(false)}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Redirecting...' : 'Sign in with Google'}
            </button>

            <button
              className="google-login-btn secondary"
              onClick={() => handleLogin(true)}
              disabled={loading}
            >
              <i className='bx bx-user-circle'></i>
              Sign in with another account
            </button>
          </div>

          <p className="privacy-note">
            <i className='bx bxs-shield'></i>
            This app only accesses your Gmail to perform the cleanup actions you request.
            Your data is never stored or shared.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
