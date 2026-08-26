'use client';

import { useState } from 'react';
import { X, Heart, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

const PRESET_AMOUNTS = [10, 25, 50, 100];
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

export default function DonationModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedAmount = amount || customAmount;

  const handlePreset = (val) => {
    setAmount(String(val));
    setCustomAmount('');
    setError('');
  };

  const handleCustom = (val) => {
    setCustomAmount(val);
    setAmount('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalAmount = parseFloat(selectedAmount);
    if (!finalAmount || finalAmount <= 0) {
      setError('Please select or enter a valid donation amount.');
      return;
    }
    if (!donorName.trim() || donorName.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payments/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment. Please try again.');
      }

      // Redirect to NOWPayments hosted checkout
      window.location.href = data.invoiceUrl;

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    background: 'rgba(10, 11, 16, 0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '1rem',
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
        width: '100%', maxWidth: '460px', maxHeight: '95vh', overflowY: 'auto',
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        padding: '2rem',
      }}>
        {/* Close */}
        <button onClick={onClose} disabled={loading} style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'rgba(255,255,255,0.06)', border: 'none',
          borderRadius: '50%', width: '34px', height: '34px',
          color: 'var(--text-secondary)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
           onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
          <X size={17} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'rgba(59,130,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Heart size={26} color="#3b82f6" fill="#3b82f6" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Make a Donation</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Secure payment via NOWPayments · Pay with card or crypto
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Amount Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              SELECT AMOUNT (USD)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {PRESET_AMOUNTS.map(val => (
                <button key={val} type="button" onClick={() => handlePreset(val)} style={{
                  padding: '0.7rem 0',
                  borderRadius: '8px',
                  border: amount === String(val)
                    ? '1px solid #3b82f6'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: amount === String(val)
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  color: amount === String(val) ? '#60a5fa' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  ${val}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Custom amount (e.g. 75)"
              value={customAmount}
              onChange={e => handleCustom(e.target.value)}
              style={{
                ...inputStyle,
                border: customAmount ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Donor Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              YOUR NAME <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={donorName}
              onChange={e => { setDonorName(e.target.value); setError(''); }}
              required
              style={inputStyle}
            />
          </div>

          {/* Donor Email (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              EMAIL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={donorEmail}
              onChange={e => setDonorEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px',
              color: '#f87171', fontSize: '0.9rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              {error}
            </div>
          )}

          {/* Amount summary */}
          {selectedAmount && parseFloat(selectedAmount) > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: '8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Donation total</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>
                ${parseFloat(selectedAmount).toFixed(2)} USD
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedAmount || !donorName.trim()}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              opacity: (loading || !selectedAmount || !donorName.trim()) ? 0.6 : 1,
              cursor: (loading || !selectedAmount || !donorName.trim()) ? 'not-allowed' : 'pointer',
              gap: '0.5rem',
            }}
          >
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating payment...</>
            ) : (
              <>Proceed to Payment <ChevronRight size={18} /></>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            You'll be redirected to the secure NOWPayments checkout.<br />
            Supports Visa, Mastercard, Bitcoin, Ethereum & 100+ more.
          </p>
        </form>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
        `}</style>
      </div>
    </div>
  );
}
