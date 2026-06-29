#!/usr/bin/env python3
"""
verify_inline_scripts.py

Checks every inline <script> block in one or more HTML files for JS syntax
errors, using Node's actual parser (`node --check`) instead of manual brace
counting. Manual brace counting can't tell you WHERE a brace is missing or
extra -- it can only tell you the net imbalance, which is why the earlier
fix attempts kept guessing wrong. This tool pinpoints the exact line.

USAGE:
    python3 verify_inline_scripts.py path/to/file1.html path/to/file2.html
    python3 verify_inline_scripts.py path/to/some/dir       # recurses *.html

REQUIRES: Node.js available on PATH (node --version to confirm).

EXIT CODE: 0 if every block in every file parses cleanly, 1 otherwise.
"""

import re
import sys
import subprocess
import tempfile
import os
from pathlib import Path

SCRIPT_OPEN_RE = re.compile(r'<script(?![^>]*\bsrc\b)[^>]*>', re.IGNORECASE)
SCRIPT_CLOSE_RE = re.compile(r'</script\s*>', re.IGNORECASE)


def find_script_blocks(html_text):
    """
    Returns a list of (start_line, end_line, code) for every inline
    <script>...</script> block (skips blocks with a src= attribute).
    Line numbers are 1-indexed and refer to the position WITHIN the html file.
    """
    blocks = []
    pos = 0
    line_no = 1
    lines = html_text.splitlines(keepends=True)

    # Build a cumulative offset->line map once, then scan with regex over
    # the raw text so we can convert char offsets to line numbers cheaply.
    offsets = [0]
    for l in lines:
        offsets.append(offsets[-1] + len(l))

    def char_to_line(idx):
        # binary search would be nicer, linear is fine for typical file sizes
        for i, off in enumerate(offsets):
            if off > idx:
                return i  # 1-indexed line number
        return len(lines)

    search_start = 0
    while True:
        m_open = SCRIPT_OPEN_RE.search(html_text, search_start)
        if not m_open:
            break
        m_close = SCRIPT_CLOSE_RE.search(html_text, m_open.end())
        if not m_close:
            break  # unclosed <script> tag itself -- report separately below
        code = html_text[m_open.end():m_close.start()]
        start_line = char_to_line(m_open.end())
        end_line = char_to_line(m_close.start())
        blocks.append((start_line, end_line, code))
        search_start = m_close.end()

    return blocks


def check_block_with_node(code):
    """
    Writes `code` to a temp .js file and runs `node --check` on it.
    Returns (ok: bool, message: str). On failure, message contains node's
    raw stderr, which includes the exact line/column inside the temp file.
    """
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False,
                                      encoding='utf-8') as tf:
        tf.write(code)
        tmp_path = tf.name
    try:
        result = subprocess.run(
            ['node', '--check', tmp_path],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            return True, ""
        return False, result.stderr
    except FileNotFoundError:
        print("ERROR: `node` was not found on PATH. Install Node.js to use "
              "this script.", file=sys.stderr)
        sys.exit(2)
    except subprocess.TimeoutExpired:
        return False, "node --check timed out (15s) -- unexpected for a syntax check"
    finally:
        os.unlink(tmp_path)


def map_node_error_to_html_line(node_stderr, block_start_line):
    """
    node --check errors look like:
        /tmp/xyz.js:42
        ...offending line printed...
              ^
        SyntaxError: ...
    Extract the line number (42) inside the temp file and convert it to the
    corresponding line number in the original HTML file.
    """
    m = re.search(r':(\d+)\n', node_stderr)
    if not m:
        return None
    js_line = int(m.group(1))
    # block_start_line is the HTML line of the char right after <script...>,
    # and the temp file's line 1 corresponds to that same position.
    html_line = block_start_line + js_line - 1
    return html_line


def check_file(path):
    text = Path(path).read_text(encoding='utf-8', errors='replace')
    blocks = find_script_blocks(text)
    if not blocks:
        print(f"  (no inline <script> blocks found)")
        return True

    all_ok = True
    for i, (start_line, end_line, code) in enumerate(blocks):
        ok, err = check_block_with_node(code)
        if ok:
            print(f"  \u2705 block {i} (HTML lines {start_line}-{end_line}): OK")
        else:
            all_ok = False
            html_line = map_node_error_to_html_line(err, start_line)
            loc = f"HTML line {html_line}" if html_line else "location unknown"
            # First line of node's stderr is the file:line header; the real
            # error message is usually 3-4 lines down (SyntaxError: ...).
            err_lines = [l for l in err.splitlines() if l.strip()]
            reason = next((l for l in err_lines if 'Error' in l), err_lines[-1] if err_lines else "unknown error")
            print(f"  \u274c block {i} (HTML lines {start_line}-{end_line}): "
                  f"SYNTAX ERROR at {loc}")
            print(f"       {reason.strip()}")
    return all_ok


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    targets = []
    for arg in sys.argv[1:]:
        p = Path(arg)
        if p.is_dir():
            targets.extend(sorted(p.rglob('*.html')))
        elif p.is_file():
            targets.append(p)
        else:
            print(f"WARNING: {arg} not found, skipping", file=sys.stderr)

    if not targets:
        print("No HTML files found to check.", file=sys.stderr)
        sys.exit(1)

    overall_ok = True
    for path in targets:
        print(f"\n{path}")
        ok = check_file(path)
        overall_ok = overall_ok and ok

    print()
    if overall_ok:
        print("All inline scripts parse cleanly.")
        sys.exit(0)
    else:
        print("One or more files have syntax errors -- see \u274c lines above for exact locations.")
        sys.exit(1)


if __name__ == '__main__':
    main()