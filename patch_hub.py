import sys, re

f = sys.argv[1]
html = open(f, encoding='utf-8').read()
original = html

MAP = {
    'material-theft':         '/construction-suite/html/construction-pro.html',
    'safety-protocol':        '/construction-suite/html/compliance.html',
    'subcontractor-exposure': '/construction-suite/html/legal.html',
    'cash-flow':              '/construction-suite/financial/index.html',
    'osha-audit':             '/construction-suite/html/compliance.html',
    'lien-exposure':          '/construction-suite/html/legal.html',
    'bid-strategy':           '/construction-suite/financial/index.html',
    'bnca':                   '/construction-suite/html/construction-strategist.html',
}

for key, dest in MAP.items():
    pattern = 'onclick="runDemo\\([\\u2018\\u2019\']' + key + '[\\u2018\\u2019\']\\)"'
    replacement = 'onclick="window.location.href=\'' + dest + '\'"'
    new_html, n = re.subn(pattern, replacement, html)
    if n:
        print('OK (' + str(n) + 'x) ' + key + ' -> ' + dest)
    else:
        print('SKIP: ' + key)
    html = new_html

if html == original:
    print('No changes made.')
else:
    open(f, 'w', encoding='utf-8').write(html)
    print('Saved -> ' + f)
