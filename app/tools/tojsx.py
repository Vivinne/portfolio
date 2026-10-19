"""Convert the browser-parsed legacy DOM (dom.json) into JSX modules for the React app.
Text and attribute values are emitted exactly; formatting whitespace added for readability is
ignored by JSX because every whitespace-bearing text node is written as an explicit {"..."} expression."""
import json, re, os, sys
OUT = sys.argv[1]
tree = json.load(open('dom.json'))

def find(n, pred):
    if 't' not in n: return None
    if pred(n): return n
    for c in n['c']:
        r = find(c, pred)
        if r: return r
    return None
def attr(n, k):
    for a, v in n['a']:
        if a == k: return v
    return None
byid = lambda i: (lambda n: attr(n, 'id') == i)

RENAME = {'class': 'className', 'tabindex': 'tabIndex', 'fetchpriority': 'fetchPriority',
          'stroke-width': 'strokeWidth', 'for': 'htmlFor'}
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr'}
SAFE_TEXT = re.compile(r'^[^\s{}<>&"\'\\`][^{}<>&\\`\n]*(?<!\s)$')

def js(s): return json.dumps(s, ensure_ascii=False)
def camel(p):
    if p.startswith('--'): return p
    if p.startswith('-'): p = p[1:]; parts = p.split('-'); return parts[0].capitalize() + ''.join(x.capitalize() for x in parts[1:])
    parts = p.split('-'); return parts[0] + ''.join(x.capitalize() for x in parts[1:])
def style_obj(s):
    items = []
    for decl in [d for d in s.split(';') if d.strip()]:
        k, v = decl.split(':', 1)
        items.append('%s: %s' % (js(camel(k.strip())), js(v.strip())))
    return '{{' + ', '.join(items) + '}}'
def attr_jsx(k, v):
    if k == 'style': return 'style=' + style_obj(v)
    name = RENAME.get(k, k)
    if k in ('hidden',): return name
    if k in ('width', 'height') and re.fullmatch(r'\d+', v): return '%s={%s}' % (name, v)
    if re.search(r'[&"\\{}]', v) or '\n' in v: return '%s={%s}' % (name, js(v))
    return '%s="%s"' % (name, v)

stats = {'img': 0, 'lazy': 0}
def emit(n, d):
    pad = '  ' * d
    if 'x' in n:
        t = n['x']
        if SAFE_TEXT.match(t): return [pad + t]
        return [pad + '{' + js(t) + '}']
    tag = n['t']; a = [(k, v) for k, v in n['a']]
    if tag == 'img':
        stats['img'] += 1
        names = [k for k, _ in a]
        if attr(n, 'data-src') is not None:
            assert set(names) <= {'data-src', 'width', 'height', 'alt', 'decoding', 'style'}, names
            stats['lazy'] += 1
            parts = ['src=' + js(attr(n, 'data-src')), 'width={%s}' % attr(n, 'width'), 'height={%s}' % attr(n, 'height'),
                     'alt=' + js(attr(n, 'alt'))]
            bg = attr(n, 'style')
            m = re.fullmatch(r'background:(#[0-9a-f]{6})', bg or '')
            assert m, bg
            parts.append('bg="%s"' % m.group(1))
            return [pad + '<Img ' + ' '.join(parts) + ' />']
        return [pad + '<img ' + ' '.join(attr_jsx(k, v) for k, v in a) + ' draggable={false} />']
    if tag == 'button' and attr(n, 'id') == 'mail-copy':
        return [pad + '<MailCopy />']
    if tag == 'details':
        a = [(k, v) for k, v in a if k != 'open']          # open/closed is set from the screen width (see useTocFold)
    head = '<' + tag + ''.join(' ' + attr_jsx(k, v) for k, v in a)
    if tag in VOID or not n['c']: return [pad + head + ' />']
    lines = [pad + head + '>']
    for c in n['c']: lines += emit(c, d + 1)
    lines.append(pad + '</' + tag + '>')
    return lines

def module(name, nodes, imports, header):
    body = []
    for c in nodes: body += emit(c, 3)
    src = header + '\n' + imports + '\n\nexport default function %s() {\n  return (\n    <>\n%s\n    </>\n  );\n}\n' % (os.path.basename(name), '\n'.join(body))
    open(os.path.join(OUT, name + '.jsx'), 'w', encoding='utf8').write(src)
    return len(src)

HDR = '/* Generated from the published page by app/tools/tojsx.py, then kept as source. Text is the original copy; do not edit wording here without the owner\'s review. */'
os.makedirs(OUT + '/works', exist_ok=True)
about = find(tree, byid('panel-about'))
print('About', module('About', about['c'], "import Img from './Img.jsx';\nimport MailCopy from './MailCopy.jsx';", HDR))
windex = find(tree, lambda n: attr(n, 'class') == 'windex')
print('WorksIndex', module('WorksIndex', [windex], "import Img from './Img.jsx';", HDR))
for i in range(1, 8):
    w = find(tree, byid('panel-w0%d' % i))
    print('W0%d' % i, module('works/W0%d' % i, w['c'], "import Img from '../Img.jsx';", HDR))
# work tab data
tabs = []
for i in range(1, 8):
    t = find(tree, byid('tab-w0%d' % i))
    st = attr(t, 'style')
    en = find(t, lambda n: attr(n, 'class') == 't-en')['c'][0]['x']
    zh = find(t, lambda n: attr(n, 'class') == 't-zh')['c'][0]['x']
    num = find(t, lambda n: attr(n, 'class') == 'cnum mono')['c'][0]['x']
    m = re.fullmatch(r'--bg:(var\(--c\d\d\));--fg:(var\(--c\d\d-fg\))', st); assert m, st
    tabs.append({'id': 'w0%d' % i, 'num': num, 'bg': m.group(1), 'fg': m.group(2), 'en': en, 'zh': zh})
open(os.path.join(OUT, 'worksData.js'), 'w', encoding='utf8').write(
    '/* Work tab strip: number, colour and title of each work (same text as the work pages). */\nexport const WORKS = ' + json.dumps(tabs, ensure_ascii=False, indent=2) + ';\n')
print(stats)
