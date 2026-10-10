'use strict';
/* Laiks — «Полезное сейчас»: когда менять резину, активность клещей, праздники;
   сравнение с климатической нормой; «дождь через N минут» с уведомлением; апвеллинг (внезапно холодное море).
   Использует данные и функции из app.js (lastW, hourlyData, nowcast, sea, sel, t, fmt, hhmm, TZ, getJSON …). */

const XSNOW = [71, 73, 75, 77, 85, 86];
const XT = () => t('xt');
const xfill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);
const ymd = s => s.slice(0, 10).split('-').map(Number);
const utcDay = s => { const [y, m, d] = ymd(s); return Date.UTC(y, m - 1, d); };
const dBetween = (a, b) => Math.round((utcDay(b) - utcDay(a))/864e5);
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const xNowIdx = () => clamp(Math.floor((Date.now() - hourlyData.base)/36e5), 0, lastW.hourly.time.length - 1);

/* ---------- климатическая норма (1991–2020, архив ERA5 через Open-Meteo) ---------- */
const NORM = {key:'', data:null, busy:false};
const normKey = () => (Math.round(sel.lat*4)/4).toFixed(2) + ',' + (Math.round(sel.lon*4)/4).toFixed(2);
const doyOf = s => { const [, m, d] = ymd(s); return Math.min(365, Math.round((Date.UTC(2000, m - 1, d) - Date.UTC(2000, 0, 1))/864e5)); };
async function loadNormals() {
  const k = normKey();
  if (NORM.key === k && NORM.data) return;
  const cache = store.get('wx_norm', {}) || {};
  if (cache[k] && cache[k].mx && cache[k].mx.length === 366) { NORM.key = k; NORM.data = cache[k]; renderPills(); renderUtil(); return; }
  if (NORM.busy) return;
  NORM.busy = true;
  try {
    const [la, lo] = k.split(',');
    const j = await getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${la}&longitude=${lo}&start_date=1991-01-01&end_date=2020-12-31&daily=temperature_2m_max,temperature_2m_min&timezone=${ENC_TZ}`);
    const d = j.daily, sx = Array(366).fill(0), sn = Array(366).fill(0), c = Array(366).fill(0);
    d.time.forEach((s, i) => {
      const a = d.temperature_2m_max[i], b = d.temperature_2m_min[i];
      if (a == null || b == null) return;
      const q = doyOf(s); sx[q] += a; sn[q] += b; c[q]++;
    });
    const mx = [], mn = [];
    for (let i = 0; i < 366; i++) {   /* сглаживаем ±7 дней, чтобы норма не прыгала от дня к дню */
      let a = 0, b = 0, n = 0;
      for (let w = -7; w <= 7; w++) { const q = (i + w + 366) % 366; a += sx[q]; b += sn[q]; n += c[q]; }
      mx.push(n ? +(a/n).toFixed(1) : null); mn.push(n ? +(b/n).toFixed(1) : null);
    }
    if (mx.some(v => v == null)) return;
    NORM.key = k; NORM.data = {mx, mn};
    const ks = Object.keys(cache); if (ks.length >= 6) delete cache[ks[0]];
    cache[k] = NORM.data; store.set('wx_norm', cache);
    renderPills(); renderUtil();
  } catch (e) {} finally { NORM.busy = false; }
}
const normFor = s => NORM.data && NORM.key === normKey() ? {mx:NORM.data.mx[doyOf(s)], mn:NORM.data.mn[doyOf(s)]} : null;
function normInfo() {
  const d = lastW.daily, N = normFor(d.time[0]); if (!N) return null;
  const X = XT().norm, diff = ((d.temperature_2m_max[0] - N.mx) + (d.temperature_2m_min[0] - N.mn))/2, a = Math.round(Math.abs(diff));
  const usual = xfill(X.usual, {a:fmt(N.mn).replace('°', ''), b:fmt(N.mx)});
  if (Math.abs(diff) < 1.5) return {cls:'nrm', txt:`🌡️ ${X.near} · ${usual}`};
  return {cls:diff > 0 ? 'warm' : 'cold', txt:`${diff > 0 ? '🔥' : '🧊'} ${xfill(diff > 0 ? X.warm : X.cold, {d:a})} · ${usual}`};
}

/* ---------- «дождь через N минут» ---------- */
function rainInfo() {
  if (!nowcast || !nowcast.p || !nowcast.p.length || !nowcast.t0) return null;
  const X = XT().rain, p = nowcast.p, wet = v => (v ?? 0) >= 0.1, now = Date.now();
  const snow = lastW && lastW.current && lastW.current.temperature_2m <= 0.5;
  const word = mx => X.int[mx >= 1 ? 2 : mx >= 0.3 ? 1 : 0];
  if (!wet(p[0])) {
    const f = p.findIndex(wet); if (f < 1 || f > 8) return null;
    const at = nowcast.t0 + f*9e5, mins = Math.max(5, Math.round((at - now)/6e4/5)*5);
    const mx = Math.max(...p.slice(f, f + 4).map(v => v ?? 0));
    return {soon:true, at, mins, txt:`${snow ? '❄️' : '☔'} ${xfill(snow ? X.snowIn : X.rainIn, {m:mins, t:hhmm(at), w:word(mx)})}`};
  }
  const e = p.findIndex((v, i) => i > 0 && !wet(v));
  if (e === -1) return {txt:`${snow ? '🌨️' : '🌧️'} ${snow ? X.snowLong : X.rainLong}`};
  const at = nowcast.t0 + e*9e5, mins = Math.max(5, Math.round((at - now)/6e4/5)*5);
  return {txt:`${snow ? '🌨️' : '🌧️'} ${xfill(snow ? X.snowEnd : X.rainEnd, {m:mins, t:hhmm(at)})}`};
}
/* уведомление, когда до начала осадков ≤ 30 минут (не чаще одного раза на одну «тучу») */
function rainSoon() {
  renderPills();
  const r = rainInfo(); if (!r || !r.soon || r.mins > 30) return;
  const seen = store.get('wx_rain_seen', 0);
  if (Math.abs(seen - r.at) < 3*36e5 && seen) return;
  store.set('wx_rain_seen', r.at);
  const X = XT().rain, body = xfill(X.notifBody, {m:r.mins, t:hhmm(r.at), p:placeName(sel)});
  toast('☔', X.notifTitle, body, 'info');
  if (document.hidden && typeof systemNotify === 'function') systemNotify('☔ ' + X.notifTitle, body, 'rain-soon');
}

function renderPills() {
  const el = $('xpills'); if (!el || !lastW) return;
  const out = [];
  try { const r = rainInfo(); if (r) out.push(`<span class="xp rain${r.soon ? ' soon' : ''}">${esc(r.txt)}</span>`); } catch (e) {}
  try { const n = normInfo(); if (n) out.push(`<span class="xp ${n.cls}">${esc(n.txt)}</span>`); } catch (e) {}
  el.innerHTML = out.join('');
}

/* ---------- 🛞 когда менять резину (правила Латвии: зимняя обязательна 1.12–1.03, шипы разрешены 1.10–30.04) ---------- */
function tiresHtml() {
  const X = XT().tires, d = lastW.daily, today = d.time[0], [y, m, dd] = ymd(today), md = m*100 + dd;
  const lo = Math.min(...d.temperature_2m_min.filter(v => v != null));
  const means = d.time.map((_, i) => (d.temperature_2m_max[i] + d.temperature_2m_min[i])/2);
  const cool = means.filter(v => v <= 7).length, snow = d.weather_code.some(c => XSNOW.includes(c));
  const dTo = (mm, day, yy) => dBetween(today, iso(yy, mm, day));
  let ico, head, why, legal = '';
  if (md >= 1201 || md < 301) {
    ico = '❄️'; head = X.winter; why = xfill(X.winterWhy, {n:dTo(3, 1, m === 12 ? y + 1 : y)});
  } else if (md < 501) {
    const ok = lo > 3 && means.every(v => v >= 7);
    ico = ok ? '☀️' : '⏳'; head = ok ? X.springOk : X.springWait; why = xfill(ok ? X.springOkWhy : X.springWaitWhy, {t:fmt(lo)});
    legal = xfill(X.studsUntil, {n:dTo(4, 30, y)});
  } else if (md < 901) {
    ico = '☀️'; head = X.summer; why = X.summerWhy;
  } else {
    if (snow || lo <= 1) { ico = '⚠️'; head = X.changeNow; why = xfill(snow ? X.whySnow : X.whyFrost, {t:fmt(lo)}); }
    else if (cool >= 3) { ico = '🔧'; head = X.changeSoon; why = X.whyCool; }
    else { ico = '✅'; head = X.notYet; why = xfill(X.whyWarm, {t:fmt(lo)}); }
    legal = xfill(X.mandatoryIn, {n:dTo(12, 1, y)}) + ' ' + (md >= 1001 ? X.studsOk : xfill(X.studsFrom, {n:dTo(10, 1, y)}));
  }
  return `<div class="pb"><div class="ph">🛞 ${esc(X.title)}</div>
    <div class="pv"><span class="pi">${ico}</span><div><b>${esc(head)}</b><small>${esc(why)}</small></div></div>
    ${legal ? `<div class="xlegal">⚖️ ${esc(legal)}</div>` : ''}</div>`;
}

/* ---------- 🕷️ активность клещей: по дневной температуре и влажности ---------- */
function ticksHtml() {
  const X = XT().ticks, h = lastW.hourly, i0 = xNowIdx(), m = ymd(h.time[i0])[1];
  const T = [], RH = [];
  for (let i = i0; i < Math.min(i0 + 30, h.time.length) && T.length < 10; i++) {
    const hr = +h.time[i].slice(11, 13);
    if (hr >= 10 && hr <= 19) { T.push(h.temperature_2m[i]); if (h.relative_humidity_2m) RH.push(h.relative_humidity_2m[i]); }
  }
  if (!T.length) return '';
  const tm = T.reduce((a, b) => a + b, 0)/T.length, rh = RH.length ? RH.reduce((a, b) => a + b, 0)/RH.length : null;
  let lv;
  if (tm < 5 || ((m <= 2 || m === 12) && tm < 8)) lv = 0;
  else {
    lv = tm < 10 ? 1 : tm < 15 ? 2 : tm <= 24 ? 3 : tm <= 28 ? 2 : 1;
    if (rh != null) { if (rh < 50) lv = Math.max(1, lv - 1); else if (rh >= 75 && lv < 3 && tm >= 8) lv++; }
  }
  const COL = ['#4ade80', '#a3e635', '#ffb547', '#ff6b4a'];
  const bar = [1, 2, 3].map(k => `<i style="background:${k <= lv ? COL[lv] : 'rgba(255,255,255,.1)'}"></i>`).join('');
  return `<div class="pb"><div class="ph">🕷️ ${esc(X.title)}</div>
    <div class="pv"><span class="pi">${lv === 0 ? '😴' : lv === 3 ? '⚠️' : '🌿'}</span><div><b>${esc(X.lv[lv])}</b>
      <small>${esc(xfill(X.why[lv], {t:fmt(tm), h:rh != null ? Math.round(rh) : '—'}))}</small></div></div>
    <div class="xmeter" role="img" aria-label="${esc(X.lv[lv])}">${bar}</div>
    ${lv ? `<ul class="xtips">${X.tips.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    <small class="xnote">${esc(X.note)}</small></div>`;
}

/* ---------- 🎉 праздники Латвии: прогноз, а если далеко — норма ---------- */
function easter(y) {   /* григорианская Пасха (алгоритм Гаусса — Анонимный) */
  const a = y % 19, b = Math.floor(y/100), c = y % 100, d = Math.floor(b/4), e = b % 4, f = Math.floor((b + 8)/25), g = Math.floor((b - f + 1)/3);
  const h = (19*a + b - d - g + 15) % 30, i = Math.floor(c/4), k = c % 4, l = (32 + 2*e + 2*i - h - k) % 7, m = Math.floor((a + 11*h + 22*l)/451);
  const mo = Math.floor((h + l - 7*m + 114)/31), da = (h + l - 7*m + 114) % 31 + 1;
  return iso(y, mo, da);
}
function holidays(y) {
  const may1 = new Date(Date.UTC(y, 4, 1)).getUTCDay(), mother = 1 + (7 - may1) % 7 + 7;
  return [['ny', iso(y, 1, 1), 1], ['easter', easter(y), 1], ['may1', iso(y, 5, 1), 1], ['may4', iso(y, 5, 4), 1], ['mother', iso(y, 5, mother), 1],
    ['ligo', iso(y, 6, 23), 2], ['martini', iso(y, 11, 10), 1], ['lacplesis', iso(y, 11, 11), 1], ['nov18', iso(y, 11, 18), 1],
    ['xmas', iso(y, 12, 24), 3], ['nye', iso(y, 12, 31), 1]];
}
const HOL = {key:'', data:null, busy:false};
async function loadHolidayFc() {
  const k = selKey(); if (HOL.key === k || HOL.busy) return;
  HOL.busy = true;
  try {
    const j = await getJSON(`${API}?${pointQS()}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=16`);
    if (k !== selKey()) return;
    HOL.key = k; HOL.data = j.daily; renderUtil();
  } catch (e) {} finally { HOL.busy = false; }
}
function holidayHtml() {
  const X = XT().hol, today = lastW.daily.time[0], y = ymd(today)[0];
  const list = holidays(y).concat(holidays(y + 1)).filter(([, d, len]) => dBetween(today, d) + len - 1 >= 0).sort((a, b) => utcDay(a[1]) - utcDay(b[1]));
  const [k, d] = list[0], [ic, name] = X.names[k], n = dBetween(today, d);
  const date = new Date(utcDay(d) + 12*36e5).toLocaleDateString(LOC, {timeZone:'UTC', day:'numeric', month:'long', weekday:'long'});
  const when = n <= 0 ? X.today : n === 1 ? X.tomorrow : xfill(X.inDays, {n});
  let fc = '';
  const src = HOL.key === selKey() && HOL.data ? HOL.data : lastW.daily, i = src.time.indexOf(n < 0 ? today : d);
  if (i >= 0) {
    const pp = src.precipitation_probability_max ? src.precipitation_probability_max[i] : null;
    fc = `<div class="xfc"><span class="xfi">${wxI(src.weather_code[i], 1, 34)}</span><div><b>${fmt(src.temperature_2m_min[i])}…${fmt(src.temperature_2m_max[i])}</b>`
      + `<small>${esc(wmo(src.weather_code[i])[0])}${pp != null ? ' · ' + esc(xfill(X.rainP, {p:pp})) : ''}</small></div></div>`;
  } else {
    if (n <= 16) loadHolidayFc();
    const N = normFor(d);
    fc = `<div class="xfc"><span class="xfi">🌡️</span><div>${N ? `<b>${esc(xfill(X.usual, {a:fmt(N.mn).replace('°', ''), b:fmt(N.mx)}))}</b>` : ''}<small>${esc(n <= 16 ? X.loading : X.later)}</small></div></div>`;
  }
  const nx = list[1] ? `<small class="xnext">${esc(X.next)}: ${X.names[list[1][0]][0]} ${esc(X.names[list[1][0]][1])} — ${esc(new Date(utcDay(list[1][1]) + 12*36e5).toLocaleDateString(LOC, {timeZone:'UTC', day:'numeric', month:'long'}))}</small>` : '';
  return `<div class="pb"><div class="ph">🎉 ${esc(X.title)}</div>
    <div class="pv"><span class="pi">${ic}</span><div><b>${esc(name)}</b><small>${esc(date)} · ${esc(when)}</small></div></div>${fc}${nx}</div>`;
}

function renderUtil() {
  const el = $('util'); if (!el || !lastW || !hourlyData) return;
  try { el.innerHTML = `<h2>${esc(XT().title)} · ${esc(placeName(sel))}</h2><div class="pgrid">${tiresHtml()}${ticksHtml()}${holidayHtml()}</div>`; }
  catch (e) { console.warn('util', e); }
  loadNormals();
}

/* ---------- 🥶 апвеллинг: ветер отгоняет тёплую воду от берега, снизу поднимается холодная ----------
   Перенос воды (экмановский) идёт под 90° вправо от ветра. Для южного берега Рижского залива (Юрмала)
   это восточные ветры, для открытого берега Курземе (Лиепая, Вентспилс) — северные. Актуально в мае — сентябре. */
const UPW = {jurmala:[30, 150], liepaja:[300, 60], ventspils:[320, 80]};
const inSector = (d, [a, b]) => a <= b ? d >= a && d <= b : d >= a || d <= b;
function upwellNote(i) {
  const id = COAST[i][0], m = new Date().getMonth() + 1; if (m < 5 || m > 9 || !UPW[id]) return '';
  const X = XT().upw, w = typeof seaWind !== 'undefined' && seaWind && seaWind[i];
  let hrs = 0, drop = 0;
  if (w && w.hourly) {
    const h = w.hourly, base = Date.parse(h.time[0] + ':00Z') - w.utc_offset_seconds*1000, k0 = clamp(Math.floor((Date.now() - base)/36e5), 0, h.time.length - 1);
    for (let k = Math.max(0, k0 - 24); k < Math.min(h.time.length, k0 + 36); k++)
      if ((h.wind_speed_10m[k] ?? 0) >= 5 && inSector(h.wind_direction_10m[k] ?? -1, UPW[id])) hrs++;
  }
  const r = sea && sea[i];
  if (r && r.hourly && r.hourly.sea_surface_temperature) {
    const base = Date.parse(r.hourly.time[0] + ':00Z') - r.utc_offset_seconds*1000, j0 = clamp(Math.floor((Date.now() - base)/36e5), 0, r.hourly.time.length - 1);
    const s = r.hourly.sea_surface_temperature.slice(j0, j0 + 48).filter(v => v != null);
    if (s.length) drop = s[0] - Math.min(...s);
  }
  const hi = hrs >= 24 || drop >= 3, maybe = hi || hrs >= 12 || drop >= 2;
  if (!maybe) return '';
  return `<div class="upw${hi ? ' hi' : ''}">🥶 ${esc(xfill(hi ? X.hi : X.maybe, {w:X.dirs[id], d:drop >= 1 ? Math.round(drop) : ''}))}</div>`;
}

/* данные могли прийти раньше, чем загрузился этот файл */
renderUtil(); renderPills();
