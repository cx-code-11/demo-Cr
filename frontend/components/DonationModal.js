'use client';

import { X } from 'lucide-react';

export default function DonationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 11, 16, 0.88)',
      backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', maxHeight: '95vh', overflowY: 'auto',
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        padding: '2rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'rgba(255,255,255,0.06)', border: 'none',
          borderRadius: '50%', width: '34px', height: '34px',
          color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <X size={17} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', width: '100%', paddingRight: '2rem' }}>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Donation
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Secure payment via NOWPayments
          </p>
        </div>

        {/* NOWPayments Widget */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          width: '100%', overflow: 'hidden',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          padding: '0.5rem',
        }}>
          <iframe
            src="https://nowpayments.io/embeds/donation-widget?api_key=037862fb-9c69-4d18-8e4c-9aeb618d3482"
            style={{
              width: '100%', maxWidth: '346px',
              height: '630px', border: 'none', overflowY: 'hidden',
            }}
            scrolling="no"
            title="Donation Widget"
          />
        </div>
      </div>
    </div>
  );
}
