'use strict';
/* Laiks — визуализации: живое небо в главной карточке и приборная панель.
   Использует данные и функции из app.js (lastW, air, sel, t, fmt, sunParams, sunElev, moonInfo, tempColor …). */

/* ---------- общие помощники SVG ---------- */
const VZ_TEXT = '#eaf2f8', VZ_MUTED = '#8fa6ba', VZ_SURF = '#0a1522';
const pt2 = (cx, cy, r, a) => [cx + r*Math.cos(a*RAD), cy + r*Math.sin(a*RAD)];
function arcD(cx, cy, r, a0, a1) {
  if (a1 - a0 >= 359.9) a1 = a0 + 359.9;
  const [x0, y0] = pt2(cx, cy, r, a0), [x1, y1] = pt2(cx, cy, r, a1);
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const svgT = (x, y, s, size, fill, w, anchor) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${w || 500}" text-anchor="${anchor || 'middle'}" dominant-baseline="middle">${esc(s)}</text>`;

/* дуговой прибор 270°: заполнение — цвет значения, дорожка — тот же цвет, приглушённый */
function arcMeter(frac, color, value, unit) {
  const a0 = 135, a1 = 405, f = clamp(frac, 0, 1), cx = 60, cy = 50, r = 34;
  return `<svg viewBox="0 0 120 92" aria-hidden="true">
    <path d="${arcD(cx, cy, r, a0, a1)}" fill="none" stroke="${hexA(color, .2)}" stroke-width="8" stroke-linecap="round"/>
    ${f > 0.004 ? `<path class="gf" pathLength="1" d="${arcD(cx, cy, r, a0, a0 + (a1 - a0)*f)}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>` : ''}
    ${svgT(cx, cy - 2, value, 19, VZ_TEXT, 600)}${unit ? svgT(cx, cy + 15, unit, 10, VZ_MUTED, 400) : ''}
  </svg>`;
}

/* ---------- приборы ---------- */
const UV_COL = ['#a58bff', '#ffd23f', '#ff8c1a', '#ff3b30', '#b36bff'];
const AQI_COL = ['#50f0e6', '#50ccaa', '#f0e641', '#ff6b5a', '#e0457b', '#b36bff'];
const uvIdx = u => u < 3 ? 0 : u < 6 ? 1 : u < 8 ? 2 : u < 11 ? 3 : 4;
const aqiIdx = a => a <= 20 ? 0 : a <= 40 ? 1 : a <= 60 ? 2 : a <= 80 ? 3 : a <= 100 ? 4 : 5;

function gWind(c, gust) {
  const dir = c.wind_direction_10m ?? 0, sp = c.wind_speed_10m ?? 0, cx = 60, cy = 46, r = 32;
  let ticks = '';
  for (let k = 0; k < 16; k++) {
    const a = k*22.5 - 90, big = k % 4 === 0, [x0, y0] = pt2(cx, cy, r - (big ? 6 : 3), a), [x1, y1] = pt2(cx, cy, r, a);
    ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${big ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.18)'}" stroke-width="1"/>`;
  }
  /* стрелка-флюгер: остриё на кольце со стороны, откуда дует ветер, указывает внутрь */
  const a = dir - 90, [tx, ty] = pt2(cx, cy, r - 2, a), [b1x, b1y] = pt2(cx, cy, r + 9, a - 9), [b2x, b2y] = pt2(cx, cy, r + 9, a + 9);
  const [sx, sy] = pt2(cx, cy, r - 14, a);
  const n = t('dirs')[0];
  return `<svg viewBox="0 0 120 92" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="1"/>${ticks}
    ${svgT(cx, cy - r - 7, n, 9, VZ_MUTED, 600)}
    <g class="vane" style="transform-origin:${cx}px ${cy}px;animation-duration:${(3.6 - clamp((gust ?? sp) - sp, 0, 10)*0.2).toFixed(1)}s">
    <line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}" stroke="#5cc8ff" stroke-width="2" stroke-linecap="round"/>
    <path d="M${tx.toFixed(1)},${ty.toFixed(1)}L${b1x.toFixed(1)},${b1y.toFixed(1)}L${b2x.toFixed(1)},${b2y.toFixed(1)}Z" fill="#5cc8ff"/></g>
    ${svgT(cx, cy - 3, Math.round(sp), 19, VZ_TEXT, 600)}${svgT(cx, cy + 12, t('ms'), 9, VZ_MUTED, 400)}
  </svg>
  <div class="gv"><span class="dirc">${esc(compass(dir))}</span>${gust != null ? ' ' + esc(t('gustShort', {v:Math.round(gust)})) : ''}</div>`;
}

function gPressure(c, tend) {
  const v = c.pressure_msl ?? 1013, lo = 960, hi = 1050, cx = 60, cy = 58, r = 38;
  const ang = 180 + clamp((v - lo)/(hi - lo), 0, 1)*180;
  let ticks = '';
  [970, 990, 1013, 1030, 1045].forEach(p => {
    const a = 180 + (p - lo)/(hi - lo)*180, [x0, y0] = pt2(cx, cy, r - 5, a), [x1, y1] = pt2(cx, cy, r + 1, a);
    ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="rgba(255,255,255,${p === 1013 ? .5 : .25})" stroke-width="1"/>`;
  });
  const [nx, ny] = pt2(cx, cy, r - 8, ang);
  const arrow = tend > 1 ? '↗' : tend < -1 ? '↘' : '→', word = tend > 1 ? t('pUp') : tend < -1 ? t('pDown') : t('pFlat');
  return `<svg viewBox="0 0 120 92" aria-hidden="true">
    <path d="${arcD(cx, cy, r, 180, 360)}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="6" stroke-linecap="round"/>
    <path class="gf" pathLength="1" d="${arcD(cx, cy, r, 180, ang)}" fill="none" stroke="#9ad7ff" stroke-width="6" stroke-linecap="round" opacity=".55"/>${ticks}
    <g class="needle" style="transform-origin:${cx}px ${cy}px"><line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${VZ_TEXT}" stroke-width="2" stroke-linecap="round"/></g>
    <circle cx="${cx}" cy="${cy}" r="4" fill="${VZ_TEXT}" stroke="${VZ_SURF}" stroke-width="2"/>
    ${svgT(cx, cy + 17, Math.round(v), 15, VZ_TEXT, 600)}${svgT(cx, cy + 29, t('hpa'), 9, VZ_MUTED, 400)}
  </svg>
  <div class="gv">${arrow} ${esc(word)}</div>`;
}

function gSun(d) {
  const rise = Date.parse(d.sunrise[0]), set = Date.parse(d.sunset[0]), now = Date.now();
  /* время в daily — местное (Europe/Riga) без зоны; переводим «сейчас» в те же местные часы */
  const loc = Date.parse(new Date(now).toLocaleString('sv-SE', {timeZone:TZ}).replace(' ', 'T'));
  const day = loc >= rise && loc <= set, f = clamp((loc - rise)/(set - rise), 0, 1);
  const cx = 60, cy = 62, rx = 44, ry = 38;
  const P = u => [cx - rx*Math.cos(u*Math.PI), cy - ry*Math.sin(u*Math.PI)];
  let full = '', part = '';
  for (let k = 0; k <= 40; k++) { const [x, y] = P(k/40); full += `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }
  if (day) for (let k = 0; k <= 40; k++) { const [x, y] = P(f*k/40); part += `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }
  const [sx, sy] = P(f);
  let mins, key;
  if (day) { mins = (set - loc)/6e4; key = 'sunLeft'; }
  else { const nr = loc < rise ? rise : rise + 864e5; mins = (nr - loc)/6e4; key = 'sunRise'; }
  const h = Math.floor(mins/60), m = Math.round(mins % 60);
  return `<svg viewBox="0 0 120 92" aria-hidden="true">
    <line x1="8" y1="${cy}" x2="112" y2="${cy}" stroke="rgba(255,255,255,.18)" stroke-width="1"/>
    <path d="${full}" fill="none" stroke="rgba(255,181,71,.22)" stroke-width="2"/>
    ${day ? `<path class="gf" pathLength="1" d="${part}" fill="none" stroke="#ffb547" stroke-width="2" stroke-linecap="round"/>
      <circle class="sunglow" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="9" fill="rgba(255,181,71,.25)"/>
      <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5" fill="#ffb547" stroke="${VZ_SURF}" stroke-width="2"/>`
      : svgT(cx, cy - 18, '🌙', 16, VZ_TEXT)}
    ${svgT(14, cy + 13, d.sunrise[0].slice(11), 9.5, VZ_MUTED, 400, 'start')}${svgT(106, cy + 13, d.sunset[0].slice(11), 9.5, VZ_MUTED, 400, 'end')}
  </svg>
  <div class="gv">${esc(t(key, {h, m}))}</div>`;
}

function pressureTrend() {
  const h = lastW && lastW.hourly; if (!h || !h.pressure_msl || !hourlyData) return 0;
  const i = clamp(Math.floor((Date.now() - hourlyData.base)/36e5), 0, h.time.length - 1);
  const a = h.pressure_msl[Math.max(0, i - 3)], b = h.pressure_msl[Math.min(h.time.length - 1, i + 3)];
  return a != null && b != null ? (b - a)/2 : 0;   /* гПа за 3 часа */
}
function gustNow() {
  const h = lastW && lastW.hourly; if (!h || !h.wind_gusts_10m || !hourlyData) return null;
  const i = clamp(Math.floor((Date.now() - hourlyData.base)/36e5), 0, h.time.length - 1);
  return h.wind_gusts_10m[i];
}

function gaugesHTML() {
  if (!lastW) return '';
  const c = lastW.current, d = lastW.daily;
  const hum = c.relative_humidity_2m ?? 0, uv = c.uv_index, ui = uv != null ? uvIdx(uv) : 0;
  const aq = air && air.european_aqi != null ? air.european_aqi : null, ai = aq != null ? aqiIdx(aq) : 0;
  const tile = (k, label, body) => `<div class="gauge" data-gi="${k}" role="button" tabindex="0" aria-haspopup="dialog" aria-label="${esc(label)}: ${esc(t('gi').open)}"><div class="gl">${esc(label)}</div>${body}</div>`;
  return [
    tile('wind', t('wind'), gWind(c, gustNow())),
    tile('hum', t('humidity'), arcMeter(hum/100, '#5cc8ff', hum + '%', '') + `<div class="gv">☁️ ${c.cloud_cover ?? '—'}%</div>`),
    tile('uv', t('gUV'), arcMeter(uv != null ? uv/11 : 0, UV_COL[ui], uv != null ? dec(uv.toFixed(1)) : '—', '') + `<div class="gv">${uv != null ? esc(uvLabel(uv)) : '—'}</div>`),
    tile('air', t('gAir'), arcMeter(aq != null ? aq/100 : 0, AQI_COL[ai], aq != null ? Math.round(aq) : (air === null ? '…' : '—'), 'EAQI') + `<div class="gv">${aq != null ? esc(aqiLabel(aq)) : '&nbsp;'}</div>`),
    tile('pres', t('pressure'), gPressure(c, pressureTrend())),
    tile('sun', t('gSun'), gSun(d))
  ].join('');
}
function refreshGauges() { const el = $('gauges'); if (el && lastW) el.innerHTML = gaugesHTML(); }

/* ---------- живое небо ---------- */
const SKY = {cv:null, cx:null, W:0, H:0, dpr:1, st:null, sig:'', clouds:[], drops:[], stars:[], fog:[], flash:0, nextFlash:0, bolt:null,
  raf:0, last:0, visible:true, still:false, t0:0};
const RAIN_N = {51:35, 53:55, 55:80, 56:45, 57:70, 61:70, 63:130, 65:210, 66:90, 67:150, 80:90, 81:150, 82:230, 95:170, 96:190, 99:220};
const SNOW_N = {71:40, 73:80, 75:140, 77:50, 85:70, 86:140};
const rnd = (a, b) => a + Math.random()*(b - a);

function skyState() {
  if (!lastW) return null;
  const c = lastW.current, code = c.weather_code ?? 0, now = Date.now();
  const sp = sunParams(now), elev = sunElev(sp, sel.lat, sel.lon);
  const solar = (((sp.utcMin + sp.eqt + 4*sel.lon)/1440) % 1 + 1) % 1;   /* 0.5 — местный полдень */
  const to = ((c.wind_direction_10m ?? 270) + 180)*RAD, ws = c.wind_speed_10m ?? 2;
  const rain = RAIN_N[code] || 0, snow = SNOW_N[code] || 0;
  let cloud = c.cloud_cover ?? 0;
  if (rain || snow) cloud = Math.max(cloud, 75);
  return {code, elev, solar, cloud, ws, dx:Math.sin(to), rain, snow, fog:code === 45 || code === 48, storm:code >= 95, moon:moonInfo(now)};
}
function skySize() {
  const box = SKY.cv.parentElement, r = box.getBoundingClientRect();
  SKY.dpr = Math.min(window.devicePixelRatio || 1, 2);
  SKY.W = Math.max(1, Math.round(r.width)); SKY.H = Math.max(1, Math.round(r.height));
  SKY.cv.width = Math.round(SKY.W*SKY.dpr); SKY.cv.height = Math.round(SKY.H*SKY.dpr);
  SKY.cx.setTransform(SKY.dpr, 0, 0, SKY.dpr, 0, 0);
  /* свет солнца или луны исходит из анимированного значка погоды */
  const ic = document.querySelector('#hero .ico');
  if (ic && ic.getBoundingClientRect) { const q = ic.getBoundingClientRect(); SKY.anchor = {x:q.left - r.left + q.width/2, y:q.top - r.top + q.height/2}; }
  else SKY.anchor = {x:SKY.W - 70, y:90};
}
function skySeed() {
  const s = SKY.st, W = SKY.W, H = SKY.H, area = W*H/(400*600);
  SKY.stars = Array.from({length:Math.round(70*area) + 20}, () => ({x:rnd(0, W), y:rnd(0, H*0.7), r:rnd(.4, 1.4), p:rnd(0, 6.28)}));
  const nC = Math.round(s.cloud/100*7);
  SKY.clouds = Array.from({length:nC}, (_, i) => {
    const sc = rnd(.7, 1.5)*(W/420);
    return {x:rnd(-80, W + 80), y:rnd(H*0.04, H*0.42), s:sc, a:rnd(.55, .95), v:rnd(.6, 1.2),
      blobs:Array.from({length:5}, () => ({dx:rnd(-46, 46), dy:rnd(-12, 10), r:rnd(18, 34)}))};
  });
  const nP = Math.round((s.rain || s.snow)*Math.max(.6, area));
  SKY.drops = Array.from({length:nP}, () => ({x:rnd(-40, W + 40), y:rnd(-H, H), l:rnd(9, 18), v:rnd(.8, 1.2), r:rnd(1, 2.6), p:rnd(0, 6.28)}));
  SKY.fog = s.fog ? Array.from({length:4}, (_, i) => ({y:H*(.25 + i*.18), x:rnd(0, W), w:W*rnd(.8, 1.4), v:rnd(4, 9)})) : [];
}
function skyColors(s) {
  const e = s.elev, k = clamp((e + 8)/14, 0, 1);              /* 0 ночь … 1 день */
  const dusk = clamp(1 - Math.abs(e - 1)/7, 0, 1);              /* сумерки около горизонта */
  const mix = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v)*f));
  let top = mix([8, 18, 40], [34, 98, 168], k), bot = mix([18, 38, 70], [96, 162, 214], k);
  bot = mix(bot, [226, 132, 92], dusk*0.75); top = mix(top, [58, 60, 112], dusk*0.4);
  const grey = clamp((s.cloud - 40)/60, 0, 1)*0.65 + (s.rain || s.snow ? .15 : 0);
  const g = k > .5 ? [96, 110, 128] : [34, 42, 58];
  top = mix(top, g, grey); bot = mix(bot, g.map(v => v + 18), grey);
  return {top:`rgb(${top})`, bot:`rgb(${bot})`, k, dusk};
}
function drawCloud(cx, c, x, y, col, a) {
  cx.save(); cx.translate(x, y); cx.scale(c.s, c.s);
  c.blobs.forEach(b => {
    const g = cx.createRadialGradient(b.dx, b.dy, 1, b.dx, b.dy, b.r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.65, `rgba(${col},${a*.7})`); g.addColorStop(1, `rgba(${col},0)`);
    cx.fillStyle = g; cx.beginPath(); cx.arc(b.dx, b.dy, b.r, 0, 6.283); cx.fill();
  });
  cx.restore();
}
function skyFrame(ts) {
  const s = SKY.st, cx = SKY.cx, W = SKY.W, H = SKY.H; if (!s || !cx) return;
  const dt = SKY.last ? Math.min(.1, (ts - SKY.last)/1000) : 0; SKY.last = ts;
  const col = skyColors(s);
  const bg = cx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, col.top); bg.addColorStop(1, col.bot);
  cx.fillStyle = bg; cx.fillRect(0, 0, W, H);

  /* звёзды */
  const starA = clamp((-s.elev - 2)/8, 0, 1)*(1 - s.cloud/110);
  if (starA > .02) SKY.stars.forEach(st => {
    const tw = SKY.still ? .8 : .55 + .45*Math.sin(ts/900 + st.p);
    cx.fillStyle = `rgba(235,242,255,${(starA*tw).toFixed(3)})`; cx.beginPath(); cx.arc(st.x, st.y, st.r, 0, 6.283); cx.fill();
  });

  /* свет солнца или луны — из значка погоды */
  const A = SKY.anchor || {x:W - 70, y:90}, veil = 1 - clamp((s.cloud - 50)/50, 0, .8);
  if (s.elev > -6) {
    const warm = col.dusk, R = Math.max(W, H)*(0.45 + 0.15*warm);
    const g = cx.createRadialGradient(A.x, A.y, 4, A.x, A.y, R);
    g.addColorStop(0, `rgba(255,${Math.round(225 - 70*warm)},${Math.round(150 - 60*warm)},${(.55*veil).toFixed(3)})`);
    g.addColorStop(.35, `rgba(255,${Math.round(190 - 60*warm)},${Math.round(110 - 40*warm)},${(.18*veil).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,180,100,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  } else {
    const R = Math.max(W, H)*0.4, a = (.12 + .2*s.moon.frac)*veil;
    const g = cx.createRadialGradient(A.x, A.y, 4, A.x, A.y, R);
    g.addColorStop(0, `rgba(215,228,255,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(215,228,255,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  }

  /* облака */
  const dark = s.rain || s.snow || s.storm, ccol = col.k > .5 ? (dark ? '150,160,176' : '250,252,255') : (dark ? '70,80,100' : '120,136,168');
  const vx = (6 + s.ws*2.2)*(s.dx >= 0 ? 1 : -1)*Math.max(.35, Math.abs(s.dx));
  SKY.clouds.forEach(c => {
    if (!SKY.still) { c.x += vx*c.v*dt; const span = W + 240; if (c.x > W + 120) c.x -= span; if (c.x < -120) c.x += span; }
    drawCloud(cx, c, c.x, c.y, ccol, c.a*(.45 + s.cloud/200));
  });
  if (s.cloud > 85) { cx.fillStyle = `rgba(${ccol},${((s.cloud - 85)/15*.25).toFixed(3)})`; cx.fillRect(0, 0, W, H*0.5); }

  /* туман */
  SKY.fog.forEach(f => {
    if (!SKY.still) { f.x += f.v*dt; if (f.x - f.w > W) f.x = -f.w*0.2; }
    const g = cx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.w*0.6);
    g.addColorStop(0, 'rgba(210,220,230,.28)'); g.addColorStop(1, 'rgba(210,220,230,0)');
    cx.fillStyle = g; cx.fillRect(f.x - f.w, f.y - f.w*0.25, f.w*2, f.w*0.5);
  });

  /* осадки */
  const slant = s.dx*Math.min(.6, .12 + s.ws*0.05);
  if (s.rain) {
    cx.strokeStyle = 'rgba(190,215,255,.55)'; cx.lineWidth = 1.2; cx.lineCap = 'round'; cx.beginPath();
    SKY.drops.forEach(p => {
      if (!SKY.still) { p.y += 520*p.v*dt; p.x += 520*p.v*dt*slant; if (p.y > H + 20) { p.y = rnd(-40, -10); p.x = rnd(-40, W + 40); } }
      cx.moveTo(p.x, p.y); cx.lineTo(p.x - p.l*slant, p.y - p.l);
    });
    cx.stroke();
  } else if (s.snow) {
    cx.fillStyle = 'rgba(245,250,255,.85)';
    SKY.drops.forEach(p => {
      if (!SKY.still) { p.y += 40*p.v*dt; p.x += (Math.sin(ts/1100 + p.p)*12 + 60*slant)*dt; if (p.y > H + 6) { p.y = -6; p.x = rnd(-20, W + 20); } }
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
    });
  }

  /* гроза: вспышка и молния */
  if (s.storm && !SKY.still) {
    if (ts > SKY.nextFlash) {
      SKY.flash = 1; SKY.nextFlash = ts + rnd(3500, 9000);
      let x = rnd(W*.15, W*.65), y = H*.12; SKY.bolt = [[x, y]];
      while (y < H*.75) { x += rnd(-18, 18); y += rnd(10, 26); SKY.bolt.push([x, y]); }
    }
    if (SKY.flash > 0) {
      cx.fillStyle = `rgba(230,236,255,${(SKY.flash*.35).toFixed(3)})`; cx.fillRect(0, 0, W, H);
      if (SKY.bolt && SKY.flash > .55) {
        cx.strokeStyle = `rgba(255,255,255,${SKY.flash.toFixed(3)})`; cx.lineWidth = 2; cx.beginPath();
        SKY.bolt.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.stroke();
      }
      SKY.flash = Math.max(0, SKY.flash - dt*2.2);
    }
  }
}
function skyLoop(ts) {
  SKY.raf = 0;
  if (!SKY.st || SKY.still || !SKY.visible || document.hidden) return;
  if (ts - (SKY.t0 || 0) >= 33) { SKY.t0 = ts; skyFrame(ts); }
  SKY.raf = requestAnimationFrame(skyLoop);
}
function skyKick() {
  if (!SKY.cv || !SKY.st) return;
  if (SKY.still) { SKY.last = 0; skyFrame(performance.now()); return; }
  if (!SKY.raf && SKY.visible && !document.hidden) { SKY.last = 0; SKY.raf = requestAnimationFrame(skyLoop); }
}
function skyUpdate() {
  if (!SKY.cv) {
    SKY.cv = $('sky'); if (!SKY.cv || !SKY.cv.getContext) return;
    SKY.cx = SKY.cv.getContext('2d');
    try { const mq = matchMedia('(prefers-reduced-motion: reduce)'); SKY.still = mq.matches; mq.addEventListener('change', e => { SKY.still = e.matches; skyKick(); }); } catch (e) {}
    try { new IntersectionObserver(es => { SKY.visible = es[0].isIntersecting; skyKick(); }).observe(SKY.cv.parentElement); } catch (e) {}
    try { new ResizeObserver(() => { if (!SKY.st) return; skySize(); skySeed(); skyKick(); }).observe(SKY.cv.parentElement); } catch (e) {}
    document.addEventListener('visibilitychange', skyKick);
  }
  const s = skyState(); if (!s) return;
  const sig = [s.code, Math.round(s.cloud/10), s.rain, s.snow, s.fog].join('|');
  SKY.st = s; skySize();
  if (sig !== SKY.sig || !SKY.clouds.length && s.cloud > 14) { SKY.sig = sig; skySeed(); }
  $('sky').setAttribute('aria-label', t('skyAria'));
  vzTheme(); skyKick();
}
/* положение солнца меняется медленно: пересчитываем раз в минуту */
setInterval(() => { if (SKY.st && lastW) { SKY.st = Object.assign(SKY.st, (() => { const sp = sunParams(Date.now()); return {elev:sunElev(sp, sel.lat, sel.lon), solar:(((sp.utcMin + sp.eqt + 4*sel.lon)/1440) % 1 + 1) % 1, moon:moonInfo(Date.now())}; })()); vzTheme(); if (SKY.still) skyKick(); } }, 60e3);

/* ---------- анимированные значки погоды (SVG + CSS-анимации, см. .wx в index.html) ---------- */
const WX_CLOUD = 'M20,48H46A10,10 0 0 0 46,28A14,14 0 0 0 19.5,24.5A11.8,11.8 0 0 0 20,48Z';
function wxSun(x, y, r) {
  let rays = '';
  for (let k = 0; k < 8; k++) {
    const a = k*45*RAD, x0 = x + Math.cos(a)*(r + 4), y0 = y + Math.sin(a)*(r + 4), x1 = x + Math.cos(a)*(r + 9), y1 = y + Math.sin(a)*(r + 9);
    rays += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`;
  }
  return `<g class="spin" style="transform-origin:${x}px ${y}px" stroke="#ffd27a" stroke-width="3" stroke-linecap="round">${rays}</g>
    <circle class="glow" cx="${x}" cy="${y}" r="${r + 3}" fill="#ffb547" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffb547"/>`;
}
function wxMoon(x, y, r) {
  return `<g class="glow2"><circle cx="${x}" cy="${y}" r="${r + 5}" fill="#dfe8ff" opacity=".12"/></g>
    <path d="M${x + r*0.35},${y - r}A${r},${r} 0 1 0 ${x + r},${y + r*0.35}A${r*0.8},${r*0.8} 0 1 1 ${x + r*0.35},${y - r}Z" fill="#f3ecd2"/>`;
}
/* внешняя группа держит положение (атрибут transform), внутренняя — анимацию (CSS transform) */
const wxCloud = (fill, cls, tr) => `<g${tr ? ` transform="${tr}"` : ''}><g class="${cls || 'drift'}"><path d="${WX_CLOUD}" fill="${fill}"/></g></g>`;
function wxDrops(n, color, heavy) {
  let s = '';
  const xs = n === 2 ? [26, 38] : n === 3 ? [22, 32, 42] : [20, 28, 36, 44];
  xs.forEach((x, i) => { s += `<line class="drop" style="animation-delay:${(-i*0.37).toFixed(2)}s" x1="${x}" y1="52" x2="${x - 2}" y2="${heavy ? 60 : 57}" stroke="${color}" stroke-width="${heavy ? 3 : 2.5}" stroke-linecap="round"/>`; });
  return s;
}
function wxFlakes(n) {
  let s = '';
  const xs = n === 2 ? [27, 39] : [22, 32, 42];
  xs.forEach((x, i) => { s += `<circle class="flake" style="animation-delay:${(-i*0.8).toFixed(2)}s" cx="${x}" cy="54" r="2.6" fill="#ffffff"/>`; });
  return s;
}
function wxIcon(code, isDay, size) {
  const night = isDay === 0, sz = size || 40, body = night ? wxMoon(22, 22, 11) : wxSun(22, 22, 9);
  let g;
  if (code === 0) g = night ? wxMoon(32, 32, 16) : wxSun(32, 32, 13);
  else if (code === 1) g = body + wxCloud('#eef4fb', 'drift', 'translate(10 8) scale(.72)');
  else if (code === 2) g = body + wxCloud('#e6eef6', 'drift', 'translate(4 2) scale(.9)');
  else if (code === 3) g = wxCloud('#9fb0c4', 'drift2', 'translate(-6 -8) scale(.85)') + wxCloud('#dfe7f0');
  else if (code === 45 || code === 48) g = wxCloud('#b9c6d4', 'drift', 'translate(0 -6)') +
    `<g stroke="#cfd9e3" stroke-width="3" stroke-linecap="round"><line class="fogl" x1="14" y1="50" x2="44" y2="50"/><line class="fogl f2" x1="20" y1="57" x2="50" y2="57"/></g>`;
  else if (code >= 51 && code <= 57) g = wxCloud('#cfd9e4', 'drift', 'translate(0 -6)') + wxDrops(2, '#5cc8ff') + (code >= 56 ? wxFlakes(2) : '');
  else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    const heavy = code === 65 || code === 67 || code === 82, n = heavy ? 4 : code === 61 || code === 80 ? 2 : 3;
    g = (isDay !== 0 && code >= 80 ? wxSun(20, 18, 7) : '') + wxCloud(heavy ? '#8a9bb0' : '#c3cfdc', 'drift', 'translate(0 -6)') + wxDrops(n, '#5cc8ff', heavy) + (code === 66 || code === 67 ? wxFlakes(2) : '');
  }
  else if ((code >= 71 && code <= 77) || code === 85 || code === 86) g = wxCloud('#d5dee8', 'drift', 'translate(0 -6)') + wxFlakes(code === 71 || code === 77 ? 2 : 3);
  else if (code >= 95) g = wxCloud('#6f7f96', 'drift', 'translate(0 -8)') +
    `<path class="bolt" d="M34,40L26,52H32L28,62L40,48H33L37,40Z" fill="#ffd23f"/>` + wxDrops(2, '#5cc8ff');
  else g = wxCloud('#dfe7f0');
  return `<svg class="wx" viewBox="0 0 64 64" width="${sz}" height="${sz}" aria-hidden="true">${g}</svg>`;
}

/* ---------- оживление: счётчик температуры, цвет системы под небо ---------- */
let vzTempShown = null;
function vzCountUp(el, to) {
  if (!el) return;
  const from = vzTempShown, still = SKY.still;
  vzTempShown = to;
  if (from === null || still || Math.round(from) === Math.round(to)) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = now => {
    const k = clamp((now - t0)/dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from)*e);
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function vzTheme() {
  if (!SKY.st) return;
  try {
  const col = skyColors(SKY.st), root = document.documentElement.style;
  root.setProperty('--skyA', col.top); root.setProperty('--skyB', col.bot);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', col.top);
  } catch (e) {}
}
