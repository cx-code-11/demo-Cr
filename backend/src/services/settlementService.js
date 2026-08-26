const prisma = require('../prismaClient');

// Fee structures:
// M0 (Instant settlement): 0.5% processing fee
// M1 (Next Business Day settlement): 0.25% processing fee
const M0_FEE_RATE = 0.005; // 0.5%
const M1_FEE_RATE = 0.0025; // 0.25%

/**
 * Calculate next business day date (skipping weekends).
 * If today is Friday, next business day is Monday (+3 days).
 * If Saturday, Monday (+2 days).
 * Otherwise, next day (+1 day).
 */
function getNextBusinessDay(fromDate = new Date()) {
  const next = new Date(fromDate);
  const dayOfWeek = next.getDay(); // 0 = Sunday, 6 = Saturday

  if (dayOfWeek === 5) {
    // Friday -> Monday (+3 days)
    next.setDate(next.getDate() + 3);
  } else if (dayOfWeek === 6) {
    // Saturday -> Monday (+2 days)
    next.setDate(next.getDate() + 2);
  } else {
    // Sun -> Mon, or Mon-Thu -> next day (+1 day)
    next.setDate(next.getDate() + 1);
  }

  // Set settlement target time to 09:00:00 AM UTC
  next.setUTCHours(9, 0, 0, 0);
  return next;
}

/**
 * Calculate fees and net settlement amounts based on settlement type.
 */
function calculateSettlement(usdAmount, settlementType = 'M0') {
  const gross = parseFloat(usdAmount) || 0;
  const rate = settlementType === 'M1' ? M1_FEE_RATE : M0_FEE_RATE;
  const fee = parseFloat((gross * rate).toFixed(2));
  const net = parseFloat((gross - fee).toFixed(2));
  return { gross, fee, net };
}

/**
 * Process settlement for a donation based on its configured settlementType.
 * Called when a donation reaches a successful status ('FINISHED' or 'CONFIRMED').
 */
async function processDonationSettlement(donationId, overrideType = null) {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
  });

  if (!donation) {
    throw new Error(`Donation not found: ${donationId}`);
  }

  const settlementType = overrideType || donation.settlementType || 'M0';
  const { gross, fee, net } = calculateSettlement(donation.usdAmount, settlementType);
  const oldStatus = donation.settlementStatus;

  let newStatus = 'PENDING';
  let settledAt = null;
  let estimatedSettlementDate = null;
  let notes = '';

  if (settlementType === 'M0') {
    // M0: Instant Settlement immediately upon payment confirmation
    newStatus = 'SETTLED';
    settledAt = new Date();
    notes = 'Instant M0 settlement processed immediately.';
  } else {
    // M1: Next Business Day Settlement
    newStatus = 'PROCESSING';
    estimatedSettlementDate = getNextBusinessDay();
    notes = `M1 scheduled settlement queued for ${estimatedSettlementDate.toISOString().split('T')[0]}.`;
  }

  const updated = await prisma.donation.update({
    where: { id: donationId },
    data: {
      settlementType,
      settlementStatus: newStatus,
      feeAmount: fee,
      netSettlementAmount: net,
      settledAt,
      estimatedSettlementDate,
      updatedAt: new Date(),
    },
  });

  // Create audit log
  await prisma.settlementLog.create({
    data: {
      donationId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      settlementType,
      amount: gross,
      fee,
      netAmount: net,
      notes,
    },
  });

  console.log(`[SETTLEMENT] Donation ${donationId} -> ${settlementType} (${newStatus}). Gross: $${gross}, Fee: $${fee}, Net: $${net}`);
  return updated;
}

/**
 * Process all pending M1 settlements that are scheduled for settlement.
 * Or manually settle all pending M1 donations if forceAll = true.
 */
async function processM1Batch(forceAll = false) {
  const now = new Date();

  const whereClause = {
    settlementType: 'M1',
    settlementStatus: { in: ['PENDING', 'PROCESSING'] },
    ...(forceAll ? {} : { estimatedSettlementDate: { lte: now } }),
  };

  const pendingDonations = await prisma.donation.findMany({
    where: whereClause,
  });

  const settled = [];

  for (const donation of pendingDonations) {
    const { gross, fee, net } = calculateSettlement(donation.usdAmount, 'M1');
    const oldStatus = donation.settlementStatus;

    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        settlementStatus: 'SETTLED',
        settledAt: new Date(),
        feeAmount: fee,
        netSettlementAmount: net,
        updatedAt: new Date(),
      },
    });

    await prisma.settlementLog.create({
      data: {
        donationId: donation.id,
        fromStatus: oldStatus,
        toStatus: 'SETTLED',
        settlementType: 'M1',
        amount: gross,
        fee,
        netAmount: net,
        notes: forceAll ? 'M1 batch settlement executed manually by admin.' : 'Automated M1 next-business-day settlement completed.',
      },
    });

    settled.push(updated);
  }

  console.log(`[SETTLEMENT BATCH] Processed ${settled.length} M1 transactions.`);
  return { count: settled.length, settled };
}

/**
 * Update settlement details manually for a donation (Admin action).
 */
async function updateSettlementManually(donationId, { settlementType, settlementStatus, notes }) {
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
  });

  if (!donation) {
    throw new Error(`Donation not found: ${donationId}`);
  }

  const targetType = settlementType || donation.settlementType;
  const targetStatus = settlementStatus || donation.settlementStatus;
  const { gross, fee, net } = calculateSettlement(donation.usdAmount, targetType);

  const settledAt = targetStatus === 'SETTLED' ? (donation.settledAt || new Date()) : null;
  const estimatedSettlementDate = targetType === 'M1' && targetStatus !== 'SETTLED' ? getNextBusinessDay() : null;

  const updated = await prisma.donation.update({
    where: { id: donationId },
    data: {
      settlementType: targetType,
      settlementStatus: targetStatus,
      feeAmount: fee,
      netSettlementAmount: net,
      settledAt,
      estimatedSettlementDate,
      updatedAt: new Date(),
    },
  });

  await prisma.settlementLog.create({
    data: {
      donationId,
      fromStatus: donation.settlementStatus,
      toStatus: targetStatus,
      settlementType: targetType,
      amount: gross,
      fee,
      netAmount: net,
      notes: notes || 'Settlement updated manually via Admin dashboard.',
    },
  });

  return updated;
}

/**
 * Get aggregated settlement fund summary (M0 vs M1, Gross, Fees, Net).
 */
async function getSettlementSummary() {
  // Aggregate all completed/settled
  const [
    m0Settled,
    m1Settled,
    m1Pending,
    totalSettledAgg,
    totalFeesAgg,
    allFinishedDonations,
  ] = await Promise.all([
    // M0 settled
    prisma.donation.aggregate({
      where: { settlementType: 'M0', settlementStatus: 'SETTLED' },
      _sum: { usdAmount: true, feeAmount: true, netSettlementAmount: true },
      _count: true,
    }),
    // M1 settled
    prisma.donation.aggregate({
      where: { settlementType: 'M1', settlementStatus: 'SETTLED' },
      _sum: { usdAmount: true, feeAmount: true, netSettlementAmount: true },
      _count: true,
    }),
    // M1 pending/processing
    prisma.donation.aggregate({
      where: { settlementType: 'M1', settlementStatus: { in: ['PENDING', 'PROCESSING'] } },
      _sum: { usdAmount: true, feeAmount: true, netSettlementAmount: true },
      _count: true,
    }),
    // Overall settled net
    prisma.donation.aggregate({
      where: { settlementStatus: 'SETTLED' },
      _sum: { usdAmount: true, feeAmount: true, netSettlementAmount: true },
      _count: true,
    }),
    // Overall fees collected
    prisma.donation.aggregate({
      _sum: { feeAmount: true },
    }),
    // Total completed payment count
    prisma.donation.count({
      where: { paymentStatus: { in: ['FINISHED', 'CONFIRMED'] } },
    }),
  ]);

  return {
    totalGrossRaisedUSD: (totalSettledAgg._sum.usdAmount || 0) + (m1Pending._sum.usdAmount || 0),
    totalNetSettledUSD: totalSettledAgg._sum.netSettlementAmount || 0,
    totalFeesCollectedUSD: totalFeesAgg._sum.feeAmount || 0,
    totalSettledCount: totalSettledAgg._count || 0,
    m0: {
      count: m0Settled._count || 0,
      grossUSD: m0Settled._sum.usdAmount || 0,
      feeUSD: m0Settled._sum.feeAmount || 0,
      netUSD: m0Settled._sum.netSettlementAmount || 0,
    },
    m1: {
      settledCount: m1Settled._count || 0,
      settledGrossUSD: m1Settled._sum.usdAmount || 0,
      settledFeeUSD: m1Settled._sum.feeAmount || 0,
      settledNetUSD: m1Settled._sum.netSettlementAmount || 0,
      pendingCount: m1Pending._count || 0,
      pendingGrossUSD: m1Pending._sum.usdAmount || 0,
      pendingNetUSD: m1Pending._sum.netSettlementAmount || 0,
    },
  };
}

module.exports = {
  calculateSettlement,
  getNextBusinessDay,
  processDonationSettlement,
  processM1Batch,
  updateSettlementManually,
  getSettlementSummary,
};
