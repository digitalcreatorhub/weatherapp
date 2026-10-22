'use strict';
/* Laiks — пояснения к шести приборам главной карточки: касание по прибору открывает окно
   с тем, что значит текущее значение, шкалой и подсказкой. Данные берутся из app.js и viz.js. */

const GI = {
  wind:{edges:[0, 1.5, 3.3, 5.4, 7.9, 10.7, 13.8, 17.1, 20.7, 25],
        cols:['#8fd0ff', '#7fd6c8', '#4ade80', '#a3e635', '#ffd23f', '#ffa040', '#ff6b4a', '#ff3b30', '#b36bff']},
  hum: {edges:[0, 30, 40, 60, 80, 100], cols:['#ffb547', '#ffd27a', '#a58bff', '#5cc8ff', '#3d8bff']},
  uv:  {edges:[0, 3, 6, 8, 11, 13], cols:['#a58bff', '#ffd23f', '#ff8c1a', '#ff3b30', '#b36bff']},
  air: {edges:[0, 20, 40, 60, 80, 100, 130], cols:['#50f0e6', '#50ccaa', '#f0e641', '#ff6b5a', '#e0457b', '#b36bff']},
  pres:{edges:[970, 990, 1005, 1020, 1030, 1045], cols:['#7fd6ff', '#5c9dff', '#a58bff', '#ffd27a', '#ffa040']}
};
const BFW = {
  ru:['0–1 балл', '2 балла', '3 балла', '4 балла', '5 баллов', '6 баллов', '7 баллов', '8 баллов', '9+ баллов'],
  lv:['0–1 balle', '2 balles', '3 balles', '4 balles', '5 balles', '6 balles', '7 balles', '8 balles', '9+ balles'],
  en:['force 0–1', 'force 2', 'force 3', 'force 4', 'force 5', 'force 6', 'force 7', 'force 8', 'force 9+']
};
let giOpen = null;

/* уровень по шкале: индекс отрезка и положение внутри него (0…1) */
function giLevel(k, v) {
  const e = GI[k].edges, n = e.length - 1;
  let i = 0;
  while (i < n - 1 && v >= e[i + 1]) i++;
  return {i, pos:clamp((i + clamp((v - e[i])/(e[i + 1] - e[i]), 0, 1))/n, 0, 1)};
}
function giScale(k, v, lvls) {
  const {i, pos} = giLevel(k, v), cols = GI[k].cols, txt = t('gi');
  const bar = cols.map((c, j) => `<i style="background:${c};opacity:${j === i ? 1 : .38}"></i>`).join('');
  const rows = lvls.map((l, j) => `<li class="${j === i ? 'on' : ''}"><i style="background:${cols[j]}"></i><b>${esc(l[0])}</b><span><em>${esc(l[1])}</em> — ${esc(l[2])}</span></li>`).join('');
  return `<div class="gi-bar" role="img" aria-label="${esc(txt.scale)}">${bar}<s style="left:${(pos*100).toFixed(1)}%"></s></div>
    <h4>${esc(txt.scale)}</h4><ul class="gi-lv">${rows}</ul>`;
}
const giLoc = s => Date.parse(s + ':00Z') - (lastW.utc_offset_seconds || 0)*1000;      /* местное время из ответа → настоящие мс */
const giHour = ms => ((ms + (lastW.utc_offset_seconds || 0)*1000) % 864e5 + 864e5) % 864e5/36e5;
function giCross(from, to, level) {
  let prev = sunElev(sunParams(from), sel.lat, sel.lon) - level;
  for (let ms = from + 6e4; ms <= to; ms += 6e4) {
    const e = sunElev(sunParams(ms), sel.lat, sel.lon) - level;
    if (prev*e <= 0) return ms;
    prev = e;
  }
  return null;
}

function giBody(k) {
  const g = t('gi'), x = g[k], c = lastW.current, d = lastW.daily, p = [];
  let head = '', scale = '';
  if (k === 'wind') {
    const v = c.wind_speed_10m ?? 0, gust = gustNow(), {i} = giLevel(k, v), l = x.lv[i], dir = c.wind_direction_10m ?? 0, s8 = Math.round(dir/45) % 8;
    head = fill(x.head, {v:Math.round(v), n:l[1]});
    p.push(fill(x.nowTxt, {v:Math.round(v), kmh:Math.round(v*3.6), bf:(BFW[lang] || BFW.en)[i], e:l[2]}));
    if (gust != null && gust - v >= 2) p.push(fill(gust >= 15 ? x.gustBad : x.gust, {g:Math.round(gust)}));
    p.push(fill(x.dir, {f:x.from[s8], s:compass(dir)}) + ' ' + (s8 >= 5 && s8 <= 6 ? x.sea : s8 === 4 ? x.south : s8 <= 2 || s8 === 7 ? x.land : ''));
    if (c.apparent_temperature != null && Math.abs(c.apparent_temperature - c.temperature_2m) >= 2) p.push(fill(x.feel, {f:fmt(c.apparent_temperature), t:fmt(c.temperature_2m)}));
    scale = giScale(k, v, x.lv);
  } else if (k === 'hum') {
    const v = c.relative_humidity_2m ?? 0, T = c.temperature_2m, {i} = giLevel(k, v), l = x.lv[i];
    const a = 17.62, b = 243.12, gm = Math.log(Math.max(v, 1)/100) + a*T/(b + T), td = b*gm/(a - gm);
    head = fill(x.head, {v, n:l[1]});
    p.push(fill(x.nowTxt, {v, t:fmt(T)}));
    p.push(fill(x.dew, {d:fmt(td)}));
    if (T - td <= 2.5) p.push(fill(x.fog, {k:Math.max(0, Math.round(T - td))}));
    else if (T < 10 && v >= 80) p.push(x.raw);
    if (td > 18) p.push(x.muggy);
    p.push(fill(x.cloud, {c:c.cloud_cover ?? '—'}));
    scale = giScale(k, v, x.lv);
  } else if (k === 'uv') {
    const v = c.uv_index ?? 0, {i} = giLevel(k, v), l = x.lv[i];
    const noon = (giLoc(d.sunrise[0]) + giLoc(d.sunset[0]))/2, mx = d.uv_index_max ? d.uv_index_max[0] : null;
    head = fill(x.head, {v:v.toFixed(1), n:l[1]});
    p.push(fill(x.nowTxt, {v:v.toFixed(1), e:l[2]}));
    if (mx != null) p.push(fill(x.max, {m:mx.toFixed(1), n:hhmm(noon)}));
    p.push(x.need);
    scale = giScale(k, v, x.lv);
  } else if (k === 'air') {
    if (!air) return {head:'—', html:`<p>${esc(x.how)}</p>`};
    const v = air.european_aqi, {i} = giLevel(k, v), l = x.lv[i];
    head = fill(x.head, {v:Math.round(v), n:l[1]});
    p.push(fill(x.nowTxt, {v:Math.round(v), e:l[2]}));
    const sub = ['pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone'].map(s => [s, air['european_aqi_' + s]]).filter(s => s[1] != null).sort((a, b) => b[1] - a[1]);
    if (sub.length) p.push(fill(x.main, {p:x.pol[sub[0][0]]}));
    const r = n => n != null ? Math.round(n) : '—';
    if (air.pm10 != null) p.push(fill(x.conc, {a:r(air.pm2_5), b:r(air.pm10), c:r(air.nitrogen_dioxide), d:r(air.ozone)}));
    scale = giScale(k, v, x.lv);
  } else if (k === 'pres') {
    const v = c.pressure_msl ?? 1013, tr = pressureTrend(), {i} = giLevel(k, v), l = x.lv[i];
    head = fill(x.head, {v:Math.round(v), n:l[1]});
    p.push(fill(x.nowTxt, {v:Math.round(v), mm:Math.round(v*0.750062), n:l[1], e:l[2]}));
    const a = Math.abs(tr).toFixed(1);
    p.push(tr <= -3 ? fill(x.down, {x:a}) + ' ' + fill(x.fast, {x:a}) : tr < -1 ? fill(x.down, {x:a}) : tr > 1 ? fill(x.up, {x:a}) : x.flat);
    scale = giScale(k, v, x.lv);
  } else if (k === 'sun') {
    const rise = giLoc(d.sunrise[0]), set = giLoc(d.sunset[0]), len = (set - rise)/6e4;
    const len2 = d.sunrise[1] ? (giLoc(d.sunset[1]) - giLoc(d.sunrise[1]))/6e4 : null;
    const noon = (rise + set)/2, el = sunElev(sunParams(noon), sel.lat, sel.lon);
    const dawn = giCross(rise - 3*36e5, rise, -6), dusk = giCross(set, set + 3*36e5, -6), now = Date.now();
    head = fill(x.head, {a:d.sunrise[0].slice(11), b:d.sunset[0].slice(11)});
    const dd = len2 == null ? null : Math.round(len2 - len);
    p.push(fill(x.len, {h:Math.floor(len/60), m:Math.round(len % 60),
      d:dd == null ? '—' : dd > 0 ? fill(x.longer, {n:dd}) : dd < 0 ? fill(x.shorter, {n:-dd}) : x.same}));
    p.push(fill(x.noon, {t:hhmm(noon), e:Math.round(el)}));
    if (now < set && dusk) p.push(fill(x.dusk, {t:hhmm(dusk)}));
    if (now < rise || now > (dusk || set)) {               /* ночью — когда светает (после заката — уже завтра) */
      const r2 = now > set && d.sunrise[1] ? giLoc(d.sunrise[1]) : rise, w2 = r2 === rise ? dawn : giCross(r2 - 3*36e5, r2, -6);
      if (w2) p.push(fill(x.dawn, {t:hhmm(w2), r:hhmm(r2)}));
    }
    /* сутки полосой: ночь — сумерки — день — сумерки — ночь, отметка «сейчас» */
    const H = ms => (giHour(ms)/24*100).toFixed(2), a0 = dawn ? H(dawn) : H(rise), a1 = H(rise), b0 = H(set), b1 = dusk ? H(dusk) : H(set);
    scale = `<div class="gi-day" role="img" aria-label="${esc(head)}"><i style="background:linear-gradient(90deg,#22395e ${a0}%,#5b7fb3 ${a1}%,#ffd27a ${a1}%,#ffb547 50%,#ffd27a ${b0}%,#5b7fb3 ${b0}%,#22395e ${b1}%)"></i>
      <s style="left:${H(now)}%"></s></div><div class="gi-hrs"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div>`;
  }
  return {head, html:p.map(s => `<p>${esc(s)}</p>`).join('') + scale};
}
function fill(s, vars) { return String(s).replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? dec(vars[k]) : m); }

function giEnsure() {
  let dlg = $('gi');
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'gi'; dlg.className = 'gi';
  dlg.innerHTML = '<div class="gi-in" id="giIn"></div>';
  document.body.appendChild(dlg);
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('.gi-x')) giClose();       /* касание по затемнению или крестику */
  });
  dlg.addEventListener('close', () => { giOpen = null; document.documentElement.classList.remove('gi-lock'); });
  return dlg;
}
function giShow(k) {
  if (!lastW || !t('gi')[k]) return;
  const g = t('gi'), x = g[k], dlg = giEnsure();
  let b;
  try { b = giBody(k); } catch (e) { console.warn('gi', e); b = {head:'', html:''}; }
  const label = $('gauges') && $('gauges').querySelector(`[data-gi="${k}"] .gl`);
  $('giIn').innerHTML = `<button class="gi-x" type="button" aria-label="${esc(g.close)}">✕</button>
    <div class="gi-hd"><span class="gi-ico" aria-hidden="true">${x.ico}</span><div><small>${esc(label ? label.textContent : '')} · ${esc(placeName(sel))}</small><h3>${esc(b.head)}</h3></div></div>
    <div class="gi-now">${b.html}</div>
    <h4>${esc(g.how)}</h4><p>${esc(x.how)}</p>
    <p class="gi-tip">💡 ${esc(x.tip)}</p>`;
  giOpen = k;
  document.documentElement.classList.add('gi-lock');
  if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  $('giIn').scrollTop = 0;
}
function giClose() {
  const dlg = $('gi'); if (!dlg || !dlg.open) return;
  dlg.classList.add('out');
  setTimeout(() => { dlg.classList.remove('out'); if (dlg.close) dlg.close(); else { dlg.removeAttribute('open'); giOpen = null; } }, 180);
}

document.addEventListener('click', e => {
  const g = e.target.closest && e.target.closest('.gauge[data-gi]');
  if (g) giShow(g.dataset.gi);
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.gauge[data-gi]')) { e.preventDefault(); giShow(e.target.dataset.gi); }
});
