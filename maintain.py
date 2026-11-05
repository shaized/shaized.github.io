"""Build the public search index and synchronize shared navigation. Standard library only."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,argparse
ROOT=Path(__file__).resolve().parent
class Content(HTMLParser):
 def __init__(self,text):
  super().__init__();self.title='';self.description='';self.words=[];self.in_title=False;self.in_main=False;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='title':self.in_title=True
  if tag=='main':self.in_main=True
  if tag=='meta' and a.get('name')=='description':self.description=a.get('content','')
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
  if tag=='main':self.in_main=False
 def handle_data(self,data):
  if self.in_title:self.title+=data
  if self.in_main:self.words.append(data.strip())
def category(name):
 if name.startswith('agent-'):return 'AI capabilities'
 if name.startswith('insight-'):return 'Fieldnotes'
 if name in ['learning.html','playbooks.html','glossary.html','resources.html']:return 'Learning & practice'
 if name in ['security.html','privacy.html','editorial.html','accessibility.html']:return 'Trust & transparency'
 return 'Explore'
def index():
 files=sorted(ROOT.glob('*.html'),key=lambda p:(p.name not in ['index.html','agents.html','news.html'],p.name))
 data=[]
 for p in files:
  c=Content(p.read_text());data.append({'url':p.name,'title':c.title.split(' — Shai Zaidenberg')[0],'description':c.description,'category':category(p.name),'keywords':' '.join(c.words)[:4500]})
 (ROOT/'site-index.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(f'Indexed {len(data)} pages')
def header():
 template=(ROOT/'header-template.txt').read_text()
 for p in ROOT.glob('*.html'):
  h=template
  for link in ['index.html','agents.html','news.html','insights.html','playbooks.html']:
   if p.name==link or (link=='agents.html' and p.name.startswith('agent-')) or (link=='insights.html' and p.name.startswith('insight-')):
    h=h.replace(f'<a href="{link}">',f'<a href="{link}" aria-current="page">')
  if p.name=='404.html':h=re.sub(r'href="(?!https?:|mailto:|/|#)([^"]+)"',r'href="/\1"',h)
  s=p.read_text();s=re.sub(r'<header.*?</header>',lambda _:h,s,count=1,flags=re.S);p.write_text(s)
 print('Synchronized shared header')
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--header',action='store_true',help='Apply header-template.txt to every page before rebuilding the index');args=parser.parse_args()
 if args.header:header()
 index()
