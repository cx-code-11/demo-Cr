'use client';

import Link from 'next/link';
import { Heart, Compass } from 'lucide-react';

export default function Navbar() {

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 11, 16, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '1rem 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'var(--text-primary)',
          fontSize: '1.4rem',
          fontWeight: 800
        }}>
          <Heart size={24} color="#3b82f6" fill="#3b82f6" />
          <span>Trust<span className="gradient-text">Aid</span></span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <Link href="/campaigns" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            fontSize: '0.95rem',
            transition: 'color 0.2s'
          }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
            <Compass size={18} />
            Explore
          </Link>
        </div>
      </div>
    </nav>
  );
}
