export const initialStats = {
  totalRaised: 5700.0,
  totalDonationsCount: 3,
  activeCampaignsCount: 2,
  uniqueDonorsCount: 2,
};

export const initialCampaigns = [
  {
    id: 'clean-water-initiative',
    title: 'Clean Water Initiative',
    description: 'Building modern tube-wells and water-filtration systems in dry communities to prevent waterborne diseases.',
    target: 15000.0,
    raised: 4500.0,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
    ngo: {
      user: {
        name: 'Hope Foundation',
      }
    },
    donations: [
      {
        id: 'd1',
        donorName: 'John Doe',
        amount: 2500.0,
        frequency: 'ONE_TIME',
      },
      {
        id: 'd2',
        donorName: 'John Doe',
        amount: 2000.0,
        frequency: 'MONTHLY',
      }
    ]
  },
  {
    id: 'education-for-all',
    title: 'Education for All Children',
    description: 'Providing primary school textbooks, school bags, and teacher stipends in marginalized local districts.',
    target: 8000.0,
    raised: 1200.0,
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    ngo: {
      user: {
        name: 'Hope Foundation',
      }
    },
    donations: [
      {
        id: 'd3',
        donorName: 'Anonymous Donor',
        amount: 1200.0,
        frequency: 'ONE_TIME',
      }
    ]
  }
];
