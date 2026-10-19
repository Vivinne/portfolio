import { useEffect, useRef, useState } from 'react';

/* "Copy" next to the email address: copies it, or selects it when the clipboard is not available. */
const LABELS = {
  idle: ['Copy', '複製'],
  ok: ['Copied', '已複製'],
  fail: ['Select and copy', '請選取後複製'],
};

export default function MailCopy() {
  const [state, setState] = useState('idle');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  function done(ok) {
    setState(ok ? 'ok' : 'fail');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1600);
  }
  function fallback() {
    try {
      const r = document.createRange();
      r.selectNodeContents(document.getElementById('mail-a'));
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e) { /* nothing to select */ }
    done(false);
  }
  function copy() {
    const text = document.getElementById('mail-a').textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback);
    else fallback();
  }

  const [en, zh] = LABELS[state];
  return (
    <button id="mail-copy" className="chip-btn" type="button" aria-live="polite" onClick={copy}>
      <span className="t-en" lang="en">{en}</span><span className="t-zh" lang="zh-Hant">{zh}</span>
    </button>
  );
}
