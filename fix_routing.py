file_path = 'index.html'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the window.location redirect logic with a TSM_UI call
old_logic = 'onclick="go(TARGET_08)"'
new_logic = 'onclick="tsmInstance.runAudit(this.dataset.sector, this.dataset.module)"'
updated_content = content.replace(old_logic, new_logic)

with open(file_path, 'w') as f:
    f.write(updated_content)
