import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentType, KeyboardEvent, LazyExoticComponent, MouseEvent, SyntheticEvent } from 'react';
import About from './About';
import WorksIndex from './WorksIndex';
import Lightbox from './Lightbox';
import type { LightboxApi } from './Lightbox';
import { WORKS, isWorkId } from './worksData';
import type { WorkId } from './worksData';

/* Two top tabs (About me / Works); Works opens on the card index and holds one tab per work.
   Each work is its own code chunk, fetched the first time that work is opened (or prefetched when
   the pointer or focus reaches a link to it). Hash routing: #about, #works, #w01 ... #w07. */

type Lang = 'en' | 'zh';
type TopId = 'about' | 'works';
type WorksState = 'index' | 'work';

/** A tab change that still needs its side effects (focus, hash, scrolling) after the render. */
interface TabEffect { kind: 'top' | 'work'; id: string; focus: boolean; user: boolean; t: number }
interface Nav { top: TopId; wstate: WorksState; cur: WorkId; fx: TabEffect | null }

type WorkModule = { default: ComponentType };
const LOADERS: Record<WorkId, () => Promise<WorkModule>> = {
  w01: () => import('./works/W01'),
  w02: () => import('./works/W02'),
  w03: () => import('./works/W03'),
  w04: () => import('./works/W04'),
  w05: () => import('./works/W05'),
  w06: () => import('./works/W06'),
  w07: () => import('./works/W07'),
};
const WORK_VIEWS = Object.fromEntries(
  (Object.keys(LOADERS) as WorkId[]).map((id) => [id, lazy(LOADERS[id])]),
) as Record<WorkId, LazyExoticComponent<ComponentType>>;

const prefetched = new Set<WorkId>();
function prefetch(id: string): void {
  if (!isWorkId(id) || prefetched.has(id)) return;
  prefetched.add(id);
  LOADERS[id]().catch(() => prefetched.delete(id));
}

const phone = window.matchMedia('(max-width: 760px)');
const darkPref = window.matchMedia('(prefers-color-scheme: dark)');

function readLang(): Lang {
  try { return localStorage.getItem('vivinne-lang') === 'zh' ? 'zh' : 'en'; } catch { return 'en'; }
}
function setHash(id: string): void {
  try { history.replaceState(null, '', '#' + id); } catch { /* ignore */ }
}
/** Where a hash leads; fields left out keep their current value. */
function route(hash: string): Partial<Nav> {
  const h = (hash || '').replace('#', '');
  if (isWorkId(h)) return { top: 'works', wstate: 'work', cur: h, fx: { kind: 'work', id: h, focus: false, user: false, t: Date.now() } };
  if (h === 'works') return { top: 'works', wstate: 'index', fx: null };
  return { top: 'about', fx: null };                          // default entry: About me
}

/* Contents lists inside a work: folded on phones, open on wider screens */
function foldToc(root?: ParentNode | null): void {
  (root ?? document).querySelectorAll('.tocd').forEach((d) => {
    if (phone.matches) d.removeAttribute('open'); else d.setAttribute('open', '');
  });
}
function TocFold({ panelId }: { panelId: string }) {
  useLayoutEffect(() => { foldToc(document.getElementById(panelId)); }, [panelId]);
  return null;
}

/** Arrow keys / Home / End inside a tab list: index of the tab to move to, or -1. */
function arrowTarget(e: KeyboardEvent, i: number, n: number): number {
  if (e.key === 'ArrowRight') return (i + 1) % n;
  if (e.key === 'ArrowLeft') return (i - 1 + n) % n;
  if (e.key === 'Home') return 0;
  if (e.key === 'End') return n - 1;
  return -1;
}
const asElement = (t: EventTarget | null): Element | null => (t instanceof Element ? t : null);

const TOPS: readonly { id: TopId; en: string; zh: string }[] = [
  { id: 'about', en: 'About me', zh: '關於我' },
  { id: 'works', en: 'Works', zh: '作品' },
];

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [nav, setNav] = useState<Nav>(() => ({ top: 'about', wstate: 'work', cur: 'w01', fx: null, ...route(location.hash) }));
  const opened = useRef(new Set<WorkId>());
  const lb = useRef<LightboxApi | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  if (nav.top === 'works' && nav.wstate === 'work') opened.current.add(nav.cur);

  useEffect(() => { try { localStorage.setItem('vivinne-lang', lang); } catch { /* ignore */ } }, [lang]);

  useEffect(() => {
    const onHash = (): void => setNav((n) => ({ ...n, ...route(location.hash) }));
    const onMq = (): void => foldToc();
    window.addEventListener('hashchange', onHash);
    phone.addEventListener('change', onMq);
    return () => {
      window.removeEventListener('hashchange', onHash);
      phone.removeEventListener('change', onMq);
    };
  }, []);

  function selectTop(id: TopId, focus: boolean, user: boolean): void {
    setNav((n) => ({ ...n, top: id, wstate: user && id === 'works' ? 'index' : n.wstate, fx: { kind: 'top', id, focus, user, t: Date.now() } }));
  }
  function selectWork(id: WorkId, focus: boolean, user: boolean): void {
    setNav((n) => ({ ...n, wstate: 'work', cur: id, fx: { kind: 'work', id, focus, user, t: Date.now() } }));
  }

  /* side effects of a tab change: focus, hash, scrolling */
  useLayoutEffect(() => {
    const fx = nav.fx;
    if (!fx) return;
    const tab = document.getElementById('tab-' + fx.id);
    if (fx.kind === 'top') {
      if (fx.focus) tab?.focus();
      if (fx.user) { setHash(fx.id); window.scrollTo(0, 0); }
      return;
    }
    const list = listRef.current;
    if (tab && list && list.scrollWidth > list.clientWidth) {   // narrow screens: the strip scrolls sideways
      const l = tab.offsetLeft, r = l + tab.offsetWidth;
      if (l < list.scrollLeft) list.scrollLeft = l;
      else if (r > list.scrollLeft + list.clientWidth) list.scrollLeft = r - list.clientWidth;
    }
    if (fx.focus) tab?.focus();
    if (fx.user) {
      setHash(fx.id);
      /* if the page is scrolled past the works strip, bring it (and the new work under it) back into view */
      const strip = stripRef.current, header = headerRef.current;
      if (strip && header) {
        const top = strip.getBoundingClientRect().top - header.offsetHeight;
        if (top < 0) window.scrollTo(0, window.pageYOffset + top);
      }
    }
  }, [nav.fx]);

  /* clicks on content generated from the original page are handled here (data-open / data-goto / data-scroll / .zoom) */
  function onClick(e: MouseEvent<HTMLDivElement>): void {
    const t = asElement(e.target);
    if (!t) return;
    const go = t.closest('[data-goto]')?.getAttribute('data-goto') ?? '';
    if (t.closest('[data-open="works"]')) selectTop('works', false, true);
    else if (isWorkId(go)) selectWork(go, false, true);
    const sc = t.closest('[data-scroll]')?.getAttribute('data-scroll');
    if (sc) document.getElementById(sc)?.scrollIntoView({ block: 'start' });
    if (t.closest('.tocd > summary') && !phone.matches) e.preventDefault();
    const z = t.closest('.zoom');
    if (z) { lb.current?.open(z); return; }
    lb.current?.click(e);
  }
  function onApproach(e: SyntheticEvent): void {
    const go = asElement(e.target)?.closest('[data-goto]')?.getAttribute('data-goto');
    if (go) prefetch(go);
  }
  function noSave(e: SyntheticEvent): void {                    // deterrent only: no right-click save or drag-out of images
    if (asElement(e.target)?.tagName === 'IMG') e.preventDefault();
  }
  function toggleTheme(): void {
    const root = document.documentElement;
    const t = root.getAttribute('data-theme');
    const next = (t ? t === 'dark' : darkPref.matches) ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('vivinne-theme', next); } catch { /* ignore */ }
  }

  /* drafts strip: work 01's Chinese is the author's original; works 02-06 only partly drafts (view names kept from the original page) */
  const view = nav.top === 'works' && nav.wstate !== 'index'
    ? (nav.cur === 'w01' ? 'w07' : (/^w0[2-6]$/.test(nav.cur) ? 'w15' : ''))
    : '';

  return (
    <div id="app" data-lang={lang} data-view={view} onClick={onClick} onPointerOver={onApproach} onFocus={onApproach}
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
