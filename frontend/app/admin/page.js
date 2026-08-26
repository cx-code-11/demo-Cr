'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, TrendingUp, Clock, CheckCircle,
  XCircle, RefreshCw, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  FINISHED:      { label: 'Finished',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  CONFIRMED:     { label: 'Confirmed',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  CONFIRMING:    { label: 'Confirming',     color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
  SENDING:       { label: 'Sending',        color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)'},
  WAITING:       { label: 'Waiting',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  PARTIALLY_PAID:{ label: 'Partial',        color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  FAILED:        { label: 'Failed',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  EXPIRED:       { label: 'Expired',        color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
  REFUNDED:      { label: 'Refunded',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub }) {
  return (
    <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} />
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/stats`);
      const data = await res.json();
      setStats(data);
    } catch { /* silent */ }
  }, []);

  const fetchDonations = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${BACKEND_URL}/api/admin/donations?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDonations(data.donations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchDonations(1);
  }, [fetchStats, fetchDonations]);

  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const statusBreakdown = stats?.statusBreakdown || {};

  return (
    <div style={{ padding: '2.5rem 0', minHeight: '80vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Donation history &amp; payment analytics</p>
          </div>
          <button onClick={() => { fetchStats(); fetchDonations(pagination.page); }}
            className="btn btn-secondary" style={{ display: 'flex', gap: '0.4rem', padding: '0.6rem 1rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <StatCard
              icon={DollarSign} iconColor="#10b981" iconBg="rgba(16,185,129,0.12)"
              label="Total Raised (USD)"
              value={`$${Number(stats.totalRaisedUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`from ${stats.completedDonations} completed payments`}
            />
            <StatCard
              icon={TrendingUp} iconColor="#3b82f6" iconBg="rgba(59,130,246,0.12)"
              label="Total Donations"
              value={stats.totalDonations || 0}
              sub="all time"
            />
            <StatCard
              icon={CheckCircle} iconColor="#10b981" iconBg="rgba(16,185,129,0.12)"
              label="Finished"
              value={statusBreakdown.FINISHED || 0}
              sub="successfully completed"
            />
            <StatCard
              icon={Clock} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)"
              label="Pending"
              value={(statusBreakdown.WAITING || 0) + (statusBreakdown.CONFIRMING || 0) + (statusBreakdown.CONFIRMED || 0)}
              sub="waiting / confirming"
            />
            <StatCard
              icon={XCircle} iconColor="#ef4444" iconBg="rgba(239,68,68,0.12)"
              label="Failed / Expired"
              value={(statusBreakdown.FAILED || 0) + (statusBreakdown.EXPIRED || 0)}
              sub="unsuccessful"
            />
          </div>
        )}

        {/* Donations Table */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
              Donation History
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                ({pagination.total} total)
              </span>
            </h3>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); fetchDonations(1); }}
              style={{
                background: 'rgba(10,11,16,0.8)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', padding: '0.45rem 0.75rem',
                borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_CONFIG).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 1.75rem', color: '#f87171', fontSize: '0.9rem',
              background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid var(--border-color)',
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Donor', 'Transaction ID', 'Requested (USD)', 'Settled', 'Method', 'Status', 'Date'].map(h => (
                    <th key={h} style={{
                      padding: '0.85rem 1rem', textAlign: 'left',
                      color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading...
                  </td></tr>
                ) : donations.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No donations found.
                  </td></tr>
                ) : donations.map((d, i) => (
                  <tr key={d.id} style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                  >
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{d.donorName}</div>
                      {d.donorEmail && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{d.donorEmail}</div>}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {d.nowPaymentsId
                          ? <span title={d.nowPaymentsId}>{String(d.nowPaymentsId).slice(0, 12)}…</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                      {d.invoiceId && (
                        <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          inv: {String(d.invoiceId).slice(0, 10)}…
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>
                      ${Number(d.usdAmount).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      {d.originalAmount && d.originalCurrency ? (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {Number(d.originalAmount).toFixed(6)} {d.originalCurrency.toUpperCase()}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      {d.paymentMethod
                        ? <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>{d.paymentMethod}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <StatusBadge status={d.paymentStatus} />
                    </td>
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {fmtDate(d.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem',
              padding: '1.25rem', borderTop: '1px solid var(--border-color)',
            }}>
              <button
                onClick={() => fetchDonations(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', opacity: pagination.page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchDonations(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
