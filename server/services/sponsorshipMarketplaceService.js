let companies = [];
let proposals = [];
let agreements = [];

const PACKAGE_TIERS = [
  { tier: 'Bronze', benefits: ['Logo on event page', 'Social media mention'], minBudget: 500 },
  {
    tier: 'Silver',
    benefits: ['Logo on event page', 'Social media mention', 'Booth space', 'Email list access'],
    minBudget: 1500,
  },
  {
    tier: 'Gold',
    benefits: [
      'Logo on event page',
      'Social media (3x)',
      'Booth space',
      'Email list access',
      'Speaking opportunity',
      'Post-event report',
    ],
    minBudget: 3000,
  },
  {
    tier: 'Platinum',
    benefits: [
      'Logo on event page',
      'Social media (5x)',
      'Prime booth space',
      'Email list access',
      'Keynote speaking',
      'Post-event report',
      'Lead generation report',
      'Dedicated booth staff',
    ],
    minBudget: 6000,
  },
];

export const sponsorshipMarketplaceService = {
  listCompanies(filters = {}) {
    let result = [...companies];
    if (filters.interest)
      result = result.filter((c) =>
        c.interests.some((i) => i.toLowerCase().includes(filters.interest.toLowerCase()))
      );
    if (filters.minBudget) result = result.filter((c) => c.budgetMax >= Number(filters.minBudget));
    return result.slice(0, 100);
  },

  createCompany(data) {
    const company = {
      id: 'cmp-' + Date.now(),
      logo: null,
      testimonials: [],
      pastSponsorships: [],
      interests: [],
      createdAt: new Date().toISOString(),
      ...data,
    };
    if (!Array.isArray(company.interests)) {
      company.interests = [];
    }
    companies.push(company);
    return company;
  },

  getCompany(id) {
    return companies.find((c) => c.id === id) || null;
  },

  getPackages() {
    return PACKAGE_TIERS.map((p) => ({ ...p }));
  },

  createProposal(data) {
    const proposal = {
      id: 'prp-' + Date.now(),
      status: 'Proposed',
      versions: [{ ...data, version: 1, timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      ...data,
    };
    proposals.push(proposal);
    return proposal;
  },

  getProposals(filters = {}) {
    let result = [...proposals];
    if (filters.companyId) result = result.filter((p) => p.companyId === filters.companyId);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    return result;
  },

  updateProposalStatus(proposalId, status) {
    const p = proposals.find((pr) => pr.id === proposalId);
    if (!p) return null;
    p.status = status;
    if (status === 'Accepted') {
      let agreement = agreements.find((a) => a.proposalId === proposalId);
      if (!agreement) {
        agreement = {
          id: 'agr-' + Date.now(),
          proposalId,
          companyId: p.companyId,
          tier: p.tier,
          benefits: p.benefits || [],
          status: 'Active',
          deliverables: (p.benefits || []).map((b) => ({ item: b, done: false })),
          createdAt: new Date().toISOString(),
        };
        agreements.push(agreement);
      }
      p.agreementId = agreement.id;
      return { proposal: p, agreement };
    }
    return { proposal: p };
  },

  getAgreements(filters = {}) {
    let result = [...agreements];
    if (filters.companyId) result = result.filter((a) => a.companyId === filters.companyId);
    if (filters.status) result = result.filter((a) => a.status === filters.status);
    return result;
  },

  updateDeliverable(agreementId, item, done) {
    const a = agreements.find((ag) => ag.id === agreementId);
    if (!a) return null;
    const d = a.deliverables.find((dl) => dl.item === item);
    if (d) d.done = done;
    if (a.deliverables.every((dl) => dl.done)) a.status = 'Completed';
    return a;
  },

  getROI(sponsorCompanyId) {
    const companyAgreements = agreements.filter((a) => a.companyId === sponsorCompanyId);
    const totalBudget = proposals
      .filter((p) => companyAgreements.some((a) => a.proposalId === p.id))
      .reduce((sum, p) => sum + (p.budget || 0), 0);
    return {
      totalBudget,
      agreementCount: companyAgreements.length,
      completedCount: companyAgreements.filter((a) => a.status === 'Completed').length,
    };
  },
};
