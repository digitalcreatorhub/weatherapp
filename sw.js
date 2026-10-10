// Сервис-воркер: офлайн-кэш, уведомления Android, фоновая проверка погоды (для установленного приложения).
const VER = 'wx-v20';
const SHELL = ['./', 'index.html', 'i18n.js?v=20', 'app.js?v=20', 'borders.js?v=20', 'viz.js?v=20', 'drive.js?v=20', 'plan.js?v=20', 'leaflet.js?v=20', 'leaflet.css?v=20', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const TYPES = {
  storm:['⛈️','Гроза'], rain:['🌧️','Сильный дождь'], snow:['❄️','Сильный снег'], ice:['🧊','Ледяной дождь, гололёд'],
  wind:['💨','Сильный ветер'], heat:['🥵','Сильная жара'], frost:['🥶','Сильный мороз'], freeze:['🌱','Заморозок']
};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('wx-v') && k !== VER).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// сеть в приоритете, при отсутствии интернета отдаём последнюю сохранённую копию
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const ours = u.origin === location.origin && !u.pathname.endsWith('__state') && !u.pathname.endsWith('__seen');
  if (!ours && u.hostname !== 'api.open-meteo.com' && u.hostname !== 'air-quality-api.open-meteo.com') return;
  /* свои файлы всегда сверяем с сервером (без устаревшего HTTP-кэша), чтобы версии не смешивались */
  const net = ours ? (r.mode === 'navigate' ? fetch(r.url, {cache:'no-cache', credentials:'same-origin'}) : fetch(r, {cache:'no-cache'})) : fetch(r);
  e.respondWith(net.then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(VER).then(c => c.put(r, cp)); }
    return res;
  }).catch(() => caches.match(r).then(x => x || Response.error())));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(list =>
    list.length ? list[0].focus() : self.clients.openWindow('./')));
});

/* ---------- фоновая проверка предупреждений ---------- */
function warn(h, i, c) {
  const out = [], code = h.weather_code[i], T = h.temperature_2m[i], pr = h.precipitation[i] ?? 0, g = h.wind_gusts_10m[i] ?? 0, on = k => !(c.off && c.off[k]);
  if (code >= 95 && on('storm')) out.push('storm');
  if ((code === 65 || code === 81 || code === 82 || pr >= c.rain) && on('rain')) out.push('rain');
  if ((code === 75 || code === 86) && on('snow')) out.push('snow');
  if ((code === 56 || code === 57 || code === 66 || code === 67) && on('ice')) out.push('ice');
  if (g >= c.wind && on('wind')) out.push('wind');
  if (T >= c.heat && on('heat')) out.push('heat');
  const fr = T <= c.frost && on('frost');
  if (fr) out.push('frost');
  if (!fr && T <= c.freeze && on('freeze')) out.push('freeze');
  return out;
}
async function readJSON(name) {
  const c = await caches.open('wx-data');
  const r = await c.match(new URL(name, self.registration.scope).href);
  return r ? r.json() : null;
}
async function bgCheck() {
  const wins = await self.clients.matchAll({type:'window'});
  if (wins.some(w => w.visibilityState === 'visible')) return;          // страница открыта: оповестит сама
  const st = await readJSON('__state');
  if (!st || !st.places || !st.places.length || !st.cfg) return;
  const cfg = st.cfg, P = st.places;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${P.map(p => p.lat.toFixed(3)).join(',')}&longitude=${P.map(p => p.lon.toFixed(3)).join(',')}`
    + `&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&forecast_days=2&wind_speed_unit=ms&timezone=Europe%2FRiga`;
  const j = await (await fetch(url)).json(), arr = Array.isArray(j) ? j : [j], times = arr[0].hourly.time;
  const base = Date.parse(times[0] + ':00Z') - arr[0].utc_offset_seconds*1000, now = Date.now();
  const from = Math.max(0, Math.floor((now - base)/36e5)), to = Math.min(from + (cfg.hours || 12), times.length - 1);
  const ev = {};
  arr.forEach((cd, ci) => {
    for (let i = from; i <= to; i++) warn(cd.hourly, i, cfg).forEach(t => {
      const e = ev[t] || (ev[t] = {cities:new Set(), start:i, end:i});
      e.cities.add(P[ci].name); e.start = Math.min(e.start, i); e.end = Math.max(e.end, i);
    });
  });
  const seen = (await readJSON('__seen')) || {};
  Object.keys(seen).forEach(k => { if (now - seen[k] > 48*36e5) delete seen[k]; });
  let changed = false;
  for (const t of Object.keys(ev)) {
    const e = ev[t], ts = times[e.start], key = `${t}|${ts.slice(0, 10)}|${Math.floor(parseInt(ts.slice(11, 13), 10)/6)}`;
    if (seen[key]) continue;
    seen[key] = now; changed = true;
    await self.registration.showNotification(`${TYPES[t][0]} ${TYPES[t][1]}`, {
      body:`${[...e.cities].join(', ')}. ${ts.slice(11)}–${times[Math.min(e.end + 1, times.length - 1)].slice(11)}`,
      tag:key, icon:'icon-192.png', vibrate:[300, 150, 300], requireInteraction:true
    });
  }
  if (changed) {
    const c = await caches.open('wx-data');
    await c.put(new URL('__seen', self.registration.scope).href, new Response(JSON.stringify(seen), {headers:{'Content-Type':'application/json'}}));
  }
}
self.addEventListener('periodicsync', e => { if (e.tag === 'wx-check') e.waitUntil(bgCheck().catch(() => {})); });
