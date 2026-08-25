const prisma = require('../prismaClient');

const getNgoProfile = async (req, res) => {
  try {
    const profile = await prisma.ngoProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true, email: true } },
        campaigns: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching NGO profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateNgoProfile = async (req, res) => {
  const { description, documentUrl } = req.body;

  try {
    const updatedProfile = await prisma.ngoProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(description !== undefined && { description }),
        ...(documentUrl !== undefined && { documentUrl }),
      },
    });

    res.json({ message: 'NGO Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating NGO profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requestPayout = async (req, res) => {
  const { amount, bankAccount } = req.body;

  if (!amount || !bankAccount) {
    return res.status(400).json({ error: 'Please provide amount and bank account details.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Payout amount must be greater than zero.' });
  }

  try {
    const ngoProfile = await prisma.ngoProfile.findUnique({
      where: { userId: req.user.id },
      include: { campaigns: true },
    });

    if (!ngoProfile) {
      return res.status(400).json({ error: 'NGO profile not found' });
    }

    if (ngoProfile.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Only verified and approved NGOs can request payouts.' });
    }

    // Compute Available Balance
    const totalRaised = ngoProfile.campaigns.reduce((sum, campaign) => sum + campaign.raised, 0);

    const payouts = await prisma.payout.findMany({
      where: {
        ngoId: ngoProfile.id,
        status: { in: ['PENDING', 'COMPLETED'] },
      },
    });
    const totalWithdrawn = payouts.reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = totalRaised - totalWithdrawn;

    if (numericAmount > availableBalance) {
      return res.status(400).json({
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${numericAmount.toFixed(2)}`,
      });
    }

    const payout = await prisma.payout.create({
      data: {
        ngoId: ngoProfile.id,
        amount: numericAmount,
        status: 'PENDING',
        bankAccount,
      },
    });

    res.status(201).json({ message: 'Payout request submitted successfully', payout });
  } catch (error) {
    console.error('Error requesting payout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPayouts = async (req, res) => {
  try {
    const ngoProfile = await prisma.ngoProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!ngoProfile) {
      return res.status(400).json({ error: 'NGO profile not found' });
    }

    const payouts = await prisma.payout.findMany({
      where: { ngoId: ngoProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getNgoDashboard = async (req, res) => {
  try {
    const ngoProfile = await prisma.ngoProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        campaigns: {
          include: {
            donations: {
              where: { status: 'COMPLETED' },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!ngoProfile) {
      return res.status(400).json({ error: 'NGO profile not found' });
    }

    // Dashboard calculations
    const campaignsCount = ngoProfile.campaigns.length;
    const totalRaised = ngoProfile.campaigns.reduce((sum, c) => sum + c.raised, 0);

    // Sum of payouts requested/completed
    const payouts = await prisma.payout.findMany({
      where: {
        ngoId: ngoProfile.id,
        status: { in: ['PENDING', 'COMPLETED'] },
      },
    });
    const totalWithdrawn = payouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = totalRaised - totalWithdrawn;

    // Flatten all donations
    let allDonations = [];
    ngoProfile.campaigns.forEach((campaign) => {
      campaign.donations.forEach((donation) => {
        allDonations.push({
          ...donation,
          campaignTitle: campaign.title,
        });
      });
    });

    // Sort by date desc
    allDonations.sort((a, b) => b.createdAt - a.createdAt);
    const latestDonations = allDonations.slice(0, 5);

    // Unique donors count
    const donorIds = allDonations
      .map((d) => d.donorId)
      .filter((id, index, self) => id !== null && self.indexOf(id) === index);

    res.json({
      campaignsCount,
      totalRaised,
      availableBalance,
      totalWithdrawn,
      uniqueDonorsCount: donorIds.length,
      latestDonations,
    });
  } catch (error) {
    console.error('Error fetching NGO dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNgoProfile,
  updateNgoProfile,
  requestPayout,
  getPayouts,
  getNgoDashboard,
};
