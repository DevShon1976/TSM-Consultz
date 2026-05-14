module.exports = {
  calculateConstruction: (j) => ({
    percent_complete: Math.round((j.cost / j.budget) * 100),
    earned_revenue: Math.round((j.cost / j.budget) * j.contract),
    over_under: Math.round((j.cost / j.budget) * j.contract - j.billed)
  }),
  calculateInsurance: (c) => ({
    reserve_adequacy: Math.round((c.paid + (c.reserve - c.paid)) / c.est_payout * 100),
    financial_exposure: c.est_payout - c.paid
  })
};
