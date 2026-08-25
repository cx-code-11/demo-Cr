'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { Shield, Check, X, FileText, Landmark, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const [statsRes, ngosRes, payoutsRes] = await Promise.all([
        fetch('http://localhost:5005/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5005/api/admin/ngos', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5005/api/admin/payouts', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (ngosRes.ok) {
        const ngosData = await ngosRes.json();
        setNgos(ngosData);
      }
      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayouts(payoutsData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleVerifyNgo = async (ngoProfileId, status) => {
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const res = await fetch(`http://localhost:5005/api/admin/ngos/${ngoProfileId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update NGO verification status');
      }

      setFeedbackMsg(`NGO status updated to ${status} successfully!`);
      fetchAdminData();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePayout = async (payoutId, status) => {
    setActionLoading(true);
    setFeedbackMsg('');
    try {
      const res = await fetch(`http://localhost:5005/api/admin/payouts/${payoutId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process payout approval');
      }

      setFeedbackMsg(`Payout request status set to ${status} successfully!`);
      fetchAdminData();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading platform configurations and ledger databases...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={28} color="var(--accent-primary)" /> Administrator Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Verify corporate NGO files, approve bank payout queues, and inspect global metrics.</p>
        </div>
        <button onClick={fetchAdminData} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Sync Database
        </button>
      </div>

      {feedbackMsg && (
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
          {feedbackMsg}
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="dashboard-stats">
          <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Global Funds Raised</span>
            <span className="stat-value gradient-text">${stats.totalRaised.toFixed(2)}</span>
          </div>

          <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Pending Payouts Queue</span>
            <span className="stat-value" style={{ color: 'var(--accent-warning)' }}>
              ${stats.pendingPayoutsAmount.toFixed(2)} ({stats.pendingPayoutsCount})
            </span>
          </div>

          <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Completed Payouts</span>
            <span className="stat-value gradient-green-text">${stats.completedPayoutsAmount.toFixed(2)}</span>
          </div>

          <div className="glass-card stat-card">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Active Campaigns</span>
            <span className="stat-value">{stats.campaignsCount}</span>
          </div>
        </div>
      )}

      {/* Dual Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* NGO Verification Section */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            NGO Registrations ({ngos.filter(n => n.status === 'PENDING').length} Pending)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto' }}>
            {ngos.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                No NGO registration applications on file.
              </div>
            ) : (
              ngos.map((ngo) => {
                const badgeClass = ngo.status === 'APPROVED' ? 'badge-approved' : ngo.status === 'PENDING' ? 'badge-pending' : 'badge-rejected';
                return (
                  <div key={ngo.id} style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{ngo.user?.name}</strong>
                      <span className={`badge ${badgeClass}`}>{ngo.status}</span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {ngo.description}
                    </p>

                    {ngo.documentUrl && (
                      <a href={ngo.documentUrl} target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#60a5fa',
                        textDecoration: 'none',
                        width: 'fit-content'
                      }}>
                        <FileText size={14} /> View Certificate File
                      </a>
                    )}

                    {ngo.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleVerifyNgo(ngo.id, 'APPROVED')}
                          disabled={actionLoading}
                          className="btn btn-success"
                          style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.8rem', gap: '0.25rem' }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleVerifyNgo(ngo.id, 'REJECTED')}
                          disabled={actionLoading}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.8rem', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payout Approval Section */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Withdrawal Approvals Queue ({payouts.filter(p => p.status === 'PENDING').length} Pending)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto' }}>
            {payouts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                No payout withdrawal requests found.
              </div>
            ) : (
              payouts.map((p) => {
                const badgeClass = p.status === 'COMPLETED' ? 'badge-approved' : p.status === 'PENDING' ? 'badge-pending' : 'badge-rejected';
                return (
                  <div key={p.id} style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Landmark size={16} color="var(--accent-primary)" />
                        <strong style={{ fontSize: '1.1rem', color: 'var(--accent-success)' }}>${p.amount.toFixed(2)}</strong>
                      </div>
                      <span className={`badge ${badgeClass}`}>{p.status === 'COMPLETED' ? 'COMPLETED' : p.status}</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Requested by: <strong>{p.ngo?.user?.name || 'NGO Owner'}</strong>
                    </div>

                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: 'var(--text-muted)',
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}>
                      Account: {p.bankAccount}
                    </div>

                    {p.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleApprovePayout(p.id, 'COMPLETED')}
                          disabled={actionLoading}
                          className="btn btn-success"
                          style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.8rem', gap: '0.25rem' }}
                        >
                          <Check size={14} /> Complete Transfer
                        </button>
                        <button
                          onClick={() => handleApprovePayout(p.id, 'REJECTED')}
                          disabled={actionLoading}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.8rem', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                          <X size={14} /> Deny Request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
