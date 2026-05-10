import os

path = './html/finops-suite/financial-ui.html'
with open(path, 'r') as f:
    html = f.read()

# 1. THE TRANSPARENT SHIELD CSS
# This creates a layer that sits on top of the card but is invisible
shield_css = """
<style>
.node-shield {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    cursor: pointer;
    background: rgba(0,0,0,0);
}
.active-node { position: relative; }
</style>
"""

# 2. INJECT SHIELDS INTO 05 AND 08
# We place the shield inside the card so it inherits the card's dimensions
shield_05 = '<div class="node-shield" onclick="window.location.href=\'compliance.html\'"></div>'
shield_08 = '<div class="node-shield" onclick="window.location.href=\'finops-showcase-v2.html\'"></div>'

if '</head>' in html:
    html = html.replace('</head>', shield_css + '</head>')

# We insert the shield right after the opening div tag of the cards
html = html.replace('id="node-05">', 'id="node-05" class="active-node">' + shield_05)
html = html.replace('id="node-08">', 'id="node-08" class="active-node">' + shield_08)

with open(path, 'w') as f:
    f.write(html)
