'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, RefreshCw, Landmark, Heart } from 'lucide-react';
import DonationModal from '../components/DonationModal';

export default function Home() {
  const [stats, setStats] = useState({
    totalRaised: 0,
    totalDonationsCount: 0,
    activeCampaignsCount: 0,
    uniqueDonorsCount: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Donate States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const loadData = async () => {
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        fetch('http://localhost:5005/api/donations/stats'),
        fetch('http://localhost:5005/api/campaigns?status=ACTIVE'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.slice(0, 3)); // show top 3
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickDonate = (campaign) => {
    setSelectedCampaign(campaign);
    setModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingBottom: '5rem' }}>
      {/* Hero Section */}
      <section style={{
        padding: '6rem 0 4rem 0',
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
          <h1 style={{
            fontSize: '3.5rem',
            lineHeight: 1.1,
            maxWidth: '800px',
            marginTop: '0.5rem'
          }}>
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
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link href="/campaigns" className="btn btn-primary">
              Browse Campaigns
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="container">
        <div className="glass-card" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
          textAlign: 'center',
          padding: '2.5rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Funds Raised</div>
            <div className="stat-value gradient-text">${stats.totalRaised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Active Campaigns</div>
            <div className="stat-value" style={{ paddingLeft: '1rem' }}>{stats.activeCampaignsCount}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Total Donations</div>
            <div className="stat-value" style={{ paddingLeft: '1rem' }}>{stats.totalDonationsCount}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Registered Donors</div>
            <div className="stat-value" style={{ paddingLeft: '1rem' }}>{stats.uniqueDonorsCount}</div>
          </div>
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

      {/* Featured Campaigns */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Featured Campaigns</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Directly support these high-priority initiatives.</p>
          </div>
          <Link href="/campaigns" style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            View All Campaigns
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No campaigns currently active. Check back later!
          </div>
        ) : (
          <div className="grid-3">
            {campaigns.map((campaign) => {
              const percent = Math.min(100, Math.round((campaign.raised / campaign.target) * 100)) || 0;
              return (
                <div key={campaign.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundImage: `url(${campaign.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '1rem',
                      background: 'rgba(10, 11, 16, 0.85)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#fff'
                    }}>
                      By {campaign.ngo?.user?.name || 'NGO'}
                    </span>
                  </div>
                  
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>{campaign.title}</h3>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '4.5rem' // fixed height for clamp alignment
                    }}>
                      {campaign.description}
                    </p>

                    <div>
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${percent}%` }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span><strong>${campaign.raised.toLocaleString()}</strong> raised</span>
                        <span style={{ color: 'var(--text-muted)' }}>{percent}% of ${campaign.target.toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <Link href={`/campaigns/${campaign.id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                        Details
                      </Link>
                      <button onClick={() => handleQuickDonate(campaign)} className="btn btn-primary" style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                        Donate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reusable Donation Modal */}
      {selectedCampaign && (
        <DonationModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedCampaign(null); }}
          campaignId={selectedCampaign.id}
          campaignTitle={selectedCampaign.title}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
