const prisma = require('../prismaClient');
const {
  getSettlementSummary,
  processM1Batch,
  updateSettlementManually,
} = require('../services/settlementService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/donations
// Returns paginated donation history with settlement metadata and filters
// ─────────────────────────────────────────────────────────────────────────────
exports.getDonations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const { status, settlementType, settlementStatus } = req.query;

    const where = {};
    if (status) where.paymentStatus = status.toUpperCase();
    if (settlementType) where.settlementType = settlementType.toUpperCase();
    if (settlementStatus) where.settlementStatus = settlementStatus.toUpperCase();

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          campaign: {
            select: { title: true },
          },
          settlementLogs: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
      prisma.donation.count({ where }),
    ]);

    return res.json({
      donations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[ADMIN] getDonations error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch donations' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Returns aggregated stats + complete M0/M1 fund settlement metrics
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [
      finishedAgg,
      statusCounts,
      totalDonations,
      settlementSummary,
      recent,
    ] = await Promise.all([
      // Total USD from FINISHED donations
      prisma.donation.aggregate({
        where: { paymentStatus: 'FINISHED' },
        _sum: { usdAmount: true },
        _count: true,
      }),
      // Count by paymentStatus
      prisma.donation.groupBy({
        by: ['paymentStatus'],
        _count: { id: true },
      }),
      // Total donations count
      prisma.donation.count(),
      // M0/M1 Settlement metrics
      getSettlementSummary(),
      // Recent 5 donations
      prisma.donation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          donorName: true,
          usdAmount: true,
          feeAmount: true,
          netSettlementAmount: true,
          settlementType: true,
          settlementStatus: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
        },
      }),
    ]);

    const statusMap = {};
    statusCounts.forEach(s => {
      statusMap[s.paymentStatus] = s._count.id;
    });

    return res.json({
      totalRaisedUSD: finishedAgg._sum.usdAmount || 0,
      completedDonations: finishedAgg._count || 0,
      totalDonations,
      statusBreakdown: statusMap,
      settlement: settlementSummary,
      recentDonations: recent,
    });
  } catch (err) {
    console.error('[ADMIN] getStats error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/settlements/process-m1
// Batch settle pending M1 transactions (next business day settlement)
// ─────────────────────────────────────────────────────────────────────────────
exports.processM1SettlementBatch = async (req, res) => {
  try {
    const forceAll = req.body?.force === true;
    const result = await processM1Batch(forceAll);
    return res.json({
      success: true,
      message: `Successfully settled ${result.count} M1 transactions.`,
      settledCount: result.count,
    });
  } catch (err) {
    console.error('[ADMIN] processM1SettlementBatch error:', err.message);
    return res.status(500).json({ error: 'Failed to process M1 settlements' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/settlements/:id/update
// Update settlement type or force status for an individual transaction
// ─────────────────────────────────────────────────────────────────────────────
exports.updateSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { settlementType, settlementStatus, notes } = req.body;

    const updated = await updateSettlementManually(id, {
      settlementType,
      settlementStatus,
      notes,
    });

    return res.json({
      success: true,
      donation: updated,
    });
  } catch (err) {
    console.error('[ADMIN] updateSettlement error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to update settlement' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/settlements/export
// Exports all donations and settlement records as a CSV file
// ─────────────────────────────────────────────────────────────────────────────
exports.exportSettlementsCsv = async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { campaign: { select: { title: true } } },
    });

    const headers = [
      'Transaction ID',
      'NOWPayments ID',
      'Donor Name',
      'Donor Email',
      'Payment Status',
      'Payment Method',
      'Original Currency',
      'Original Amount',
      'Gross USD Amount',
      'Processing Fee USD',
      'Net Settled USD',
      'Settlement Type',
      'Settlement Status',
      'Settled At',
      'Created At',
    ];

    const rows = donations.map(d => [
      `"${d.id}"`,
      `"${d.nowPaymentsId || ''}"`,
      `"${d.donorName.replace(/"/g, '""')}"`,
      `"${d.donorEmail || ''}"`,
      `"${d.paymentStatus}"`,
      `"${d.paymentMethod || ''}"`,
      `"${d.originalCurrency || ''}"`,
      d.originalAmount || 0,
      d.usdAmount || 0,
      d.feeAmount || 0,
      d.netSettlementAmount || 0,
      `"${d.settlementType}"`,
      `"${d.settlementStatus}"`,
      `"${d.settledAt ? d.settledAt.toISOString() : ''}"`,
      `"${d.createdAt.toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=trustaid-settlement-report-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[ADMIN] exportSettlementsCsv error:', err.message);
    return res.status(500).json({ error: 'Failed to export settlement report' });
  }
};
