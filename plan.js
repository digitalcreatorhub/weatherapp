'use strict';
/* Laiks — «Советы на сегодня»: когда мыть машину, лучшее окно для занятия, закат и рассвет для фото.
   Считается на устройстве по уже загруженному почасовому прогнозу выбранного места. */

const ACTS = {
  walk:{ico:'🚶', ideal:18, tol:10, wind:10, prob:35},
  run:{ico:'🏃', ideal:12, tol:8, wind:9, prob:30},
  bike:{ico:'🚴', ideal:19, tol:8, wind:7, prob:25},
  bbq:{ico:'🍖', ideal:21, tol:7, wind:8, prob:15}
};
const PLAN = {act:ACTS[store.get('wx_act', 'walk')] ? store.get('wx_act', 'walk') : 'walk'};
const SNOWC = [71, 73, 75, 77, 85, 86];
const hIdx = ms => clamp(Math.floor((ms - hourlyData.base)/36e5), 0, lastW.hourly.time.length - 1);
const dayStart = k => { const d = lastW.daily.time[k]; return d ? Date.parse(d + 'T00:00:00Z') - lastW.utc_offset_seconds*1000 : null; };
const wdName = ms => new Date(ms).toLocaleDateString(LOC, {timeZone:TZ, weekday:'long'});

/* ---------- 4. когда мыть машину ---------- */
function washPlan() {
  const h = lastW.hourly, now = Date.now(), n = h.time.length, days = [];
  for (let k = 0; k < 4; k++) {
    const d0 = dayStart(k); if (d0 === null) break;
    const at = k === 0 ? Math.max(now, d0 + 9*36e5) : d0 + 12*36e5;
    if (k === 0 && at > d0 + 19*36e5) continue;                 /* сегодня уже поздно */
    const i0 = hIdx(at), i1 = Math.min(n - 1, i0 + 48);
    if (i1 - i0 < 30) break;                                     /* мало данных вперёд */
    let mm = 0, maxP = 0, snow = false, salt = false, cold = h.temperature_2m[i0] ?? 5;
    /* мороз: днём в часы мойки (4 часа) и ночью после неё */
    let tDay = -99, tNight = 99;
    for (let i = i0; i <= Math.min(n - 1, i0 + 4); i++) tDay = Math.max(tDay, h.temperature_2m[i] ?? 5);
    for (let i = i0; i <= Math.min(n - 1, i0 + 20); i++) tNight = Math.min(tNight, h.temperature_2m[i] ?? 5);
    for (let i = i0; i <= i1; i++) {
      const pr = h.precipitation[i] ?? 0, T = h.temperature_2m[i] ?? 5;
      mm += pr; maxP = Math.max(maxP, h.precipitation_probability[i] ?? 0);
      if (SNOWC.includes(h.weather_code[i])) snow = true;
      if (T <= 1 && pr > 0.1) salt = true;
    }
    const hard = tDay <= -5, frost = !hard && (tDay <= 0 || tNight <= -3);
    let lvl = (mm < .3 && maxP < 35 && !snow && !salt) ? 2 : (mm < 1.5 && maxP < 60 && !snow) ? 1 : 0;
    if (hard) lvl = 0; else if (frost) lvl = Math.min(lvl, 1);
    days.push({k, at, mm, maxP, snow, salt, cold, lvl, hard, frost, tDay, tNight});
  }
  return days;
}
function washHtml() {
  const days = washPlan(); if (!days.length) return '';
  const best = days.find(d => d.lvl === 2), ok1 = days.find(d => d.lvl === 1 && !d.hard), first = days[0];
  let ico, head, why;
  if (!best && days.every(d => d.hard)) { ico = '🥶'; head = t('washHardHead'); why = t('washHardWhy'); }
  else if (!best && ok1 && ok1.frost && ok1.mm < .3 && ok1.maxP < 35 && !ok1.snow && !ok1.salt) { ico = '🧊'; head = t(ok1.k === 0 ? 'washToday' : 'washOn', {d:ok1.k === 1 ? t('tomorrowL') : wdName(ok1.at)}); why = t('washDry'); }
  else if (best && best.k === first.k) { ico = '✅'; head = t(first.k === 0 ? 'washToday' : 'washTomorrow'); why = t('washDry'); }
  else if (best) { ico = '📅'; head = t('washOn', {d:best.k === 1 ? t('tomorrowL') : wdName(best.at)}); why = t('washDryAfter'); }
  else {
    ico = '⏳'; head = t('washWait');
    why = first.snow ? t('washSnow') : first.salt ? t('washSalt') : t('washRain', {mm:first.mm.toFixed(1)});
  }
  /* мойка в мороз: что сделать после, а в сильный мороз — почему лучше подождать */
  const pick = best || ok1 || first;
  const cold = pick.hard ? `<div class="pwarn hi">🥶 ${esc(t('washHard', {t:fmt(pick.tDay)}))}</div>`
    : pick.frost ? `<div class="pwarn">❄️ ${esc(t('washFrost', {t:fmt(Math.min(pick.tDay, pick.tNight))}))}</div>`
    : days.some(d => d.hard) ? `<div class="pwarn">🥶 ${esc(t('washHardSoon', {d:wdName(days.find(d => d.hard).at)}))}</div>` : '';
  const dots = days.map(d => `<span class="pd l${d.lvl}" title="${esc(d.k === 0 ? t('todayL') : wdName(d.at))}"><i></i>${d.hard || d.frost ? '❄️' : ''}${esc(d.k === 0 ? t('todayL') : new Date(d.at).toLocaleDateString(LOC, {timeZone:TZ, weekday:'short'}))}</span>`).join('');
  return `<div class="pb"><div class="ph">🚗 ${esc(t('carTitle'))}</div>
    <div class="ph2">🧽 ${esc(t('washTitle'))}</div>
    <div class="pv"><span class="pi">${ico}</span><div><b>${esc(head)}</b><small>${esc(why)}</small></div></div>
    <div class="pdays">${dots}</div>${cold}
    ${typeof tiresInline === 'function' ? tiresInline() : ''}</div>`;
}

/* ---------- 5. лучшее окно для занятия ---------- */
function hourScore(a, h, i) {
  const P = h.precipitation_probability[i] ?? 0, pr = h.precipitation[i] ?? 0, Ta = h.apparent_temperature ? h.apparent_temperature[i] ?? h.temperature_2m[i] : h.temperature_2m[i];
  const ws = h.wind_speed_10m ? h.wind_speed_10m[i] ?? 0 : 0, g = h.wind_gusts_10m ? h.wind_gusts_10m[i] ?? 0 : 0, c = h.weather_code[i];
  let s = 100;
  if (P > 10) s -= (P - 10)*(a.prob < 25 ? 1.1 : .8);
  s -= Math.min(60, pr*45);
  s -= Math.max(0, Math.abs(Ta - a.ideal) - 3)*(45/a.tol);
  s -= Math.max(0, ws - a.wind)*8 + Math.max(0, g - 15)*3;
  if (h.is_day[i] === 0) s -= 55;
  if (c >= 95) s -= 100;
  return clamp(Math.round(s), 0, 100);
}
function bestWindow() {
  const h = lastW.hourly, a = ACTS[PLAN.act], now = Date.now();
  let from = hIdx(now + 20*6e4), to = hIdx(dayStart(0) + 22*36e5), tom = false;
  if (to - from < 3) { tom = true; from = hIdx(dayStart(1) + 7*36e5); to = hIdx(dayStart(1) + 22*36e5); }
  const sc = []; for (let i = from; i <= to; i++) sc.push({i, s:hourScore(a, h, i)});
  let best = null;
  for (let k = 0; k < sc.length - 1; k++) { const v = Math.min(sc[k].s, sc[k + 1].s); if (!best || v > best.v) best = {k, v}; }
  return {sc, best, tom};
}
const scoreLbl = v => t('scoreLbl')[v >= 80 ? 0 : v >= 60 ? 1 : v >= 40 ? 2 : 3];
/* цвета оценки: отлично, хорошо, так себе, плохо */
const SC = ['#7ea8ff', '#a58bff', '#ff8fc7', '#ff6b7a'];
const scoreCol = v => SC[v >= 80 ? 0 : v >= 60 ? 1 : v >= 40 ? 2 : 3];
function windowHtml() {
  const h = lastW.hourly, {sc, best, tom} = bestWindow();
  const chips = Object.keys(ACTS).map(k => `<button class="chip pa" data-act="${k}" aria-pressed="${k === PLAN.act}">${ACTS[k].ico} ${esc(t('acts')[k])}</button>`).join('');
  let res = `<div class="ok">${esc(t('noWindow'))}</div>`;
  if (best) {
    const i = sc[best.k].i, from = h.time[i].slice(11), to = h.time[Math.min(i + 2, h.time.length - 1)].slice(11);
    const T = h.apparent_temperature ? h.apparent_temperature[i] : h.temperature_2m[i], P = Math.max(h.precipitation_probability[i] ?? 0, h.precipitation_probability[i + 1] ?? 0);
    const ws = h.wind_speed_10m ? Math.round(Math.max(h.wind_speed_10m[i] ?? 0, h.wind_speed_10m[i + 1] ?? 0)) : null;
    res = `<div class="pv"><span class="pi">${ACTS[PLAN.act].ico}</span><div><b>${esc(t(tom ? 'winTomorrow' : 'winToday', {a:from, b:to}))}</b>`
      + `<small>${esc(scoreLbl(best.v))} · ${esc(t('winDetail', {t:fmt(T), p:P, w:ws ?? '—'}))}</small></div></div>`;
  }
  const bars = sc.map((x, k) => { const c = scoreCol(x.s), on = best && (k === best.k || k === best.k + 1); return `<i style="height:${Math.max(8, x.s)}%;background-color:${c}${on ? ';box-shadow:0 0 14px -3px ' + c : ';opacity:.45'}" title="${h.time[x.i].slice(11)}: ${x.s}"></i>`; }).join('');
  const lbls = sc.filter((x, k) => k % 3 === 0).map(x => `<span>${h.time[x.i].slice(11, 13)}</span>`).join('');
  return `<div class="pb"><div class="ph">⏱ ${esc(t('winTitle'))}</div><div class="pchips" role="group">${chips}</div>${res}
    <div class="pbars" style="grid-template-columns:repeat(${sc.length},1fr)" aria-hidden="true">${bars}</div><div class="plbl" aria-hidden="true">${lbls}</div></div>`;
}

/* ---------- 10. закат и рассвет для фото ---------- */
function sunAz(ms, lat, lon) {
  const sp = sunParams(ms), H = ((sp.utcMin + sp.eqt + 4*lon)/4 - 180)*RAD, la = lat*RAD;
  return (Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(la) - Math.tan(sp.decl)*Math.cos(la))/RAD + 180 + 360) % 360;
}
function crossTime(from, to, level) {          /* момент, когда высота Солнца проходит уровень */
  const el = ms => sunElev(sunParams(ms), sel.lat, sel.lon);
  let prev = el(from);
  for (let ms = from + 12e4; ms <= to; ms += 12e4) { const e = el(ms); if ((prev - level)*(e - level) <= 0) return ms; prev = e; }
  return null;
}
function skyShow(i) {
  const h = lastW.hourly, g = (k, j) => h[k] ? h[k][j] ?? 0 : 0, j0 = Math.max(0, i - 1);
  const low = (g('cloud_cover_low', i) + g('cloud_cover_low', j0))/2, mid = (g('cloud_cover_mid', i) + g('cloud_cover_mid', j0))/2;
  const high = (g('cloud_cover_high', i) + g('cloud_cover_high', j0))/2, tot = g('cloud_cover', i), P = g('precipitation_probability', i);
  if (!h.cloud_cover_low) return null;
  const hm = Math.max(high, mid*.85);
  let s = tot < 10 ? 45 : 30 + 70*Math.exp(-Math.pow((hm - 50)/30, 2)) - (low >= 70 ? 60 : low*.6);
  if (P > 50) s -= 25;
  s = clamp(Math.round(s), 0, 100);
  const lbl = low >= 75 || s < 20 ? t('sunLbl')[3] : s >= 75 ? t('sunLbl')[0] : s >= 55 ? t('sunLbl')[1] : t('sunLbl')[2];
  return {s, lbl};
}
/* полное название стороны света (буква «З» легко путается с цифрой 3) */
const SET_DIRS = {ru:['юго-западе','западе','северо-западе'], lv:['dienvidrietumos','rietumos','ziemeļrietumos'], en:['south-west','west','north-west']};
function setDir(az) { const d = SET_DIRS[lang] || SET_DIRS.en; return d[az < 247.5 ? 0 : az < 292.5 ? 1 : 2]; }

function sunHtml() {
  const d = lastW.daily, off = lastW.utc_offset_seconds*1000, now = Date.now();
  const toMs = str => Date.parse(str + ':00Z') - off;
  let k = 0; if (toMs(d.sunset[0]) + 30*6e4 < now) k = 1;
  const set = toMs(d.sunset[k]), rise = toMs(d.sunrise[Math.min(k + 1, d.sunrise.length - 1)]);
  const gStart = crossTime(set - 3*36e5, set, 6), bStart = crossTime(set - 36e5, set + 2*36e5, -4), bEnd = crossTime(set, set + 2*36e5, -6);
  const q = skyShow(hIdx(set)), qr = skyShow(hIdx(rise));
  const az = Math.round(sunAz(set, sel.lat, sel.lon));
  const ring = q ? (typeof arcMeter === 'function' ? arcMeter(q.s/100, scoreCol(q.s), q.s, '/100') : `<b>${q.s}</b>`) : '';
  return `<div class="pb"><div class="ph">📸 ${esc(t(k ? 'sunsetTom' : 'sunsetToday'))}</div>
    <div class="psun"><div class="pring">${ring}</div><div>
      <b>${esc(q ? q.lbl : '—')}</b>
      <small>${esc(t('sunsetAt', {t:hhmm(set), d:setDir(az), a:az}))}</small>
      ${gStart && bStart ? `<small>✨ ${esc(t('goldenH', {a:hhmm(gStart), b:hhmm(bStart)}))}</small>` : ''}
      ${bStart && bEnd ? `<small>🔵 ${esc(t('blueH', {a:hhmm(bStart), b:hhmm(bEnd)}))}</small>` : ''}
      ${qr ? `<small>🌅 ${esc(t('sunriseTom', {t:hhmm(rise), l:qr.lbl}))}</small>` : ''}
    </div></div></div>`;
}

function renderPlan() {
  const el = $('plan'); if (!el || !lastW || !hourlyData) return;
  try {
    el.innerHTML = `<h2>${esc(t('planTitle'))} · ${esc(placeName(sel))}</h2><div class="pgrid">${washHtml()}${windowHtml()}${sunHtml()}</div>`;
  } catch (e) { console.warn('plan', e); }
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#plan [data-act]'); if (!b) return;
  PLAN.act = b.dataset.act; store.set('wx_act', PLAN.act); renderPlan();
});

/* данные могли прийти раньше, чем загрузился этот файл */
renderPlan();
