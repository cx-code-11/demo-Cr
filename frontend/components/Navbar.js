'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import DonationModal from './DonationModal';

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
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
          {/* Logo */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-primary)',
            fontSize: '1.4rem',
            fontWeight: 800,
            textDecoration: 'none',
          }}>
            <Heart size={24} color="#3b82f6" fill="#3b82f6" />
            <span>Trust<span className="gradient-text">Aid</span></span>
          </Link>

          {/* Donate Button */}
          <button
            id="donate-btn"
            onClick={() => setModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}
          >
            Donate
          </button>
        </div>
      </nav>

      <DonationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
