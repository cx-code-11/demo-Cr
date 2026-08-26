'use client';

import { useState } from 'react';
import {
  X, CreditCard, Coins, Check, Heart, Loader2,
  ChevronRight, ArrowRight, ShieldCheck, RefreshCw, Globe
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';
const PRESET_AMOUNTS = [10, 25, 50, 100];
const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD - Australian Dollar' },
];

export default function DonationModal({ isOpen, onClose }) {
  // Method: 'card' (Stripe / Apple Pay / Google Pay) vs 'crypto' (NOWPayments)
  const [method, setMethod] = useState('card');
  const [frequency, setFrequency] = useState('ONE_TIME'); // 'ONE_TIME' | 'MONTHLY'
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('25');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [settlementType, setSettlementType] = useState('M0'); // M0 Instant | M1 Next Day
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
  const effectiveAmount = customAmount ? parseFloat(customAmount) : parseFloat(amount);

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!effectiveAmount || effectiveAmount <= 0) {
      setError('Please select or enter a valid donation amount.');
      return;
    }
    if (!donorName.trim() || donorName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/stripe/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          currency: currency.toLowerCase(),
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim() || undefined,
          frequency,
          settlementType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment.');

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    background: 'rgba(10, 11, 16, 0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

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
        <button onClick={onClose} disabled={loading} style={{
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
            Multi-currency cards, digital wallets &amp; crypto payments
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

        {/* ── CARD & STRIPE CHECKOUT FORM ────────────────────────────────────── */}
        {method === 'card' ? (
          <form onSubmit={handleCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

            {/* Frequency Toggle: One-time vs Monthly */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setFrequency('ONE_TIME')}
                style={{
                  padding: '0.55rem', borderRadius: '8px',
                  border: frequency === 'ONE_TIME' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                  background: frequency === 'ONE_TIME' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                  color: frequency === 'ONE_TIME' ? '#60a5fa' : 'var(--text-secondary)',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Give Once
              </button>
              <button
                type="button"
                onClick={() => setFrequency('MONTHLY')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  padding: '0.55rem', borderRadius: '8px',
                  border: frequency === 'MONTHLY' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                  background: frequency === 'MONTHLY' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                  color: frequency === 'MONTHLY' ? '#34d399' : 'var(--text-secondary)',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} /> Monthly Support
              </button>
            </div>

            {/* Currency Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                CURRENCY (AUTO-CONVERTED TO USD)
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Amount Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                AMOUNT ({currency})
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem', marginBottom: '0.5rem' }}>
                {PRESET_AMOUNTS.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setAmount(String(val)); setCustomAmount(''); setError(''); }}
                    style={{
                      padding: '0.65rem 0', borderRadius: '8px',
                      border: amount === String(val) && !customAmount ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                      background: amount === String(val) && !customAmount ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                      color: amount === String(val) && !customAmount ? '#60a5fa' : 'var(--text-primary)',
                      fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                    }}
                  >
                    {currentSymbol}{val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder={`Custom amount in ${currency}`}
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setError(''); }}
                style={inputStyle}
              />
            </div>

            {/* Donor Name & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  YOUR NAME <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={donorName}
                  onChange={e => { setDonorName(e.target.value); setError(''); }}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  placeholder="donor@example.com"
                  value={donorEmail}
                  onChange={e => setDonorEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                padding: '0.65rem 0.85rem', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px',
                color: '#f87171', fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !effectiveAmount || !donorName.trim()}
              className="btn btn-primary"
              style={{
                width: '100%', padding: '0.85rem', fontSize: '0.98rem',
                opacity: (loading || !effectiveAmount || !donorName.trim()) ? 0.6 : 1,
                cursor: (loading || !effectiveAmount || !donorName.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Processing Checkout...</>
              ) : (
                <>
                  Pay {currentSymbol}{effectiveAmount || 0} via Cards / Pay
                  <ChevronRight size={17} />
                </>
              )}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>PCI-Compliant 256-bit Encrypted Checkout</span>
            </div>
          </form>
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

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          input:focus, select:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
        `}</style>
      </div>
    </div>
  );
}
