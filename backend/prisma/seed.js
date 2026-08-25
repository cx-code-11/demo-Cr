const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.payout.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.ngoProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create hashed passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const ngoPassword = await bcrypt.hash('ngo123', 10);
  const donorPassword = await bcrypt.hash('donor123', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@charity.org',
      password: adminPassword,
      name: 'Global Admin',
      role: 'ADMIN',
    },
  });

  // 2. Create NGO User & Profile
  const ngoUser = await prisma.user.create({
    data: {
      email: 'ngo@hope.org',
      password: ngoPassword,
      name: 'Hope Foundation',
      role: 'NGO',
    },
  });

  const ngoProfile = await prisma.ngoProfile.create({
    data: {
      userId: ngoUser.id,
      description: 'Hope Foundation works towards sustainable development and clean drinking water access in remote villages.',
      status: 'APPROVED',
      documentUrl: 'https://example.com/docs/hope-cert.pdf',
    },
  });

  // 3. Create Donor
  const donor = await prisma.user.create({
    data: {
      email: 'donor@gmail.com',
      password: donorPassword,
      name: 'John Doe',
      role: 'DONOR',
    },
  });

  // 4. Create Campaigns
  const campaign1 = await prisma.campaign.create({
    data: {
      ngoId: ngoProfile.id,
      title: 'Clean Water Initiative',
      description: 'Building modern tube-wells and water-filtration systems in dry communities to prevent waterborne diseases.',
      target: 15000.0,
      raised: 4500.0,
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      ngoId: ngoProfile.id,
      title: 'Education for All Children',
      description: 'Providing primary school textbooks, school bags, and teacher stipends in marginalized local districts.',
      target: 8000.0,
      raised: 1200.0,
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    },
  });

  // 5. Create Donations
  await prisma.donation.create({
    data: {
      amount: 2500.0,
      currency: 'USD',
      status: 'COMPLETED',
      frequency: 'ONE_TIME',
      donorId: donor.id,
      donorName: donor.name,
      campaignId: campaign1.id,
      stripeId: 'ch_simulated_1',
    },
  });

  await prisma.donation.create({
    data: {
      amount: 2000.0,
      currency: 'USD',
      status: 'COMPLETED',
      frequency: 'MONTHLY',
      donorId: donor.id,
      donorName: donor.name,
      campaignId: campaign1.id,
      stripeId: 'ch_simulated_2',
    },
  });

  await prisma.donation.create({
    data: {
      amount: 1200.0,
      currency: 'USD',
      status: 'COMPLETED',
      frequency: 'ONE_TIME',
      donorName: 'Anonymous Donor',
      campaignId: campaign2.id,
      stripeId: 'ch_simulated_3',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
