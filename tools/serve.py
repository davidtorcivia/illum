"""Serve the repo on the LAN for the playground: python3 tools/serve.py [port]

Like `python3 -m http.server`, but every response says Cache-Control: no-cache, so a browser revalidates each module
on every load. (Without it a browser may keep an old module from its cache beside a new one that imports it; the page
then breaks in ways that look like a bug in the code.)"""
import http.server, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

http.server.ThreadingHTTPServer(('0.0.0.0', int(sys.argv[1]) if len(sys.argv) > 1 else 8000), NoCache).serve_forever()
