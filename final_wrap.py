import os

path = './html/finops-suite/financial-ui.html'
with open(path, 'r') as f:
    html = f.read()

# Surgical wrap: Putting an <a> tag AROUND the card divs for 05 and 08
# This forces the browser to treat the entire card area as a link
def wrap_card(content, node_id, target_file):
    # Find the start of the card div
    search_str = f'id="{node_id}"'
    if search_str in content:
        # We find the specific div and wrap it
        # This replaces the div's internal onclick with a physical link
        replacement = f'href="{target_file}" style="text-decoration: none; display: block;"'
        # Remove any existing onclicks that might block the link
        import re
        content = re.sub(f'<div[^>]*id="{node_id}"[^>]*onclick="[^"]*"', f'<a href="{target_file}"><div id="{node_id}"', content)
        # Ensure the div closure is followed by an anchor closure
        # (This is a simplified approach; usually we'd use a parser, 
        # but for this specific UI, we'll target the card's closing tag)
    return content

# Apply to 05 and 08
html = html.replace('onclick="location.href=\'compliance.html\'"', '')
html = html.replace('onclick="location.href=\'finops-showcase-v2.html\'"', '')

# The "Sledgehammer" - directly replacing the button tags inside those cards
html = html.replace('id="node-05"', 'id="node-05" style="cursor:pointer" onclick="window.location.href=\'compliance.html\'"')
html = html.replace('id="node-08"', 'id="node-08" style="cursor:pointer" onclick="window.location.href=\'finops-showcase-v2.html\'"')

with open(path, 'w') as f:
    f.write(html)
