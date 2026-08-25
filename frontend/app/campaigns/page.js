'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function CampaignsDirectory() {
  const [campaigns, setCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch('http://localhost:5005/api/campaigns?status=ACTIVE');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.ngo?.user?.name && campaign.ngo.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container" style={{ padding: '4rem 2rem 6rem 2rem' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1rem',
        marginBottom: '4rem'
      }}>
        <h1 style={{ fontSize: '2.5rem' }}>Active <span className="gradient-text">Fundraising Campaigns</span></h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Explore NGO projects and charity works. Support them with direct payments or monthly contribution agreements.
        </p>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)',
          borderRadius: '999px',
          padding: '0.5rem 1.5rem',
          width: '100%',
          maxWidth: '450px',
          marginTop: '1.5rem'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search campaigns, NGOs, or key terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#fff',
              width: '100%',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '5rem' }}>
          Loading fundraising directory...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          No campaigns found matching "{searchTerm}". Try checking your spelling or explore other terms.
        </div>
      ) : (
        <div className="grid-3">
          {filteredCampaigns.map((campaign) => {
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
                    height: '4.5rem'
                  }}>
                    {campaign.description}
                  </p>

                  <div>
                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span><strong>${campaign.raised.toLocaleString()}</strong> raised</span>
                      <span style={{ color: 'var(--text-muted)' }}>{percent}% of ${campaign.target.toLocaleString()}</span>
                    </div>
                  </div>

                  <Link href={`/campaigns/${campaign.id}`} className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>
                    View Campaign
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
