import { useEffect, useRef, useState } from 'react';

/* "Copy" next to the email address: copies it, or selects it when the clipboard is not available. */
type CopyState = 'idle' | 'ok' | 'fail';

const LABELS: Record<CopyState, readonly [en: string, zh: string]> = {
  idle: ['Copy', '複製'],
  ok: ['Copied', '已複製'],
  fail: ['Select and copy', '請選取後複製'],
};

export default function MailCopy() {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function done(ok: boolean): void {
    setState(ok ? 'ok' : 'fail');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 1600);
  }
  function fallback(): void {
    const a = document.getElementById('mail-a');
    try {
      const sel = window.getSelection();
      if (a && sel) {
        const r = document.createRange();
        r.selectNodeContents(a);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    } catch { /* nothing to select */ }
    done(false);
  }
  function copy(): void {
    const text = (document.getElementById('mail-a')?.textContent ?? '').trim();
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback);
    else fallback();
  }

  const [en, zh] = LABELS[state];
  return (
    <button id="mail-copy" className="chip-btn" type="button" aria-live="polite" onClick={copy}>
      <span className="t-en" lang="en">{en}</span><span className="t-zh" lang="zh-Hant">{zh}</span>
    </button>
  );
}
