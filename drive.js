'use strict';
/* Laiks — «Режим в пути»: GPS, погода впереди по ходу движения, голосовые предупреждения.
   Работает, пока приложение открыто на экране (браузер не даёт GPS при заблокированном экране).
   Координаты никуда не сохраняются: они уходят только в запрос прогноза Open-Meteo. */

const DRIVE = {on:false, watch:null, pos:null, prev:null, prevAt:0, heading:null, speed:0, acc:0, lastAt:0, lastPt:null,
  res:null, checkedAt:0, err:'', wake:null, said:{}, timer:null, busy:false, me:null, dark:null};
const DRIVE_VARS = 'temperature_2m,dew_point_2m,soil_temperature_0cm,precipitation,rain,snowfall,weather_code,visibility,wind_gusts_10m';
const ecoOn = () => !!($('dEco') && $('dEco').checked);
const voiceOn = () => !!($('dVoice') && $('dVoice').checked);

/* --- геометрия --- */
function bearing(a, b) {
  const y = Math.sin((b.lon - a.lon)*RAD)*Math.cos(b.lat*RAD);
  const x = Math.cos(a.lat*RAD)*Math.sin(b.lat*RAD) - Math.sin(a.lat*RAD)*Math.cos(b.lat*RAD)*Math.cos((b.lon - a.lon)*RAD);
  return (Math.atan2(y, x)/RAD + 360) % 360;
}
function destPoint(p, brg, km) {
  const d = km/6371, b = brg*RAD, la = p.lat*RAD, lo = p.lon*RAD;
  const la2 = Math.asin(Math.sin(la)*Math.cos(d) + Math.cos(la)*Math.sin(d)*Math.cos(b));
  const lo2 = lo + Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(la), Math.cos(d) - Math.sin(la)*Math.sin(la2));
  return {lat:la2/RAD, lon:lo2/RAD};
}

/* --- голос --- */
const FEMALE = /female|woman|жен|milena|alyona|alena|katya|irina|elena|anna|tatyana|svetlana|daria|dariya|zira|samantha|karen|serena|victoria|laura|aija|google русский/i;
const MALE = /\bmale\b|муж|yuri|pavel|maxim|dmitri|ivan|daniel|david|george|mark/i;
function allVoices() { try { return window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { return []; } }
function speechLangPick() {
  const v = allVoices(), has = lg => v.some(x => (x.lang || '').toLowerCase().startsWith(lg));
  return has(lang) ? lang : has('ru') ? 'ru' : has('en') ? 'en' : lang;
}
function pickVoice(lg) {
  const chosen = store.get('wx_voice', '');
  const list = allVoices().filter(x => (x.lang || '').toLowerCase().startsWith(lg));
  if (chosen) { const c = list.find(x => x.name === chosen); if (c) return c; }
  return list.find(x => FEMALE.test(x.name) && !MALE.test(x.name)) || list.find(x => x.default && !MALE.test(x.name)) || list.find(x => !MALE.test(x.name)) || list[0] || null;
}
function speak(text, lg) {
  if (!window.speechSynthesis || !text) return;
  try {
    const u = new SpeechSynthesisUtterance(text), v = pickVoice(lg);
    if (v) u.voice = v;
    u.lang = v ? v.lang : (LANGS[lg] || 'ru-RU'); u.rate = .97; u.pitch = 1.08; u.volume = 1;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
/* тексты в языке голоса: на время подставляем язык интерфейса */
function inLang(lg, fn) { const s = lang; lang = lg; try { return fn(); } finally { lang = s; } }
function fillVoices() {
  const sel = $('dVoiceSel'); if (!sel) return;
  const lg = speechLangPick(), list = allVoices().filter(x => (x.lang || '').toLowerCase().startsWith(lg)), chosen = store.get('wx_voice', '');
  sel.innerHTML = `<option value="">${esc(t('voiceAuto'))}</option>` + list.map(v => `<option value="${esc(v.name)}"${v.name === chosen ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
  sel.style.display = list.length ? '' : 'none';
}
try { if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', fillVoices); } catch (e) {}

/* --- экран не гаснет --- */
async function wakeOn() {
  try { if ('wakeLock' in navigator && !DRIVE.wake) { DRIVE.wake = await navigator.wakeLock.request('screen'); DRIVE.wake.addEventListener('release', () => { DRIVE.wake = null; }); } } catch (e) {}
}
function wakeOff() { try { if (DRIVE.wake) DRIVE.wake.release(); } catch (e) {} DRIVE.wake = null; }
document.addEventListener('visibilitychange', () => { if (DRIVE.on && !document.hidden) { wakeOn(); driveCheck(false); } });

/* --- GPS --- */
function startWatch() {
  if (DRIVE.watch !== null) navigator.geolocation.clearWatch(DRIVE.watch);
  const eco = ecoOn();
  DRIVE.watch = navigator.geolocation.watchPosition(onPos, onPosErr, {enableHighAccuracy:!eco, maximumAge:eco ? 60000 : 5000, timeout:60000});
}
/* Скорость без «дрожания» на месте. GPS-точка гуляет на 5–30 м даже когда телефон лежит,
   и браузер честно сообщает из-за этого 1–4 км/ч. Навигаторы (Google Maps и др.) отсекают это
   датчиками телефона; в браузере их нет, поэтому делаем то же по самим точкам:
   — пока вы стоите, есть «якорь»; уход от него меньше погрешности GPS считается шумом;
   — поехали — только если сдвинулись дальше погрешности И скорость держится 2 замера подряд;
   — остановились — если 3 замера подряд почти нет скорости; тогда показываем ровно 0. */
const MOVE_ON = 2.2, MOVE_OFF = 1.2;          /* м/с: ≈ 8 км/ч, чтобы тронуться; ≈ 4 км/ч, чтобы встать */
function onPos(p) {
  const c = p.coords, now = Date.now(), pos = {lat:c.latitude, lon:c.longitude}, acc = c.accuracy || 50;
  DRIVE.err = ''; DRIVE.acc = acc;
  const S = DRIVE.st || (DRIVE.st = {moving:false, anchor:null, hist:[], up:0, down:0, v:0});
  if (acc > 120 && DRIVE.pos) { renderDrive(); return; }   /* очень грубая точка (по вышкам) — скорость по ней не считаем */
  S.hist.push({pos, at:now, acc}); while (S.hist.length > 12) S.hist.shift();
  /* «сырая» скорость: от телефона, а если её нет — по точке не младше 5 с, только если сдвиг больше погрешности */
  let raw = c.speed != null && !Number.isNaN(c.speed) ? c.speed : null;
  if (raw == null) {
    const old = S.hist.slice().reverse().find(h => now - h.at >= 5000 && now - h.at <= 30000);
    if (old) { const m = hav(old.pos, pos)*1000, dt = (now - old.at)/1000; raw = m > old.acc + acc ? Math.min(m/dt, 70) : 0; }
    else raw = S.moving ? S.v : 0;
  }
  if (!S.anchor) S.anchor = pos;
  const away = hav(S.anchor, pos)*1000, noise = Math.max(25, acc*1.5);
  if (!S.moving) {
    S.up = raw >= MOVE_ON && away > noise || away > noise*2.5 ? S.up + 1 : 0;
    if (S.up >= 2) { S.moving = true; S.down = 0; S.v = raw; }
    else {   /* стоим: якорь медленно подтягивается к среднему положению */
      S.anchor = {lat:S.anchor.lat*.85 + pos.lat*.15, lon:S.anchor.lon*.85 + pos.lon*.15};
    }
  } else {
    S.down = raw < MOVE_OFF ? S.down + 1 : 0;
    if (S.down >= 3) { S.moving = false; S.up = 0; S.v = 0; S.anchor = pos; }
    else { S.v = S.v*.5 + raw*.5; S.anchor = pos; }
  }
  DRIVE.speed = S.moving ? S.v : 0;
  /* направление — только в движении */
  if (S.moving) {
    if (c.heading != null && !Number.isNaN(c.heading) && raw > 1.5) DRIVE.heading = c.heading;
    else if (DRIVE.prev && hav(DRIVE.prev, pos)*1000 > noise) DRIVE.heading = bearing(DRIVE.prev, pos);
    if (!DRIVE.prev || hav(DRIVE.prev, pos)*1000 > noise) { DRIVE.prev = pos; DRIVE.prevAt = now; }
  } else { DRIVE.prev = pos; DRIVE.prevAt = now; }
  DRIVE.pos = S.moving ? pos : (DRIVE.pos && hav(DRIVE.pos, pos)*1000 < noise ? DRIVE.pos : pos);
  driveMapMark(); renderDrive(); driveCheck(false);
}
function onPosErr(e) {
  DRIVE.err = e && e.code === 1 ? 'dDenied' : e && e.code === 3 ? 'dWaiting' : 'dNoFix';
  renderDrive();
}

/* --- проверка погоды здесь и впереди --- */
async function driveCheck(force) {
  if (!DRIVE.on || !DRIVE.pos || DRIVE.busy) return;
  const eco = ecoOn(), now = Date.now();
  const moved = DRIVE.lastPt ? hav(DRIVE.lastPt, DRIVE.pos) : 1e9;
  if (!force && now - DRIVE.lastAt < (eco ? 5 : 2)*6e4 && moved < (eco ? 5 : 2)) return;
  DRIVE.busy = true; DRIVE.lastAt = now; DRIVE.lastPt = Object.assign({}, DRIVE.pos);
  try {
    const moving = DRIVE.speed > 3 && DRIVE.heading != null;
    const dists = moving ? [0, 10, 25, 50] : [0];
    const pts = dists.map(d => d ? destPoint(DRIVE.pos, DRIVE.heading, d) : DRIVE.pos);
    const j = await getJSON(`${API}?latitude=${pts.map(p => p.lat.toFixed(3)).join(',')}&longitude=${pts.map(p => p.lon.toFixed(3)).join(',')}`
      + `&hourly=${DRIVE_VARS}&forecast_days=2&wind_speed_unit=ms&timezone=${ENC_TZ}`);
    const arr = Array.isArray(j) ? j : [j], kmh = Math.max(DRIVE.speed*3.6, 60);
    DRIVE.res = dists.map((d, k) => {
      const h = arr[k].hourly, base = Date.parse(h.time[0] + ':00Z') - arr[k].utc_offset_seconds*1000;
      const eta = d/kmh*60, i = clamp(Math.floor((now + eta*6e4 - base)/36e5), 0, h.time.length - 1);
      const ev = roadEval(h, i);
      if (h.weather_code[i] >= 95) { ev.lvl = 2; ev.r.unshift(String(t('wtypes').storm).toLowerCase()); }
      return {d, eta, h, i, lvl:ev.lvl, r:ev.r, T:ev.T, Ts:ev.Ts, code:h.weather_code[i]};
    });
    DRIVE.checkedAt = Date.now();
    driveAnnounce();
  } catch (e) { DRIVE.err = 'dNet'; }
  DRIVE.busy = false;
  renderDrive();
}
function driveAnnounce() {
  const bad = (DRIVE.res || []).filter(x => x.lvl >= 1);
  if (!bad.length) return;
  const x = bad[0], key = x.r.join('|') + '|' + (x.d === 0 ? 'here' : 'ahead'), now = Date.now();
  Object.keys(DRIVE.said).forEach(k => { if (now - DRIVE.said[k] > 25*6e4) delete DRIVE.said[k]; });
  if (DRIVE.said[key]) return;
  DRIVE.said[key] = now;
  const where = x.d === 0 ? t('dHere') : t('dAhead', {d:x.d});
  alertUser(x.lvl >= 2 ? '⛔' : '⚠️', t('driveAlert'), `${where}: ${x.r.join(', ')}`, 'drive|' + key);
  if (voiceOn()) {
    const lg = speechLangPick();
    const text = inLang(lg, () => {
      const ev = roadEval(x.h, x.i); if (x.code >= 95) ev.r.unshift(String(t('wtypes').storm).toLowerCase());
      return t('voiceWarn', {where:x.d === 0 ? t('dHere') : t('dAhead', {d:x.d}), what:ev.r.join(', ')});
    });
    speak(text, lg);
  }
}

/* --- отображение --- */
function renderDrive() {
  const out = $('driveOut'), btn = $('driveBtn'); if (!out || !btn) return;
  btn.textContent = DRIVE.on ? t('driveOff') : t('driveOn'); btn.classList.toggle('on', DRIVE.on);
  if (!DRIVE.on) { out.innerHTML = `<div class="ok">${esc(t('dIdle'))}</div>`; driveDark(); return; }
  if (DRIVE.err && !DRIVE.pos) { out.innerHTML = `<div class="ok">${esc(t(DRIVE.err))}</div>`; driveDark(); return; }
  if (!DRIVE.pos) { out.innerHTML = `<div class="ok">${esc(t('dWaiting'))}</div>`; driveDark(); return; }
  const kmh = Math.round(DRIVE.speed*3.6), dir = DRIVE.heading != null && DRIVE.speed > 1.5 ? compass(DRIVE.heading) : '—';
  let h = `<div class="dstat"><b>${kmh}</b><small>${esc(t('kmh'))}</small><span class="dirc">${esc(dir)}</span>`
    + `<em>${esc(t('dAcc', {a:Math.round(DRIVE.acc)}))}${DRIVE.checkedAt ? ' · ' + esc(t('dChecked', {t:hhmm(DRIVE.checkedAt)})) : ''}</em></div>`;
  if (DRIVE.res) {
    h += '<div class="dlist">' + DRIVE.res.map(x => {
      const lab = x.d === 0 ? t('dHereCap') : t('dAheadCap', {d:x.d}), eta = x.d ? ` <small>${esc(t('dEta', {m:Math.max(1, Math.round(x.eta))}))}</small>` : '';
      return `<div class="drow lv${x.lvl}"><i></i><div><b>${esc(lab)}</b>${eta}<small>${esc(x.r.length ? x.r.join(', ') : t('dOk'))}</small></div>`
        + `<span>${fmt(x.T)}<small>${esc(t('dRoad', {v:fmt(x.Ts)}))}</small></span></div>`;
    }).join('') + '</div>';
    if (DRIVE.res.length === 1) h += `<div class="nst">${esc(t('dStationary'))}</div>`;
  }
  if (DRIVE.err && DRIVE.pos) h += `<div class="nst">${esc(t(DRIVE.err))}</div>`;
  out.innerHTML = h;
  driveDark();
}
function driveMapMark() {
  if (typeof WM === 'undefined' || !WM.map || typeof L === 'undefined') return;
  if (!DRIVE.on || !DRIVE.pos) { if (DRIVE.me) { WM.map.removeLayer(DRIVE.me); DRIVE.me = null; } return; }
  const rot = DRIVE.heading != null && DRIVE.speed > 1.5 ? DRIVE.heading : null;
  const html = `<div class="me">${rot != null ? `<i style="transform:rotate(${Math.round(rot)}deg)"></i>` : ''}</div>`;
  if (!DRIVE.me) DRIVE.me = L.marker([DRIVE.pos.lat, DRIVE.pos.lon], {icon:L.divIcon({className:'cmw', html, iconSize:null}), interactive:false, zIndexOffset:3000}).addTo(WM.map);
  else { DRIVE.me.setLatLng([DRIVE.pos.lat, DRIVE.pos.lon]); DRIVE.me.setIcon(L.divIcon({className:'cmw', html, iconSize:null})); }
}
/* тёмный экран: почти чёрный фон экономит заряд на OLED-экранах */
function driveDark() {
  const d = DRIVE.dark; if (!d) return;
  const worst = (DRIVE.res || []).reduce((m, x) => x.lvl > m.lvl ? x : m, {lvl:-1});
  const msg = !DRIVE.res ? t('dWaiting') : worst.lvl >= 1 ? `${worst.d === 0 ? t('dHereCap') : t('dAheadCap', {d:worst.d})}: ${worst.r.join(', ')}` : t('dOk');
  d.querySelector('.dk-sp').textContent = Math.round(DRIVE.speed*3.6);
  d.querySelector('.dk-msg').textContent = msg;
  d.className = 'darkscr lv' + Math.max(0, worst.lvl);
}
function openDark() {
  if (DRIVE.dark) return;
  const d = document.createElement('div'); d.className = 'darkscr'; d.setAttribute('role', 'dialog');
  d.innerHTML = `<div class="dk-sp">0</div><div class="dk-u"></div><div class="dk-msg"></div><div class="dk-hint"></div>`;
  d.querySelector('.dk-u').textContent = t('kmh'); d.querySelector('.dk-hint').textContent = t('dDarkHint');
  d.addEventListener('click', () => { d.remove(); DRIVE.dark = null; });
  document.body.appendChild(d); DRIVE.dark = d; driveDark();
}

/* --- включение / выключение --- */
function driveStart() {
  if (!('geolocation' in navigator)) { DRIVE.on = true; DRIVE.err = 'dNoGeo'; renderDrive(); return; }
  DRIVE.on = true; DRIVE.err = ''; DRIVE.res = null; DRIVE.lastAt = 0; DRIVE.lastPt = null; DRIVE.st = null; DRIVE.speed = 0;
  startWatch(); wakeOn(); fillVoices();
  if (voiceOn()) { const lg = speechLangPick(); speak(inLang(lg, () => t('voiceHello')), lg); }
  clearInterval(DRIVE.timer); DRIVE.timer = setInterval(() => driveCheck(false), 60e3);
  renderDrive();
}
function driveStop() {
  DRIVE.on = false;
  if (DRIVE.watch !== null) { navigator.geolocation.clearWatch(DRIVE.watch); DRIVE.watch = null; }
  clearInterval(DRIVE.timer); wakeOff(); DRIVE.pos = null; DRIVE.prev = null; DRIVE.res = null; DRIVE.st = null; DRIVE.speed = 0;
  try { speechSynthesis.cancel(); } catch (e) {}
  if (DRIVE.dark) { DRIVE.dark.remove(); DRIVE.dark = null; }
  driveMapMark(); renderDrive();
}
function driveInit() {
  if (!$('driveBtn')) return;
  $('dEco').checked = store.get('wx_eco', true) !== false;
  $('dVoice').checked = store.get('wx_dvoice', true) !== false;
  $('driveBtn').onclick = () => DRIVE.on ? driveStop() : driveStart();
  $('dEco').onchange = () => { store.set('wx_eco', $('dEco').checked); if (DRIVE.on) startWatch(); };
  $('dVoice').onchange = () => store.set('wx_dvoice', $('dVoice').checked);
  $('dVoiceSel').onchange = e => store.set('wx_voice', e.target.value);
  $('dTest').onclick = () => { const lg = speechLangPick(); fillVoices(); speak(inLang(lg, () => t('voiceTest')), lg); };
  $('dDark').onclick = openDark;
  fillVoices(); renderDrive();
}
driveInit();
