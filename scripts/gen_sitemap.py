import os, datetime

today = datetime.date.today().isoformat()
base = "https://gamezipper.com"

# Collect all game pages
games = []
for d in sorted(os.listdir('.')):
    if os.path.isdir(d) and os.path.exists(f'{d}/index.html'):
        if d in ('node_modules','dist','audio','ad-experiments','scripts','test-results','template-phaser3','og-images','.git'):
            continue
        games.append(d)

# Static pages
pages = [
    ('/', '1.0', 'daily'),
    ('/sitemap.html', '0.9', 'daily'),
]
# Category pages
for cat in ['arcade-games','card-games','idle-games','puzzle-games','simulation-games','word-typing-games']:
    pages.append((f'/{cat}.html', '0.9', 'weekly'))
# Blog pages
blog_dir = 'blog'
if os.path.isdir(blog_dir):
    for f in sorted(os.listdir(blog_dir)):
        if f.endswith('.html'):
            pages.append((f'/blog/{f}', '0.9', 'weekly'))
# Game pages
for g in games:
    pages.append((f'/{g}/', '0.8', 'weekly'))

xml = ['<?xml version="1.0" encoding="UTF-8"?>']
xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
for loc, priority, freq in pages:
    xml.append(f'  <url>')
    xml.append(f'    <loc>{base}{loc}</loc>')
    xml.append(f'    <lastmod>{today}</lastmod>')
    xml.append(f'    <changefreq>{freq}</changefreq>')
    xml.append(f'    <priority>{priority}</priority>')
    xml.append(f'  </url>')
xml.append('</urlset>')

with open('sitemap.xml', 'w') as f:
    f.write('\n'.join(xml))

print(f"Generated sitemap with {len(pages)} URLs")
