#!/usr/bin/env python3
"""Deploy the Token Tycoon static game to Vercel (production)."""
import base64
import json
import os
import sys
import urllib.request
import urllib.error

sys.path.insert(0, "/opt/hatch/skills/skill-creator/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

BASE = "https://api.vercel.com"
ALLOWED = ("api.vercel.com",)
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # play/
FILES = ["index.html", "game.js", "nemotron.js", "vendor/phaser.min.js"]


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    add_surrogate_to_request(req, "custom.vercel", entry_name="access_token", allowed_hosts=ALLOWED)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return read_json_response(resp)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} on {method} {path}: {e.read().decode(errors='replace')[:500]}", file=sys.stderr)
        raise SystemExit(1)


# 1. ensure project exists
proj = None
try:
    proj = call("GET", "/v9/projects/token-tycoon")
    print("project exists:", proj["id"])
except SystemExit:
    proj = call("POST", "/v9/projects", {"name": "token-tycoon", "framework": None})
    print("project created:", proj["id"])

# 2. deploy files
payload_files = []
for f in FILES:
    with open(os.path.join(HERE, f), "rb") as fh:
        payload_files.append({
            "file": f,
            "data": base64.b64encode(fh.read()).decode(),
            "encoding": "base64",
        })
dep = call("POST", "/v13/deployments", {
    "name": "token-tycoon",
    "project": "token-tycoon",
    "target": "production",
    "files": payload_files,
})
print("DEPLOY_URL=https://" + dep["url"])
print("STATUS=" + dep.get("readyState", "?"))
print("ID=" + dep.get("id", "?"))
