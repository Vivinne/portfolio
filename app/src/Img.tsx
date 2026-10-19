import { useEffect, useRef } from 'react';

/* Images load on approach. Until the real file arrives each <img> shows an empty SVG of the same
   width x height (so the layout is already final) on a flat average colour. On the published site
   the file comes from jsDelivr (the GitHub repo through a CDN); if the CDN fails, that image and every
   later one fall back to the file next to index.html. ?cdn=1 / ?cdn=0 forces either mode for testing. */

const CDN = 'https://cdn.jsdelivr.net/gh/Vivinne/portfolio@main/';
const CDN_HOSTS: readonly string[] = ['vivinne.github.io'];
const NEAR = '1000px 0px';

const forced = location.search.match(/[?&]cdn=(0|1)\b/);
let useCdn: boolean = forced ? forced[1] === '1' : CDN_HOSTS.includes(location.hostname);

if (useCdn) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://cdn.jsdelivr.net';
  document.head.appendChild(link);
}

const placeholder = (w: number, h: number): string =>
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"/>');

const started = new WeakSet<HTMLImageElement>();

function start(img: HTMLImageElement): void {
  if (started.has(img)) return;
  started.add(img);
  const local = img.getAttribute('data-src') ?? '';
  let viaCdn = useCdn;
  const onLoad = (): void => {
    if (/^data:/.test(img.currentSrc || img.src)) return;            // the placeholder's own load event
    img.removeEventListener('load', onLoad);
    img.classList.add('is-loaded');
  };
  const onErr = (): void => {
    if (viaCdn) { viaCdn = false; useCdn = false; img.src = local; }  // CDN down: this and all later images use the local file
    else { img.removeEventListener('error', onErr); img.classList.add('is-failed'); }
  };
  img.addEventListener('load', onLoad);
  img.addEventListener('error', onErr);
  img.src = (viaCdn ? CDN : '') + local;
}

let io: IntersectionObserver | null = null;
function observe(img: HTMLImageElement): void {
  if (!('IntersectionObserver' in window)) { start(img); return; }
  if (!io) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { obs.unobserve(e.target); start(e.target as HTMLImageElement); }
      });
    }, { rootMargin: NEAR });
    io = obs;
  }
  io.observe(img);
}

export interface ImgProps {
  src: string;      // path under img/, e.g. "img/w01-a074.jpg"
  width: number;    // intrinsic size of the file (sets the layout before it loads)
  height: number;
  alt: string;
  bg: string;       // average colour shown while loading, "#rrggbb"
}

export default function Img({ src, width, height, alt, bg }: ImgProps) {
  const ref = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    observe(el);
    return () => { io?.unobserve(el); };
  }, []);
  return (
    <img ref={ref} data-src={src} src={placeholder(width, height)} width={width} height={height} alt={alt}
      decoding="async" style={{ background: bg }} draggable={false} />
  );
}
