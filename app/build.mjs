/* Build: bundles app/src with esbuild and writes the site to the repository root
   (index.html + assets/). Only assets/ and the root index.html are replaced; img/ is untouched.
   node build.mjs          production build
   node build.mjs --dev    unminified, React development mode (shows React warnings in the console) */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');                       // local node_modules, or NODE_PATH
const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const out = join(site, 'assets');
const dev = process.argv.includes('--dev');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const result = await esbuild.build({
  absWorkingDir: here,
  entryPoints: ['src/main.jsx'],
  bundle: true,
  splitting: true,
  format: 'esm',
  target: ['es2020'],
  outdir: out,
  entryNames: '[name]-[hash]',
  chunkNames: '[name]-[hash]',
  jsx: 'automatic',
  minify: !dev,
  legalComments: 'none',
  metafile: true,
  nodePaths: (process.env.NODE_PATH || '').split(':').filter(Boolean),
  define: { 'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production') },
  logLevel: 'warning',
});

const entry = Object.entries(result.metafile.outputs).find(([, o]) => o.entryPoint === 'src/main.jsx');
const js = relative(site, join(here, entry[0]));
const css = relative(site, join(here, entry[1].cssBundle));
const html = readFileSync(join(here, 'index.html'), 'utf8').replace('%JS%', './' + js).replace('%CSS%', './' + css);
writeFileSync(join(site, 'index.html'), html);

for (const [file, o] of Object.entries(result.metafile.outputs)) {
  console.log(relative(site, join(here, file)).padEnd(34), String(o.bytes).padStart(8), 'B');
}
console.log(dev ? 'built (development)' : 'built');
