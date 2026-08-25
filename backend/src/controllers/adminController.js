const prisma = require('../prismaClient');

const getAllNgos = async (req, res) => {
  try {
    const ngos = await prisma.ngoProfile.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ngos);
  } catch (error) {
    console.error('Error fetching NGOs for admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyNgo = async (req, res) => {
  const { id } = req.params; // NGO Profile ID
  const { status } = req.body; // "APPROVED" or "REJECTED"

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED.' });
  }

  try {
    const ngo = await prisma.ngoProfile.findUnique({ where: { id } });
    if (!ngo) {
      return res.status(404).json({ error: 'NGO profile not found' });
    }

    const updatedNgo = await prisma.ngoProfile.update({
      where: { id },
      data: { status },
    });

    res.json({ message: `NGO status updated to ${status} successfully.`, ngo: updatedNgo });
  } catch (error) {
    console.error('Error verifying NGO:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllPayoutRequests = async (req, res) => {
  try {
    const payouts = await prisma.payout.findMany({
      include: {
        ngo: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payouts);
  } catch (error) {
    console.error('Error fetching payout requests for admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const processPayout = async (req, res) => {
  const { id } = req.params; // Payout ID
  const { status } = req.body; // "COMPLETED" or "REJECTED"

  if (!status || !['COMPLETED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be COMPLETED or REJECTED.' });
  }

  try {
    const payout = await prisma.payout.findUnique({ where: { id } });
    if (!payout) {
      return res.status(404).json({ error: 'Payout request not found.' });
    }

    if (payout.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payout request has already been processed.' });
    }

    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: { status },
    });

    res.json({ message: `Payout status updated to ${status} successfully.`, payout: updatedPayout });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const donorsCount = await prisma.user.count({ where: { role: 'DONOR' } });
    const ngosCount = await prisma.user.count({ where: { role: 'NGO' } });
    const campaignsCount = await prisma.campaign.count();
    
    const donations = await prisma.donation.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const pendingPayouts = await prisma.payout.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const completedPayouts = await prisma.payout.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    res.json({
      donorsCount,
      ngosCount,
      campaignsCount,
      totalRaised: donations._sum.amount || 0,
      pendingPayoutsCount: pendingPayouts._count.id || 0,
      pendingPayoutsAmount: pendingPayouts._sum.amount || 0,
      completedPayoutsAmount: completedPayouts._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllNgos,
  verifyNgo,
  getAllPayoutRequests,
  processPayout,
  getAdminStats,
};
