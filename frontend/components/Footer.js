import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '4rem 0 2rem 0',
      background: 'rgba(10, 11, 16, 0.5)',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 800 }} className="gradient-text">
              Trust Aid
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '380px' }}>
              A secure, transparent, and user-friendly NGO fundraising platform connecting generous donors with impactful campaigns globally.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#fff' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/campaigns" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Browse Campaigns
              </Link>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#fff' }}>Legal & Security</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Stripe Verified Simulation</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>SQLite Local Schema</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Terms of Service</span>
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <span>© {new Date().getFullYear()} Trust Aid. All rights reserved.</span>
          <span>Made for Pairing Demonstration</span>
        </div>
      </div>
    </footer>
  );
}
