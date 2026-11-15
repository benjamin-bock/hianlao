#!/usr/bin/env python3
"""Static dev server with a small /api mock so offline development
doesn't spam the console with 404s from the optional backend probes.

Serves the repo like `python3 -m http.server`, but answers:
  GET /api/health       -> {"ok":true, kv:false, tts:false, ...}
  GET /api/leaderboard  -> {"ok":true, kv:false, entries:[]}

Usage: python3 scripts/dev-server.py [port]  (default 8000)
"""
import json
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

API_MOCKS = {
    '/api/health': {'ok': True, 'kv': False, 'tts': False, 'service': 'hianlao-dev'},
    '/api/leaderboard': {'ok': True, 'kv': False, 'entries': []},
    '/api/auth/me': {'ok': False},
}


class DevHandler(SimpleHTTPRequestHandler):
    # Always revalidate: editing JS/CSS mid-session must show up on reload.
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def send_json(self, payload):
        body = json.dumps(payload).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path.startswith('/api/'):
            return self.send_json(API_MOCKS.get(path, {'ok': False, 'error': 'dev-mock: not implemented'}))
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            return self.send_json({'ok': False, 'error': 'dev-mock: backend not available in offline dev'})
        self.send_error(404)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f'HianLao dev server (with /api mock) on http://127.0.0.1:{port}')
    HTTPServer(('127.0.0.1', port), DevHandler).serve_forever()
