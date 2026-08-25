'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { Landmark, Plus, FileText, CheckCircle, Hourglass, HelpCircle, RefreshCw } from 'lucide-react';

export default function NgoDashboard() {
  const { user, token, refreshMe } = useAuth();
  
  // Dashboard data states
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form states
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [campaignTarget, setCampaignTarget] = useState('');
  const [campaignImg, setCampaignImg] = useState('');
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const [statsRes, payoutsRes] = await Promise.all([
        fetch('http://localhost:5005/api/ngo/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5005/api/ngo/payouts', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayouts(payoutsData);
      }
    } catch (error) {
      console.error('Error fetching NGO dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    setCampaignSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5005/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: campaignTitle,
          description: campaignDesc,
          target: parseFloat(campaignTarget),
          imageUrl: campaignImg || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      setSuccessMsg('Campaign created successfully!');
      setCampaignTitle('');
      setCampaignDesc('');
      setCampaignTarget('');
      setCampaignImg('');
      setCampaignModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setCampaignSubmitting(false);
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('http://localhost:5005/api/ngo/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          bankAccount
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request payout');
      }

      setSuccessMsg(`Payout request for $${parseFloat(payoutAmount).toFixed(2)} submitted successfully!`);
      setPayoutAmount('');
      setBankAccount('');
      fetchDashboardData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading NGO metrics and payouts...</div>;
  }

  const ngoStatus = user?.ngoProfile?.status || 'PENDING';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>NGO Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your fundraising campaigns and withdrawal requests.</p>
        </div>
        <button onClick={() => { refreshMe(); fetchDashboardData(); }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Account Verification Banner */}
      {ngoStatus === 'PENDING' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <Hourglass color="var(--accent-warning)" size={24} style={{ flexShrink: 0, marginTop: '0.2rem' }} />
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>Verification Pending Approval</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
              Your NGO registration is currently under review by our platform administration. You can browse active campaigns, but you cannot publish new campaigns or withdraw donations until your NGO status is updated to <strong>APPROVED</strong>.
            </p>
          </div>
        </div>
      )}

      {ngoStatus === 'REJECTED' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <Hourglass color="#ef4444" size={24} style={{ flexShrink: 0, marginTop: '0.2rem' }} />
          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>Verification Denied</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
              Your NGO profile verification request was rejected. Please contact our system support for additional information.
            </p>
          </div>
        </div>
      )}

      {ngoStatus === 'APPROVED' && stats && (
        <>
          {/* Stats Summary */}
          <div className="dashboard-stats">
            <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Funds Raised</span>
              <span className="stat-value gradient-text">${stats.totalRaised.toFixed(2)}</span>
            </div>

            <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Available Balance</span>
              <span className="stat-value gradient-green-text">${stats.availableBalance.toFixed(2)}</span>
            </div>

            <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Active Campaigns</span>
              <span className="stat-value">{stats.campaignsCount}</span>
            </div>

            <div className="glass-card stat-card">
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Unique Contributors</span>
              <span className="stat-value">{stats.uniqueDonorsCount}</span>
            </div>
          </div>

          {/* Form Feedbacks */}
          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-success)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
              {successMsg}
            </div>
          )}

          {/* Main Content Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem' }}>
            
            {/* Left Column: Campaigns & Recent Donations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Campaign Header Section */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>My Campaigns</h3>
                  <button onClick={() => setCampaignModalOpen(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Create Campaign
                  </button>
                </div>

                {/* Listing of campaigns */}
                {/* Note: In this view, we can just let users view all their published campaigns. For simplicity, we query them in page.js, but since stats has totalRaised, we can fetch public campaigns filtered by current user's profile ID */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Your campaigns are running on the live platform. Open the public directory to view details or process payments.
                  </p>
                  <a href="/campaigns" className="btn btn-secondary" style={{ width: 'fit-content' }}>
                    Open Public Directory
                  </a>
                </div>
              </div>

              {/* Recent Campaign Donations list */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Recent Platform Contributions</h3>
                {stats.latestDonations && stats.latestDonations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stats.latestDonations.map((d) => (
                      <div key={d.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.9rem'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{d.donorName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Campaign: <strong style={{ color: 'var(--text-secondary)' }}>{d.campaignTitle}</strong>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                          +${d.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                    No donations received yet. Let's start promoting your campaigns!
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Withdrawals & Request Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Request Payout Form */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Landmark size={20} color="var(--accent-primary)" /> Request Bank Payout
                </h3>
                
                <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Amount to Withdraw (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={`Max: $${stats.availableBalance.toFixed(2)}`}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Recipient Bank Account Detail</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Routing: 123456789, Account: 987654321"
                      className="form-input"
                      required
                    />
                  </div>

                  <button type="submit" disabled={payoutSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
                    {payoutSubmitting ? 'Submitting Withdrawal...' : 'Request Payout'}
                  </button>
                </form>
              </div>

              {/* Payout Requests History */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem' }}>Withdrawal Ledger</h4>
                {payouts.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                    No payout history found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {payouts.map((p) => {
                      const badgeClass = p.status === 'COMPLETED' ? 'badge-approved' : p.status === 'PENDING' ? 'badge-pending' : 'badge-rejected';
                      return (
                        <div key={p.id} style={{
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>${p.amount.toFixed(2)}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Bank: {p.bankAccount}
                            </div>
                          </div>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                            {p.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Campaign Modal */}
      {campaignModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '500px',
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2.5rem',
            position: 'relative'
          }}>
            <button onClick={() => setCampaignModalOpen(false)} style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}>
              &times;
            </button>

            <form onSubmit={handleCreateCampaignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>Create New Campaign</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Publish fundraising details to donors</p>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Campaign Title</label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. Flood Relief Fund"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Target Funding (USD)</label>
                <input
                  type="number"
                  value={campaignTarget}
                  onChange={(e) => setCampaignTarget(e.target.value)}
                  placeholder="e.g. 10000"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cover Image Link (URL)</label>
                <input
                  type="url"
                  value={campaignImg}
                  onChange={(e) => setCampaignImg(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Campaign Description</label>
                <textarea
                  value={campaignDesc}
                  onChange={(e) => setCampaignDesc(e.target.value)}
                  placeholder="Describe what these funds will build/finance..."
                  className="form-input"
                  style={{ minHeight: '100px' }}
                  required
                />
              </div>

              <button type="submit" disabled={campaignSubmitting} className="btn btn-primary" style={{ width: '100%' }}>
                {campaignSubmitting ? 'Publishing Campaign...' : 'Publish Campaign'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
