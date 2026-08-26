const prisma = require('../prismaClient');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/donations
// Returns paginated donation history with all payment metadata
// ─────────────────────────────────────────────────────────────────────────────
exports.getDonations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const status = req.query.status; // optional filter

    const where = status ? { paymentStatus: status.toUpperCase() } : {};

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
// Returns aggregated stats: total USD raised, counts by status
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    // Total USD from FINISHED donations
    const finishedAgg = await prisma.donation.aggregate({
      where: { paymentStatus: 'FINISHED' },
      _sum: { usdAmount: true },
      _count: true,
    });

    // Count by status
    const statusCounts = await prisma.donation.groupBy({
      by: ['paymentStatus'],
      _count: { id: true },
    });

    // Total donations ever created
    const totalDonations = await prisma.donation.count();

    // Recent 5 donations
    const recent = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        donorName: true,
        usdAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    const statusMap = {};
    statusCounts.forEach(s => {
      statusMap[s.paymentStatus] = s._count.id;
    });

    return res.json({
      totalRaisedUSD: finishedAgg._sum.usdAmount || 0,
      completedDonations: finishedAgg._count || 0,
      totalDonations,
      statusBreakdown: statusMap,
      recentDonations: recent,
    });
  } catch (err) {
    console.error('[ADMIN] getStats error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
