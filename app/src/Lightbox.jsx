import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* Image viewer. Opened from any .zoom button (see App's click delegation).
   Phones: tap the image to zoom in at the tapped point and drag to pan; tap again to fit.
   While zoomed, a tap beside the image goes back to fit instead of closing. */

const phone = window.matchMedia('(max-width: 760px)');

export default function Lightbox({ api }) {
  const [view, setView] = useState({ open: false, src: null, alt: '' });
  const [zoom, setZoom] = useState(null);           // { w, fx, fy } while zoomed
  const lbRef = useRef(null), imgRef = useRef(null), xRef = useRef(null);
  const lastFocus = useRef(null);
  const wasOpen = useRef(false);

  function close() {
    setZoom(null);
    setView((v) => ({ open: false, src: null, alt: v.alt }));
  }

  api.current = {
    open(btn) {
      const img = btn.querySelector('img');
      const src = (img.hasAttribute('data-src') && !img.classList.contains('is-loaded'))
        ? img.getAttribute('data-src')
        : (img.currentSrc || img.getAttribute('src'));
      lastFocus.current = btn;
      setZoom(null);
      setView({ open: true, src, alt: img.getAttribute('alt') || '' });
    },
    click(e) {
      if (!view.open) return;
      const lb = lbRef.current, img = imgRef.current;
      if (e.target === img && phone.matches) {
        if (zoom) { setZoom(null); return; }
        const r = img.getBoundingClientRect();
        const vw = lb.clientWidth, nw = img.naturalWidth || vw;
        setZoom({ w: Math.max(vw, Math.min(vw * 2.4, nw * 1.5)), fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height });
        return;
      }
      if (e.target === lb && zoom) { setZoom(null); return; }
      if (e.target === lb || e.target === xRef.current || e.target === img) close();
    },
  };

  useLayoutEffect(() => {                               // focus: into the viewer on open, back to the image on close
    if (view.open && !wasOpen.current) xRef.current.focus();
    if (!view.open && wasOpen.current && lastFocus.current) lastFocus.current.focus();
    wasOpen.current = view.open;
  }, [view.open]);

  useLayoutEffect(() => {                               // zoomed: centre the tapped point
    if (!zoom) return;
    const lb = lbRef.current, img = imgRef.current;
    const vw = lb.clientWidth, nw = img.naturalWidth || vw, nh = img.naturalHeight || vw;
    lb.scrollLeft = zoom.fx * zoom.w - vw / 2;
    lb.scrollTop = zoom.fy * (zoom.w * nh / nw) - lb.clientHeight / 2;
  }, [zoom]);

  useEffect(() => {
    if (!view.open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view.open]);

  return (
    <div id="lb" ref={lbRef} className={zoom ? 'lb is-zoom' : 'lb'} hidden={!view.open} role="dialog" aria-modal="true" aria-label="Image viewer">
      <button id="lb-x" ref={xRef} className="lb-x" type="button" aria-label="Close">×</button>
      <img id="lb-img" ref={imgRef} src={view.src || undefined} alt={view.alt} style={zoom ? { width: zoom.w + 'px' } : undefined} draggable={false} />
      <p className="lb-hint mono"><span className="t-en" lang="en">Tap image to zoom</span><span className="t-zh" lang="zh-Hant">點一下放大</span></p>
    </div>
  );
}
