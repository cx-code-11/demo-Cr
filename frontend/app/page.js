'use client';

import { Heart, ShieldCheck, RefreshCw, Landmark } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingBottom: '5rem' }}>

      {/* Hero Section */}
      <section style={{
        padding: '7rem 0 4rem 0',
        background: 'radial-gradient(circle at 50% -20%, var(--accent-primary-glow), transparent 60%)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '999px',
            color: '#60a5fa',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <Heart size={14} fill="#60a5fa" />
            Empowering Transparent Giving
          </div>

          <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, maxWidth: '800px', marginTop: '0.5rem' }}>
            Support Great Causes. <br />
            <span className="gradient-text">Make a Tangible Impact.</span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.15rem',
            maxWidth: '600px',
            lineHeight: 1.6
          }}>
            Join our secure fundraising platform where donors connect directly with verified NGOs. Track your donations transparently in real-time.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Why Choose Trust Aid?</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            We combine high-end technology with complete donation transparency.
          </p>
        </div>
        <div className="grid-3">
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Verified NGOs Only</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Every NGO registration undergoes strict manual inspection by platform admins before they can receive payments.
            </p>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
              <RefreshCw size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Recurring Support</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Set up monthly subscriptions easily to establish predictable, long-term funding streams for causes you love.
            </p>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }}>
              <Landmark size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem' }}>Simulated Payout Tracking</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Transparency from donor to beneficiary. NGOs can request and log payouts showing bank details and status.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
