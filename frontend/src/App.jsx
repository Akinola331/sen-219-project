import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import { BookOpen } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeView, setActiveView] = useState('auth'); // 'auth' | 'dashboard'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-login on reload
  useEffect(() => {
    const savedToken = localStorage.getItem('elearning_token');
    if (savedToken) {
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setToken(authToken);
        setActiveView('dashboard');
      } else {
        // Token expired or invalid
        localStorage.removeItem('elearning_token');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMsg('Cannot connect to authentication server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData, authToken) => {
    localStorage.setItem('elearning_token', authToken);
    setUser(userData);
    setToken(authToken);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('elearning_token');
    setUser(null);
    setToken(null);
    setActiveView('auth');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '15px' }}>
          Connecting to E-Learning portal...
        </p>
        {errorMsg && (
          <p style={{ color: 'var(--color-danger)', fontSize: '14px', maxWidth: '300px', textAlign: 'center', marginTop: '10px' }}>
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {activeView === 'dashboard' && user && (
        <Navbar user={user} onLogout={handleLogout} />
      )}
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeView === 'auth' ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} apiBase={API_BASE} />
        ) : (
          <Dashboard user={user} token={token} apiBase={API_BASE} />
        )}
      </main>
      
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: 'var(--text-muted)',
        fontSize: '13px',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto',
        background: 'rgba(11, 15, 25, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
          <BookOpen size={14} className="text-primary" style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>EduVault</span>
          <span>&bull; Secure Academic Document Exchange</span>
        </div>
        <p>&copy; {new Date().getFullYear()} EduVault. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
