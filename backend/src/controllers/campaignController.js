const prisma = require('../prismaClient');

const getAllCampaigns = async (req, res) => {
  const { ngoId, status } = req.query;

  try {
    const filters = {};
    if (ngoId) {
      filters.ngoId = ngoId;
    }
    if (status) {
      filters.status = status;
    } else {
      // By default, show active campaigns to public
      filters.status = 'ACTIVE';
    }

    const campaigns = await prisma.campaign.findMany({
      where: filters,
      include: {
        ngo: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCampaignById = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        ngo: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        donations: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCampaign = async (req, res) => {
  const { title, description, target, imageUrl } = req.body;

  if (!title || !description || !target) {
    return res.status(400).json({ error: 'Missing required fields (title, description, target)' });
  }

  try {
    // Check NGO profile
    const ngoProfile = await prisma.ngoProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!ngoProfile) {
      return res.status(400).json({ error: 'User is not associated with an NGO profile' });
    }

    if (ngoProfile.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Your NGO account is pending approval or has been rejected. You cannot create campaigns yet.' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        ngoId: ngoProfile.id,
        title,
        description,
        target: parseFloat(target),
        status: 'ACTIVE',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
      },
    });

    res.status(201).json({ message: 'Campaign created successfully', campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCampaign = async (req, res) => {
  const { id } = req.params;
  const { title, description, target, imageUrl, status } = req.body;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { ngo: true },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Verify ownership or admin role
    if (req.user.role !== 'ADMIN') {
      const ngoProfile = await prisma.ngoProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!ngoProfile || campaign.ngoId !== ngoProfile.id) {
        return res.status(403).json({ error: 'You do not have permission to update this campaign.' });
      }
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(target && { target: parseFloat(target) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status && { status }),
      },
    });

    res.json({ message: 'Campaign updated successfully', campaign: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCampaign = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { ngo: true },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Verify ownership or admin role
    if (req.user.role !== 'ADMIN') {
      const ngoProfile = await prisma.ngoProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!ngoProfile || campaign.ngoId !== ngoProfile.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this campaign.' });
      }
    }

    await prisma.campaign.delete({ where: { id } });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};
