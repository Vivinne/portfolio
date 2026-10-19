import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import About from './About.jsx';
import WorksIndex from './WorksIndex.jsx';
import Lightbox from './Lightbox.jsx';
import { WORKS } from './worksData.js';

/* Two top tabs (About me / Works); Works opens on the card index and holds one tab per work.
   Each work is its own code chunk, fetched the first time that work is opened (or prefetched when
   the pointer or focus reaches a link to it). Hash routing: #about, #works, #w01 ... #w07. */

const LOADERS = {
  w01: () => import('./works/W01.jsx'),
  w02: () => import('./works/W02.jsx'),
  w03: () => import('./works/W03.jsx'),
  w04: () => import('./works/W04.jsx'),
  w05: () => import('./works/W05.jsx'),
  w06: () => import('./works/W06.jsx'),
  w07: () => import('./works/W07.jsx'),
};
const WORK_VIEWS = Object.fromEntries(Object.entries(LOADERS).map(([id, load]) => [id, lazy(load)]));
const prefetched = new Set();
function prefetch(id) {
  if (!LOADERS[id] || prefetched.has(id)) return;
  prefetched.add(id);
  LOADERS[id]().catch(() => prefetched.delete(id));
}

const phone = window.matchMedia('(max-width: 760px)');
const darkPref = window.matchMedia('(prefers-color-scheme: dark)');

function readLang() {
  try { return localStorage.getItem('vivinne-lang') === 'zh' ? 'zh' : 'en'; } catch (e) { return 'en'; }
}
function setHash(id) {
  try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignore */ }
}
/* where a hash leads; fields left out keep their current value */
function route(hash) {
  const h = (hash || '').replace('#', '');
  if (/^w0[1-7]$/.test(h)) return { top: 'works', wstate: 'work', cur: h, fx: { kind: 'work', id: h, focus: false, user: false, t: Date.now() } };
  if (h === 'works') return { top: 'works', wstate: 'index', fx: null };
  return { top: 'about', fx: null };                                    // default entry: About me
}

/* Contents lists inside a work: folded on phones, open on wider screens */
function foldToc(root) {
  (root || document).querySelectorAll('.tocd').forEach((d) => {
    if (phone.matches) d.removeAttribute('open'); else d.setAttribute('open', '');
  });
}
function TocFold({ panelId }) {
  useLayoutEffect(() => { foldToc(document.getElementById(panelId)); }, [panelId]);
  return null;
}

function arrowTarget(e, i, n) {
  if (e.key === 'ArrowRight') return (i + 1) % n;
  if (e.key === 'ArrowLeft') return (i - 1 + n) % n;
  if (e.key === 'Home') return 0;
  if (e.key === 'End') return n - 1;
  return -1;
}

const TOPS = [
  { id: 'about', en: 'About me', zh: '關於我' },
  { id: 'works', en: 'Works', zh: '作品' },
];

export default function App() {
  const [lang, setLang] = useState(readLang);
  const [nav, setNav] = useState(() => ({ top: 'about', wstate: 'work', cur: 'w01', fx: null, ...route(location.hash) }));
  const opened = useRef(new Set());
  const lb = useRef(null);
  const headerRef = useRef(null), stripRef = useRef(null), listRef = useRef(null);

  const workOpen = nav.top === 'works' && nav.wstate === 'work';
  if (workOpen) opened.current.add(nav.cur);

  useEffect(() => { try { localStorage.setItem('vivinne-lang', lang); } catch (e) { /* ignore */ } }, [lang]);

  useEffect(() => {
    const onHash = () => setNav((n) => ({ ...n, ...route(location.hash) }));
    window.addEventListener('hashchange', onHash);
    const onMq = () => foldToc();
    if (phone.addEventListener) phone.addEventListener('change', onMq);
    return () => {
      window.removeEventListener('hashchange', onHash);
      if (phone.removeEventListener) phone.removeEventListener('change', onMq);
    };
  }, []);

  function selectTop(id, focus, user) {
    setNav((n) => ({ ...n, top: id, wstate: user && id === 'works' ? 'index' : n.wstate, fx: { kind: 'top', id, focus, user, t: Date.now() } }));
  }
  function selectWork(id, focus, user) {
    setNav((n) => ({ ...n, wstate: 'work', cur: id, fx: { kind: 'work', id, focus, user, t: Date.now() } }));
  }

  /* side effects of a tab change: focus, hash, scrolling */
  useLayoutEffect(() => {
    const fx = nav.fx;
    if (!fx) return;
    const tab = document.getElementById('tab-' + fx.id);
    if (fx.kind === 'top') {
      if (fx.focus && tab) tab.focus();
      if (fx.user) { setHash(fx.id); window.scrollTo(0, 0); }
      return;
    }
    const list = listRef.current;
    if (tab && list.scrollWidth > list.clientWidth) {         // narrow screens: the strip scrolls sideways
      const l = tab.offsetLeft, r = l + tab.offsetWidth;
      if (l < list.scrollLeft) list.scrollLeft = l;
      else if (r > list.scrollLeft + list.clientWidth) list.scrollLeft = r - list.clientWidth;
    }
    if (fx.focus && tab) tab.focus();
    if (fx.user) {
      setHash(fx.id);
      /* if the page is scrolled past the works strip, bring it (and the new work under it) back into view */
      const top = stripRef.current.getBoundingClientRect().top - headerRef.current.offsetHeight;
      if (top < 0) window.scrollTo(0, window.pageYOffset + top);
    }
  }, [nav.fx]);

  /* clicks on content generated from the original page are handled here (data-open / data-goto / data-scroll / .zoom) */
  function onClick(e) {
    const t = e.target;
    if (!t.closest) return;
    const open = t.closest('[data-open="works"]');
    if (open) selectTop('works', false, true);
    else {
      const go = t.closest('[data-goto]');
      if (go) selectWork(go.getAttribute('data-goto'), false, true);
    }
    const sc = t.closest('[data-scroll]');
    if (sc) {
      const target = document.getElementById(sc.getAttribute('data-scroll'));
      if (target) target.scrollIntoView({ block: 'start' });
    }
    if (t.closest('.tocd > summary') && !phone.matches) e.preventDefault();
    const z = t.closest('.zoom');
    if (z) { lb.current.open(z); return; }
    lb.current.click(e);
  }
  function onPointerOver(e) {
    const go = e.target.closest && e.target.closest('[data-goto]');
    if (go) prefetch(go.getAttribute('data-goto'));
  }
  function noSave(e) {                                          // deterrent only: no right-click save or drag-out of images
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  }
  function toggleTheme() {
    const root = document.documentElement;
    const t = root.getAttribute('data-theme');
    const next = (t ? t === 'dark' : darkPref.matches) ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('vivinne-theme', next); } catch (e) { /* ignore */ }
  }

  /* drafts strip: work 01's Chinese is the author's original; works 02-06 only partly drafts (view names kept from the original page) */
  const view = nav.top === 'works' && nav.wstate !== 'index'
    ? (nav.cur === 'w01' ? 'w07' : (/^w0[2-6]$/.test(nav.cur) ? 'w15' : ''))
    : '';

  return (
    <div id="app" data-lang={lang} data-view={view} onClick={onClick} onPointerOver={onPointerOver} onFocus={onPointerOver}
      onContextMenu={noSave} onDragStart={noSave}>
      <header className="top" id="top" ref={headerRef}><div className="wrap topin">
        <a className="brand" id="brand" href="#about" onClick={(e) => { e.preventDefault(); selectTop('about', false, true); }}>Vivinne</a>
        <div className="nav" role="tablist" aria-label="Sections">
          {TOPS.map((tp, i) => {
            const on = nav.top === tp.id;
            return (
              <button key={tp.id} type="button" role="tab" id={'tab-' + tp.id} aria-selected={on ? 'true' : 'false'} aria-controls={'panel-' + tp.id}
                tabIndex={on ? 0 : -1} onClick={() => selectTop(tp.id, false, true)}
                onKeyDown={(e) => { const k = arrowTarget(e, i, TOPS.length); if (k >= 0) { e.preventDefault(); selectTop(TOPS[k].id, true, true); } }}>
                <span className="t-en" lang="en">{tp.en}</span><span className="t-zh" lang="zh-Hant">{tp.zh}</span>
              </button>
            );
          })}
        </div>
        <div className="lang" role="group" aria-label="Language">
          <button type="button" data-set="en" aria-pressed={lang === 'en' ? 'true' : 'false'} onClick={() => setLang('en')}>EN</button>
          <span aria-hidden="true">/</span>
          <button type="button" data-set="zh" aria-pressed={lang === 'zh' ? 'true' : 'false'} onClick={() => setLang('zh')}>中文</button>
        </div>
        <button type="button" className="theme" id="theme" aria-label="Toggle light / dark theme" onClick={toggleTheme}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></svg>
        </button>
      </div></header>
      <p className="draft draft--all mono t-zh" lang="zh-Hant"><span className="wrap">中文版為待審譯稿，審查通過前不視為定稿。</span></p>
      <p className="draft draft--15 mono t-zh" lang="zh-Hant"><span className="wrap">標題、概述與設計概念的中文為待審譯稿；各節內文為作者原文（圖說依簡報標示整理）。</span></p>
      <main>
        <div id="panel-about" className="sec" role="tabpanel" aria-labelledby="tab-about" tabIndex={0} hidden={nav.top !== 'about'}>
          <About />
        </div>
        <div id="panel-works" className="sec" data-wstate={nav.wstate} role="tabpanel" aria-labelledby="tab-works" tabIndex={0} hidden={nav.top !== 'works'}>
          <WorksIndex />
          <div className="wtabs" ref={stripRef}><div className="wrap"><div className="wtabs-in" role="tablist" aria-label="Works" ref={listRef}>
            {WORKS.map((w, i) => {
              const on = nav.cur === w.id;
              return (
                <button key={w.id} type="button" role="tab" id={'tab-' + w.id} className="wtab" style={{ '--bg': w.bg, '--fg': w.fg }}
                  aria-selected={on ? 'true' : 'false'} aria-controls={'panel-' + w.id} tabIndex={on ? 0 : -1}
                  onClick={() => selectWork(w.id, false, true)}
                  onKeyDown={(e) => { const k = arrowTarget(e, i, WORKS.length); if (k >= 0) { e.preventDefault(); selectWork(WORKS[k].id, true, true); } }}>
                  <span className="cnum mono">{w.num}</span><span className="ctitle"><span className="t-en" lang="en">{w.en}</span><span className="t-zh" lang="zh-Hant">{w.zh}</span></span>
                </button>
              );
            })}
          </div></div></div>
          {WORKS.map((w) => {
            const View = WORK_VIEWS[w.id];
            return (
              <div key={w.id} id={'panel-' + w.id} className="work" role="tabpanel" aria-labelledby={'tab-' + w.id} tabIndex={0} hidden={nav.cur !== w.id}>
                {opened.current.has(w.id) && (
                  <Suspense fallback={null}>
                    <View />
                    <TocFold panelId={'panel-' + w.id} />
                  </Suspense>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <footer className="end"><div className="wrap endin">
        <span className="brand">Vivinne</span>
        <a className="end-mail mono" href="mailto:threeelegrace@gmail.com">threeelegrace@gmail.com</a>
        <button type="button" id="to-top" className="mono" onClick={() => window.scrollTo(0, 0)}><span className="t-en" lang="en">Top</span><span className="t-zh" lang="zh-Hant">回到頂端</span> ↑</button>
      </div></footer>
      <Lightbox api={lb} />
    </div>
  );
}
