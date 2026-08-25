'use client';

import { useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Heart, LayoutDashboard, Compass, LogOut, ArrowLeft } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '10rem' }}>Loading session...</div>;
  }

  if (!user) {
    return null; // Will redirect shortly
  }

  return (
    <div className="dashboard-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'var(--text-primary)',
          fontSize: '1.25rem',
          fontWeight: 800
        }}>
          <Heart size={20} color="#3b82f6" fill="#3b82f6" />
          <span>Trust<span className="gradient-text">Aid</span></span>
        </Link>

        {/* User Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Role: <span style={{ fontWeight: 600, color: '#60a5fa' }}>{user.role}</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link href={
            user.role === 'ADMIN' ? '/dashboard/admin' :
            user.role === 'NGO' ? '/dashboard/ngo' : '/dashboard/donor'
          } style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            color: '#fff',
            background: 'rgba(59, 130, 246, 0.1)',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 500
          }}>
            <LayoutDashboard size={18} />
            My Dashboard
          </Link>

          <Link href="/campaigns" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 500
          }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
            <Compass size={18} />
            Browse Campaigns
          </Link>

          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 500,
            marginTop: 'auto'
          }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
            <ArrowLeft size={18} />
            Main Website
          </Link>

          <button onClick={logout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            color: 'rgba(239, 68, 68, 0.8)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.95rem',
            fontWeight: 500
          }} onMouseEnter={(e) => e.target.style.color = '#ef4444'} onMouseLeave={(e) => e.target.style.color = 'rgba(239, 68, 68, 0.8)'}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
