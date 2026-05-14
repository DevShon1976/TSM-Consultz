#!/bin/bash
echo "🧠 BUILDING THE CFO BRAIN MODULE..."

# 1. Create the Backend Logic Engine
cat <<'JS' > wip-engine.js
const calculateWIP = (job) => {
    const revContract = job.contract_value_original + 
        (job.change_orders || []).filter(co => co.approved).reduce((sum, co) => sum + co.amount, 0);
    const pctComplete = job.costs.cost_to_date / (job.wip.projected_cost_at_completion || 1);
    const earnedRev = revContract * pctComplete;
    const overUnder = earnedRev - job.billing.billings_to_date;
    
    return {
        ...job,
        revised_contract: revContract,
        percent_complete: (pctComplete * 100).toFixed(1),
        earned_revenue: earnedRev.toFixed(2),
        over_under_val: overUnder.toFixed(2),
        status_label: overUnder > 0 ? "Under-Billed (Cash Leak)" : "Over-Billed (Positive)"
    };
};
module.exports = { calculateWIP };
JS

# 2. Append the API Route to server.js
# (Using a temporary file to safely append before the app.listen)
sed -i '$d' server.js # Remove last line
cat <<'API' >> server.js
const { calculateWIP } = require('./wip-engine');

app.post('/api/cfo-chat', async (req, res) => {
    const { jobId, question } = req.body;
    const rawData = JSON.parse(await fs.promises.readFile('./data/wip-master.json', 'utf8'));
    const job = rawData.jobs.find(j => j.id === jobId);
    
    if (!job) return res.status(404).send("Job not found");
    const analytics = calculateWIP(job);

    // This is where you'd call Groq, for now we return the analyzed context
    const aiResponse = `Analysis for ${analytics.entity}: Progress is at ${analytics.percent_complete}%. 
                        The position is ${analytics.status_label} by $${Math.abs(analytics.over_under_val)}. 
                        Insight: Review cost transactions in ${analytics.sector} categories for variances.`;
    
    res.json({ answer: aiResponse, stats: analytics });
});

app.listen(process.env.PORT || 8080, () => console.log('TSM Shell Active on 8080'));
API

# 3. Create a Demo WIP Dataset if it doesn't exist
mkdir -p data
cat <<'DATA' > data/wip-master.json
{
  "jobs": [
    {
      "id": "MAYO-AUDIT-01",
      "sector": "Healthcare",
      "entity": "Mayo Clinic",
      "contract_value_original": 250000,
      "billing": { "billings_to_date": 100000 },
      "costs": { "cost_to_date": 140000 },
      "wip": { "projected_cost_at_completion": 200000 },
      "change_orders": []
    }
  ]
}
DATA

# 4. Deploy
echo "🚀 DEPLOYING CFO BRAIN TO FLY.IO..."
fly deploy --remote-only --strategy rolling
