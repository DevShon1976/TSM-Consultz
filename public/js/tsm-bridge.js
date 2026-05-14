async function triggerNeuralLink(payload) {
    console.log("Initiating Bridge Sync...", payload);
    try {
        const response = await fetch('/api/cfo-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        renderStrategistOutput(data);
    } catch (err) {
        console.error("Bridge Connection Failed:", err);
    }
}

function renderStrategistOutput(data) {
    const display = document.getElementById('strategist-display') || document.body;
    const alertBox = document.createElement('div');
    alertBox.style = "border: 2px solid #22d3ee; background: #0f172a; padding: 20px; margin-top: 20px; color: #fff;";
    alertBox.innerHTML = `
        <h3 style="color:#22d3ee">DATA RELAY: ${data.logic_applied || 'General'}</h3>
        <p><strong>Analysis:</strong> ${data.analysis || 'No data'}</p>
        <p><em>${data.narrative}</em></p>
    `;
    display.prepend(alertBox);
}
