// 圏外でも動くようにするための、ごく小さな仕掛け。
//
// ここで一度やらかしている。音声をキャッシュから返すとき、
// ブラウザが出す Range 要求（頭出しのために「この範囲だけ」と聞いてくる）に対して
// 丸ごとの応答を返していた。ブラウザはこれを受け取れず、音が出なくなる。
// Range で聞かれたら、必ず 206 と Content-Range を返すこと。
const CACHE = 'practice-r8-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// キャッシュにある丸ごとの応答から、聞かれた範囲だけを切り出して返す
async function partial(hit, range){
  const m = /bytes=(\d*)-(\d*)/.exec(range || '');
  if (!m) return hit;
  const buf = await hit.arrayBuffer();
  const size = buf.byteLength;
  let start = m[1] === '' ? null : parseInt(m[1], 10);
  let end   = m[2] === '' ? null : parseInt(m[2], 10);
  if (start === null) { start = Math.max(0, size - (end || 0)); end = size - 1; }
  if (end === null || end >= size) end = size - 1;
  if (start > end || start >= size) {
    return new Response(null, { status: 416,
      headers: { 'Content-Range': `bytes */${size}` } });
  }
  const h = new Headers(hit.headers);
  h.set('Content-Range', `bytes ${start}-${end}/${size}`);
  h.set('Content-Length', String(end - start + 1));
  h.set('Accept-Ranges', 'bytes');
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: 'Partial Content', headers: h });
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;

  const range = r.headers.get('range');

  e.respondWith((async () => {
    const c = await caches.open(CACHE);

    // 音声とページの画像は変わらない。あれば、まずここから返す。
    if (/\.(mp3|png)$/.test(url.pathname)) {
      const hit = await c.match(url.pathname, { ignoreSearch: true });
      if (hit) return range ? partial(hit, range) : hit;
    }

    try {
      // Range 付きのまま取りに行くと、返ってくるのは 206。
      // 206 はキャッシュに入れられないので、控えるのは丸ごと取れたときだけにする。
      const net = await fetch(r);
      if (net.ok && net.status === 200 &&
          (/\.(mp3|png|json|html|js)$/.test(url.pathname) || url.pathname.endsWith('/'))) {
        c.put(url.pathname, net.clone()).catch(() => {});
      }
      return net;
    } catch (err) {
      const hit = await c.match(url.pathname, { ignoreSearch: true });
      if (hit) return range ? partial(hit, range) : hit;
      const shell = await c.match('/practice/index.html') || await c.match('index.html');
      if (shell && r.mode === 'navigate') return shell;
      throw err;
    }
  })());
});
