import React, { useState } from 'react';
import { BookOpen, User, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

export default function AuthPage({ onLoginSuccess, apiBase }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // 'student' | 'lecturer'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!username.trim() || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { username, password } 
      : { username, password, name, role };

    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message || 'An error occurred during authentication.');
      }
    } catch (err) {
      console.error('Auth request error:', err);
      setError('Cannot reach server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      flex: 1,
      position: 'relative'
    }}>
      {/* Decorative Glow - Disabled in V1 */}
      <div style={{ display: 'none' }}></div>

      <div style={{
        width: '100%',
        maxWidth: '460px',
        animation: 'fadeIn 0.5s ease'
      }}>
        {/* Brand Logo Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'var(--color-secondary)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--border-color)',
            display: 'inline-flex',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '16px'
          }}>
            <BookOpen size={32} color="#fff" />
          </div>
          <h1 style={{
            fontSize: '32px',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            background: 'linear-gradient(to right, var(--text-primary), var(--color-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '4px'
          }}>
            EduVault
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {isLogin ? 'Welcome back! Sign in to continue your learning.' : 'Create an account to start sharing or learning.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card" style={{ padding: '36px', transform: 'none' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: 'var(--color-danger)',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name (Register Only) */}
            {!isLogin && (
              <div className="input-group">
                <label className="input-label">
                  <User size={14} />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Professor John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-input"
                  required
                />
              </div>
            )}

            {/* Username / Email */}
            <div className="input-group">
              <label className="input-label">
                <Mail size={14} />
                <span>Username</span>
              </label>
              <input
                type="text"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-input"
                required
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label">
                <Lock size={14} />
                <span>Password</span>
              </label>
              <input
                type="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
                required
              />
            </div>

            {/* Role Selection Tabs (Register Only) */}
            {!isLogin && (
              <div className="input-group" style={{ marginBottom: '28px' }}>
                <span className="input-label">I am a...</span>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginTop: '4px'
                }}>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: role === 'student' ? 'var(--color-primary)' : 'var(--border-color)',
                      background: role === 'student' ? 'var(--color-primary)' : 'var(--bg-card)',
                      color: role === 'student' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('lecturer')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: role === 'lecturer' ? 'var(--color-primary)' : 'var(--border-color)',
                      background: role === 'lecturer' ? 'var(--color-primary)' : 'var(--bg-card)',
                      color: role === 'lecturer' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all var(--transition-fast)'
                        }}
                  >
                    Lecturer
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '10px',
                height: '48px'
              }}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Log In' : 'Create Account'}</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
            <button
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
