from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,zipfile
root=Path(__file__).resolve().parent
class Page(HTMLParser):
 def __init__(self,text):super().__init__();self.ids=[];self.refs=[];self.tags=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);self.tags.append((tag,a))
  if 'id'in a:self.ids.append(a['id'])
  for k in ('href','src','poster'):
   if k in a:self.refs.append(a[k])
pages={f.name:Page(f.read_text()) for f in root.glob('*.html')}
for name,page in pages.items():
 assert len(page.ids)==len(set(page.ids)),(name,'duplicate IDs')
 assert sum(t=='h1' for t,a in page.tags)==1,(name,'h1')
 assert sum(t=='main' for t,a in page.tags)==1
 assert 'access-panel' in page.ids
 for tag,a in page.tags:
  if tag=='img':assert 'alt'in a,(name,a)
  if tag=='video':assert 'controls'in a and 'autoplay'not in a
  if tag=='script':assert a.get('src') and not a['src'].startswith('http')
  if tag=='input':assert a.get('id') and any(t=='label'and b.get('for')==a['id'] for t,b in page.tags) or a.get('type')=='checkbox',(name,a)
  assert not any(k.startswith('on')for k in a),(name,'inline handler')
 for ref in page.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc:continue
  path=unquote(u.path);target=('index.html'if path in('./','/')else path.removeprefix('./').lstrip('/'))if path else name
  assert(root/target).is_file(),(name,ref)
  if u.fragment and target in pages:assert u.fragment in pages[target].ids,(name,ref)
assert len(list(root.glob('agent-*.html')))==8
for f in root.glob('agent-*.html'):
 s=f.read_text();assert s.count('class="demo-stage"')==4
 assert 'Fictional demonstration' in s
 assert not re.search(r'Arya|Varys|Davos|Hodor|Pocketful|Cora-Tuning',s)
data=json.loads((root/'kev-catalog.json').read_text());assert data['count']==len(data['vulnerabilities']);assert len({v['cveID']for v in data['vulnerabilities']})==data['count']
def lum(h):
 v=[int(h[i:i+2],16)/255 for i in(1,3,5)];v=[x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4 for x in v];return sum(x*y for x,y in zip(v,(.2126,.7152,.0722)))
def ratio(a,b):x,y=sorted([lum(a),lum(b)]);return(y+.05)/(x+.05)
cs=[]
for label,a,b in [('dark text','#eef3fc','#080c14'),('dark secondary','#a9b7cc','#111925'),('dark accent','#92b5ff','#172232'),('light text','#101c30','#f5f7fb'),('light secondary','#53637a','#fffFFF'),('light accent','#244fb3','#eaf0fa'),('primary button','#ffffff','#285bd6')]:
 r=ratio(a,b);assert r>=4.5,(label,r);cs.append(f'{label}: {r:.2f}:1')
report=f'Static verification PASS: {len(pages)} pages; links, anchors, unique IDs, landmarks, media controls, eight fictional demos with four steps each.\nCatalog: {data["count"]} entries, release {data["dateReleased"]}.\nContrast:\n'+'\n'.join(cs)

print(report)

# Coverage and navigation contracts.
index=json.loads((root/'site-index.json').read_text())
assert {x['url'] for x in index}==set(pages), 'Search index is stale'
assert set(pages)<=set(urlsplit(r).path.lstrip('/') for r in pages['index.html'].refs), 'Homepage does not link to every page'
for name,page in pages.items():
 assert 'site-search-dialog' in page.ids and 'site-search-toggle' in page.ids
 if name!='index.html':assert any('data-site-back' in a for t,a in page.tags),name
for css in root.glob('*.css'):
 for ref in re.findall(r'url\([\"\']?([^\)\"\']+)',css.read_text()):
  if not ref.startswith(('data:','https:')):assert(root/ref).is_file(),(css.name,ref)
print('PASS: complete homepage coverage, search index, inner-page back links, and local CSS assets.')
