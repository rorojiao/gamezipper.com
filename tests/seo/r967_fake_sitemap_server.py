import http.server, socketserver, threading, sys, os

# BROKEN sitemap: 300 URLs, ZERO lastmod  -> the exact R9357-style regression
def good_sitemap(n, lastmod=True):
    out=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for i in range(n):
        out.append(f'  <url>\n    <loc>https://x.test/p{i}/</loc>')
        if lastmod: out.append(f'    <lastmod>2026-10-19</lastmod>')
        out.append('  </url>')
    out.append('</urlset>')
    return "\n".join(out)

MODE = sys.argv[1]
PORT = int(sys.argv[2])

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def do_GET(self):
        if self.path=='/sitemap.xml':
            if MODE=='nolastmod':   body=good_sitemap(300, lastmod=False)   # 0% lastmod coverage
            elif MODE=='truncated': body=good_sitemap(5, lastmod=True)     # 5 URLs (gutted)
            elif MODE=='dupes':
                s=good_sitemap(300, lastmod=True).replace('<loc>https://x.test/p299/</loc>','<loc>https://x.test/p0/</loc>')
                body=s
            else:                   body=good_sitemap(300, lastmod=True)
            b=body.encode()
        elif self.path=='/robots.txt': b=b"User-agent: *\nAllow: /\n"
        elif self.path=='/indexnowkey.txt': b=b"testkey\n"
        else: b=b"<html><head><title>ok</title></head><body>ok</body></html>"
        self.send_response(200); self.send_header('Content-Type','text/plain')
        self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)

socketserver.TCPServer.allow_reuse_address=True
httpd=socketserver.TCPServer(("127.0.0.1",PORT),H)
threading.Thread(target=httpd.serve_forever,daemon=True).start()
print("serving",MODE,PORT,flush=True)
import time; time.sleep(120)
