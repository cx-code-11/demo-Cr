'use client';

import { X } from 'lucide-react';

export default function DonationModal({ isOpen, onClose, campaignTitle }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(10, 11, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        maxHeight: '95vh',
        overflowY: 'auto',
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-premium)'
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, color 0.2s'
        }} onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.color = '#fff';
        }} onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', width: '100%', paddingRight: '2rem', paddingLeft: '2rem' }}>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Donation
          </h3>
          {campaignTitle && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
              Supporting: <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{campaignTitle}</span>
            </p>
          )}
        </div>

        {/* Responsive Widget Wrapper */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          overflow: 'hidden',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.01)',
          padding: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <iframe
            src="https://nowpayments.io/embeds/donation-widget?api_key=037862fb-9c69-4d18-8e4c-9aeb618d3482"
            style={{
              width: '100%',
              maxWidth: '346px',
              height: '630px',
              border: 'none',
              overflowY: 'hidden',
            }}
            scrolling="no"
            title="Donation Widget"
          />
        </div>
      </div>
    </div>
  );
}
