'use strict';
/* Meteo LV — погода, радар, море, пыльца, дороги и предупреждения для Латвии.
   Тексты интерфейса лежат в i18n.js (ru / lv / en). */
const API = 'https://api.open-meteo.com/v1/forecast';
const AQ_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine';
const MA_FEED = 'https://feeds.meteoalarm.org/api/v1/warnings/feeds-latvia';
const LVGMC_URL = 'https://videscentrs.lvgmc.lv/';
const MA_URL = 'https://meteoalarm.org/';
const LVC_URL = 'https://lvceli.lv/';
const TZ = 'Europe/Riga', ENC_TZ = encodeURIComponent(TZ);

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const RAD = Math.PI/180;
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- язык ---------- */
const LANGS = {ru:'ru-RU', lv:'lv-LV', en:'en-GB'};
let lang = store.get('wx_lang', null);
if (!LANGS[lang]) { const n = String(navigator.language || 'ru').slice(0, 2).toLowerCase(); lang = LANGS[n] ? n : 'ru'; }
let LOC = LANGS[lang];
function t(key, vars) {
  let s = I18N[lang] ? I18N[lang][key] : undefined;
  if (s === undefined) s = I18N.ru[key];
  if (s === undefined) return key;
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
  return s;
}
const fmt = n => (Math.round(n) < 0 ? '−' : '') + Math.abs(Math.round(n)) + '°';
const dFmt = (s, o) => new Date(s).toLocaleDateString(LOC, o);
/* семантическая шкала температуры: холодно — синий, около нуля — светло-голубой, тепло — жёлтый → оранжевый → красный */
const TSTOPS = [[-25,'#3657c9'],[-10,'#4f8fe8'],[0,'#8fd0ff'],[10,'#d9efc4'],[18,'#ffd27a'],[25,'#ffa040'],[32,'#ff5a3c']];
function tempColor(v) {
  if (!Number.isFinite(v)) return '#8fa6ba';
  if (v <= TSTOPS[0][0]) return TSTOPS[0][1];
  for (let i = 1; i < TSTOPS.length; i++) {
    const [b, cb] = TSTOPS[i], [a, ca] = TSTOPS[i - 1];
    if (v <= b) {
      const f = (v - a)/(b - a), A = parseInt(ca.slice(1), 16), B = parseInt(cb.slice(1), 16);
      const ch = sh => Math.round(((A >> sh) & 255) + ((((B >> sh) & 255) - ((A >> sh) & 255))*f));
      return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
    }
  }
  return TSTOPS[TSTOPS.length - 1][1];
}
const hasViz = () => typeof wxIcon === 'function';
const wxI = (code, isDay, size, fallback) => hasViz() ? wxIcon(code, isDay, size) : (fallback || icon(code, isDay));
const hhmm = ms => new Date(ms).toLocaleTimeString(LOC, {timeZone:TZ, hour:'2-digit', minute:'2-digit', hour12:false});
const dtFmt = ms => new Date(ms).toLocaleString(LOC, {timeZone:TZ, weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:false});
const WICON = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',56:'🌧️',57:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',66:'🌧️',67:'🌧️',
  71:'🌨️',73:'🌨️',75:'❄️',77:'🌨️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'};
const wmo = c => [t('wmo')[c] || '—', WICON[c] || '❔'];
function icon(code, isDay) {
  if (isDay === 0) { if (code === 0 || code === 1) return '🌙'; if (code === 2) return '☁️'; }
  return wmo(code)[1];
}
const compass = d => t('dirs')[Math.round(d/45) % 8];
const uvLabel = u => t('uv')[u < 3 ? 0 : u < 6 ? 1 : u < 8 ? 2 : u < 11 ? 3 : 4];
const aqiLabel = a => t('aqi')[a <= 20 ? 0 : a <= 40 ? 1 : a <= 60 ? 2 : a <= 80 ? 3 : a <= 100 ? 4 : 5];
const link = (href, txt) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(txt)}</a>`;

async function getJSON(url) {
  for (let a = 0; a < 2; a++) {
    const c = new AbortController(), tm = setTimeout(() => c.abort(), 15000);
    try {
      const r = await fetch(url, {signal:c.signal}); clearTimeout(tm);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { clearTimeout(tm); if (a) throw e; await new Promise(r => setTimeout(r, 700)); }
  }
}
function showErr(m) { $('errt').textContent = m; $('err').style.display = 'block'; }

/* ---------- места ---------- */
const TOWNS = {
  riga:{lat:56.9496, lon:24.1052, n:{ru:'Рига', lv:'Rīga', en:'Riga'}},
  daugavpils:{lat:55.8747, lon:26.5362, n:{ru:'Даугавпилс', lv:'Daugavpils', en:'Daugavpils'}},
  liepaja:{lat:56.5047, lon:21.0108, n:{ru:'Лиепая', lv:'Liepāja', en:'Liepāja'}},
  jelgava:{lat:56.6511, lon:23.7214, n:{ru:'Елгава', lv:'Jelgava', en:'Jelgava'}},
  jurmala:{lat:56.968, lon:23.7704, n:{ru:'Юрмала', lv:'Jūrmala', en:'Jūrmala'}, hide:true},
  ventspils:{lat:57.3894, lon:21.5606, n:{ru:'Вентспилс', lv:'Ventspils', en:'Ventspils'}},
  rezekne:{lat:56.5099, lon:27.3331, n:{ru:'Резекне', lv:'Rēzekne', en:'Rēzekne'}},
  valmiera:{lat:57.5385, lon:25.4264, n:{ru:'Валмиера', lv:'Valmiera', en:'Valmiera'}},
  jekabpils:{lat:56.4992, lon:25.8578, n:{ru:'Екабпилс', lv:'Jēkabpils', en:'Jēkabpils'}},
  cesis:{lat:57.3119, lon:25.2749, n:{ru:'Цесис', lv:'Cēsis', en:'Cēsis'}},
  ogre:{lat:56.8162, lon:24.6140, n:{ru:'Огре', lv:'Ogre', en:'Ogre'}},
  lielvarde:{lat:56.7206, lon:24.8100, n:{ru:'Лиелварде', lv:'Lielvārde', en:'Lielvārde'}},
  aizkraukle:{lat:56.6048, lon:25.2555, n:{ru:'Айзкраукле', lv:'Aizkraukle', en:'Aizkraukle'}},
  livani:{lat:56.3543, lon:26.1759, n:{ru:'Ливаны', lv:'Līvāni', en:'Līvāni'}},
  sigulda:{lat:57.1537, lon:24.8597, n:{ru:'Сигулда', lv:'Sigulda', en:'Sigulda'}},
  tukums:{lat:56.9673, lon:23.1554, n:{ru:'Тукумс', lv:'Tukums', en:'Tukums'}},
  kandava:{lat:57.0337, lon:22.7755, n:{ru:'Кандава', lv:'Kandava', en:'Kandava'}},
  saldus:{lat:56.6637, lon:22.4881, n:{ru:'Салдус', lv:'Saldus', en:'Saldus'}},
  skrunda:{lat:56.6766, lon:22.0153, n:{ru:'Скрунда', lv:'Skrunda', en:'Skrunda'}},
  vilani:{lat:56.5528, lon:26.9256, n:{ru:'Виляны', lv:'Viļāni', en:'Viļāni'}}
};
const CITY_IDS = ['riga','daugavpils','liepaja','jelgava','jurmala','ventspils','rezekne','valmiera','jekabpils','cesis'];
/* основные трассы через города по пути (примерно); остальные пары считаются по прямой */
const ROUTES = [
  ['riga','ogre','lielvarde','aizkraukle','jekabpils','livani','daugavpils'],
  ['riga','ogre','aizkraukle','jekabpils','vilani','rezekne'],
  ['riga','saldus','skrunda','liepaja'],
  ['riga','jurmala','tukums','kandava','ventspils'],
  ['riga','sigulda','cesis','valmiera'],
  ['riga','jelgava']
];
const townName = id => TOWNS[id].n[lang] || TOWNS[id].n.ru;
const samePlace = (a, b) => !!a && !!b && Math.abs(a.lat - b.lat) < 1e-3 && Math.abs(a.lon - b.lon) < 1e-3;
const placeName = p => p.id ? townName(p.id) : p.pt ? t('pointName', {a:p.lat.toFixed(2), b:p.lon.toFixed(2)}) : p.name;

const CFG_DEF = {wind:17, rain:4, heat:30, frost:-15, freeze:0, hours:12, off:{freeze:true}};
let cfg = Object.assign({}, CFG_DEF, store.get('wx_cfg', {}));
cfg.off = Object.assign({}, CFG_DEF.off, cfg.off || {});
['wind','rain','heat','frost','freeze','hours'].forEach(k => { if (!Number.isFinite(cfg[k])) cfg[k] = CFG_DEF[k]; });
let favs = (store.get('wx_favs', []) || []).filter(f => f && Number.isFinite(f.lat) && Number.isFinite(f.lon)).slice(0, 8)
  .map(f => ({name:String(f.name || 'Место').slice(0, 40), lat:f.lat, lon:f.lon}));
let PLACES = [], cityPlaces = [], cityData = [];
function rebuildPlaces() {
  PLACES = CITY_IDS.map(id => ({id, lat:TOWNS[id].lat, lon:TOWNS[id].lon, hide:!!TOWNS[id].hide}))
    .concat(favs.map(f => ({name:f.name, lat:f.lat, lon:f.lon, fav:true})));
}
rebuildPlaces();

/* ---------- состояние ---------- */
const L0 = 19.4, L1 = 29.8, A0 = 54.7, A1 = 58.9, NLAT = 8, NLON = 12;   /* сетка прогноза шире Латвии: края поля уходят за видимую карту */
const inLV = (la, lo) => la >= 55.6 && la <= 58.1 && lo >= 20.9 && lo <= 28.3;
const LATVIA = [[57.76,22.59],[57.6,22.0],[57.39,21.55],[57.0,21.2],[56.51,21.01],[56.07,21.06],[56.15,21.7],[56.1,22.2],[56.25,22.9],[56.1,23.4],[56.07,24.0],[56.1,24.6],[56.0,25.3],[55.9,26.0],[55.7,26.6],[55.9,27.3],[56.1,28.15],[56.6,28.15],[57.0,27.9],[57.5,27.35],[57.57,26.6],[57.78,26.03],[57.87,25.2],[57.87,24.36],[57.55,24.35],[57.26,24.4],[56.95,24.1],[56.97,23.6],[57.15,23.2],[57.5,22.8]];
const GRID_VARS = ['cloud_cover','precipitation','temperature_2m','wind_speed_10m','wind_direction_10m'];
const REFRESH = {current:60e3, point:15*60e3, cities:15*60e3, grid:30*60e3, radar:10*60e3, now:5*60e3, official:15*60e3, sea:30*60e3, road:15*60e3};
const mer = a => Math.log(Math.tan(Math.PI/4 + a*Math.PI/360));
const M0 = mer(A1), M1 = mer(A0);

let sel = {id:'riga', lat:TOWNS.riga.lat, lon:TOWNS.riga.lon};
const selKey = () => sel.lat.toFixed(4) + ',' + sel.lon.toFixed(4);
let lastW = null, hourlyData = null, air = null, pollen = null, models = null, nowcast = null, h24Idx = -1;
let grid = null, gridBase = 0, gridN = 72, layer = ['clouds','precip','temp'].includes(store.get('wx_layer', 'clouds')) ? store.get('wx_layer', 'clouds') : 'clouds';
let live = true, pos = 0, playTimer = null, offline = false;
const stamp = {current:0, point:0, cities:0, grid:0, warn:0, moon:0, radar:0, now:0, official:0, sea:0, road:0}, busy = {};
const lats = Array.from({length:NLAT}, (_, i) => A0 + i*(A1-A0)/(NLAT-1));
const lons = Array.from({length:NLON}, (_, j) => L0 + j*(L1-L0)/(NLON-1));
const CUR = 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,pressure_msl,uv_index,is_day';
const pointQS = () => `latitude=${sel.lat.toFixed(4)}&longitude=${sel.lon.toFixed(4)}&timezone=${ENC_TZ}&wind_speed_unit=ms`;
const posNow = () => clamp((Date.now() - gridBase)/36e5, 0, gridN - 1);
function setBase(r) {
  gridN = r.hourly.time.length;
  gridBase = Date.parse(r.hourly.time[0] + ':00Z') - r.utc_offset_seconds*1000;
  $('slider').max = gridN - 1;
  if (live) { pos = posNow(); $('slider').value = pos; }
}
function guarded(name, fn) {
  if (busy[name]) return; busy[name] = true;
  Promise.resolve().then(fn).catch(() => { offline = true; }).finally(() => { busy[name] = false; });
}

/* ---------- прогноз по выбранной точке ---------- */
async function loadPoint() {
  const key = selKey();
  const url = `${API}?${pointQS()}&current=${CUR}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,is_day,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_gusts_10m,wind_speed_10m,wind_direction_10m,pressure_msl`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max&forecast_days=5`;
  try {
    const w = await getJSON(url);
    if (key !== selKey()) return;
    lastW = w; stamp.point = stamp.current = Date.now(); offline = false;
    hourlyData = {t:w.hourly.time, T:w.hourly.temperature_2m, P:w.hourly.precipitation_probability, days:w.daily.time, base:Date.parse(w.hourly.time[0] + ':00Z') - w.utc_offset_seconds*1000, n:w.hourly.time.length};
    renderHero(); renderDaily(w); drawHourly(); draw(); renderH24(); renderToday(); renderMoon(); renderAcc();
    if (typeof renderPlan === 'function') renderPlan();
    guarded('mod', loadModels); guarded('air', loadAir); guarded('nc', loadNowcast);
  } catch (e) {
    if (!lastW) { $('hero').innerHTML = `<div class="state">${t('noData')}</div>`; showErr(t('netErr')); }
    offline = true;
  }
}
async function loadCurrent() {
  if (!lastW) return;
  const key = selKey();
  try {
    const j = await getJSON(`${API}?${pointQS()}&current=${CUR}`);
    if (key !== selKey() || !lastW) return;
    lastW.current = j.current; stamp.current = Date.now(); offline = false; renderHero();
  } catch (e) { offline = true; }
}
let heroKey = '';
function renderHero() {
  if (!lastW) return;
  const w = lastW, c = w.current, d = w.daily, [txt] = wmo(c.weather_code);
  const fav = favs.some(f => samePlace(f, sel));
  const star = sel.id ? '' : `<button class="star" data-act="star" aria-pressed="${fav}" aria-label="${esc(fav ? t('favRemove') : t('favAdd'))}">${fav ? '★' : '☆'}</button>`;
  const fresh = heroKey !== selKey(); heroKey = selKey();
  const dir = c.wind_direction_10m ?? 0, dl = (Date.parse(d.sunset[0]) - Date.parse(d.sunrise[0]))/6e4, uv = c.uv_index;
  const airTxt = air === null ? '…' : air ? Math.round(air.european_aqi) + ', ' + aqiLabel(air.european_aqi) : '—';
  let gz = ''; if (hasViz()) { try { gz = gaugesHTML(); } catch (e) { console.warn('gauges', e); } }
  const panel = gz ? `<div class="gauges${fresh ? ' anim' : ''}" id="gauges">${gz}</div>` : `<div class="facts">
      <div class="fact"><small>${t('wind')}</small><b><span style="display:inline-block;transform:rotate(${dir + 180}deg)">↑</span> ${compass(dir)} ${Math.round(c.wind_speed_10m)} ${t('ms')}</b></div>
      <div class="fact"><small>${t('humidity')}</small><b>${c.relative_humidity_2m}%</b></div>
      <div class="fact"><small>${t('pressure')}</small><b>${Math.round(c.pressure_msl)} ${t('hpa')}</b></div>
      <div class="fact"><small>${t('uvToday', {n:Math.round(d.uv_index_max[0] ?? 0)})}</small><b>${uv != null ? uv.toFixed(1) + ', ' + uvLabel(uv) : '—'}</b></div>
      <div class="fact"><small>${t('air')}</small><b>${airTxt}</b></div>
      <div class="fact"><small>${t('daylen')}</small><b>${t('daylenVal', {h:Math.floor(dl/60), m:Math.round(dl % 60)})}</b></div>
    </div>`;
  $('hero').innerHTML = `
    <div class="place">${esc(placeName(sel))}${star}</div>
    <div class="trow"><div class="big" id="bigT">${fmt(c.temperature_2m)}</div><div class="ico">${wxI(c.weather_code, c.is_day, 92)}</div></div>
    <div class="cond">${esc(txt)}</div>
    <div class="sub">${t('feels', {f:fmt(c.apparent_temperature), lo:fmt(d.temperature_2m_min[0]), hi:fmt(d.temperature_2m_max[0])})}</div>
    ${panel}`;
  if (hasViz()) { try { vzCountUp($('bigT'), c.temperature_2m); skyUpdate(); } catch (e) { console.warn('viz', e); } }
}
$('hero').addEventListener('click', e => { if (e.target.closest('[data-act=star]')) toggleFav(); });
function renderDaily(w) {
  if (!w) return;
  const d = w.daily, lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max), span = Math.max(hi - lo, 1);
  $('daily').innerHTML = d.time.map((day, i) => {
    const l = (d.temperature_2m_min[i] - lo)/span*100, wd = Math.max((d.temperature_2m_max[i] - d.temperature_2m_min[i])/span*100, 8);
    const nm = i === 0 ? t('today') : i === 1 ? t('tomorrow') : dFmt(day, {weekday:'long'});
    const mm = d.precipitation_sum[i] > 0.1 ? d.precipitation_sum[i].toFixed(1) + ' ' + t('mm') : '';
    const [wt, wi] = wmo(d.weather_code[i]);
    return `<div class="row"><div class="nm"><span class="dn">${nm}</span><small>${dFmt(day, {day:'numeric', month:'short'})}${mm ? `<span class="mm"> · ${mm}</span>` : ''}</small></div>
      <div class="ic" title="${esc(wt)}">${wxI(d.weather_code[i], 1, 36, wi)}</div>
      <div class="rg"><span>${fmt(d.temperature_2m_min[i])}</span><div class="tr"><i style="left:${l}%;width:${wd}%;background:linear-gradient(90deg,${tempColor(d.temperature_2m_min[i])},${tempColor(d.temperature_2m_max[i])});animation-delay:${i*80}ms"></i></div><span>${fmt(d.temperature_2m_max[i])}</span></div>${confCell(i)}</div>`;
  }).join('');
}

/* ---------- «Сегодня коротко»: одежда, зонт, ветер, УФ, гололедица ---------- */
function renderToday() {
  const el = $('today');
  if (!lastW || !hourlyData) return;
  const h = lastW.hourly, n = h.time.length;
  const nowH = parseInt(new Intl.DateTimeFormat('en-GB', {timeZone:TZ, hour:'2-digit', hour12:false}).format(new Date()), 10) % 24;
  let i0 = clamp(Math.floor((Date.now() - hourlyData.base)/36e5), 0, n - 1), i1 = i0 + (22 - nowH), tom = false;
  if (22 - nowH < 3) { tom = true; i0 = clamp(i0 + (24 - nowH) + 7, 0, n - 1); i1 = i0 + 15; }
  i1 = clamp(i1, i0, n - 1);
  const part = a => a.slice(i0, i1 + 1).map(v => v ?? 0);
  const T = part(h.temperature_2m), F = part(h.apparent_temperature);
  const lo = Math.min(...T), hi = Math.max(...T), flo = Math.min(...F), fhi = Math.max(...F);
  const feel = flo*0.6 + fhi*0.4;
  const wi = feel <= -15 ? 0 : feel <= -5 ? 1 : feel <= 5 ? 2 : feel <= 12 ? 3 : feel <= 18 ? 4 : feel <= 23 ? 5 : 6;
  const items = [['🧥', t('wear')[wi]]];
  let firstWet = -1, maxP = 0, snowy = false;
  for (let i = i0; i <= i1; i++) {
    const p = h.precipitation_probability[i] ?? 0, pr = h.precipitation[i] ?? 0, c = h.weather_code[i];
    maxP = Math.max(maxP, p);
    if (firstWet < 0 && c >= 51 && (p >= 50 || pr >= 0.3)) firstWet = i;
    if ([71, 73, 75, 77, 85, 86].includes(c)) snowy = true;
  }
  if (firstWet >= 0) items.push(['☂️', t('umbrellaYes', {t:h.time[firstWet].slice(11)})]);
  else if (maxP >= 30) items.push(['🌂', t('umbrellaMaybe', {p:maxP})]);
  else items.push(['🙂', t('umbrellaNo')]);
  if (snowy) items.push(['🥾', t('snowShoes')]);
  const g = Math.max(...part(h.wind_gusts_10m));
  if (g >= 12) items.push(['💨', t('windy', {g:Math.round(g)})]);
  const uv = lastW.daily.uv_index_max[tom ? 1 : 0] ?? 0;
  if (uv >= 3) items.push(['🕶️', t('sunscreen', {u:Math.round(uv)})]);
  if (lo <= 1 && (firstWet >= 0 || snowy || maxP >= 40)) items.push(['⚠️', t('iceRisk')]);
  el.innerHTML = `<h2>${t(tom ? 'tomorrowTitle' : 'todayTitle')} · ${esc(placeName(sel))}</h2>
    <div class="tline">${t('todayRange', {lo:fmt(lo), hi:fmt(hi), flo:fmt(flo), fhi:fmt(fhi)})}</div>
    <div class="tl">${items.map(([i, s]) => `<div class="ti"><span>${i}</span><span>${esc(s)}</span></div>`).join('')}</div>`;
}

/* ---------- воздух и пыльца ---------- */
const POLLEN = [['alder',[10,100,500]],['birch',[10,100,500]],['grass',[10,50,150]],['mugwort',[10,30,100]],['ragweed',[5,20,60]]];
const P_COL = ['#4ade80','#4ade80','#ffd23f','#ff8c1a','#ff3b30'];
async function loadAir() {
  const key = selKey();
  const pk = POLLEN.map(p => p[0] + '_pollen').join(',');
  try {
    const j = await getJSON(`${AQ_API}?latitude=${sel.lat.toFixed(4)}&longitude=${sel.lon.toFixed(4)}&current=european_aqi,pm2_5&hourly=${pk}&forecast_days=1&timezone=${ENC_TZ}`);
    if (key !== selKey()) return;
    air = j.current && j.current.european_aqi != null ? j.current : false;
    const out = {}; let any = false;
    POLLEN.forEach(([k]) => {
      const a = ((j.hourly || {})[k + '_pollen'] || []).filter(v => v != null);
      if (a.length) { any = true; out[k] = Math.max(...a); }
    });
    pollen = any ? out : 'off';
  } catch (e) { air = false; pollen = false; }
  if (lastW) renderHero();
  renderPollen();
}
function renderPollen() {
  const el = $('pollenOut');
  if (pollen === null) return;
  if (pollen === false) { el.innerHTML = `<div class="ok">${t('pollenNA')}</div>`; return; }
  if (pollen === 'off') { el.innerHTML = `<div class="ok">🌿 ${t('pollenOff')}</div>`; return; }
  el.innerHTML = POLLEN.filter(([k]) => pollen[k] !== undefined).map(([k, th]) => {
    const v = pollen[k], lv = v < 1 ? 0 : v < th[0] ? 1 : v < th[1] ? 2 : v < th[2] ? 3 : 4;
    const w = lv === 0 ? 0 : Math.min(100, 12 + lv*22);
    return `<div class="pr"><span>${t('pollenTypes')[k]}</span><div class="bar"><i style="width:${w}%;background:${P_COL[lv]}"></i></div><b>${t('pollenLevels')[lv]} · ${Math.round(v)}</b></div>`;
  }).join('') + `<div class="nst">${t('pollenNote')}</div>`;
}

/* ---------- согласие моделей и учёт точности ---------- */
const ACC = {ecmwf_ifs025:'ECMWF', icon_seamless:'ICON (DWD)', gfs_seamless:'GFS (NOAA)'};
let accData = store.get('wx_acc', {});
const accKey = () => PLACES.some(p => samePlace(p, sel)) ? sel.lat.toFixed(2) + ',' + sel.lon.toFixed(2) : null;
async function loadModels() {
  const key = selKey();
  try {
    const j = await getJSON(`${API}?${pointQS()}&daily=temperature_2m_max&forecast_days=5&models=${Object.keys(ACC).join(',')}`);
    if (key !== selKey()) return;
    const d = j.daily, ks = Object.keys(d).filter(k => k.startsWith('temperature_2m_max_'));
    models = d.time.map((_, i) => {
      const v = ks.map(k => d[k][i]).filter(x => x != null);
      return v.length >= 2 ? {spread:Math.max(...v) - Math.min(...v)} : null;
    });
    recordAcc(d);
    if (lastW) renderDaily(lastW);
    await resolveAcc();
  } catch (e) { models = null; }
}
function confCell(i) {
  const m = models && models[i]; if (!m) return '<div class="cf"></div>';
  const s = m.spread, k = s <= 1.5 ? 0 : s <= 3 ? 1 : 2, col = ['#4ade80', '#ffb547', '#ff6b4a'][k];
  return `<div class="cf" title="${esc(t('confTitle', {l:t('conf')[k], s:s.toFixed(1)}))}"><i style="background:${col}"></i>±${(s/2).toFixed(1)}°</div>`;
}
function recordAcc(d) {
  const k = accKey(); if (!k || !d.time[1]) return;
  const a = accData[k] || (accData[k] = {fc:{}, obs:{}}), date = d.time[1];
  if (a.fc[date]) return;
  const v = {};
  Object.keys(ACC).forEach(m => { const x = d['temperature_2m_max_' + m]; if (x && x[1] != null) v[m] = x[1]; });
  if (Object.keys(v).length < 2) return;
  if (lastW) v.best = lastW.daily.temperature_2m_max[1];
  a.fc[date] = v;
  Object.keys(a.fc).sort().slice(0, -40).forEach(x => { delete a.fc[x]; delete a.obs[x]; });
  store.set('wx_acc', accData);
}
async function resolveAcc() {
  const k = accKey(); if (!k || !accData[k]) { renderAcc(); return; }
  const a = accData[k], today = new Date().toLocaleDateString('sv-SE', {timeZone:TZ});
  const need = Object.keys(a.fc).filter(d => d < today && a.obs[d] === undefined);
  if (need.length) {
    try {
      const j = await getJSON(`${API}?latitude=${sel.lat.toFixed(4)}&longitude=${sel.lon.toFixed(4)}&daily=temperature_2m_max&past_days=7&forecast_days=1&timezone=${ENC_TZ}`);
      j.daily.time.forEach((d, i) => { if (need.includes(d)) a.obs[d] = j.daily.temperature_2m_max[i]; });
      need.forEach(d => { if (a.obs[d] === undefined) a.obs[d] = null; });
      store.set('wx_acc', accData);
    } catch (e) {}
  }
  renderAcc();
}
function renderAcc() {
  const k = accKey(), el = $('acc'), head = `<h2>${t('accTitle')}</h2>`;
  if (!k) { el.innerHTML = head + `<div class="ok">${t('accPick')}</div>`; return; }
  const a = accData[k] || {fc:{}, obs:{}}, total = Object.keys(a.fc).length;
  const dates = Object.keys(a.fc).filter(d => typeof a.obs[d] === 'number');
  const defs = [...Object.keys(ACC).map(m => [m, ACC[m]]), ['mean', t('accMean')], ['best', t('accAuto')]];
  const rows = defs.map(([m, lab]) => {
    let s = 0, n = 0;
    dates.forEach(d => {
      const f = a.fc[d]; let v = f[m];
      if (m === 'mean') { const xs = Object.keys(ACC).map(x => f[x]).filter(x => x != null); v = xs.length >= 2 ? xs.reduce((p, q) => p + q, 0)/xs.length : undefined; }
      if (v != null) { s += Math.abs(v - a.obs[d]); n++; }
    });
    return n ? {lab, mae:s/n} : null;
  }).filter(Boolean).sort((p, q) => p.mae - q.mae);
  if (dates.length < 2 || !rows.length) {
    el.innerHTML = head + `<div class="ok">${t('accWait', {p:esc(placeName(sel)), t:total, d:dates.length})}</div>`;
    return;
  }
  const mx = Math.max(...rows.map(r => r.mae), 0.5);
  el.innerHTML = head + rows.map((r, i) => `<div class="ar${i === 0 ? ' best' : ''}"><span>${i === 0 ? '🏆 ' : ''}${esc(r.lab)}</span><div class="bar"><i style="width:${Math.max(6, r.mae/mx*100)}%"></i></div><b>±${r.mae.toFixed(1)}°</b></div>`).join('')
    + `<div class="nst">${t('accNote', {d:dates.length})}</div>`;
}

/* ---------- ближайшие 24 часа ---------- */
function renderH24() {
  if (!lastW || !hourlyData) return;
  const h = lastW.hourly, i0 = clamp(Math.floor((Date.now() - hourlyData.base)/36e5), 0, h.time.length - 25);
  h24Idx = i0; let out = '';
  for (let i = i0; i < i0 + 24; i++) {
    const hh = h.time[i].slice(11, 13), pp = h.precipitation_probability[i] ?? 0, T = h.temperature_2m[i];
    const lab = i === i0 ? t('nowLbl') : hh === '00' ? dFmt(h.time[i], {weekday:'short'}) : hh + ':00';
    const wd = h.wind_direction_10m ? h.wind_direction_10m[i] : null, ws = h.wind_speed_10m ? h.wind_speed_10m[i] : null;
    const wind = wd != null && ws != null ? `<span class="wd"><i style="transform:rotate(${Math.round(wd + 180)}deg)">↑</i>${Math.round(ws)}</span>` : '';
    out += `<div class="hc${i === i0 ? ' now' : ''}${h.is_day[i] === 0 ? ' nt' : ''}"><small>${lab}</small><span class="hi">${wxI(h.weather_code[i], h.is_day[i], 34)}</span>`
      + `<b>${fmt(T)}</b><i class="tk" style="background:${tempColor(T)}"></i>${wind}`
      + `<span class="pb" title="${pp}%"><i style="height:${Math.max(pp, 2)}%;opacity:${pp >= 20 ? 1 : .35}"></i></span><em>${pp >= 20 ? pp + '%' : ''}</em></div>`;
  }
  $('h24').innerHTML = out;
}

/* ---------- Луна (низкоточная формула Мееуса) ---------- */
function moonE(ms) {
  const T = (ms/864e5 + 2440587.5 - 2451545)/36525, s = x => Math.sin(x*RAD);
  const D = 297.8501921 + 445267.1114034*T, M = 357.5291092 + 35999.0502909*T, Mp = 134.9633964 + 477198.8675055*T;
  const i = 180 - D - 6.289*s(Mp) + 2.100*s(M) - 1.274*s(2*D - Mp) - 0.658*s(2*D) - 0.214*s(2*Mp) - 0.110*s(D);
  return ((180 - i) % 360 + 360) % 360;
}
const MOON_EMO = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
function moonInfo(ms) {
  const E = moonE(ms), k = Math.round(E/45) % 8;
  return {E, frac:(1 - Math.cos(E*RAD))/2, emoji:MOON_EMO[k], name:t('moonNames')[k], age:E/360*29.53};
}
function nextMoon(ms, target) {
  const step = 3*36e5, rel = x => ((moonE(x) - target + 540) % 360) - 180;
  let prev = rel(ms);
  for (let x = ms + step; x < ms + 32*864e5; x += step) {
    const cur = rel(x);
    if (prev < 0 && cur >= 0) return x - step*cur/(cur - prev);
    prev = cur;
  }
  return null;
}
function moonSvg(E) {
  const r = 44, wax = E <= 180, Ee = wax ? E : 360 - E, c = Math.cos(Ee*RAD), rx = Math.abs(c)*r, sw = c > 0 ? 0 : 1;
  const lit = `<path d="M0,${-r} A${r},${r} 0 0 1 0,${r} A${rx},${r} 0 0 ${sw} 0,${-r}Z" fill="#f3ecd2"/>`;
  return `<svg viewBox="-50 -50 100 100" width="96" height="96" aria-hidden="true"><circle r="${r}" fill="#1d2b3c" stroke="rgba(255,255,255,.14)"/><g ${wax ? '' : 'transform="scale(-1,1)"'}>${lit}</g></svg>`;
}
function skyRating(frac) {
  if (!lastW || !hourlyData) return null;
  const h = lastW.hourly, now = Date.now(); let sum = 0, n = 0;
  for (let i = 0; i < h.time.length; i++) {
    const x = hourlyData.base + i*36e5;
    if (x < now - 36e5 || x > now + 24*36e5) continue;
    if (h.is_day[i] === 0 && h.cloud_cover[i] != null) { sum += h.cloud_cover[i]; n++; }
  }
  if (!n) return null;
  const c = sum/n, k = c < 20 ? 0 : c < 45 ? 1 : c < 70 ? 2 : 3;
  return {c, txt:t('sky')[k], note:c < 45 && frac > 0.6 ? t('skyMoon') : ''};
}
function renderMoon() {
  const now = Date.now(), m = moonInfo(now), nn = nextMoon(now, 0), nf = nextMoon(now, 180), sky = skyRating(m.frac);
  const fd = x => x ? new Date(x).toLocaleDateString(LOC, {timeZone:TZ, day:'numeric', month:'long'}) : '—';
  $('moon').innerHTML = `<h2>${t('moonTitle')}</h2>
    <div class="mrow">${moonSvg(m.E)}<div class="mt"><b>${m.name}</b>
      <div class="sub">${t('moonLit', {p:Math.round(m.frac*100), a:m.age.toFixed(1)})}</div>
      <div class="mn"><span>${t('newMoon', {d:fd(nn)})}</span><span>${t('fullMoon', {d:fd(nf)})}</span></div></div></div>
    ${sky ? `<div class="sky">⭐ ${sky.txt}<small>${t('skyNote', {c:Math.round(sky.c)})} ${sky.note}</small></div>` : ''}`;
}

/* ---------- города: почасовой прогноз для карты и предупреждений ---------- */
async function loadCities() {
  const pl = PLACES.slice();
  const url = `${API}?latitude=${pl.map(c => c.lat.toFixed(4)).join(',')}&longitude=${pl.map(c => c.lon.toFixed(4)).join(',')}`
    + `&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&forecast_days=3&wind_speed_unit=ms&timezone=${ENC_TZ}`;
  const j = await getJSON(url);
  cityData = Array.isArray(j) ? j : [j]; cityPlaces = pl;
  setBase(cityData[0]);
  stamp.cities = Date.now();
  draw(); refreshWarnings();
}
function cityAt(p, ps) {
  const i = cityPlaces.findIndex(q => samePlace(q, p)), cd = cityData[i]; if (!cd) return null;
  const h = cd.hourly, n = h.time.length, h0 = clamp(Math.floor(ps), 0, n-1), h1 = Math.min(h0 + 1, n-1), f = ps - h0, r = clamp(Math.round(ps), 0, n-1);
  return {T:(h.temperature_2m[h0] ?? 0)*(1-f) + (h.temperature_2m[h1] ?? 0)*f, code:h.weather_code[r], warn:hourWarn(h, r).length > 0};
}

/* ---------- сетка облачности ---------- */
async function loadGrid() {
  const la = [], lo = [];
  lats.forEach(a => lons.forEach(b => { la.push(a.toFixed(2)); lo.push(b.toFixed(2)); }));
  const url = `${API}?latitude=${la.join(',')}&longitude=${lo.join(',')}&hourly=${GRID_VARS.join(',')}&forecast_days=3&wind_speed_unit=ms&timezone=${ENC_TZ}`;
  const j = await getJSON(url);
  grid = Array.isArray(j) ? j : [j];
  setBase(grid[0]);
  stamp.grid = Date.now(); buildStrip(); draw();
}
function fieldAt(key, p) {
  const h0 = Math.min(Math.floor(p), gridN - 1), h1 = Math.min(h0 + 1, gridN - 1), f = p - h0;
  return Array.from({length:NLAT}, (_, i) => Array.from({length:NLON}, (_, j) => {
    const hh = grid[i*NLON + j].hourly[key];
    return (hh[h0] ?? 0)*(1-f) + (hh[h1] ?? 0)*f;
  }));
}
function sunParams(ms) {
  const d = new Date(ms), doy = (ms - Date.UTC(d.getUTCFullYear(), 0, 0))/864e5;
  const g = 2*Math.PI/365*(doy - 1 + (d.getUTCHours() - 12)/24);
  const decl = 0.006918 - 0.399912*Math.cos(g) + 0.070257*Math.sin(g) - 0.006758*Math.cos(2*g) + 0.000907*Math.sin(2*g) - 0.002697*Math.cos(3*g) + 0.00148*Math.sin(3*g);
  const eqt = 229.18*(0.000075 + 0.001868*Math.cos(g) - 0.032077*Math.sin(g) - 0.014615*Math.cos(2*g) - 0.040849*Math.sin(2*g));
  return {decl, eqt, utcMin:((ms/6e4) % 1440 + 1440) % 1440};
}
function sunElev(sp, lat, lon) {
  const la = lat*RAD, H = ((sp.utcMin + sp.eqt + 4*lon)/4 - 180)*RAD;
  return Math.asin(Math.sin(la)*Math.sin(sp.decl) + Math.cos(la)*Math.cos(sp.decl)*Math.cos(H))/RAD;
}
/* ---------- карты на Leaflet: подложка Esri, слои погоды, ветер, города ---------- */
/* тёмная подложка Esri World Dark Gray: бесплатна и без ключа (CARTO с осени 2026 требует ключ) */
const BASE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const BASE_ATTR = 'Powered by <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> · Esri, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
const LV_BOUNDS = [[55.66, 20.95], [58.09, 28.25]];
const MAP_LAYERS = ['clouds', 'precip', 'temp'];
const MAP_KEY = {clouds:'cloud_cover', precip:'precipitation', temp:'temperature_2m'};
let windOn = store.get('wx_wind', true) !== false;
const hasL = () => typeof L !== 'undefined' && !!L.map;
const reducedMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

function makeMap(el) {
  if (!hasL() || !el) return null;
  const mobile = !!(L.Browser && L.Browser.mobile);
  const map = L.map(el, {zoomSnap:.25, zoomDelta:.5, minZoom:5.5, maxZoom:10, scrollWheelZoom:false, dragging:!mobile, tap:false,
    maxBounds:[[53.4, 17], [60.4, 32.5]], maxBoundsViscosity:.9, attributionControl:true, zoomControl:true, fadeAnimation:true});
  map.attributionControl.setPrefix(false);
  L.tileLayer(BASE_URL, {maxNativeZoom:16, maxZoom:12, attribution:BASE_ATTR, className:'basemap'}).addTo(map);
  /* границы поверх погоды: Латвия — подсвеченной линией, соседи — тонкими (Natural Earth) */
  if (typeof LV_BORDERS !== 'undefined') {
    const bp = map.createPane('borders'); bp.style.zIndex = 380; bp.style.pointerEvents = 'none';
    LV_BORDERS.other.forEach(l => L.polyline(l, {pane:'borders', color:'#d5e2ee', weight:1, opacity:.5, interactive:false, lineJoin:'round'}).addTo(map));
    LV_BORDERS.lv.forEach(r => {
      L.polyline(r, {pane:'borders', color:'#ffb547', weight:8, opacity:.14, interactive:false, lineJoin:'round'}).addTo(map);
      L.polyline(r, {pane:'borders', color:'#0a1522', weight:3.6, opacity:.55, interactive:false, lineJoin:'round'}).addTo(map);
      L.polyline(r, {pane:'borders', color:'#ffd27a', weight:1.8, opacity:.95, interactive:false, lineJoin:'round'}).addTo(map);
    });
  }
  map._fitLV = () => { map.invalidateSize(); map.fitBounds(LV_BOUNDS, {padding:[4, 4], animate:false}); map._fitZ = map.getZoom(); };
  map._fitLV();
  /* на телефоне карта не перехватывает прокрутку страницы: двигать можно после приближения двумя пальцами */
  if (mobile) map.on('zoomend', () => { const on = map.getZoom() > (map._fitZ ?? 0) + .2; on ? map.dragging.enable() : map.dragging.disable(); });
  map.on('click', e => newSel({pt:true, lat:e.latlng.lat, lon:e.latlng.lng}));
  let touched = false; map.on('zoomstart dragstart', () => { touched = true; });
  try { new ResizeObserver(() => { if (!touched) map._fitLV(); else map.invalidateSize(); }).observe(el); } catch (e) {}
  return map;
}

/* поля погоды по сетке 6×9 точек */
/* плавная (бикубическая, Катмулл — Ром) интерполяция между точками сетки: без «квадратов» */
const cr = (p0, p1, p2, p3, t) => p1 + .5*t*(p2 - p0 + t*(2*p0 - 5*p1 + 4*p2 - p3 + t*(3*(p1 - p2) + p3 - p0)));
function gridVal(f, lat, lon) {
  const gi = clamp((lat - A0)/(A1 - A0), 0, 1)*(NLAT - 1), i1 = Math.min(Math.floor(gi), NLAT - 2), fi = gi - i1;
  const gj = clamp((lon - L0)/(L1 - L0), 0, 1)*(NLON - 1), j1 = Math.min(Math.floor(gj), NLON - 2), fj = gj - j1;
  const row = i => { const r = f[clamp(i, 0, NLAT - 1)], c = j => r[clamp(j, 0, NLON - 1)]; return cr(c(j1 - 1), c(j1), c(j1 + 1), c(j1 + 2), fj); };
  return cr(row(i1 - 1), row(i1), row(i1 + 1), row(i1 + 2), fi);
}
function windField(p) {
  const h0 = Math.min(Math.floor(p), gridN - 1), h1 = Math.min(h0 + 1, gridN - 1), f = p - h0;
  const U = [], V = [];
  for (let i = 0; i < NLAT; i++) { U.push([]); V.push([]);
    for (let j = 0; j < NLON; j++) {
      const hh = grid[i*NLON + j].hourly, uv = h => { const s = hh.wind_speed_10m ? hh.wind_speed_10m[h] ?? 0 : 0, d = (hh.wind_direction_10m ? hh.wind_direction_10m[h] ?? 0 : 0)*RAD; return [-s*Math.sin(d), -s*Math.cos(d)]; };
      const a = uv(h0), b = uv(h1); U[i].push(a[0]*(1 - f) + b[0]*f); V[i].push(a[1]*(1 - f) + b[1]*f);
    }
  }
  return {U, V};
}
const PRECIP_STOPS = [[0.02, [120, 200, 255, .0]], [0.3, [120, 200, 255, .34]], [0.6, [70, 160, 255, .5]], [2, [70, 100, 240, .62]], [5, [150, 70, 225, .74]], [10, [235, 70, 160, .85]]];
function precipColor(v) {
  if (v <= PRECIP_STOPS[0][0]) return [0, 0, 0, 0];
  for (let i = 1; i < PRECIP_STOPS.length; i++) {
    const [b, cb] = PRECIP_STOPS[i], [a, ca] = PRECIP_STOPS[i - 1];
    if (v <= b) { const f = (v - a)/(b - a); return ca.map((x, k) => x + (cb[k] - x)*f); }
  }
  return PRECIP_STOPS[PRECIP_STOPS.length - 1][1];
}
const rgbOf = s => { const m = s.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : [143, 166, 186]; };

const WM = {map:null, pane:null, fc:null, pc:null, dpr:1, W:0, H:0, img:document.createElement('canvas'), nimg:document.createElement('canvas'),
  fieldKey:'', mean:null, markers:{}, pin:null, route:null, routeKey:'', parts:[], vel:null, velKey:'', velPos:-1, raf:0, visible:true, last:0, layoutKey:''};
WM.img.width = WM.nimg.width = 180; WM.img.height = WM.nimg.height = 120;

function wmInit() {
  if (WM.map) return true;
  const map = makeMap($('map')); if (!map) return false;
  WM.map = map;
  const pane = map.createPane('wx'); pane.style.zIndex = 350; pane.style.pointerEvents = 'none'; WM.pane = pane;
  WM.fc = document.createElement('canvas'); WM.pc = document.createElement('canvas');
  [WM.fc, WM.pc].forEach(c => { c.className = 'wxc'; pane.appendChild(c); });
  map.on('move', () => { wmFrame(); wmClearParts(); WM.velKey = ''; });
  map.on('resize', () => { wmSize(); wmFrame(); WM.velKey = ''; wmLayout(); });
  map.on('zoomstart', () => pane.classList.add('zooming'));
  map.on('zoomend', () => { pane.classList.remove('zooming'); wmSize(); wmFrame(); WM.velKey = ''; wmLayout(); });
  try { new IntersectionObserver(es => { WM.visible = es[0].isIntersecting; wmKick(); }).observe($('map')); } catch (e) {}
  document.addEventListener('visibilitychange', wmKick);
  wmSize();
  return true;
}
function wmSize() {
  const s = WM.map.getSize(); WM.dpr = Math.min(window.devicePixelRatio || 1, 2); WM.W = s.x; WM.H = s.y;
  [WM.fc, WM.pc].forEach(c => { c.width = Math.round(s.x*WM.dpr); c.height = Math.round(s.y*WM.dpr); c.style.width = s.x + 'px'; c.style.height = s.y + 'px';
    c.getContext('2d').setTransform(WM.dpr, 0, 0, WM.dpr, 0, 0); });
}
function wmPlace() { const p = WM.map.containerPointToLayerPoint([0, 0]); L.DomUtil.setPosition(WM.fc, p); L.DomUtil.setPosition(WM.pc, p); }
function wmRect() {
  const a = WM.map.latLngToContainerPoint([A1, L0]), b = WM.map.latLngToContainerPoint([A0, L1]);
  return {x:a.x, y:a.y, w:b.x - a.x, h:b.y - a.y};
}
/* растр поля: строки по меркатору, как у подложки; края плавно растворяются */
function wmBuildField(ms) {
  const IW = WM.img.width, IH = WM.img.height, sp = sunParams(ms), key = MAP_KEY[layer];
  const f = fieldAt(key, pos), c1 = WM.img.getContext('2d'), c2 = WM.nimg.getContext('2d');
  const im = c1.createImageData(IW, IH), nm = c2.createImageData(IW, IH);
  let sum = 0;
  for (let y = 0; y < IH; y++) {
    const m = M0 - (y + .5)/IH*(M0 - M1), lat = (2*Math.atan(Math.exp(m)) - Math.PI/2)/RAD;
    for (let x = 0; x < IW; x++) {
      const lon = L0 + (x + .5)/IW*(L1 - L0), v = gridVal(f, lat, lon), p = (y*IW + x)*4;
      const edge = Math.min(x, IW - 1 - x, y, IH - 1 - y)/(IW*0.07), fe = clamp(edge, 0, 1), feather = fe*fe*(3 - 2*fe);
      let r, g, b, a;
      let k = clamp((sunElev(sp, lat, lon) + 6)/12, 0, 1); k = k*k*(3 - 2*k);
      if (layer === 'clouds') { const tt = clamp(v/100, 0, 1); r = 128 + 112*k; g = 142 + 104*k; b = 170 + 82*k; a = Math.pow(tt, 1.15)*.8; }
      else if (layer === 'precip') { [r, g, b, a] = precipColor(v); }
      else { [r, g, b] = rgbOf(tempColor(v)); a = .5; }
      im.data[p] = r; im.data[p + 1] = g; im.data[p + 2] = b; im.data[p + 3] = Math.round(255*a*feather);
      nm.data[p] = 0; nm.data[p + 1] = 4; nm.data[p + 2] = 22; nm.data[p + 3] = Math.round((1 - k)*80*feather);
    }
  }
  c1.putImageData(im, 0, 0); c2.putImageData(nm, 0, 0);
  let cnt = 0;
  for (let i = 0; i < NLAT; i++) for (let j = 0; j < NLON; j++) if (inLV(lats[i], lons[j])) { sum += f[i][j]; cnt++; }
  WM.mean = cnt ? sum/cnt : null;
}
/* бесшовный шум (несколько октав) — фактура облаков и осадков */
function makeNoise(size, cells, lo, hi, seed) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d'), im = ctx.createImageData(size, size), acc = new Float32Array(size*size);
  let sd = seed; const rnd = () => { sd = (sd*16807) % 2147483647; return sd/2147483647; };
  let amp = 1, tot = 0;
  for (let o = 0; o < 4; o++) {
    const n = cells << o, g = Array.from({length:n*n}, rnd), st = size/n;
    for (let y = 0; y < size; y++) {
      const gy = y/st, y0 = Math.floor(gy), fy = gy - y0, sy = fy*fy*(3 - 2*fy), y1 = (y0 + 1) % n;
      for (let x = 0; x < size; x++) {
        const gx = x/st, x0 = Math.floor(gx), fx = gx - x0, sx = fx*fx*(3 - 2*fx), x1 = (x0 + 1) % n;
        const a = g[y0*n + x0]*(1 - sx) + g[y0*n + x1]*sx, b = g[y1*n + x0]*(1 - sx) + g[y1*n + x1]*sx;
        acc[y*size + x] += (a*(1 - sy) + b*sy)*amp;
      }
    }
    tot += amp; amp *= .5;
  }
  for (let i = 0; i < size*size; i++) {
    let v = acc[i]/tot; v = clamp((v - .28)/.5, 0, 1); v = v*v*(3 - 2*v);
    im.data[i*4] = im.data[i*4 + 1] = im.data[i*4 + 2] = 255; im.data[i*4 + 3] = Math.round(255*(lo + (hi - lo)*v));
  }
  ctx.putImageData(im, 0, 0);
  return cv;
}
function wmTex() {
  if (WM.tex) return WM.tex;
  const c = WM.fc.getContext('2d');
  WM.tex = {a:c.createPattern(makeNoise(256, 4, .5, 1, 7), 'repeat'), b:c.createPattern(makeNoise(256, 8, .62, 1, 31), 'repeat'),
    p:c.createPattern(makeNoise(256, 6, .72, 1, 13), 'repeat'), ox:0, oy:0, ox2:0, oy2:0, last:0};
  WM.tmp = document.createElement('canvas');
  return WM.tex;
}
function wmFrame(ts) {
  if (!WM.map) return;
  wmPlace();
  const c = WM.fc.getContext('2d'); c.clearRect(0, 0, WM.W, WM.H);
  if (!grid) return;
  const r = wmRect(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.drawImage(WM.nimg, r.x, r.y, r.w, r.h);
  if (layer === 'temp') { c.drawImage(WM.img, r.x, r.y, r.w, r.h); return; }
  /* облака и осадки: поле × движущаяся фактура */
  const T = wmTex(), now = ts || performance.now(), dt = T.last ? Math.min(.1, (now - T.last)/1000) : 0; T.last = now;
  const w = WM.wmean || {u:3, v:0}, sp = layer === 'clouds' ? 2.2 : 3;
  T.ox -= w.u*sp*dt; T.oy += w.v*sp*dt; T.ox2 -= w.u*sp*1.6*dt; T.oy2 += w.v*sp*1.6*dt;
  const tc = WM.tmp; if (tc.width !== WM.fc.width || tc.height !== WM.fc.height) { tc.width = WM.fc.width; tc.height = WM.fc.height; }
  const t = tc.getContext('2d'); t.setTransform(WM.dpr, 0, 0, WM.dpr, 0, 0);
  t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, WM.W, WM.H);
  t.imageSmoothingEnabled = true; t.filter = `blur(${layer === 'precip' ? 6 : 3}px)`; t.drawImage(WM.img, r.x, r.y, r.w, r.h); t.filter = 'none';
  t.globalCompositeOperation = 'destination-in';
  const z = Math.pow(2, (WM.map.getZoom() - 6.2)*.6), mod = (v, m) => ((v % m) + m) % m;
  const layerFill = (pat, ox, oy, sc) => { t.save(); t.translate(mod(ox, 256*sc), mod(oy, 256*sc)); t.scale(sc, sc); t.fillStyle = pat;
    t.fillRect(-256, -256, WM.W/sc + 512, WM.H/sc + 512); t.restore(); };
  if (layer === 'clouds') { layerFill(T.a, T.ox, T.oy, 1.3*z); layerFill(T.b, T.ox2, T.oy2, .8*z); }
  else layerFill(T.p, T.ox, T.oy, 1.1*z);
  t.globalCompositeOperation = 'source-over';
  c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(tc, 0, 0); c.setTransform(WM.dpr, 0, 0, WM.dpr, 0, 0);
}

/* ветер: частицы, которые текут по полю ветра (как в больших погодных приложениях) */
function wmClearParts() { if (WM.pc) WM.pc.getContext('2d').clearRect(0, 0, WM.W, WM.H); }
function wmVel() {
  const W = WM.W, H = WM.H, step = 12, cols = Math.ceil(W/step) + 2, rows = Math.ceil(H/step) + 2;
  const {U, V} = windField(pos), k = .17*Math.pow(2, (WM.map.getZoom() - 6.2)*.5);
  const vel = new Float32Array(cols*rows*2).fill(NaN);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const ll = WM.map.containerPointToLatLng([c*step, r*step]);
    if (ll.lat < A0 || ll.lat > A1 || ll.lng < L0 || ll.lng > L1) continue;
    const q = (r*cols + c)*2; vel[q] = gridVal(U, ll.lat, ll.lng)*k; vel[q + 1] = -gridVal(V, ll.lat, ll.lng)*k;
  }
  WM.vel = {vel, cols, rows, step}; WM.velPos = pos;
  { let su = 0, sv = 0, n = 0; for (let i = 0; i < NLAT; i++) for (let j = 0; j < NLON; j++) if (inLV(lats[i], lons[j])) { su += U[i][j]; sv += V[i][j]; n++; }
    WM.wmean = n ? {u:su/n, v:sv/n} : {u:3, v:0}; }
  const rr = wmRect(), x0 = Math.max(0, rr.x), y0 = Math.max(0, rr.y), x1 = Math.min(W, rr.x + rr.w), y1 = Math.min(H, rr.y + rr.h);
  WM.spawn = {x0, y0, w:Math.max(1, x1 - x0), h:Math.max(1, y1 - y0)};
  const n = Math.min(1100, Math.round(WM.spawn.w*WM.spawn.h/430));
  WM.parts = Array.from({length:n}, () => wmSpawn({}));
}
function wmSpawn(p) { const s = WM.spawn; p.x = s.x0 + Math.random()*s.w; p.y = s.y0 + Math.random()*s.h; p.age = Math.floor(Math.random()*70); p.max = 50 + Math.random()*60; return p; }
function velAt(x, y) {
  const V = WM.vel, c = x/V.step, r = y/V.step, c0 = Math.floor(c), r0 = Math.floor(r);
  if (c0 < 0 || r0 < 0 || c0 >= V.cols - 1 || r0 >= V.rows - 1) return null;
  const fx = c - c0, fy = r - r0, g = (rr, cc, o) => V.vel[(rr*V.cols + cc)*2 + o];
  const a = g(r0, c0, 0); if (Number.isNaN(a)) return null;
  const pick = o => { const v00 = g(r0, c0, o), v01 = g(r0, c0 + 1, o), v10 = g(r0 + 1, c0, o), v11 = g(r0 + 1, c0 + 1, o);
    if ([v01, v10, v11].some(Number.isNaN)) return v00; return (v00*(1 - fx) + v01*fx)*(1 - fy) + (v10*(1 - fx) + v11*fx)*fy; };
  return [pick(0), pick(1)];
}
function wmParticles(fade) {
  const c = WM.pc.getContext('2d');
  if (fade) { c.globalCompositeOperation = 'destination-in'; c.fillStyle = 'rgba(0,0,0,.86)'; c.fillRect(0, 0, WM.W, WM.H); c.globalCompositeOperation = 'source-over'; }
  c.lineWidth = 1; c.lineCap = 'round'; c.strokeStyle = layer === 'clouds' ? 'rgba(170,220,255,.7)' : 'rgba(255,255,255,.72)';
  c.beginPath();
  WM.parts.forEach(p => {
    const v = velAt(p.x, p.y);
    if (!v || ++p.age > p.max) { wmSpawn(p); p.age = 0; return; }
    const nx = p.x + v[0], ny = p.y + v[1];
    c.moveTo(p.x, p.y); c.lineTo(nx, ny); p.x = nx; p.y = ny;
  });
  c.stroke();
}
const animTex = () => layer !== 'temp';
function wmLoop(ts) {
  WM.raf = 0;
  if (!grid || !WM.visible || document.hidden || reducedMotion() || (!windOn && !animTex())) return;
  if (ts - WM.last >= 33) {
    WM.last = ts;
    if (!WM.velKey || Math.abs(WM.velPos - pos) > .05) { WM.velKey = 'ok'; wmVel(); wmClearParts(); }
    if (animTex()) wmFrame(ts);
    if (windOn) wmParticles(true);
  }
  WM.raf = requestAnimationFrame(wmLoop);
}
function wmKick() {
  if (!WM.map) return;
  if (!grid) return;
  if (!windOn) wmClearParts();
  if (reducedMotion()) { wmVel(); wmFrame(); wmClearParts(); if (windOn) { for (let i = 0; i < 26; i++) wmParticles(false); } WM.velKey = 'ok'; return; }
  if (!WM.raf && WM.visible && !document.hidden) WM.raf = requestAnimationFrame(wmLoop);
}

/* города: «таблетки» с анимированным значком; при тесноте — компактные точки */
const CITY_PRIO = id => { const i = CITY_IDS.indexOf(id); return i < 0 ? 50 : i; };
function cityHtml(p, cw, ms, mode) {
  mode = mode || {};
  if (mode.gone) return '<div class="cm gone"></div>';
  const compact = mode.mini, isSel = samePlace(p, sel), day = sunElev(sunParams(ms), p.lat, p.lon) > 0 ? 1 : 0;
  const cls = 'cm' + (cw && cw.warn ? ' warn' : '') + (isSel ? ' sel' : '') + (p.fav ? ' fav' : '') + (compact ? ' mini' : '') + (mode.al ? ' cm-l' : mode.ar ? ' cm-r' : '');
  if (!cw) return `<div class="${cls}"><small>${esc(placeName(p))}</small></div>`;
  if (compact) return `<div class="${cls}" title="${esc(placeName(p))}"><i style="background:${tempColor(cw.T)}"></i><b>${fmt(cw.T)}</b></div>`;
  return `<div class="${cls}"><span class="cm-i">${typeof wxIcon === 'function' ? wxIcon(cw.code, day, 24) : wmo(cw.code)[1]}</span><b>${fmt(cw.T)}</b><small>${esc(placeName(p))}${cw.warn ? ' ⚠' : ''}</small></div>`;
}
function wmLayout() {
  if (!WM.map) return;
  /* простое «избегание столкновений»: важные места рисуются целиком, соседние — компактно */
  const list = PLACES.filter(p => !p.hide).map(p => ({p, k:placeKey(p), pr:samePlace(p, sel) ? -2 : p.fav ? -1 : CITY_PRIO(p.id)})).sort((a, b) => a.pr - b.pr);
  const boxes = [], compact = {}, W = WM.map.getSize().x;
  const hits = b => boxes.some(q => b.x0 < q.x1 && b.x1 > q.x0 && b.y0 < q.y1 && b.y1 > q.y0);
  const place = (pt, w, h) => {   /* у краёв метка прижимается внутрь карты */
    let x0 = pt.x - w/2, al = false, ar = false;
    if (x0 < 4) { x0 = pt.x - 14; al = true; } else if (x0 + w > W - 4) { x0 = pt.x - w + 14; ar = true; }
    return {x0, x1:x0 + w, y0:pt.y - h/2, y1:pt.y + h/2, al, ar};
  };
  list.forEach(o => {
    const pt = WM.map.latLngToContainerPoint([o.p.lat, o.p.lon]);
    const full = place(pt, 64 + placeName(o.p).length*6.4, 30);
    if (!hits(full)) { boxes.push(full); compact[o.k] = {al:full.al, ar:full.ar}; return; }
    const mini = place(pt, 54, 22);
    if (!hits(mini)) { boxes.push(mini); compact[o.k] = {mini:true, al:mini.al, ar:mini.ar}; return; }
    compact[o.k] = {gone:true};
  });
  WM.compact = compact; WM.layoutKey = '';
  wmMarkers(true);
}
function wmMarkers(force) {
  if (!WM.map) return;
  const ms = gridBase ? gridBase + pos*36e5 : Date.now(), seen = {};
  if (!WM.compact) { WM.compact = {}; setTimeout(wmLayout, 0); }
  PLACES.forEach(p => {
    if (p.hide) return;
    const k = placeKey(p), cw = cityAt(p, pos); seen[k] = 1;
    const html = cityHtml(p, cw, ms, WM.compact[k]);
    let m = WM.markers[k];
    if (!m) {
      m = L.marker([p.lat, p.lon], {icon:L.divIcon({className:'cmw', html, iconSize:null}), keyboard:false, riseOnHover:true, zIndexOffset:samePlace(p, sel) ? 1000 : 0})
        .on('click', () => newSel(p.id ? {id:p.id, lat:p.lat, lon:p.lon} : {name:p.name, lat:p.lat, lon:p.lon}));
      m._html = html; m.addTo(WM.map); WM.markers[k] = m;
    } else if (m._html !== html || force) {
      if (m._html !== html) { m.setIcon(L.divIcon({className:'cmw', html, iconSize:null})); m._html = html; }
      m.setZIndexOffset(samePlace(p, sel) ? 1000 : WM.compact[k] && WM.compact[k].mini ? -100 : 0);
    }
  });
  Object.keys(WM.markers).forEach(k => { if (!seen[k]) { WM.map.removeLayer(WM.markers[k]); delete WM.markers[k]; } });
  /* выбранная точка, если это не город */
  const isCity = PLACES.some(p => !p.hide && samePlace(p, sel));
  if (!isCity) {
    if (!WM.pin) WM.pin = L.marker([sel.lat, sel.lon], {icon:L.divIcon({className:'cmw', html:'<div class="pin"></div>', iconSize:null}), interactive:false, zIndexOffset:2000}).addTo(WM.map);
    else WM.pin.setLatLng([sel.lat, sel.lon]);
  } else if (WM.pin) { WM.map.removeLayer(WM.pin); WM.pin = null; }
}
const LV_COL = ['#4ade80', '#ffb547', '#ff6b4a'];
function wmRoute() {
  const ok = roadRes && roadRes.evals && roadState === 'ok';
  const key = ok ? roadRes.key + ':' + roadRes.evals.map(e => e.lvl).join('') : '';
  if (key === WM.routeKey) return;
  WM.routeKey = key;
  if (WM.route) { WM.map.removeLayer(WM.route); WM.route = null; }
  if (!ok) return;
  const g = L.layerGroup(), P = roadRes.pts, ev = roadRes.evals, ll = P.map(q => [q.lat, q.lon]);
  L.polyline(ll, {color:'#0a1522', weight:9, opacity:.55, interactive:false, lineCap:'round', lineJoin:'round'}).addTo(g);
  for (let i = 0; i < P.length - 1; i++)
    L.polyline([ll[i], ll[i + 1]], {color:LV_COL[Math.max(ev[i].lvl, ev[i + 1].lvl)], weight:4.5, opacity:.95, interactive:false, lineCap:'round', className:'route-seg'}).addTo(g);
  WM.route = g.addTo(WM.map);
}
function mapLegend() {
  const el = $('mlegend'); if (!el) return;
  let h;
  if (layer === 'clouds') h = `<span>${esc(t('clear'))}</span><i style="background:linear-gradient(90deg,rgba(236,243,250,.05),rgba(236,243,250,.9))"></i><span>${esc(t('overcast'))}</span>`;
  else if (layer === 'precip') h = `<span>0.1</span><i style="background:linear-gradient(90deg,rgba(120,200,255,.35),rgb(70,160,255) 30%,rgb(70,100,240) 55%,rgb(150,70,225) 78%,rgb(235,70,160))"></i><span>10+ ${esc(t('mmh'))}</span>`;
  else { const a = TSTOPS[0][0], b = TSTOPS[TSTOPS.length - 1][0];
    h = `<span>${fmt(a)}</span><i style="background:linear-gradient(90deg,${TSTOPS.map(([v, c]) => `${c} ${((v - a)/(b - a)*100).toFixed(1)}%`).join(',')})"></i><span>+${b}°</span>`; }
  if (windOn) h += `<em>〰 ${esc(t('windLines'))}</em>`;
  el.innerHTML = h;
}

/* ---------- карта погоды: перерисовка (вызывается и каждую секунду — тяжёлое только при изменениях) ---------- */
function draw() {
  if (!wmInit()) return;
  const ms = gridBase ? gridBase + pos*36e5 : Date.now();
  if (grid) {
    const fk = layer + '|' + pos.toFixed(2) + '|' + stamp.grid;
    if (fk !== WM.fieldKey) { WM.fieldKey = fk; wmBuildField(ms); wmFrame(); }
  }
  wmMarkers(false); wmRoute(); wmKick();
  if (gridBase) {
    const e = sunElev(sunParams(ms), 56.95, 24.1), phase = t('phase')[e > 3 ? 0 : e > -6 ? 1 : 2];
    $('when').textContent = new Date(ms).toLocaleString(LOC, {timeZone:TZ, weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:false}) + '  ' + phase;
    const mi = moonInfo(ms), mean = WM.mean;
    const mtxt = mean === null ? '' : layer === 'clouds' ? t('meanClouds', {c:Math.round(mean)}) : layer === 'precip' ? t('meanPrecip', {v:mean.toFixed(1)}) : t('meanTemp', {v:fmt(mean)});
    $('mean').textContent = mtxt + t('moonShort', {e:mi.emoji, p:Math.round(mi.frac*100)});
    const on = Math.round(pos);
    if (on !== WM.stripOn) { WM.stripOn = on; document.querySelectorAll('#strip i').forEach((el, n) => el.classList.toggle('on', n === on)); }
  }
}

function setLive(v) { live = v; $('nowbtn').setAttribute('aria-pressed', v); if (v) { stopPlay(); if (gridBase) { pos = posNow(); $('slider').value = pos; } } draw(); }
function buildStrip() {
  if (!grid) return;
  const times = grid[0].hourly.time, s = $('strip'), key = MAP_KEY[layer];
  const lvIdx = grid.map((_, ix) => ix).filter(ix => inLV(lats[Math.floor(ix/NLON)], lons[ix % NLON]));
  const means = times.map((_, h) => lvIdx.reduce((a, ix) => a + (grid[ix].hourly[key] ? grid[ix].hourly[key][h] ?? 0 : 0), 0)/Math.max(1, lvIdx.length));
  const lo = Math.min(...means), hi = Math.max(...means);
  const hgt = v => layer === 'clouds' ? v*0.38 : layer === 'precip' ? Math.min(38, v*30) : 4 + (v - lo)/Math.max(hi - lo, 1)*34;
  s.style.gridTemplateColumns = `repeat(${times.length},1fr)`;
  s.innerHTML = means.map(v => `<i style="height:${Math.max(3, hgt(v)).toFixed(1)}px${layer === 'temp' ? `;background:${tempColor(v)};opacity:.55` : ''}"></i>`).join('');
  WM.stripOn = -1;
  $('d3').innerHTML = Array.from({length:times.length/24}, (_, n) => `<span>${dFmt(times[n*24], {weekday:'short', day:'numeric', month:'short'})}</span>`).join('');
  mapLegend();
}
$('slider').addEventListener('input', e => { setLive(false); pos = +e.target.value; draw(); });
$('nowbtn').addEventListener('click', () => setLive(true));
function stopPlay() { clearInterval(playTimer); playTimer = null; $('play').textContent = '▶'; $('play').setAttribute('aria-label', t('play')); }
$('play').addEventListener('click', () => {
  if (playTimer) return stopPlay();
  setLive(false);
  $('play').textContent = '❚❚'; $('play').setAttribute('aria-label', t('stop'));
  playTimer = setInterval(() => { pos += 0.25; if (pos > gridN - 1) pos = 0; $('slider').value = pos; draw(); }, 110);
});
function buildLayers() {
  const box = $('layers'); box.innerHTML = '';
  MAP_LAYERS.forEach(k => {
    const b = document.createElement('button'); b.textContent = t('ml')[k]; b.setAttribute('aria-pressed', k === layer);
    b.onclick = () => { layer = k; store.set('wx_layer', k); buildLayers(); buildStrip(); WM.fieldKey = ''; draw(); };
    box.appendChild(b);
  });
  const w = document.createElement('button'); w.className = 'tog'; w.textContent = '〰 ' + t('ml').wind; w.setAttribute('aria-pressed', windOn);
  w.onclick = () => { windOn = !windOn; store.set('wx_wind', windOn); buildLayers(); mapLegend(); wmKick(); };
  box.appendChild(w);
  mapLegend();
}

/* ---------- радар осадков: RainViewer на той же подложке, плавная смена кадров ---------- */
const radar = {frames:[], host:'', idx:0, err:false, timer:null};
const RM = {map:null, layers:[], sig:'', pin:null, dots:null};
async function loadRadar() {
  stamp.radar = Date.now();
  try {
    const j = await getJSON('https://api.rainviewer.com/public/weather-maps.json');
    const past = (j.radar && j.radar.past) || [];
    if (!past.length) throw new Error('no frames');
    const keep = radar.timer;
    radar.host = j.host; radar.frames = past; radar.err = false;
    if (!keep) { radar.idx = past.length - 1; }
    $('rslider').max = past.length - 1; $('rslider').value = radar.idx;
  } catch (e) { radar.err = true; }
  drawRadar();
}
function rmInit() {
  if (RM.map) return true;
  const map = makeMap($('radar')); if (!map) return false;
  RM.map = map;
  RM.dots = L.layerGroup().addTo(map);
  return true;
}
function drawRadar() {
  if (!rmInit()) return;
  const n = radar.frames.length, sig = radar.host + radar.frames.map(f => f.path).join(',');
  if (sig !== RM.sig) {
    RM.layers.forEach(l => RM.map.removeLayer(l)); RM.sig = sig;
    RM.layers = radar.frames.map(f => L.tileLayer(`${radar.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`,
      {maxNativeZoom:7, maxZoom:10, opacity:0, className:'rvl', zIndex:5, attribution:'<a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer">RainViewer</a>'}));
  }
  RM.layers.forEach((ly, i) => {
    const cur = i === radar.idx, next = n && i === (radar.idx + 1) % n;
    if ((cur || next) && !RM.map.hasLayer(ly)) ly.addTo(RM.map);
    if (RM.map.hasLayer(ly)) ly.setOpacity(cur ? .9 : 0);
  });
  /* подписи городов и выбранная точка */
  const dk = PLACES.map(p => placeKey(p)).join() + '|' + selKey() + '|' + lang;
  if (dk !== RM.dotsKey) {
    RM.dotsKey = dk; RM.dots.clearLayers();
    PLACES.filter(p => !p.hide).forEach(p => L.marker([p.lat, p.lon], {icon:L.divIcon({className:'cmw', html:`<div class="rdot${samePlace(p, sel) ? ' sel' : ''}"><i></i>${esc(placeName(p))}</div>`, iconSize:null}), keyboard:false})
      .on('click', () => newSel(p.id ? {id:p.id, lat:p.lat, lon:p.lon} : {name:p.name, lat:p.lat, lon:p.lon})).addTo(RM.dots));
    if (!PLACES.some(p => !p.hide && samePlace(p, sel))) L.marker([sel.lat, sel.lon], {icon:L.divIcon({className:'cmw', html:'<div class="pin"></div>', iconSize:null}), interactive:false, zIndexOffset:2000}).addTo(RM.dots);
  }
  const f = radar.frames[radar.idx];
  if (radar.err) $('rwhen').textContent = t('radarNA');
  else if (f) {
    const ago = Math.max(0, Math.round((Date.now() - f.time*1000)/6e4));
    $('rwhen').textContent = hhmm(f.time*1000) + (ago > 1 ? t('agoMin', {n:ago}) : t('justNow'));
  } else $('rwhen').textContent = t('radarLoading');
}
$('rslider').addEventListener('input', e => { stopRadar(); radar.idx = +e.target.value; drawRadar(); });
function stopRadar() { clearInterval(radar.timer); radar.timer = null; $('rplay').textContent = '▶'; }
$('rplay').addEventListener('click', () => {
  if (radar.timer) return stopRadar();
  if (!radar.frames.length) return;
  $('rplay').textContent = '❚❚';
  radar.timer = setInterval(() => { radar.idx = (radar.idx + 1) % radar.frames.length; $('rslider').value = radar.idx; drawRadar(); }, 650);
});

async function loadNowcast() {
  const key = selKey(); stamp.now = Date.now();
  try {
    const j = await getJSON(`${API}?${pointQS()}&minutely_15=precipitation&forecast_minutely_15=16`);
    if (key !== selKey()) return;
    const m = j.minutely_15; if (!m || !m.precipitation) throw new Error('no data');
    const base = Date.parse(m.time[0] + ':00Z') - j.utc_offset_seconds*1000, i0 = clamp(Math.floor((Date.now() - base)/9e5), 0, m.time.length - 1);
    nowcast = {p:m.precipitation.slice(i0, i0 + 12)};
  } catch (e) { nowcast = false; }
  renderNowcast();
}
function renderNowcast() {
  const el = $('nowt'), b = $('nowbars');
  if (nowcast === null) return;
  if (!nowcast || !nowcast.p.length) { el.textContent = t('ncNA'); b.innerHTML = ''; return; }
  const p = nowcast.p, wet = v => (v ?? 0) >= 0.1, first = p.findIndex(wet), mx = Math.max(...p.map(v => v ?? 0));
  let txt;
  if (!wet(p[0])) txt = first === -1 ? t('ncDry') : t('ncStart', {m:first*15, v:mx.toFixed(1)});
  else { const end = p.findIndex((v, i) => i > 0 && !wet(v)); txt = end === -1 ? t('ncAll') : t('ncEnd', {m:end*15}); }
  el.textContent = txt;
  b.innerHTML = p.map(v => `<i style="height:${Math.min(100, (v ?? 0) > 0 ? 8 + (v ?? 0)*70 : 4)}%"></i>`).join('');
}

/* ---------- море и волны ---------- */
const COAST = [['jurmala', 57.00, 23.78], ['liepaja', 56.52, 20.97], ['ventspils', 57.41, 21.50]];
let sea = null;
async function loadSea() {
  stamp.sea = Date.now();
  const q = 'current=wave_height,wave_direction,wave_period,sea_surface_temperature&hourly=wave_height&forecast_days=2&timezone=' + ENC_TZ;
  sea = await Promise.all(COAST.map(([, la, lo]) => getJSON(`${MARINE_API}?latitude=${la}&longitude=${lo}&${q}`).catch(() => null)));
  renderSea();
}
function renderSea() {
  const el = $('seaOut');
  if (!sea) return;
  if (sea.every(x => !x)) { el.innerHTML = `<div class="ok">${t('seaNA')}</div>`; return; }
  el.innerHTML = COAST.map(([id], i) => {
    const r = sea[i], c = r && r.current;
    if (!c) return `<div class="sr"><div class="nm">${townName(id)}</div><div class="wt">—</div><div class="wv">${t('seaNA')}</div></div>`;
    const hw = c.wave_height, st = hw == null ? '' : t('seaState')[hw < 0.5 ? 0 : hw < 1.25 ? 1 : hw < 2.5 ? 2 : 3];
    let mx = null;
    if (r.hourly && r.hourly.wave_height) {
      const base = Date.parse(r.hourly.time[0] + ':00Z') - r.utc_offset_seconds*1000, i0 = clamp(Math.floor((Date.now() - base)/36e5), 0, r.hourly.time.length - 1);
      const a = r.hourly.wave_height.slice(i0, i0 + 24).filter(v => v != null); if (a.length) mx = Math.max(...a);
    }
    const dir = c.wave_direction;
    return `<div class="sr"><div class="nm">${townName(id)}<small>${t('seaWater')}</small></div>
      <div class="wt">${c.sea_surface_temperature != null ? fmt(c.sea_surface_temperature) : '—'}</div>
      <div class="wv">🌊 ${hw != null ? t('visM', {v:hw.toFixed(1)}) : '—'} ${dir != null ? `<span style="display:inline-block;transform:rotate(${dir + 180}deg)">↑</span>` : ''} ${st}
        <small>${[mx != null ? t('seaMax', {v:mx.toFixed(1)}) : '', c.wave_period != null ? t('seaPeriod', {s:Math.round(c.wave_period)}) : ''].filter(Boolean).join(', ')}</small></div></div>`;
  }).join('') + `<div class="nst">${t('seaNote')}</div>`;
}

/* ---------- погода на дороге ---------- */
const SPEED = 75;
let road = Object.assign({from:'riga', to:'daugavpils', dep:0}, store.get('wx_road', {}));
let roadRes = null, roadState = 'idle';
const placeKey = p => p.id ? p.id : `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;
const placeByKey = k => PLACES.find(p => placeKey(p) === k) || null;
function hav(a, b) {
  const dLa = (b.lat - a.lat)*RAD, dLo = (b.lon - a.lon)*RAD;
  const x = Math.sin(dLa/2)**2 + Math.cos(a.lat*RAD)*Math.cos(b.lat*RAD)*Math.sin(dLo/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function routeLine(a, b) {
  if (a.id && b.id) for (const r of ROUTES) {
    const i = r.indexOf(a.id), j = r.indexOf(b.id);
    if (i >= 0 && j >= 0) {
      const seq = i < j ? r.slice(i, j + 1) : r.slice(j, i + 1).reverse();
      return {pts:seq.map(id => ({lat:TOWNS[id].lat, lon:TOWNS[id].lon, id})), straight:false};
    }
  }
  return {pts:[{lat:a.lat, lon:a.lon, id:a.id, name:a.name}, {lat:b.lat, lon:b.lon, id:b.id, name:b.name}], straight:true};
}
function densify(pts, factor) {
  const out = [Object.assign({}, pts[0], {km:0})]; let acc = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s], b = pts[s + 1], d = hav(a, b), n = Math.max(1, Math.round(d/22));
    for (let k = 1; k <= n; k++) {
      const f = k/n, p = k === n ? Object.assign({}, b) : {lat:a.lat + (b.lat - a.lat)*f, lon:a.lon + (b.lon - a.lon)*f};
      p.km = (acc + d*f)*factor; out.push(p);
    }
    acc += d;
  }
  if (out.length <= 16) return out;
  const step = Math.ceil(out.length/14);
  return out.filter((p, i) => i === 0 || i === out.length - 1 || p.id || p.name || i % step === 0);
}
function buildRoadUI() {
  const opts = PLACES.map(p => `<option value="${esc(placeKey(p))}">${esc((p.fav ? '★ ' : '') + placeName(p))}</option>`).join('');
  if (!placeByKey(road.from)) road.from = 'riga';
  if (!placeByKey(road.to)) road.to = 'daugavpils';
  $('rFrom').innerHTML = opts; $('rTo').innerHTML = opts;
  $('rFrom').value = road.from; $('rTo').value = road.to;
  const h0 = Math.floor(Date.now()/36e5)*36e5;
  $('rDep').innerHTML = Array.from({length:13}, (_, h) => `<option value="${h}">${h === 0 ? t('roadNowOpt') : `${hhmm(h0 + h*36e5)} (${t('roadIn', {h})})`}</option>`).join('');
  $('rDep').value = String(road.dep);
}
['rFrom', 'rTo', 'rDep'].forEach(id => $(id).addEventListener('change', () => {
  const prev = road.from + '>' + road.to;
  road = {from:$('rFrom').value, to:$('rTo').value, dep:+$('rDep').value};
  store.set('wx_road', road);
  if (road.from + '>' + road.to !== prev) guarded('road', loadRoad); else { renderRoad(); draw(); }
}));
async function loadRoad() {
  stamp.road = Date.now();
  const a = placeByKey(road.from), b = placeByKey(road.to);
  if (!a || !b) { roadState = 'fail'; renderRoad(); return; }
  if (samePlace(a, b)) { roadState = 'same'; roadRes = null; renderRoad(); draw(); return; }
  if (!roadRes || roadRes.key !== road.from + '>' + road.to) { roadState = 'loading'; renderRoad(); }
  const geo = routeLine(a, b), pts = densify(geo.pts, geo.straight ? 1.25 : 1.12), key = road.from + '>' + road.to;
  try {
    const j = await getJSON(`${API}?latitude=${pts.map(p => p.lat.toFixed(3)).join(',')}&longitude=${pts.map(p => p.lon.toFixed(3)).join(',')}`
      + `&hourly=temperature_2m,dew_point_2m,soil_temperature_0cm,precipitation,rain,snowfall,weather_code,visibility,wind_gusts_10m&forecast_days=2&wind_speed_unit=ms&timezone=${ENC_TZ}`);
    if (key !== road.from + '>' + road.to) return;
    const arr = Array.isArray(j) ? j : [j];
    roadRes = {key, a, b, pts, data:arr, straight:geo.straight, base:Date.parse(arr[0].hourly.time[0] + ':00Z') - arr[0].utc_offset_seconds*1000};
    roadState = 'ok';
  } catch (e) { if (!roadRes || roadRes.key !== key) roadState = 'fail'; }
  renderRoad(); draw();
}
const visFmt = v => v >= 1000 ? t('visKm', {v:(v/1000).toFixed(v < 10000 ? 1 : 0)}) : t('visM', {v:Math.round(v/10)*10});
function roadEval(h, i) {
  const T = h.temperature_2m[i], Td = h.dew_point_2m[i], Ts = h.soil_temperature_0cm[i] ?? T, pr = h.precipitation[i] ?? 0, rn = h.rain[i] ?? 0;
  const sn = h.snowfall[i] ?? 0, c = h.weather_code[i], vis = h.visibility ? h.visibility[i] : null, g = h.wind_gusts_10m[i] ?? 0;
  const r = []; let lvl = 0; const up = (l, k) => { lvl = Math.max(lvl, l); r.push(k); };
  if ([56, 57, 66, 67].includes(c)) up(2, t('rFreezeRain'));
  else if (Ts <= 0 && rn > 0) up(2, t('rIce'));
  else if (Ts <= 0.5 && (pr > 0 || sn > 0)) up(1, t('rIceRisk'));
  else if (Ts <= 0 && Td != null && T - Td <= 1) up(1, t('rFrost'));
  if (sn >= 1) up(2, t('rSnowHeavy')); else if (sn > 0) up(1, t('rSnow'));
  if (vis != null && vis < 200) up(2, t('rFog', {v:visFmt(vis)}));
  else if ((vis != null && vis < 1000) || (vis == null && (c === 45 || c === 48))) up(1, t('rFog', {v:vis != null ? visFmt(vis) : t('visKm', {v:'< 1'})}));
  if (pr >= 4 && sn === 0) up(1, t('rRain'));
  if (g >= 22) up(2, t('rWind', {g:Math.round(g)})); else if (g >= 17) up(1, t('rWind', {g:Math.round(g)}));
  return {lvl, r, T, Ts, vis, c};
}
function renderRoad() {
  const el = $('roadOut');
  if (roadState === 'same') { el.innerHTML = `<div class="ok">${t('roadSame')}</div>`; return; }
  if (roadState === 'loading' || roadState === 'idle') { el.innerHTML = `<div class="ok">${t('roadLoading')}</div>`; return; }
  if (roadState === 'fail' || !roadRes) { el.innerHTML = `<div class="ok">${t('roadFail')}</div>`; return; }
  const R = roadRes, now = Date.now(), dep = road.dep === 0 ? now : Math.floor(now/36e5)*36e5 + road.dep*36e5;
  const n = R.data[0].hourly.time.length;
  R.evals = R.pts.map((p, k) => {
    const eta = dep + p.km/SPEED*36e5, i = clamp(Math.round((eta - R.base)/36e5), 0, n - 1);
    return Object.assign(roadEval(R.data[k].hourly, i), {eta});
  });
  const last = R.pts[R.pts.length - 1], totalKm = Math.round(last.km), mins = Math.round(last.km/SPEED*60);
  const worst = Math.max(...R.evals.map(e => e.lvl));
  const label = p => p.id ? townName(p.id) : p.name ? p.name : `${t('km')} ${Math.round(p.km)}`;
  const reasons = [];
  R.evals.forEach((e, k) => e.r.forEach(x => { const base = x.split(',')[0]; if (!reasons.some(y => y.b === base)) reasons.push({b:base, s:`${x} (${label(R.pts[k])})`}); }));
  const verdict = worst === 0 ? t('roadOK') : t(worst === 2 ? 'roadDanger' : 'roadWarn', {r:reasons.slice(0, 4).map(x => x.s).join('; ')});
  el.innerHTML = `<div class="rsum">${esc(t('roadSummary', {a:placeName(R.a), b:placeName(R.b), km:totalKm, dur:t('dur', {h:Math.floor(mins/60), m:mins % 60}), t1:hhmm(dep), t2:hhmm(dep + mins*6e4)}))}
      <small>${R.straight ? t('roadStraight') : ''}</small></div>
    <div class="ok" style="margin-bottom:8px">${esc(verdict)}</div>
    <div class="rbar">${R.evals.map(e => `<i style="background:${LV_COL[e.lvl]}"></i>`).join('')}</div>
    <div class="rpts">${R.evals.map((e, k) => `<div class="rp"><span class="d" style="background:${LV_COL[e.lvl]}"></span>
      <span>${esc(label(R.pts[k]))}<br><small>${Math.round(R.pts[k].km)} ${t('km')}</small></span>
      <span>${hhmm(e.eta)}</span><span>${wmo(e.c)[1]}</span>
      <span>${fmt(e.T)} <small>${t('roadAir')}</small><br>${fmt(e.Ts)} <small>${t('roadSurf')}</small></span>
      <span class="why">${e.r.length ? esc(e.r.join(', ')) : `<small>${t('roadOkShort')}${e.vis != null ? ', ' + t('roadVis') + ' ' + visFmt(e.vis) : ''}</small>`}</span></div>`).join('')}</div>
    <div class="nst">${t('roadNote', {lvc:link(LVC_URL, 'Latvijas Valsts ceļi')})}</div>`;
}

/* ---------- официальные предупреждения LVĢMC (MeteoAlarm) ---------- */
const MA_ICON = {1:'💨',2:'🧊',3:'⛈️',4:'🌫️',5:'🥵',6:'🥶',7:'🌊',8:'🔥',9:'🏔️',10:'🌧️',12:'🌊',13:'🌧️'};
const LVL_DOT = {yellow:'🟡', orange:'🟠', red:'🔴'};
let maRaw = null, maState = 'loading';
async function loadOfficial() {
  stamp.official = Date.now();
  try { maRaw = await getJSON(MA_FEED); maState = 'ok'; } catch (e) { if (!maRaw) maState = 'fail'; }
  refreshWarnings();
}
function parseMA(j) {
  const now = Date.now(), out = [];
  (j && j.warnings || []).forEach(w => {
    const a = w && (w.alert || w); if (!a || /cancel/i.test(a.msgType || '')) return;
    const infos = Array.isArray(a.info) ? a.info : []; if (!infos.length) return;
    const lg = x => String(x.language || '').toLowerCase();
    const pick = infos.find(i => lg(i).startsWith(lang)) || infos.find(i => lg(i).startsWith(lang === 'ru' ? 'lv' : 'en')) || infos.find(i => lg(i).startsWith('en')) || infos[0];
    const par = {}; (pick.parameter || []).forEach(p => { if (p && p.valueName) par[p.valueName] = String(p.value || ''); });
    let lv = (String(par.awareness_level || '').split(';')[1] || '').trim().toLowerCase();
    if (!['yellow', 'orange', 'red'].includes(lv)) lv = ({Moderate:'yellow', Severe:'orange', Extreme:'red'})[pick.severity] || '';
    if (!lv) return;
    const typeN = parseInt(String(par.awareness_type || '').split(';')[0], 10);
    const onset = Date.parse(pick.onset || pick.effective || ''), expires = Date.parse(pick.expires || '');
    if (Number.isFinite(expires) && expires < now) return;
    const areas = (pick.area || []).map(x => x && x.areaDesc).filter(Boolean).map(String);
    const key = [lv, typeN, pick.onset, pick.expires, pick.headline].join('|');
    const e = out.find(o => o.key === key);
    if (e) { areas.forEach(x => { if (!e.areas.includes(x)) e.areas.push(x); }); return; }
    out.push({key, id:String(a.identifier || key), lv, typeN, onset, expires, event:String(pick.event || ''), headline:String(pick.headline || ''), desc:String(pick.description || ''), areas});
  });
  const rank = {red:3, orange:2, yellow:1};
  return out.sort((x, y) => rank[y.lv] - rank[x.lv] || (x.onset || 0) - (y.onset || 0));
}
const wNoWrap = s => esc(s);
const AREA_STEM = n => n.slice(0, Math.max(3, n.length - 2)).toLowerCase();
function officialList() { return maState === 'ok' && maRaw ? parseMA(maRaw) : []; }
function officialHtml() {
  if (maState === 'loading') return `<div class="ok">${t('offLoading')}</div>`;
  if (maState === 'fail') return `<div class="ok">${t('offFail', {lv:link(LVGMC_URL, 'LVĢMC'), ma:link(MA_URL, 'MeteoAlarm')})}</div>`;
  const list = officialList();
  if (!list.length) return `<div class="ok">${t('offNone')}</div>`;
  const stem = sel.id ? AREA_STEM(TOWNS[sel.id].n.lv) : null;
  return list.map(w => {
    const typeTxt = t('mtypes')[w.typeN] || w.event, here = stem && w.areas.some(a => a.toLowerCase().includes(stem));
    const areas = w.areas.length > 6 ? w.areas.slice(0, 6).join(', ') + ` +${w.areas.length - 6}` : w.areas.join(', ');
    const when = t('offFrom', {a:Number.isFinite(w.onset) ? dtFmt(w.onset) : '…', b:Number.isFinite(w.expires) ? dtFmt(w.expires) : '…'});
    const more = (w.headline || w.desc) ? `<details><summary>${t('offMore')}</summary>${wNoWrap(w.headline)}${w.headline && w.desc ? '. ' : ''}${wNoWrap(w.desc)}</details>` : '';
    return `<div class="oi ${w.lv}"><div class="wic">${MA_ICON[w.typeN] || '⚠️'}</div><div>
      <b>${LVL_DOT[w.lv]} ${t('levels')[w.lv]} · ${esc(typeTxt)}</b><small>${esc(when)}</small>
      ${areas ? `<small>${esc(t('offAreas', {a:areas}))}</small>` : ''}${here ? `<small class="here">${t('offHere')}</small>` : ''}${more}</div></div>`;
  }).join('') + `<div class="src">${t('offSource')}</div>`;
}
function officialAlerts() {
  if (cfg.off.official) return [];
  return officialList().map(w => {
    const typeTxt = t('mtypes')[w.typeN] || w.event;
    return {key:'ma|' + w.id + '|' + w.lv, icon:LVL_DOT[w.lv], title:`${t('levels')[w.lv]}: ${typeTxt}`,
      text:[Number.isFinite(w.onset) ? t('offFrom', {a:dtFmt(w.onset), b:Number.isFinite(w.expires) ? dtFmt(w.expires) : '…'}) : '', w.areas.slice(0, 4).join(', ')].filter(Boolean).join('. ')};
  });
}

/* ---------- предупреждения по модели ---------- */
const WT_ICON = {storm:'⛈️', rain:'🌧️', snow:'❄️', ice:'🧊', wind:'💨', heat:'🥵', frost:'🥶', freeze:'🌱'};
function hourWarn(h, i, c = cfg) {
  const out = [], code = h.weather_code[i], T = h.temperature_2m[i], pr = h.precipitation[i] ?? 0, g = h.wind_gusts_10m[i] ?? 0, on = k => !c.off[k];
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
function dayLabel(ts, ref) {
  const diff = Math.round((Date.parse(ts.slice(0, 10)) - Date.parse(ref.slice(0, 10)))/864e5);
  return diff === 0 ? t('todayL') : diff === 1 ? t('tomorrowL') : dFmt(ts.slice(0, 10), {weekday:'long'});
}
let alerts = [];
function computeAlerts() {
  if (!cityData.length || !gridBase) return [];
  const from = Math.floor(posNow()), to = Math.min(from + cfg.hours, gridN - 1), times = cityData[0].hourly.time, ev = {};
  cityData.forEach((cd, ci) => {
    const h = cd.hourly, nm = cityPlaces[ci] ? placeName(cityPlaces[ci]) : '';
    for (let i = from; i <= to; i++) hourWarn(h, i).forEach(k => {
      const e = ev[k] || (ev[k] = {type:k, cities:new Set(), start:i, end:i, val:null});
      e.cities.add(nm); e.start = Math.min(e.start, i); e.end = Math.max(e.end, i);
      const v = k === 'wind' ? h.wind_gusts_10m[i] : k === 'rain' ? h.precipitation[i] : k === 'heat' ? h.temperature_2m[i] : (k === 'frost' || k === 'freeze') ? -h.temperature_2m[i] : null;
      if (v != null) e.val = e.val === null ? v : Math.max(e.val, v);
    });
  });
  return Object.values(ev).sort((a, b) => a.start - b.start).map(e => {
    const tS = times[e.start], tE = times[Math.min(e.end + 1, times.length - 1)], v = e.val ?? 0;
    const detail = e.type === 'wind' ? t('gusts', {v:Math.round(v)}) : e.type === 'rain' && v >= 1 ? t('upToMm', {v:v.toFixed(1)})
      : e.type === 'heat' ? t('upHot', {v:fmt(v)}) : (e.type === 'frost' || e.type === 'freeze') ? t('downCold', {v:fmt(-v)}) : '';
    const when = e.start === from ? t('ongoing', {t:tE.slice(11)}) : `${dayLabel(tS, times[0])} ${tS.slice(11)}–${tE.slice(11)}`;
    return {key:`${e.type}|${tS.slice(0, 10)}|${Math.floor(parseInt(tS.slice(11, 13), 10)/6)}`, icon:WT_ICON[e.type], title:t('wtypes')[e.type],
      text:`${[...e.cities].join(', ')}. ${when}${detail ? ', ' + detail : ''}`};
  });
}
function renderWarnings() {
  alerts = computeAlerts(); stamp.warn = Date.now();
  const model = !cityData.length ? `<div class="ok">${t('checking')}</div>`
    : alerts.length ? alerts.map(a => `<div class="wi"><div class="wic">${a.icon}</div><div><b>${esc(a.title)}</b><small>${esc(a.text)}</small></div></div>`).join('')
    : `<div class="ok">${t('noDanger', {h:cfg.hours, n:cityPlaces.length})}</div>`;
  $('wl').innerHTML = `<div class="subh">${t('offTitle')}</div>${officialHtml()}<div class="subh">${t('modelTitle', {h:cfg.hours})}</div><div class="wl">${model}</div>`;
}
function refreshWarnings() { renderWarnings(); const list = alerts.concat(officialAlerts()); guarded('fire', () => fireAlerts(list)); }

/* настройки порогов */
const CFG_UI = [['storm','cfgStorm'],['rain','cfgRain','rain','mmh'],['snow','cfgSnow'],['ice','cfgIce'],['wind','cfgWind','wind','ms'],['heat','cfgHeat','heat','°C'],['frost','cfgFrost','frost','°C'],['freeze','cfgFreeze','freeze','°C'],['official','cfgOfficial']];
function buildCfg() {
  $('cfgbox').innerHTML = CFG_UI.map(([k, l, nk, u]) => `<label class="cr"><input type="checkbox" data-k="${k}" ${cfg.off[k] ? '' : 'checked'}><span>${t(l)}</span>${nk ? `<input type="number" step="1" data-n="${nk}" value="${cfg[nk]}"><em>${u === '°C' ? u : t(u)}</em>` : '<span></span><span></span>'}</label>`).join('')
    + `<label class="cr"><span></span><span>${t('cfgLook')}</span><select id="cfgh">${[6, 12, 24].map(h => `<option value="${h}" ${cfg.hours === h ? 'selected' : ''}>${h}</option>`).join('')}</select><em>${t('hours')}</em></label>`;
}
$('cfgbox').addEventListener('change', e => {
  const x = e.target;
  if (x.dataset.k) cfg.off[x.dataset.k] = !x.checked;
  else if (x.dataset.n) { const v = parseFloat(x.value); if (!isNaN(v)) cfg[x.dataset.n] = v; }
  else if (x.id === 'cfgh') cfg.hours = +x.value;
  store.set('wx_cfg', cfg); syncState(); refreshWarnings(); draw();
});
$('cfgReset').onclick = () => { cfg = JSON.parse(JSON.stringify(CFG_DEF)); store.set('wx_cfg', cfg); buildCfg(); syncState(); refreshWarnings(); draw(); };

/* ---------- всплывающие окна, вибрация, системные уведомления ---------- */
let swReg = null, bgState = '', lastNotifErr = '';
const canSW = 'serviceWorker' in navigator && location.protocol === 'https:';
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
const perm = () => ('Notification' in window) ? Notification.permission : 'unsupported';
function toast(ic, title, text, kind) {
  const box = $('toasts'); while (box.children.length >= 3) box.firstChild.remove();
  const el = document.createElement('div'); el.className = 'toast' + (kind === 'info' ? ' info' : ''); el.setAttribute('role', 'alert');
  el.innerHTML = `<div class="t-ic"></div><div><b></b><span></span></div><button></button>`;
  el.querySelector('.t-ic').textContent = ic; el.querySelector('b').textContent = title; el.querySelector('span').textContent = text;
  const btn = el.querySelector('button'); btn.textContent = '✕'; btn.setAttribute('aria-label', t('close')); btn.onclick = () => el.remove();
  box.appendChild(el);
  if (kind === 'info') setTimeout(() => el.remove(), 9000);
}
async function getSW() {
  if (!canSW) return null;
  if (swReg && swReg.active) return swReg;
  try { return await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 5000))]); } catch (e) { return null; }
}
async function systemNotify(title, body, tag) {
  if (!('Notification' in window)) return t('nUnsupported');
  if (Notification.permission !== 'granted') return Notification.permission === 'denied' ? t('nDenied') : t('nNotYet');
  const reg = await getSW();
  if (!reg) return canSW ? t('nNoSW') : t('nNeedHttps');
  try {
    await reg.showNotification(title, {body, tag, icon:'icon-192.png', badge:'icon-192.png', vibrate:[300, 150, 300], renotify:true, requireInteraction:true});
    lastNotifErr = ''; return '';
  } catch (e) { return t('nRejected', {e:(e && e.message) || String(e)}); }
}
function alertUser(ic, title, text, tag) {
  toast(ic, title, text);
  try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {}
  systemNotify(`${ic} ${title}`, text, tag).then(err => { if (err) { lastNotifErr = err; notifStatus(); } });
}
const stateURL = n => new URL(n, location.href).href;
async function sharedSeen() {
  let s = store.get('wx_seen', {});
  try { const c = await caches.open('wx-data'), r = await c.match(stateURL('__seen')); if (r) s = Object.assign(await r.json(), s); } catch (e) {}
  return s;
}
async function saveSeen(s) {
  store.set('wx_seen', s);
  try { const c = await caches.open('wx-data'); await c.put(stateURL('__seen'), new Response(JSON.stringify(s), {headers:{'Content-Type':'application/json'}})); } catch (e) {}
}
async function fireAlerts(list) {
  const seen = await sharedSeen(), now = Date.now(); let ch = false;
  Object.keys(seen).forEach(k => { if (now - seen[k] > 48*36e5) { delete seen[k]; ch = true; } });
  list.forEach(a => { if (!seen[a.key]) { seen[a.key] = now; ch = true; alertUser(a.icon, a.title, a.text, a.key); } });
  if (ch) await saveSeen(seen);
}
async function syncState() {
  try {
    const c = await caches.open('wx-data');
    await c.put(stateURL('__state'), new Response(JSON.stringify({lang, cfg, places:PLACES.map(p => ({name:placeName(p), lat:p.lat, lon:p.lon}))}), {headers:{'Content-Type':'application/json'}}));
  } catch (e) {}
}
async function registerBg() {
  bgState = '';
  try {
    const reg = await getSW();
    if (!reg) bgState = '';
    else if (!('periodicSync' in reg)) bgState = 'bgNo';
    else {
      const st = await navigator.permissions.query({name:'periodic-background-sync'});
      if (st.state !== 'granted') bgState = 'bgInstall';
      else { await reg.periodicSync.register('wx-check', {minInterval:3*36e5}); bgState = 'bgOn'; }
    }
  } catch (e) { bgState = ''; }
  notifStatus();
}
async function notifStatus() {
  const el = $('nst'), btn = $('notifBtn'), p = perm();
  let s;
  if (p === 'unsupported') s = t('stUnsupported');
  else if (p === 'granted') s = t('stGranted');
  else if (p === 'denied') s = t('stDenied') + (isStandalone() ? t('howApp') : t('howBrowser'));
  else s = t('stDefault');
  if (location.protocol !== 'https:') s += ' ' + t('stHttps');
  if (lastNotifErr) s += ' ' + t('stLastErr', {e:lastNotifErr}) + ' ' + t('howOS');
  if (bgState) s += ' ' + t(bgState);
  let reg = null;
  if (canSW) { try { reg = swReg && swReg.active ? swReg : await navigator.serviceWorker.getRegistration(); } catch (e) { reg = null; } }
  const diag = t('diag', {p:t('diagP')[p], s:reg && reg.active ? t('diagSWok') : t('diagSWno'), m:isStandalone() ? t('modeApp') : t('modeBrowser')});
  el.textContent = s + ' ' + diag;
  btn.classList.toggle('on', p === 'granted');
  btn.textContent = p === 'granted' ? t('notifOn') : t('notifOff');
}
async function askPermission() {
  if (!('Notification' in window)) { notifStatus(); return 'unsupported'; }
  let p = Notification.permission;
  if (p === 'default') {
    try { p = await Notification.requestPermission(); } catch (e) { p = Notification.permission; }
    if (p === 'default') toast('🔕', t('quietTitle'), t('quietTxt') + t('howBrowser'), 'info');
  }
  if (p === 'denied') toast('🔕', t('deniedTitle'), isStandalone() ? t('howApp') : t('howBrowser'), 'info');
  notifStatus();
  if (p === 'granted') registerBg();
  return p;
}
$('notifBtn').onclick = () => askPermission();
$('testBtn').onclick = async () => {
  const p = await askPermission();
  toast('⚠️', t('testTitle'), t('testBody'));
  try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {}
  if (p !== 'granted') return;
  const err = await systemNotify('⚠️ ' + t('testTitle'), t('testBody'), 'wx-test-' + Date.now());
  if (err) { lastNotifErr = err; toast('❗', t('notSentTitle'), err + '. ' + t('howOS'), 'info'); }
  else toast('✅', t('sentTitle'), t('sentBody') + t('howOS'), 'info');
  notifStatus();
};

/* PWA: сервис-воркер и кнопка установки */
let installEvt = null;
if (canSW) {
  navigator.serviceWorker.register('sw.js', {scope:'./'}).then(r => { swReg = r; notifStatus(); if (perm() === 'granted') registerBg(); })
    .catch(e => { lastNotifErr = t('nRegFail', {e:(e && e.message) || e}); notifStatus(); });
  const hadSW = !!navigator.serviceWorker.controller; let swReloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { notifStatus(); if (hadSW && !swReloaded) { swReloaded = true; location.reload(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && swReg) swReg.update().catch(() => {}); });
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('installBtn').style.display = 'inline-block'; });
window.addEventListener('appinstalled', () => { $('installBtn').style.display = 'none'; registerBg(); });
$('installBtn').onclick = async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; $('installBtn').style.display = 'none'; };

/* ---------- график по часам ---------- */
let hourlyKey = '';
function smoothPath(pts) {
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0])/6, p1[1] + (p2[1] - p0[1])/6], c2 = [p2[0] - (p3[0] - p1[0])/6, p2[1] - (p3[1] - p1[1])/6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function drawHourly() {
  if (!hourlyData || !lastW) return;
  const svg = $('hourly'), W = svg.clientWidth || 600, {t:tm, T, P, days, n} = hourlyData, h = lastW.hourly, PR = h.precipitation || [];
  const fresh = hourlyKey !== selKey(); hourlyKey = selKey();
  const pt = 28, tH = 150, gap = 18, pH = 34, ax = 22, tB = pt + tH, p0 = tB + gap, pB = p0 + pH, H = pB + ax;
  hourlyData.W = W;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H);
  const lo = Math.floor(Math.min(...T)) - 1, hi = Math.ceil(Math.max(...T)) + 1;
  const X = i => clamp(i/(n - 1)*W, 0, W), Y = v => pt + (hi - v)/(hi - lo)*tH;
  const F = 'font-family="system-ui,Roboto,sans-serif"';
  /* ночь — затенённые полосы */
  let night = '';
  for (let i = 0; i < n;) {
    if (h.is_day[i] === 0) { let j = i; while (j < n && h.is_day[j] === 0) j++; const a = X(i - .5), b = X(j - .5);
      night += `<rect x="${a.toFixed(1)}" y="${pt - 6}" width="${(b - a).toFixed(1)}" height="${pB - pt + 6}" fill="rgba(2,8,20,.34)"/>`; i = j; }
    else i++;
  }
  /* сетка: тонкие сплошные линии, подписи слева */
  const step = hi - lo > 24 ? 10 : 5; let grid = '';
  for (let v = Math.ceil(lo/step)*step; v <= hi; v += step) {
    const y = Y(v); if (y < pt + 6 || y > tB - 4) continue;
    grid += `<line x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,${v === 0 ? .22 : .07})"/>`
      + `<text x="4" y="${(y - 4).toFixed(1)}" fill="#8fa6ba" font-size="10" ${F}>${fmt(v)}</text>`;
  }
  /* градиент по температуре */
  let stops = '';
  for (let k = 0; k <= 12; k++) { const v = hi - (hi - lo)*k/12; stops += `<stop offset="${(k/12).toFixed(3)}" stop-color="${tempColor(v)}"/>`; }
  const pts = T.map((v, i) => [X(i), Y(v)]), line = smoothPath(pts);
  const iMax = T.indexOf(Math.max(...T)), iMin = T.indexOf(Math.min(...T));
  const mark = (i, dy) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(T[i]).toFixed(1)}" r="4.5" fill="${tempColor(T[i])}" stroke="#0a1522" stroke-width="2"/>`
    + `<text x="${clamp(X(i), 18, W - 18).toFixed(1)}" y="${(Y(T[i]) + dy).toFixed(1)}" fill="#eaf2f8" font-size="12" font-weight="600" text-anchor="middle" ${F}>${fmt(T[i])}</text>`;
  /* полоса осадков: своя шкала 0–100 %, без второй оси на графике температуры */
  const bw = Math.min(Math.max(W/n - 2, 1), 24);
  const bars = P.map((p, i) => { const v = p ?? 0; if (v < 1) return ''; const bh = Math.max(1.5, v/100*pH);
    return `<rect class="pbar" style="animation-delay:${fresh ? Math.round(i*6) : 0}ms" x="${(X(i) - bw/2).toFixed(1)}" y="${(pB - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${Math.min(2, bw/2).toFixed(1)}" fill="#5cc8ff" opacity="${v >= 50 ? .95 : .55}"/>`; }).join('');
  const seps = days.map((d, k) => `<line x1="${X(k*24).toFixed(1)}" x2="${X(k*24).toFixed(1)}" y1="${pt - 6}" y2="${pB}" stroke="rgba(255,255,255,.1)"/>`
    + `<text x="${(X(k*24) + 6).toFixed(1)}" y="${H - 7}" fill="#8fa6ba" font-size="11" ${F}>${esc(dFmt(d, {weekday:'short', day:'numeric'}))}</text>`).join('');
  svg.innerHTML = `<defs><linearGradient id="tg" gradientUnits="userSpaceOnUse" x1="0" y1="${Y(hi).toFixed(1)}" x2="0" y2="${Y(lo).toFixed(1)}">${stops}</linearGradient></defs>`
    + night + grid + seps
    + `<path d="${line}L${W},${tB}L0,${tB}Z" fill="url(#tg)" opacity=".13"/>`
    + `<path class="${fresh ? 'draw' : ''}" pathLength="1" d="${line}" fill="none" stroke="url(#tg)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`
    + mark(iMax, -10) + (iMin !== iMax ? mark(iMin, 20) : '')
    + `<text x="4" y="${p0 - 5}" fill="#8fa6ba" font-size="10" ${F}>${esc(t('precipBand'))}</text>`
    + `<line x1="0" x2="${W}" y1="${pB}" y2="${pB}" stroke="rgba(255,255,255,.12)"/>` + bars
    + `<line id="nw" y1="${pt - 6}" y2="${pB}" stroke="#4ade80" stroke-width="1.5"/>`
    + `<g id="tip" opacity="0" pointer-events="none"><line id="tl" y1="${pt - 6}" y2="${pB}" stroke="#fff" stroke-opacity=".45"/>`
    + `<circle id="tc" r="5" fill="#fff" stroke="#0a1522" stroke-width="2"/><rect id="tr" y="2" height="20" rx="10" fill="rgba(10,21,34,.92)" stroke="rgba(255,255,255,.15)"/>`
    + `<text id="tt" y="16" fill="#eaf2f8" font-size="12" font-weight="500" ${F}></text></g>`;
  const move = e => {
    const r = svg.getBoundingClientRect(), i = clamp(Math.round((e.clientX - r.left)/r.width*(n - 1)), 0, n - 1), x = X(i);
    $('tl').setAttribute('x1', x); $('tl').setAttribute('x2', x); $('tc').setAttribute('cx', x); $('tc').setAttribute('cy', Y(T[i]));
    const tt = $('tt');
    tt.textContent = t('hourTip2', {d:dFmt(tm[i], {weekday:'short'}), h:tm[i].slice(11), t:fmt(T[i]), p:P[i] ?? 0, mm:(PR[i] ?? 0).toFixed(1)});
    let tw = 180; try { tw = tt.getComputedTextLength(); } catch (er) {}
    const bx = clamp(x - tw/2 - 10, 0, W - tw - 20);
    tt.setAttribute('x', bx + 10); $('tr').setAttribute('x', bx); $('tr').setAttribute('width', tw + 20);
    $('tip').setAttribute('opacity', 1);
  };
  svg.onpointermove = move; svg.onpointerdown = move; svg.onpointerleave = () => $('tip') && $('tip').setAttribute('opacity', 0);
  const sc = $('tscale');
  if (sc) {
    const a = TSTOPS[0][0], b = TSTOPS[TSTOPS.length - 1][0];
    sc.innerHTML = `<span>${fmt(a)}</span><i style="background:linear-gradient(90deg,${TSTOPS.map(([v, c]) => `${c} ${((v - a)/(b - a)*100).toFixed(1)}%`).join(',')})"></i><span>+${b}°</span><em>${esc(t('tempScale'))}</em>`;
  }
  updateNowLine();
}
function updateNowLine() {
  const h = hourlyData, el = $('nw'); if (!h || !el) return;
  const x = (Date.now() - h.base)/36e5/(h.n - 1)*h.W;
  el.setAttribute('x1', x); el.setAttribute('x2', x); el.style.display = x >= 0 && x <= h.W ? '' : 'none';
}

/* ---------- выбор места, избранное, поиск ---------- */
function markChips() { document.querySelectorAll('.chip').forEach((c, n) => c.setAttribute('aria-pressed', !!PLACES[n] && samePlace(PLACES[n], sel))); }
function buildChips() {
  const box = $('chips'); box.innerHTML = '';
  PLACES.forEach(p => {
    const b = document.createElement('button'); b.className = 'chip'; b.textContent = (p.fav ? '★ ' : '') + placeName(p);
    b.onclick = () => newSel(p.id ? {id:p.id, lat:p.lat, lon:p.lon} : {name:p.name, lat:p.lat, lon:p.lon}); box.appendChild(b);
  });
  markChips();
}
function newSel(s) {
  sel = s; lastW = null; air = null; pollen = null; models = null; nowcast = null;
  $('err').style.display = 'none'; markChips(); renderAcc(); loadPoint(); draw(); drawRadar(); renderWarnings();
}
function toggleFav() {
  const i = favs.findIndex(f => samePlace(f, sel));
  if (i >= 0) favs.splice(i, 1);
  else {
    if (favs.length >= 8) { toast('⭐', t('favFull'), t('favFullTxt')); return; }
    let name = sel.pt ? (((prompt(t('favNamePrompt'), t('favDefault')) || '').trim()) || t('favDefault')) : placeName(sel);
    name = name.slice(0, 40); favs.push({name, lat:sel.lat, lon:sel.lon}); sel = {name, lat:sel.lat, lon:sel.lon};
  }
  store.set('wx_favs', favs); rebuildPlaces(); buildChips(); buildRoadUI(); renderHero(); renderAcc(); syncState(); guarded('ct', loadCities);
}
let qt;
$('q').addEventListener('input', e => {
  clearTimeout(qt); const v = e.target.value.trim();
  if (v.length < 2) { $('qres').style.display = 'none'; return; }
  qt = setTimeout(() => searchPlaces(v), 300);
});
async function searchPlaces(v) {
  try {
    const j = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(v)}&count=10&language=${lang}&format=json&countryCode=LV`);
    const r = (j.results || []).filter(x => x.country_code === 'LV' && Number.isFinite(x.latitude) && Number.isFinite(x.longitude)).slice(0, 6), box = $('qres');
    box.innerHTML = '';
    if (!r.length) { const b = document.createElement('button'); b.disabled = true; b.textContent = t('notFound'); box.appendChild(b); }
    r.forEach(x => {
      const b = document.createElement('button'); b.innerHTML = '<span></span> <small></small>';
      b.children[0].textContent = x.name; b.children[1].textContent = [x.admin1, x.admin2].filter(Boolean).join(', ');
      b.onclick = () => { box.style.display = 'none'; $('q').value = ''; newSel({name:String(x.name).slice(0, 40), lat:x.latitude, lon:x.longitude}); };
      box.appendChild(b);
    });
    box.style.display = 'block';
  } catch (e) {}
}
document.addEventListener('click', e => { if (!e.target.closest('.search')) $('qres').style.display = 'none'; });

/* ---------- переключение языка ---------- */
function applyStatic() {
  document.documentElement.lang = lang;
  document.title = t('title');
  const md = document.querySelector('meta[name=description]'); if (md) md.setAttribute('content', t('metaDesc'));
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
  $('footer').innerHTML = t('footer', {om:link('https://open-meteo.com/', 'Open-Meteo'), rv:link('https://www.rainviewer.com/', 'RainViewer'), ma:link(MA_URL, 'MeteoAlarm')});
  const lb = $('langs'); lb.innerHTML = '';
  [['ru', 'RU'], ['lv', 'LV'], ['en', 'EN']].forEach(([k, lab]) => {
    const b = document.createElement('button'); b.textContent = lab; b.setAttribute('aria-pressed', k === lang); b.setAttribute('lang', k);
    b.onclick = () => setLang(k); lb.appendChild(b);
  });
  $('play').setAttribute('aria-label', t(playTimer ? 'stop' : 'play'));
}
function setLang(k) {
  if (!LANGS[k] || k === lang) return;
  lang = k; LOC = LANGS[k]; store.set('wx_lang', k);
  applyStatic(); buildChips(); buildLayers(); buildCfg(); buildRoadUI(); buildStrip();
  renderHero(); renderDaily(lastW); renderH24(); renderToday(); renderMoon(); renderAcc(); renderWarnings(); renderNowcast();
  renderSea(); renderPollen(); renderRoad(); drawHourly(); draw(); drawRadar(); notifStatus(); syncState(); tick();
  if (typeof renderDrive === 'function') { renderDrive(); fillVoices(); }
  if (typeof renderPlan === 'function') renderPlan();
}

/* ---------- LIVE: тик раз в секунду ---------- */
function tick() {
  const now = Date.now();
  if (live && gridBase) { pos = posNow(); $('slider').value = pos; }
  draw(); updateNowLine();
  if (hourlyData && lastW) { const ix = clamp(Math.floor((now - hourlyData.base)/36e5), 0, lastW.hourly.time.length - 25); if (ix !== h24Idx) { renderH24(); renderToday(); if (typeof renderPlan === 'function') renderPlan(); } }
  if (now - stamp.moon >= 60e3) { stamp.moon = now; renderMoon(); if (hasViz()) { try { refreshGauges(); } catch (e) {} } }

  if (!document.hidden) {
    if (now - stamp.current >= REFRESH.current && lastW) { stamp.current = now - REFRESH.current + 5000; guarded('cur', loadCurrent); }
    if (now - stamp.point >= REFRESH.point && lastW) { stamp.point = now - REFRESH.point + 30000; guarded('pt', loadPoint); }
    if (now - stamp.cities >= REFRESH.cities && stamp.cities) { stamp.cities = now - REFRESH.cities + 30000; guarded('ct', loadCities); }
    if (now - stamp.grid >= REFRESH.grid && stamp.grid) { stamp.grid = now - REFRESH.grid + 30000; guarded('gr', loadGrid); }
    if (now - stamp.radar >= REFRESH.radar && stamp.radar) guarded('rad', loadRadar);
    if (now - stamp.now >= REFRESH.now && stamp.now && lastW) { stamp.now = now; guarded('nc', loadNowcast); }
    if (now - stamp.official >= REFRESH.official && stamp.official) guarded('ma', loadOfficial);
    if (now - stamp.sea >= REFRESH.sea && stamp.sea) guarded('sea', loadSea);
    if (now - stamp.road >= REFRESH.road && stamp.road) guarded('road', loadRoad);
    if (now - stamp.warn >= 60e3 && cityData.length) refreshWarnings();
  }
  $('dot').classList.toggle('off', offline);
  if (offline) $('upd').textContent = t('offline');
  else if (lastW) {
    $('upd').textContent = t('updatedAt', {t:hhmm(stamp.current)});
  }
}
function start() {
  $('err').style.display = 'none'; offline = false;
  loadPoint(); loadCities().catch(() => showErr(t('netErr'))); loadGrid().catch(() => showErr(t('netErr')));
  guarded('rad', loadRadar); guarded('ma', loadOfficial); guarded('sea', loadSea); guarded('road', loadRoad);
}
$('retry').onclick = start;
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
let rz; window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { draw(); drawRadar(); drawHourly(); }); });
applyStatic(); buildChips(); buildLayers(); buildCfg(); buildRoadUI(); notifStatus(); syncState(); renderAcc(); renderWarnings();
draw(); drawRadar(); start(); setInterval(tick, 1000);
