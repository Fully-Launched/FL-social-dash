#!/usr/bin/env python3
"""Local preview of dashboards/dist with the same redirects/rewrites as vercel.json.
/supabase/config.js is served from the repo's gitignored supabase/config.js."""
import http.server, re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DIST = REPO / "dashboards" / "dist"
CONFIG = REPO / "supabase" / "config.js"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(DIST), **kw)

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path == "/":
            self.send_response(307); self.send_header("Location", "/operator/dashboard.html"); self.end_headers(); return
        if path == "/supabase/config.js":
            body = CONFIG.read_bytes()
            self.send_response(200); self.send_header("Content-Type", "application/javascript")
            self.send_header("Cache-Control", "no-store"); self.send_header("Content-Length", str(len(body)))
            self.end_headers(); self.wfile.write(body); return
        if re.fullmatch(r"/clients/[^/]+(/portal\.html)?/?", path) and path != "/clients/portal.html":
            self.path = "/clients/portal.html"
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
