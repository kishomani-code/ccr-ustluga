// Network first for app files. Data files (data*.json, eng*.json) are kept by index.html in cache 'appdata-v1'.
const CACHE = 'rencons-ccr-v4-57-pk';
const FILES = ['./theme.css','./shell.js','./iwpreq.js','./exp.js','./rep.js','./know.js','./ps.js','./know.json','./sysp.js','./loopc.js','./fonts/inter-regular.woff','./fonts/inter-medium.woff','./fonts/inter-semibold.woff','./fonts/inter-bold.woff', './', './index.html', './translations.js', './app.js', './areas.js', './loto.js', './xl.js', './mc.js', './ra.js', './ug.js', './ug.json', './ga.js', './ga.json', './dw.js', './dw.json', './mdr.json', './ho.js', './handover.json', './ca.js', './ctqa.json', './ak.js', './ak.json', './px.js', './sp.js', './kz.js', './kz.json', './wh.json', './sg.json', './mat.json', './ncr.json', './ug_d48_roof_ac_1.jpg', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && !k.startsWith('appdata-')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, {cache: 'no-store'}).then(res => {
      if (res.ok && !/\/(data|data_d48|data_cold|data_1801|data_8810|eng_ccr|eng_d48|eng_cold|eng_1801|eng_8810|rfi_ccr|rfi_d48|rfi_cold|rfi_1801|rfi_8810|loto|areas\/[^/]+|ax\/[^/]+)\.json$/.test(e.request.url.split('?')[0])) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request.url.split('?')[0], copy)); } return res;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
