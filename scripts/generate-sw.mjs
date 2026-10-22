import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const output = resolve(process.argv[2] || 'dist');
const files = [
  'index.html',
  'favicon.svg',
  ...(await readdir(`${output}/assets`)).map((name) => `assets/${name}`),
];
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(`${output}/${file}`));
const version = hash.digest('hex').slice(0, 16);
await writeFile(
  `${output}/sw.js`,
  `// Generated from the exact build assets; no user content is cached.
const PREFIX = 'agent-rules-check-scope-' + encodeURIComponent(self.registration.scope) + '-';
const CACHE = PREFIX + '${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(new URL(file, self.registration.scope), {cache: 'reload'})))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const allowed = FILES.map(file => new URL(file, self.registration.scope).href);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(new URL('index.html', self.registration.scope))).then(response => response || fetch(event.request)));
  } else if (allowed.includes(url.href)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, {ignoreVary: true})).then(response => response || fetch(event.request)));
  }
});
`,
);
console.log(
  `Offline worker generated for ${files.length} assets (${version}).`,
);
