import os

path = './html/finops-suite/financial-ui.html'
with open(path, 'r') as f:
    html = f.read()

# 1. FORCE THE STACKING ORDER
# We add z-index: 9999 to ensure they are physically 'on top' of all overlays
html = html.replace('id="node-05"', 'id="node-05" style="z-index: 9999 !important; pointer-events: auto !important; cursor: pointer !important;" onclick="window.location.href=\'compliance.html\';"')
html = html.replace('id="node-08"', 'id="node-08" style="z-index: 9999 !important; pointer-events: auto !important; cursor: pointer !important;" onclick="window.location.href=\'finops-showcase-v2.html\';"')

# 2. CLEAR ANY HIDDEN OVERLAYS
# This CSS snippet ensures that if there's a 'card-overlay' div, it doesn't block the click
css_patch = """
<style>
#node-05 *, #node-08 * {
    pointer-events: none; /* Children won't steal the click */
}
#node-05, #node-08 {
    pointer-events: auto !important; /* The card itself handles everything */
}
</style>
"""

if '</head>' in html:
    html = html.replace('</head>', css_patch + '</head>')

with open(path, 'w') as f:
    f.write(html)
