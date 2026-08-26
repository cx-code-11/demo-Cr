'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard, Smartphone, QrCode, Zap, RotateCcw,
  CheckCircle, ArrowLeft, ShieldCheck, Coins, ExternalLink,
  ChevronRight, RefreshCw, Volume2, Sparkles
} from 'lucide-react';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/3cI4gAbkSgeyb2y8mzfrW0l';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

export default function VirtualPOSTerminal() {
  const [amountStr, setAmountStr] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [donorName, setDonorName] = useState('');
  const [settlementType, setSettlementType] = useState('M0'); // M0 Instant | M1 Next Day
  const [activeTab, setActiveTab] = useState('charge'); // 'charge' | 'qr' | 'crypto' | 'success'
  const [recentSales, setRecentSales] = useState([]);
  const [lastCharged, setLastCharged] = useState(null);

  const numAmount = parseFloat(amountStr) || 0;
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  // Keypad press handler
  const handleKey = (key) => {
    if (key === 'C') {
      setAmountStr('0');
      return;
    }
    if (key === 'DEL') {
      if (amountStr.length <= 1) {
        setAmountStr('0');
      } else {
        setAmountStr(amountStr.slice(0, -1));
      }
      return;
    }
    if (key === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(amountStr + '.');
      }
      return;
    }

    // Numbers
    if (amountStr === '0') {
      setAmountStr(String(key));
    } else {
      // Limit to 2 decimal places if decimal exists
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      if (amountStr.length >= 7) return; // Prevent unreasonable numbers
      setAmountStr(amountStr + String(key));
    }
  };

  const handlePreset = (val) => {
    setAmountStr(String(val));
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(STRIPE_PAYMENT_LINK)}`;

  const handleChargeCard = () => {
    if (numAmount <= 0) return;
    setLastCharged({
      amount: numAmount,
      currency,
      donorName: donorName || 'Anonymous Customer',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      settlementType,
    });
    window.open(STRIPE_PAYMENT_LINK, '_blank');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.08), var(--bg-primary) 65%)',
      padding: '2rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Top Header Bar */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
      }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem',
        }}>
          <ArrowLeft size={16} /> Exit POS
        </Link>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.75rem', borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#34d399', fontSize: '0.75rem', fontWeight: 700,
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          Web POS Online (No Hardware Needed)
        </div>
      </div>

      {/* Main POS Device Frame */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#0d0f17',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '28px',
        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Terminal Screen Header */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(30, 34, 52, 0.6) 0%, rgba(13, 15, 23, 0.9) 100%)',
          padding: '1.75rem 1.5rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center',
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Amount to Collect
          </div>
          <div style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: '#f8fafc',
            lineHeight: 1.1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.2rem',
          }}>
            <span style={{ color: '#60a5fa', fontSize: '2.2rem' }}>{currencySymbol}</span>
            <span>{amountStr}</span>
          </div>

          {/* Settlement Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => setSettlementType(settlementType === 'M0' ? 'M1' : 'M0')}
              style={{
                background: settlementType === 'M0' ? 'rgba(56,189,248,0.12)' : 'rgba(192,132,252,0.12)',
                border: `1px solid ${settlementType === 'M0' ? 'rgba(56,189,248,0.3)' : 'rgba(192,132,252,0.3)'}`,
                color: settlementType === 'M0' ? '#38bdf8' : '#c084fc',
                borderRadius: '999px',
                padding: '0.2rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="Click to toggle settlement mode"
            >
              <Zap size={12} />
              {settlementType === 'M0' ? '⚡ M0 Instant Settlement' : '📅 M1 Next-Day Settlement'}
            </button>
          </div>
        </div>

        {/* Mode Selector (Charge Card vs Scan QR vs Crypto) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '0.5rem',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          gap: '0.3rem',
        }}>
          <button
            onClick={() => setActiveTab('charge')}
            style={{
              padding: '0.55rem 0.2rem', borderRadius: '8px', border: 'none',
              background: activeTab === 'charge' ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: activeTab === 'charge' ? '#60a5fa' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
            }}
          >
            <CreditCard size={16} /> Card / Apple Pay
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            style={{
              padding: '0.55rem 0.2rem', borderRadius: '8px', border: 'none',
              background: activeTab === 'qr' ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: activeTab === 'qr' ? '#60a5fa' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
            }}
          >
            <QrCode size={16} /> Scan QR to Pay
          </button>

          <button
            onClick={() => setActiveTab('crypto')}
            style={{
              padding: '0.55rem 0.2rem', borderRadius: '8px', border: 'none',
              background: activeTab === 'crypto' ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: activeTab === 'crypto' ? '#60a5fa' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
            }}
          >
            <Coins size={16} /> Crypto POS
          </button>
        </div>

        {/* ── TAB 1: KEYPAD & INSTANT CHARGE ─────────────────────────────────── */}
        {activeTab === 'charge' && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Quick Amount Presets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
              {[10, 25, 50, 100, 250].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  style={{
                    padding: '0.45rem 0',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: amountStr === String(preset) ? 'rgba(59,130,246,0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: amountStr === String(preset) ? '#60a5fa' : 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {/* Virtual Numpad */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'DEL'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleKey(k)}
                  style={{
                    padding: '0.85rem 0',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: k === 'DEL' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                    color: k === 'DEL' ? '#f87171' : 'var(--text-primary)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {k === 'DEL' ? '⌫' : k}
                </button>
              ))}
            </div>

            {/* Customer Name Input (Optional) */}
            <input
              type="text"
              placeholder="Customer / Donor Name (Optional)"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />

            {/* Main Charge Button */}
            <button
              onClick={handleChargeCard}
              disabled={numAmount <= 0}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                opacity: numAmount <= 0 ? 0.5 : 1,
                cursor: numAmount <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              Charge {currencySymbol}{amountStr} Now <ExternalLink size={18} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Supports Apple Pay, Google Pay, Visa, Mastercard, Amex &amp; Link
            </div>
          </div>
        )}

        {/* ── TAB 2: DYNAMIC QR CODE DISPLAY (CUSTOMER PHONES) ───────────────── */}
        {activeTab === 'qr' && (
          <div style={{
            padding: '1.75rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            textAlign: 'center',
          }}>
            <div style={{
              background: '#fff',
              padding: '0.75rem',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}>
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Customer Scan to Pay</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Customer points phone camera at this screen to pay instantly via Apple Pay, Google Pay, or Card.
              </p>
            </div>

            <div style={{
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '10px',
              padding: '0.6rem 1rem',
              fontSize: '0.8rem',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              <Smartphone size={16} /> Contactless • Zero Hardware Required
            </div>
          </div>
        )}

        {/* ── TAB 3: NOWPAYMENTS CRYPTO POS ───────────────────────────────────── */}
        {activeTab === 'crypto' && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <iframe
                src="https://nowpayments.io/embeds/donation-widget?api_key=77JW23M-9Q944MQ-K30WB10-5EH3WGB"
                style={{
                  width: '100%',
                  maxWidth: '346px',
                  height: '520px',
                  border: 'none',
                  display: 'block',
                  margin: '0 auto',
                }}
                scrolling="no"
                title="Crypto POS"
              />
            </div>
          </div>
        )}

        {/* Footer info */}
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck size={14} color="#10b981" /> 256-bit Encrypted POS
          </span>
          <Link href="/admin" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            View Settled Transactions →
          </Link>
        </div>
      </div>
    </div>
  );
}
