window.runAI = async function(node='operations') {
  const input =
    document.querySelector('textarea')?.value ||
    "Analyze current construction risk and return BNCA.";

  const out =
    document.querySelector("#out, .out, .ai-output, pre");

  if (out) out.innerHTML = "⏳ Running AI Analysis...";

  try {
    const res = await fetch('/api/hc/ask', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        nodeKey: node,
        query: input
      })
    });

    const data = await res.json();

    const text =
      data.reply ||
      data.content ||
      JSON.stringify(data, null, 2);

    if (out) {
      out.innerHTML =
        "<b>AI ANALYSIS</b><br><br>" +
        text.replace(/\n/g,'<br>');
    }

    console.log("✅ AI OK:", data);

  } catch (e) {
    console.error("❌ AI FAIL:", e);
    if (out) out.innerHTML = "❌ AI request failed";
  }
};
