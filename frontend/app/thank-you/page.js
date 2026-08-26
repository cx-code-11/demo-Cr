'use client';

import { CheckCircle, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
      }}>
        {/* Animated icon */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          <CheckCircle size={46} color="#10b981" strokeWidth={1.5} />
        </div>

        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Thank You! <span style={{ display: 'inline-block', animation: 'wave 0.8s ease 0.3s' }}>🎉</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '400px' }}>
            Your payment is being processed. You&apos;ll receive a confirmation once the transaction is complete.
          </p>
        </div>

        {/* Info card */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          width: '100%',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text-primary)' }}>What happens next?</strong><br />
            Crypto payments may take a few minutes to confirm on the blockchain.
            Card payments are usually instant. Your donation goes directly towards our causes.
          </p>
        </div>

        {/* Heart animation */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Heart size={16} color="#f472b6" fill="#f472b6" />
          Making the world a better place, one donation at a time.
        </div>

        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes wave {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(20deg); }
          75%  { transform: rotate(-10deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
