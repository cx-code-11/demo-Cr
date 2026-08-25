const prisma = require('../prismaClient');

const createDonation = async (req, res) => {
  const { campaignId, amount, currency, frequency, donorName, paymentCardNumber } = req.body;

  if (!campaignId || !amount || !currency || !frequency) {
    return res.status(400).json({ error: 'Missing donation details (campaignId, amount, currency, frequency)' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Donation amount must be greater than zero.' });
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'This campaign is no longer active and cannot accept donations.' });
    }

    // 1. Simulate Stripe Card Authorization & Payment Intent
    let paymentSuccess = true;
    let stripeId = 'ch_simulated_' + Math.random().toString(36).substr(2, 9);

    // Simple card validation simulation: if it contains '4000', treat as declinable
    if (paymentCardNumber && paymentCardNumber.includes('4000 0000')) {
      paymentSuccess = false;
    }

    if (!paymentSuccess) {
      return res.status(400).json({ error: 'Payment declined. Please try another card.' });
    }

    // 2. Determine donor identification
    let donorId = null;
    let finalDonorName = donorName || 'Anonymous Donor';

    if (req.user) {
      // User is logged in
      donorId = req.user.id;
      if (!donorName) {
        const user = await prisma.user.findUnique({ where: { id: donorId } });
        if (user) {
          finalDonorName = user.name;
        }
      }
    }

    // 3. Save Donation record inside transaction
    const [donation, updatedCampaign] = await prisma.$transaction([
      prisma.donation.create({
        data: {
          amount: numericAmount,
          currency: currency.toUpperCase(),
          status: 'COMPLETED',
          frequency,
          donorId,
          campaignId,
          donorName: finalDonorName,
          stripeId,
        },
      }),
      prisma.campaign.update({
        where: { id: campaignId },
        data: {
          raised: {
            increment: numericAmount,
          },
        },
      }),
    ]);

    res.status(201).json({
      message: 'Donation processed successfully. Thank you for your support!',
      donation,
      campaignRaised: updatedCampaign.raised,
    });
  } catch (error) {
    console.error('Error processing donation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyDonationHistory = async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { donorId: req.user.id },
      include: {
        campaign: {
          select: {
            title: true,
            imageUrl: true,
            ngo: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(donations);
  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const totalDonations = await prisma.donation.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const activeCampaignsCount = await prisma.campaign.count({
      where: { status: 'ACTIVE' },
    });

    const uniqueDonorsCount = await prisma.user.count({
      where: { role: 'DONOR' },
    });

    // Also get sum of donations group by currency
    const currencySummary = await prisma.donation.groupBy({
      by: ['currency'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    res.json({
      totalRaised: totalDonations._sum.amount || 0,
      totalDonationsCount: totalDonations._count.id || 0,
      activeCampaignsCount,
      uniqueDonorsCount,
      currencySummary,
    });
  } catch (error) {
    console.error('Error calculating platform statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createDonation,
  getMyDonationHistory,
  getPlatformStats,
};
