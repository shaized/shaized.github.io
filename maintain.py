"""Build the public search index and synchronize shared navigation. Standard library only."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,argparse
from collections import Counter
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
 if name in ['learning.html','playbooks.html','glossary.html','resources.html','tools.html','blueprints.html']:return 'Learning & practice'
 if name in ['security.html','privacy.html','editorial.html','accessibility.html']:return 'Trust & transparency'
 return 'Explore'
def index():
 files=sorted(ROOT.glob('*.html'),key=lambda p:(p.name not in ['index.html','agents.html','news.html'],p.name))
 data=[]
 for p in files:
  c=Content(p.read_text());data.append({'url':p.name,'title':c.title.split(' — Shai Zaidenberg')[0],'description':c.description,'category':category(p.name),'keywords':' '.join(c.words)[:4500]})
 (ROOT/'site-index.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(f'Indexed {len(data)} pages')
def kev_summary():
 """Small, derived view of kev-catalog.json for the homepage. Counts only; no invented figures."""
 data=json.loads((ROOT/'kev-catalog.json').read_text());items=data['vulnerabilities'];released=data['dateReleased'][:10]
 year,month=int(released[:4]),int(released[5:7]);months=[]
 for _ in range(12):
  months.append(f'{year:04d}-{month:02d}');month-=1
  if month==0:year,month=year-1,12
 months.reverse();per_month=Counter(v['dateAdded'][:7] for v in items)
 def days_before(n):
  from datetime import date,timedelta
  return (date.fromisoformat(released)-timedelta(days=n)).isoformat()
 latest=sorted(items,key=lambda v:(v['dateAdded'],v['cveID']),reverse=True)[:6]
 summary={'dateReleased':data['dateReleased'],'catalogVersion':data['catalogVersion'],'count':data['count'],
  'ransomware':sum(v['knownRansomwareCampaignUse']=='Known' for v in items),
  'added30':sum(v['dateAdded']>days_before(30) for v in items),'added90':sum(v['dateAdded']>days_before(90) for v in items),
  'vendorCount':len({v['vendorProject'] for v in items}),
  'vendors':[{'name':n,'count':c} for n,c in sorted(Counter(v['vendorProject'] for v in items).items(),key=lambda x:(-x[1],x[0]))[:8]],
  'months':[{'month':m,'count':per_month.get(m,0)} for m in months],
  'latest':[{'cveID':v['cveID'],'vendor':v['vendorProject'],'product':v['product'],'name':v['vulnerabilityName'],'dateAdded':v['dateAdded'],'ransomware':v['knownRansomwareCampaignUse']=='Known'} for v in latest]}
 (ROOT/'kev-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=1)+'\n');print(f"Summarized {summary['count']} catalog entries")
def header():
 template=(ROOT/'header-template.txt').read_text();footer=(ROOT/'footer-template.txt').read_text().strip()
 for p in ROOT.glob('*.html'):
  h=template
  for link in ['index.html','agents.html','news.html','insights.html','playbooks.html','tools.html','blueprints.html']:
   if p.name==link or (link=='agents.html' and p.name.startswith('agent-')) or (link=='insights.html' and p.name.startswith('insight-')):
    h=h.replace(f'<a href="{link}">',f'<a href="{link}" aria-current="page">')
  f=footer
  if p.name=='404.html':h,f=[re.sub(r'href="(?!https?:|mailto:|/|#)([^"]+)"',r'href="/\1"',x) for x in (h,f)]
  s=p.read_text();s=re.sub(r'<header.*?</header>',lambda _:h,s,count=1,flags=re.S);s=re.sub(r'<footer.*?</footer>',lambda _:f,s,count=1,flags=re.S);p.write_text(s)
 print('Synchronized shared header and footer')
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--header',action='store_true',help='Apply header-template.txt and footer-template.txt to every page before rebuilding the index');args=parser.parse_args()
 if args.header:header()
 index();kev_summary()
