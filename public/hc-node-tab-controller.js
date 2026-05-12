// Minimal TSM Tab Controller Recovery
window.switchTab = function(id, el) {
    document.querySelectorAll('.tab-pane, .panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('.tab-btn, .tnav-btn, .nav-tab').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
    
    console.log("TSM_UI: Switched to " + id);
};

console.log("TSM_UI: Direct Neural Link Established.");
