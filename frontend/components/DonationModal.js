'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Coins, Heart, Loader2,
  ShieldCheck, CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD — US Dollar' },
  { code: 'EUR', symbol: '€',  label: 'EUR — Euro' },
  { code: 'GBP', symbol: '£',  label: 'GBP — British Pound' },
  { code: 'CAD', symbol: 'C$', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD — Australian Dollar' },
  { code: 'INR', symbol: '₹',  label: 'INR — Indian Rupee' },
  { code: 'SGD', symbol: 'S$', label: 'SGD — Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ',label: 'AED — UAE Dirham' },
];

// ── PayPal SVG Icon ──────────────────────────────────────────────────────────
function PayPalIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.542h7.027c3.486 0 5.86 1.764 5.378 5.122-.43 2.996-2.585 4.67-5.597 4.67H9.288l-1.464 7.827a.641.641 0 0 1-.632.54h-.116z" fill="#003087"/>
      <path d="M9.288 12.97h3.096c3.012 0 5.167-1.674 5.597-4.67.482-3.358-1.892-5.122-5.378-5.122H5.576a.641.641 0 0 0-.632.542L2.838 17.065a.64.64 0 0 0 .633.732h3.693l1.464-7.827h.66z" fill="#0079C1" opacity="0.95"/>
      <path d="M8.29 17.797l1.098-6.867h3.096c2.72 0 4.693-1.364 5.253-3.955.19 1.134.025 2.378-.585 3.328-1.028 1.6-2.906 2.164-5.304 2.164H9.728l-1.096 5.86a.641.641 0 0 1-.632.54h-.01a.64.64 0 0 1-.63-.734l.93-4.336z" fill="#00457C"/>
    </svg>
  );
}

// ── Root Modal ───────────────────────────────────────────────────────────────
export default function DonationModal({ isOpen, onClose }) {
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
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        padding: '2rem 1.75rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        {/* Close */}
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
        <div style={{ textAlign: 'center', padding: '0 1rem' }}>
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

        {/* Tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem',
          background: 'rgba(255,255,255,0.03)', padding: '0.3rem',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button type="button" onClick={() => setMethod('paypal')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            padding: '0.7rem 0.5rem', borderRadius: '9px', border: 'none',
            background: method === 'paypal' ? '#0070ba' : 'transparent',
            color: method === 'paypal' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <PayPalIcon size={16} /> PayPal
          </button>

          <button type="button" onClick={() => setMethod('crypto')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            padding: '0.7rem 0.5rem', borderRadius: '9px', border: 'none',
            background: method === 'crypto' ? 'var(--accent-primary)' : 'transparent',
            color: method === 'crypto' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <Coins size={16} /> Crypto &amp; Web3
          </button>
        </div>

        {/* Panels */}
        {method === 'paypal' && <PayPalCheckoutPanel onSuccess={onClose} />}

        {method === 'crypto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              width: '100%', overflow: 'hidden', borderRadius: '12px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '0.25rem',
            }}>
              <iframe
                src="https://nowpayments.io/embeds/donation-widget?api_key=77JW23M-9Q944MQ-K30WB10-5EH3WGB"
                style={{ width: '100%', maxWidth: '346px', height: '560px', border: 'none' }}
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

// ── PayPal Checkout Panel ────────────────────────────────────────────────────
function PayPalCheckoutPanel({ onSuccess }) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [amount, setAmount]           = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom]       = useState(false);
  const [currency, setCurrency]       = useState('USD');
  const [donorName, setDonorName]     = useState('');
  const [donorEmail, setDonorEmail]   = useState('');
  const [sdkReady, setSdkReady]       = useState(false);
  const [sdkError, setSdkError]       = useState(null);
  const [status, setStatus]           = useState('idle'); // idle | loading | success | error
  const [statusMsg, setStatusMsg]     = useState('');

  const paypalContainerRef = useRef(null);
  const buttonsRef         = useRef(null);

  const finalAmount    = isCustom ? (parseFloat(customAmount) || 0) : amount;
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
  const isValid        = finalAmount >= 1;

  // ── Shared input style ───────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '0.7rem 0.9rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'var(--text-primary)', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  // ── Load / reload PayPal SDK when currency changes ───────────────────────
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setSdkError('PayPal Client ID not configured.');
      return;
    }
    setSdkReady(false);
    const existing = document.getElementById('paypal-sdk');
    if (existing) existing.remove();
    if (buttonsRef.current) {
      try { buttonsRef.current.close(); } catch (_) {}
      buttonsRef.current = null;
    }
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${currency}&intent=capture`;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setSdkError('Failed to load PayPal SDK.');
    document.head.appendChild(script);
  }, [currency]);

  // ── Render PayPal Smart Buttons ──────────────────────────────────────────
  const renderButtons = useCallback(() => {
    if (!sdkReady || !window.paypal || !paypalContainerRef.current || !isValid) return;

    if (buttonsRef.current) {
      try { buttonsRef.current.close(); } catch (_) {}
      buttonsRef.current = null;
    }
    paypalContainerRef.current.innerHTML = '';

    buttonsRef.current = window.paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 48 },

      createOrder: async () => {
        setStatus('loading');
        setStatusMsg('Creating order…');
        try {
          const res = await fetch(`${BACKEND_URL}/api/payments/paypal/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: finalAmount,
              currency,
              donorName: donorName.trim() || 'Anonymous Donor',
              donorEmail: donorEmail.trim() || undefined,
              frequency: 'ONE_TIME',
              settlementType: 'M0',
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create order');
          setStatus('idle');
          return data.paypalOrderId;
        } catch (err) {
          setStatus('error');
          setStatusMsg(err.message);
          throw err;
        }
      },

      onApprove: async (data) => {
        setStatus('loading');
        setStatusMsg('Finalising your donation…');
        try {
          const res = await fetch(`${BACKEND_URL}/api/payments/paypal/capture-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Capture failed');
          setStatus('success');
          setTimeout(() => { window.location.href = '/thank-you'; }, 1200);
        } catch (err) {
          setStatus('error');
          setStatusMsg(err.message);
        }
      },

      onCancel: () => { setStatus('idle'); setStatusMsg(''); },
      onError: (err) => {
        console.error('[PAYPAL BUTTON ERROR]', err);
        setStatus('error');
        setStatusMsg('An error occurred with PayPal. Please try again.');
      },
    });

    if (buttonsRef.current.isEligible()) {
      buttonsRef.current.render(paypalContainerRef.current);
    }
  }, [sdkReady, isValid, finalAmount, donorName, donorEmail, currency]);

  useEffect(() => {
    renderButtons();
    return () => {
      if (buttonsRef.current) {
        try { buttonsRef.current.close(); } catch (_) {}
        buttonsRef.current = null;
      }
    };
  }, [renderButtons]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

      {/* Amount + Currency */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Donation Amount
          </label>
          {/* Currency dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              style={{
                appearance: 'none',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontSize: '0.8rem', fontWeight: 700,
                padding: '0.3rem 1.8rem 0.3rem 0.7rem',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code} style={{ background: '#1a1b23', color: '#e2e8f0' }}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '0.45rem', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {PRESET_AMOUNTS.map(a => (
            <button key={a} type="button"
              onClick={() => { setAmount(a); setIsCustom(false); setCustomAmount(''); }}
              style={{
                flex: '1 1 0', minWidth: '56px', padding: '0.55rem 0.4rem',
                borderRadius: '9px', border: (!isCustom && amount === a) ? '1.5px solid #0070ba' : '1px solid rgba(255,255,255,0.1)',
                background: (!isCustom && amount === a) ? 'rgba(0,112,186,0.18)' : 'rgba(255,255,255,0.04)',
                color: (!isCustom && amount === a) ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.18s',
              }}
            >
              {currencySymbol}{a}
            </button>
          ))}
          <button type="button" onClick={() => { setIsCustom(true); setCustomAmount(''); }}
            style={{
              flex: '1 1 0', minWidth: '56px', padding: '0.55rem 0.4rem',
              borderRadius: '9px', border: isCustom ? '1.5px solid #0070ba' : '1px solid rgba(255,255,255,0.1)',
              background: isCustom ? 'rgba(0,112,186,0.18)' : 'rgba(255,255,255,0.04)',
              color: isCustom ? '#38bdf8' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.18s',
            }}
          >
            Custom
          </button>
        </div>

        {/* Custom amount input */}
        {isCustom && (
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 700 }}>
              {currencySymbol}
            </span>
            <input
              type="number" min="1" placeholder="Enter amount"
              value={customAmount} onChange={e => setCustomAmount(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '1.8rem' }}
              onFocus={e => e.target.style.borderColor = '#0070ba'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        )}
      </div>

      {/* Donor details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Your Details <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: '0.75rem' }}>(optional)</span>
        </label>
        <input type="text" placeholder="Full Name (optional)"
          value={donorName} onChange={e => setDonorName(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#0070ba'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <input type="email" placeholder="Email Address (optional)"
          value={donorEmail} onChange={e => setDonorEmail(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#0070ba'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* Order summary */}
      {finalAmount >= 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.7rem 1rem',
          background: 'rgba(0,112,186,0.08)', border: '1px solid rgba(0,112,186,0.2)',
          borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700,
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>One-time donation</span>
          <span style={{ color: '#38bdf8', fontSize: '1.05rem' }}>
            {currencySymbol}{finalAmount.toFixed(2)} {currency}
          </span>
        </div>
      )}

      {/* Status messages */}
      {status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.85rem' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          {statusMsg}
        </div>
      )}
      {status === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
          <CheckCircle2 size={16} /> Payment successful! Redirecting…
        </div>
      )}
      {status === 'error' && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          color: '#f87171', fontSize: '0.82rem', lineHeight: 1.4,
          padding: '0.6rem 0.8rem',
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '8px',
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
          {statusMsg}
        </div>
      )}

      {/* SDK error */}
      {sdkError && (
        <div style={{ color: '#f87171', fontSize: '0.82rem', textAlign: 'center', padding: '0.5rem' }}>
          ⚠️ {sdkError}
        </div>
      )}

      {/* Prompt when amount not set */}
      {!sdkError && !isValid && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: '10px', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: '0.82rem',
        }}>
          Please select or enter a valid donation amount (minimum 1 {currency}).
        </div>
      )}

      {/* PayPal buttons container */}
      <div
        ref={paypalContainerRef}
        style={{ display: isValid && !sdkError ? 'block' : 'none', minHeight: '50px', borderRadius: '10px', overflow: 'hidden' }}
      />

      {/* SDK loading indicator */}
      {!sdkReady && !sdkError && isValid && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Loading PayPal…
        </div>
      )}

      {/* Trust badge */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        <ShieldCheck size={14} color="#10b981" />
        <span>PayPal Buyer &amp; Donor Protection Enabled</span>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
