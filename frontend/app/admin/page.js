'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, TrendingUp, Clock, CheckCircle,
  XCircle, RefreshCw, ChevronLeft, ChevronRight, AlertCircle,
  Download, Zap, Calendar, PlayCircle, ShieldCheck, ArrowUpRight
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

// ── Payment Status config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  FINISHED:       { label: 'Finished',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  CONFIRMED:      { label: 'Confirmed',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  CONFIRMING:     { label: 'Confirming',     color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
  SENDING:        { label: 'Sending',        color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)'},
  WAITING:        { label: 'Waiting',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  PARTIALLY_PAID: { label: 'Partial',        color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  FAILED:         { label: 'Failed',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  EXPIRED:        { label: 'Expired',        color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
  REFUNDED:       { label: 'Refunded',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)'  },
};

// ── Settlement Status config ──────────────────────────────────────────────────
const SETTLEMENT_STATUS_CONFIG = {
  SETTLED:    { label: 'Settled',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  PROCESSING: { label: 'Processing', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  PENDING:    { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  FAILED:     { label: 'Failed',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
};

function StatusBadge({ status, config = STATUS_CONFIG }) {
  const cfg = config[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' };
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

function SettlementTypeBadge({ type }) {
  const isM0 = type === 'M0';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
      color: isM0 ? '#38bdf8' : '#c084fc',
      background: isM0 ? 'rgba(56,189,248,0.12)' : 'rgba(192,132,252,0.12)',
      border: `1px solid ${isM0 ? 'rgba(56,189,248,0.3)' : 'rgba(192,132,252,0.3)'}`,
      whiteSpace: 'nowrap',
    }}>
      {isM0 ? <Zap size={11} /> : <Calendar size={11} />}
      {isM0 ? 'M0 Instant' : 'M1 Next-Day'}
    </span>
  );
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub, badge }) {
  return (
    <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{label}</div>
          {badge}
        </div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [settlementTypeFilter, setSettlementTypeFilter] = useState('');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

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
      if (settlementTypeFilter) params.set('settlementType', settlementTypeFilter);
      if (settlementStatusFilter) params.set('settlementStatus', settlementStatusFilter);

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
  }, [statusFilter, settlementTypeFilter, settlementStatusFilter]);

  useEffect(() => {
    fetchStats();
    fetchDonations(1);
  }, [fetchStats, fetchDonations]);

  const handleProcessM1Batch = async () => {
    setBatchLoading(true);
    setActionSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settlements/process-m1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess(data.message || 'M1 batch settlement completed!');
      fetchStats();
      fetchDonations(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to process M1 batch');
    } finally {
      setBatchLoading(false);
      setTimeout(() => setActionSuccess(''), 5000);
    }
  };

  const handleToggleSettlement = async (donation) => {
    const nextType = donation.settlementType === 'M0' ? 'M1' : 'M0';
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settlements/${donation.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementType: nextType }),
      });
      if (res.ok) {
        fetchStats();
        fetchDonations(pagination.page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceSettle = async (donationId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settlements/${donationId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlementStatus: 'SETTLED' }),
      });
      if (res.ok) {
        fetchStats();
        fetchDonations(pagination.page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const settlement = stats?.settlement || {};

  return (
    <div style={{ padding: '2.5rem 0', minHeight: '80vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* Top Header & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              <ShieldCheck size={16} /> Server Fund &amp; Payment Settlements
            </div>
            <h1 style={{ fontSize: '2.2rem', margin: 0 }}>Admin Fund Management</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Monitor instant M0 and next-business-day M1 payout settlements
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleProcessM1Batch}
              disabled={batchLoading}
              className="btn btn-primary"
              style={{ display: 'flex', gap: '0.5rem', padding: '0.65rem 1.15rem', fontSize: '0.9rem' }}
            >
              <PlayCircle size={17} />
              {batchLoading ? 'Processing Batch...' : 'Process M1 Batch'}
            </button>

            <a
              href={`${BACKEND_URL}/api/admin/settlements/export`}
              className="btn btn-secondary"
              style={{ display: 'flex', gap: '0.5rem', padding: '0.65rem 1.15rem', fontSize: '0.9rem' }}
              download
            >
              <Download size={17} /> Export CSV Report
            </a>

            <button
              onClick={() => { fetchStats(); fetchDonations(pagination.page); }}
              className="btn btn-secondary"
              style={{ display: 'flex', gap: '0.4rem', padding: '0.65rem 1rem' }}
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div style={{
            padding: '1rem 1.25rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <CheckCircle size={18} /> {actionSuccess}
          </div>
        )}

        {/* Settlement Fund Overview Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
            <StatCard
              icon={DollarSign} iconColor="#10b981" iconBg="rgba(16,185,129,0.12)"
              label="Net Settled Funds"
              value={`$${Number(settlement.totalNetSettledUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`Total Gross: $${Number(settlement.totalGrossRaisedUSD || 0).toFixed(2)}`}
              badge={<span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Settled</span>}
            />

            <StatCard
              icon={Zap} iconColor="#38bdf8" iconBg="rgba(56,189,248,0.12)"
              label="M0 Instant Settlements"
              value={`$${Number(settlement.m0?.netUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`${settlement.m0?.count || 0} instant settled payouts (0.5% fee)`}
              badge={<span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>Instant</span>}
            />

            <StatCard
              icon={Calendar} iconColor="#c084fc" iconBg="rgba(192,132,252,0.12)"
              label="M1 Next-Day Settled"
              value={`$${Number(settlement.m1?.settledNetUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`${settlement.m1?.settledCount || 0} batch settled payouts (0.25% fee)`}
              badge={<span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>Next-Day</span>}
            />

            <StatCard
              icon={Clock} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)"
              label="M1 Pending Queue"
              value={`$${Number(settlement.m1?.pendingGrossUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`${settlement.m1?.pendingCount || 0} transactions awaiting next-day batch`}
              badge={<span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>Queued</span>}
            />

            <StatCard
              icon={TrendingUp} iconColor="#f472b6" iconBg="rgba(244,114,182,0.12)"
              label="Gateway Fees Collected"
              value={`$${Number(settlement.totalFeesCollectedUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub="Processing & network fee reserve"
            />
          </div>
        )}

        {/* Transactions Table & Filters */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {/* Filter Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                Fund Settlements &amp; Transactions
              </h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Showing {donations.length} of {pagination.total} records
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Settlement Type Filter */}
              <select
                value={settlementTypeFilter}
                onChange={e => { setSettlementTypeFilter(e.target.value); fetchDonations(1); }}
                style={{
                  background: 'rgba(10,11,16,0.8)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', padding: '0.45rem 0.75rem',
                  borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                <option value="">All Settlement Types</option>
                <option value="M0">M0 (Instant)</option>
                <option value="M1">M1 (Next Business Day)</option>
              </select>

              {/* Settlement Status Filter */}
              <select
                value={settlementStatusFilter}
                onChange={e => { setSettlementStatusFilter(e.target.value); fetchDonations(1); }}
                style={{
                  background: 'rgba(10,11,16,0.8)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', padding: '0.45rem 0.75rem',
                  borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                <option value="">All Settlement Statuses</option>
                <option value="SETTLED">Settled</option>
                <option value="PROCESSING">Processing</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              {/* Payment Status Filter */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); fetchDonations(1); }}
                style={{
                  background: 'rgba(10,11,16,0.8)', border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)', padding: '0.45rem 0.75rem',
                  borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                <option value="">All Payment Statuses</option>
                {Object.keys(STATUS_CONFIG).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
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
                  {['Donor', 'Transaction ID', 'Gross USD', 'Fee', 'Net Settlement', 'Type', 'Settlement Status', 'Payment', 'Date / Settled', 'Action'].map(h => (
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
                  <tr><td colSpan={10} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading transactions...
                  </td></tr>
                ) : donations.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions match the selected criteria.
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
                    {/* Donor */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{d.donorName}</div>
                      {d.donorEmail && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{d.donorEmail}</div>}
                    </td>

                    {/* Transaction ID */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {d.nowPaymentsId
                          ? <span title={d.nowPaymentsId}>{String(d.nowPaymentsId).slice(0, 12)}…</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>
                      {d.paymentMethod && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {d.paymentMethod}
                        </div>
                      )}
                    </td>

                    {/* Gross USD */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>
                      ${Number(d.usdAmount || 0).toFixed(2)}
                    </td>

                    {/* Fee */}
                    <td style={{ padding: '0.9rem 1rem', color: '#f87171', fontSize: '0.84rem' }}>
                      -${Number(d.feeAmount || 0).toFixed(2)}
                    </td>

                    {/* Net Settlement */}
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: '#34d399' }}>
                      ${Number(d.netSettlementAmount || (d.usdAmount - d.feeAmount) || 0).toFixed(2)}
                    </td>

                    {/* Settlement Type */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <SettlementTypeBadge type={d.settlementType} />
                    </td>

                    {/* Settlement Status */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <StatusBadge status={d.settlementStatus} config={SETTLEMENT_STATUS_CONFIG} />
                    </td>

                    {/* Payment Status */}
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <StatusBadge status={d.paymentStatus} config={STATUS_CONFIG} />
                    </td>

                    {/* Date / Settled */}
                    <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      <div>Created: {fmtDate(d.createdAt)}</div>
                      {d.settledAt && (
                        <div style={{ color: '#10b981', fontSize: '0.74rem' }}>
                          Settled: {fmtDate(d.settledAt)}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      {d.settlementStatus !== 'SETTLED' ? (
                        <button
                          onClick={() => handleForceSettle(d.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.25rem' }}
                          title="Instant settle this fund"
                        >
                          <Zap size={12} color="#38bdf8" /> Settle Now
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleSettlement(d)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline'
                          }}
                        >
                          Switch {d.settlementType === 'M0' ? 'M1' : 'M0'}
                        </button>
                      )}
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
