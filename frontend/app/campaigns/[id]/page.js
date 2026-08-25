'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '../../AuthContext';
import { Landmark, ArrowLeft, Heart } from 'lucide-react';
import DonationModal from '../../../components/DonationModal';

export default function CampaignDetail({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const { user, token } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`http://localhost:5005/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  // Form submission logic moved to DonationModal component

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '10rem' }}>Loading campaign details...</div>;
  }

  if (!campaign) {
    return (
      <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h2 className="mb-4">Campaign Not Found</h2>
        <p className="mb-4 text-muted">The campaign you are looking for does not exist or has been removed.</p>
        <Link href="/campaigns" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Campaigns
        </Link>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((campaign.raised / campaign.target) * 100)) || 0;

  return (
    <div className="container" style={{ padding: '4rem 2rem 6rem 2rem' }}>
      <Link href="/campaigns" style={{
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '2.5rem',
        fontSize: '0.95rem'
      }}>
        <ArrowLeft size={16} />
        Back to Campaigns
      </Link>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '7fr 5fr',
        gap: '3.5rem'
      }}>
        {/* Left Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div style={{
            width: '100%',
            height: '420px',
            backgroundImage: `url(${campaign.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-premium)'
          }}></div>

          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>{campaign.title}</h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '2rem'
            }}>
              <span className="badge badge-approved" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.3)' }}>
                NGO Verified
              </span>
              <span>•</span>
              <span>Organized by <strong>{campaign.ngo?.user?.name || 'NGO Owner'}</strong></span>
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              About this Campaign
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-line'
            }}>
              {campaign.description}
            </p>
          </div>
        </div>

        {/* Right Column: Funding Status & Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'sticky', top: '100px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>${campaign.raised.toLocaleString()}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>raised of ${campaign.target.toLocaleString()} target</span>
              </div>

              <div className="progress-container" style={{ height: '12px', margin: '1.25rem 0 0.75rem 0' }}>
                <div className="progress-bar" style={{ width: `${percent}%` }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span><strong>{percent}%</strong> complete</span>
                <span><strong>{campaign.donations?.length || 0}</strong> contributions</span>
              </div>
            </div>

            <button onClick={() => {
              setModalOpen(true);
              setSuccessData(null);
              setErrorMsg('');
            }} className="btn btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem' }}>
              <Heart size={20} fill="#fff" />
              Donate Now
            </button>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <Landmark size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>100% Tax Deductible</strong>
                <p style={{ marginTop: '0.2rem' }}>Proceeds are sent directly to the verified NGO account. Receipts will be logged to your dashboard profile.</p>
              </div>
            </div>

            {/* Recent Donations */}
            <div>
              <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem', fontWeight: 600 }}>Recent Contributors</h4>
              {campaign.donations && campaign.donations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {campaign.donations.map((d) => (
                    <div key={d.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.donorName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {d.frequency === 'MONTHLY' ? 'Monthly Partner' : 'One-time donation'}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                        +${d.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  Be the first one to support this cause!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <DonationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        campaignId={id}
        campaignTitle={campaign.title}
        onSuccess={() => fetchCampaign()}
      />
    </div>
  );
}
