"""Refresh kev-catalog.json from CISA's official public mirror. Standard library only.

The download replaces the bundled snapshot only when it is well formed, newer than the
current file, and not suspiciously smaller. Exit code 0 means "nothing to do" or "updated".
"""
from pathlib import Path
from urllib.request import Request,urlopen
import json,re,sys
ROOT=Path(__file__).resolve().parent
SOURCE='https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json'
DATE=re.compile(r'^\d{4}-\d{2}-\d{2}$');CVE=re.compile(r'^CVE-\d{4}-\d{4,}$')
TEXT_FIELDS=('vendorProject','product','vulnerabilityName','shortDescription','requiredAction','knownRansomwareCampaignUse')
def validate(data):
 items=data.get('vulnerabilities') if isinstance(data,dict) else None
 if not isinstance(items,list) or not 0<len(items)<=15000 or data.get('count')!=len(items):raise ValueError('unexpected catalog structure')
 if not isinstance(data.get('dateReleased'),str) or not re.match(r'^\d{4}-\d{2}-\d{2}T',data['dateReleased']):raise ValueError('missing release date')
 seen=set()
 for v in items:
  if not isinstance(v,dict) or not isinstance(v.get('cveID'),str) or not CVE.match(v['cveID']) or v['cveID'] in seen:raise ValueError('unexpected or duplicate CVE ID')
  if not all(isinstance(v.get(k),str) for k in TEXT_FIELDS) or not all(isinstance(v.get(k),str) and DATE.match(v[k]) for k in ('dateAdded','dueDate')):raise ValueError(f"unexpected record {v['cveID']}")
  seen.add(v['cveID'])
 return data
def main():
 target=ROOT/'kev-catalog.json';current=validate(json.loads(target.read_text()))
 with urlopen(Request(SOURCE,headers={'User-Agent':'kev-snapshot-refresh'}),timeout=60) as response:
  if response.status!=200:raise ValueError(f'HTTP {response.status}')
  raw=response.read(30_000_000)
 fresh=validate(json.loads(raw.decode('utf-8')))
 if fresh['dateReleased']<=current['dateReleased']:print(f"No newer release (bundled {current['dateReleased']}, mirror {fresh['dateReleased']}).");return 0
 if fresh['count']<current['count']*0.95:raise ValueError(f"mirror has {fresh['count']} entries, bundled has {current['count']}: refusing a large drop")
 target.write_bytes(raw);print(f"Updated: {current['count']} -> {fresh['count']} entries, release {fresh['dateReleased']}.");return 0
if __name__=='__main__':
 try:sys.exit(main())
 except Exception as error:print(f'Refresh failed, snapshot unchanged: {error}',file=sys.stderr);sys.exit(1)
