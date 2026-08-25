'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { Heart, Sparkles, Receipt, Calendar } from 'lucide-react';

export default function DonorDashboard() {
  const { user, token } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5005/api/donations/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setDonations(data);
        }
      } catch (error) {
        console.error('Error fetching donation history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [token]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading donor profile metrics...</div>;
  }

  // Calculations
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const monthlyCount = donations.filter(d => d.frequency === 'MONTHLY').length;
  const uniqueNgos = new Set(donations.map(d => d.campaign?.ngo?.user?.name).filter(Boolean)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Donor Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your contributions, active sponsorships, and tax receipts.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Contributed</span>
          <span className="stat-value gradient-green-text">${totalAmount.toFixed(2)}</span>
        </div>

        <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Monthly Partnerships</span>
          <span className="stat-value">{monthlyCount}</span>
        </div>

        <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Supported NGOs</span>
          <span className="stat-value">{uniqueNgos}</span>
        </div>
      </div>

      {/* Main Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem' }}>
        {/* Table Column */}
        <div className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--accent-primary)" /> Contribution Ledger
          </h3>

          {donations.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
              You haven't made any donations yet. Explore campaigns to get started!
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Campaign / Initiative</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{d.campaign?.title || 'Unknown Campaign'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        By {d.campaign?.ngo?.user?.name || 'NGO Partner'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                      +${d.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className="badge" style={{
                        fontSize: '0.7rem',
                        background: d.frequency === 'MONTHLY' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: d.frequency === 'MONTHLY' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                        border: d.frequency === 'MONTHLY' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)',
                      }}>
                        {d.frequency === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                      {new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <button onClick={() => alert(`Receipt details:\nTransaction Intent: ${d.stripeId}\nCampaign: ${d.campaign?.title}\nAmount: $${d.amount}\nDonor: ${d.donorName}\nDate: ${new Date(d.createdAt).toLocaleString()}\n\nThis is a simulated verification receipt.`)} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                        <Receipt size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>
              <Sparkles size={20} />
            </div>
            <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>Tax Deductible Giving</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              All donations made on Trust Aid are logged with Stripe authorization hashes. You can use these generated ledger receipts for simulated annual tax write-offs.
            </p>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
              <Heart size={20} />
            </div>
            <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>Giving Impact</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              By setting up monthly recurring donations, you support NGOs with predictable budgeting resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
