import json, re
from playwright.sync_api import sync_playwright
import sys
# usage: python3 dumpdom.py <old static index.html>  -> dom.json (then: python3 tojsx.py <out dir>)
s=open(sys.argv[1],encoding='utf8').read()
s=re.sub(r'<script>.*?</script>','',s,flags=re.S)
SER="""()=>{function ser(n){ if(n.nodeType===3) return {x:n.data}; if(n.nodeType!==1) return null;
  const o={t:n.localName,a:n.getAttributeNames().map(k=>[k,n.getAttribute(k)]),c:[]};
  for(const ch of n.childNodes){const r=ser(ch); if(r) o.c.push(r);} return o;}
  return ser(document.getElementById('app'));}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    pg.route('**/*', lambda r: r.abort())
    pg.set_content(s, wait_until='domcontentloaded')
    tree=pg.evaluate(SER)
    b.close()
json.dump(tree,open('dom.json','w'),ensure_ascii=False)
# inventory
attrs={}; tags={}
def walk(n):
    if 't' not in n: return
    tags[n['t']]=tags.get(n['t'],0)+1
    for k,v in n['a']: attrs[k]=attrs.get(k,0)+1
    for c in n['c']: walk(c)
walk(tree)
print(sorted(tags.items(),key=lambda x:-x[1]))
print(sorted(attrs.items(),key=lambda x:-x[1]))
