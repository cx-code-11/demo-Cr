'use client';

import { useState } from 'react';
import {
  X, Coins, Heart, Loader2,
  ChevronRight, ArrowRight, ShieldCheck, ExternalLink, CheckCircle2
} from 'lucide-react';

const PAYPAL_PAYMENT_LINK = 'https://paypal.me/aramtrustmain';

function PayPalIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.542h7.027c3.486 0 5.86 1.764 5.378 5.122-.43 2.996-2.585 4.67-5.597 4.67H9.288l-1.464 7.827a.641.641 0 0 1-.632.54h-.116z" fill="#003087"/>
      <path d="M9.288 12.97h3.096c3.012 0 5.167-1.674 5.597-4.67.482-3.358-1.892-5.122-5.378-5.122H5.576a.641.641 0 0 0-.632.542L2.838 17.065a.64.64 0 0 0 .633.732h3.693l1.464-7.827h.66z" fill="#0079C1" opacity="0.95"/>
      <path d="M8.29 17.797l1.098-6.867h3.096c2.72 0 4.693-1.364 5.253-3.955.19 1.134.025 2.378-.585 3.328-1.028 1.6-2.906 2.164-5.304 2.164H9.728l-1.096 5.86a.641.641 0 0 1-.632.54h-.01a.64.64 0 0 1-.63-.734l.93-4.336z" fill="#00457C"/>
    </svg>
  );
}

export default function DonationModal({ isOpen, onClose }) {
  // Method: 'paypal' | 'crypto'
  const [method, setMethod] = useState('paypal');

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
        width: '100%', maxWidth: '480px', maxHeight: '95vh', overflowY: 'auto',
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
            Instant checkout with PayPal &amp; Crypto
          </p>
        </div>

        {/* Method Selector Tabs: PayPal vs Crypto */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem',
          background: 'rgba(255,255,255,0.03)', padding: '0.3rem',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            type="button"
            onClick={() => setMethod('paypal')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              padding: '0.7rem 0.5rem', borderRadius: '9px', border: 'none',
              background: method === 'paypal' ? '#0070ba' : 'transparent',
              color: method === 'paypal' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            <PayPalIcon size={16} /> PayPal
          </button>

          <button
            type="button"
            onClick={() => setMethod('crypto')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              padding: '0.7rem 0.5rem', borderRadius: '9px', border: 'none',
              background: method === 'crypto' ? 'var(--accent-primary)' : 'transparent',
              color: method === 'crypto' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            <Coins size={16} /> Crypto &amp; Web3
          </button>
        </div>

        {/* ── PAYPAL / PAYPAL.ME CHECKOUT ───────────────────────────────────── */}
        {method === 'paypal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 112, 186, 0.08) 0%, rgba(0, 48, 135, 0.12) 100%)',
              border: '1px solid rgba(0, 112, 186, 0.25)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700 }}>
                  <PayPalIcon size={18} /> PayPal.Me Direct
                </div>
                <span style={{
                  padding: '0.2rem 0.55rem', borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8',
                }}>
                  Verified Recipient
                </span>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                background: 'rgba(0,0,0,0.25)', padding: '0.6rem 0.8rem',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Handle:</span>
                <code style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.9rem' }}>paypal.me/aramtrustmain</code>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                Donate seamlessly using your PayPal balance, linked bank account, debit card, or credit card.
              </p>
            </div>

            {/* Direct PayPal Button */}
            <a
              href={PAYPAL_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.9rem 1.5rem', fontSize: '1rem', fontWeight: 700,
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #0070ba 0%, #003087 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(0, 112, 186, 0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 112, 186, 0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 112, 186, 0.35)';
              }}
            >
              <PayPalIcon size={18} /> Pay via PayPal.Me <ExternalLink size={17} />
            </a>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>PayPal Buyer &amp; Donor Protection Enabled</span>
            </div>
          </div>
        )}

        {/* ── CRYPTO & NOWPAYMENTS WIDGET ────────────────────────────────────── */}
        {method === 'crypto' && (
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


