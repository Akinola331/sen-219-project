import React from 'react';
import { BookOpen, LogOut, User } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#ffffff',
      backdropFilter: 'none',
      borderBottom: '2px solid var(--border-color)',
      padding: '16px 24px'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer'
        }}>
          <div style={{
            background: 'var(--color-secondary)',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <span style={{
            fontSize: '22px',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            background: 'linear-gradient(to right, var(--text-primary), var(--color-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            EduVault
          </span>
        </div>

        {/* User Info & Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(0, 0, 0, 0.02)',
            padding: '6px 14px',
            borderRadius: '30px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: user.role === 'lecturer' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: user.role === 'lecturer' ? 'var(--color-primary)' : 'var(--color-success)'
            }}>
              <User size={15} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                {user.username}
              </span>
            </div>

            <span className={`badge badge-${user.role}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
              {user.role}
            </span>
          </div>

          <button 
            onClick={onLogout}
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Log Out"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
