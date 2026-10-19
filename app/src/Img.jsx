import { useEffect, useRef } from 'react';

/* Images load on approach. Until the real file arrives each <img> shows an empty SVG of the same
   width x height (so the layout is already final) on a flat average colour. On the published site
   the file comes from jsDelivr (the GitHub repo through a CDN); if the CDN fails, that image and every
   later one fall back to the file next to index.html. ?cdn=1 / ?cdn=0 forces either mode for testing. */

const CDN = 'https://cdn.jsdelivr.net/gh/Vivinne/portfolio@main/';
const CDN_HOSTS = ['vivinne.github.io'];
const NEAR = '1000px 0px';

const forced = location.search.match(/[?&]cdn=(0|1)\b/);
let useCdn = forced ? forced[1] === '1' : CDN_HOSTS.indexOf(location.hostname) !== -1;

if (useCdn) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://cdn.jsdelivr.net';
  document.head.appendChild(link);
}

const placeholder = (w, h) =>
  'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"/>');

function start(img) {
  if (img.__go) return;
  img.__go = true;
  const local = img.getAttribute('data-src');
  let viaCdn = useCdn;
  img.addEventListener('load', function onLoad() {
    if (/^data:/.test(img.currentSrc || img.src)) return;            // the placeholder's own load event
    img.removeEventListener('load', onLoad);
    img.classList.add('is-loaded');
  });
  img.addEventListener('error', function onErr() {
    if (viaCdn) { viaCdn = false; useCdn = false; img.src = local; }  // CDN down: this and all later images use the local file
    else { img.removeEventListener('error', onErr); img.classList.add('is-failed'); }
  });
  img.src = (viaCdn ? CDN : '') + local;
}

let io = null;
function observe(img) {
  if (!('IntersectionObserver' in window)) { start(img); return; }
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); start(e.target); } });
    }, { rootMargin: NEAR });
  }
  io.observe(img);
}

export default function Img({ src, width, height, alt, bg }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    observe(el);
    return () => { if (io) io.unobserve(el); };
  }, []);
  return (
    <img ref={ref} data-src={src} src={placeholder(width, height)} width={width} height={height} alt={alt}
      decoding="async" style={{ background: bg }} draggable={false} />
  );
}
