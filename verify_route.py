import os

# Define a quick fix for the backend route if it's missing
route_code = """
@app.route('/api/audit', methods=['POST'])
def audit_proxy():
    data = request.json
    query = data.get('query', '')
    # This calls your auditops logic locally
    output = os.popen(f"auditops {query}").read()
    return jsonify({"output": output})
"""
print("Ensure your backend app file contains the /api/audit route logic.")
