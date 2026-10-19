'use client';

import dynamic from 'next/dynamic';

/* The whole page runs in the browser (it reads the hash, saved language/theme and screen size on start),
   so it is not pre-rendered. Each work inside it is a separate chunk, loaded when opened. */
const App = dynamic(() => import('../components/App'), { ssr: false });

export default function Page() {
  return <App />;
}
