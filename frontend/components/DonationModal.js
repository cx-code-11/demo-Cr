'use client';

import { useState } from 'react';
import {
  X, CreditCard, Coins, Heart, Loader2,
  ChevronRight, ArrowRight, ShieldCheck, ExternalLink, Zap
} from 'lucide-react';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/3cI4gAbkSgeyb2y8mzfrW0l';

export default function DonationModal({ isOpen, onClose }) {
  // Method: 'card' (Stripe: Apple Pay, Google Pay, Cards) vs 'crypto' (NOWPayments)
  const [method, setMethod] = useState('card');

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
        width: '100%', maxWidth: '460px', maxHeight: '95vh', overflowY: 'auto',
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        padding: '2rem 1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
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
        <div style={{ textAlign: 'center', paddingRight: '1rem', paddingLeft: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem',
          }}>
            <Heart size={24} fill="#3b82f6" color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Support TrustAid</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Instant checkout with Apple Pay, Google Pay, Cards &amp; Crypto
          </p>
        </div>

        {/* Method Selector Tabs: Card/Wallets vs Crypto */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem',
          background: 'rgba(255,255,255,0.03)', padding: '0.3rem',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            type="button"
            onClick={() => setMethod('card')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem 0.5rem', borderRadius: '9px', border: 'none',
              background: method === 'card' ? 'var(--accent-primary)' : 'transparent',
              color: method === 'card' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <CreditCard size={15} /> Card &amp; Apple/Google Pay
          </button>

          <button
            type="button"
            onClick={() => setMethod('crypto')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem 0.5rem', borderRadius: '9px', border: 'none',
              background: method === 'crypto' ? 'var(--accent-primary)' : 'transparent',
              color: method === 'crypto' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Coins size={15} /> Crypto &amp; Web3
          </button>
        </div>

        {/* ── CARD / APPLE PAY / STRIPE CHECKOUT ────────────────────────────── */}
        {method === 'card' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
            
            {/* Features preview */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 600 }}>
                <Zap size={16} /> Instant Stripe Checkout
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                Pay securely using your preferred payment method:
              </p>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem'
              }}>
                {['Apple Pay', 'Google Pay', 'Visa', 'MasterCard', 'Amex', 'Link'].map(item => (
                  <span key={item} style={{
                    padding: '0.25rem 0.6rem', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)',
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Pay Button */}
            <a
              href={STRIPE_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.9rem 1.5rem', fontSize: '1rem', fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Pay with Card / Apple Pay <ExternalLink size={17} />
            </a>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>PCI-Compliant 256-bit Encrypted Stripe Checkout</span>
            </div>
          </div>
        ) : (
          /* ── CRYPTO & NOWPAYMENTS WIDGET ────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              width: '100%', overflow: 'hidden',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              padding: '0.25rem',
            }}>
              <iframe
                src="https://nowpayments.io/embeds/donation-widget?api_key=77JW23M-9Q944MQ-K30WB10-5EH3WGB"
                style={{
                  width: '100%', maxWidth: '346px',
                  height: '560px', border: 'none', overflowY: 'hidden',
                }}
                scrolling="no"
                title="NOWPayments Widget"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
