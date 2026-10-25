/* Laiks: слой движения.
   — живая погода на весь экран за карточками (дождь, снег, туман, облака, звёзды, гроза, пылинки света), сквозь стекло карточек;
   — главная карточка: наклон за курсором, блик, температура-градиент цвета погоды, параллакс при прокрутке;
   — липкая «капля» с температурой, когда главная карточка ушла вверх;
   — объёмное появление карточек, «лупа» в ленте часов, магнитные кнопки, подсветка кромки под курсором, индикатор прокрутки.
   Данных не меняет, текстов не содержит (в «капле» копируются уже показанные название места и температура).
   При «уменьшить движение» и в режиме экономии трафика не делает ничего. Откат: убрать <link> и <script> на motion.* в index.html. */
(function () {
  'use strict';
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  const saver = !!(navigator.connection && navigator.connection.saveData);
  if (mq.matches || saver) return;
  const root = document.documentElement, body = document.body;
  const fine = window.matchMedia ? matchMedia('(hover:hover) and (pointer:fine)').matches : false;
  const coarse = window.matchMedia ? matchMedia('(pointer:coarse)').matches : false;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = (a, b) => a + Math.random()*(b - a);
  const $ = id => document.getElementById(id);
  root.classList.add('mo');
  let off = false;
  /* если человек включит «уменьшить движение» уже во время работы, слой выключается */
  try { mq.addEventListener('change', e => { off = e.matches; root.classList.toggle('mo', !e.matches); if (!e.matches) atKick(); }); } catch (e) {}

  const heroBox = $('heroBox');

  /* ============================================================ погода на весь экран ============================================================ */
  const AT = {cv:null, cx:null, W:0, H:0, q:1, st:null, sig:'', raf:0, last:0, t0:0, sy:0, mx:.5, my:.35, ax:.5, ay:.35,
    flash:0, nextFlash:0, bolt:null, shoot:null, nextShoot:0, far:[], near:[], stars:[], motes:[], drops:[[], []], snow:[[], [], []], fog:[]};
  /* на телефонах и слабых устройствах кадров меньше: стекло карточек размывает движущийся фон, это дорого */
  AT.gap = ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency || 8) <= 2) ? 66 : coarse ? 42 : 33;
  const DEF = {code:3, elev:20, cloud:40, ws:3, dx:.4, rain:0, snow:0, fog:false, storm:false, moon:{frac:.5}};
  const BG = [7, 12, 20];
  const mix = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v)*f));
  const parse = c => (c.match(/\d+/g) || [10, 20, 36]).slice(0, 3).map(Number);

  function atSize() {
    const W = innerWidth, H = innerHeight;
    if (AT.cv.width && W === AT.W && Math.abs(H - AT.H) < 120) return false;
    AT.W = W; AT.H = H; AT.q = Math.min(window.devicePixelRatio || 1, W < 700 ? .7 : .85);
    AT.cv.width = Math.round(W*AT.q); AT.cv.height = Math.round(H*AT.q);
    AT.cx.setTransform(AT.q, 0, 0, AT.q, 0, 0);
    return true;
  }
  function atSeed(s) {
    const area = clamp(AT.W*AT.H/(390*844), .8, 3.2), perf = (navigator.hardwareConcurrency || 8) <= 4 ? .65 : 1;
    AT.stars = Array.from({length:Math.round(110*Math.min(area, 2)*perf)}, () => ({x:Math.random(), y:Math.random()*.8, r:rnd(.4, 1.5), p:rnd(0, 6.28)}));
    AT.far = Array.from({length:Math.round(3 + s.cloud/100*6)}, () => ({x:Math.random(), y:rnd(.02, .75), r:rnd(.2, .46), a:rnd(.05, .12), v:rnd(.5, 1.1)}));
    AT.near = s.cloud > 45 ? Array.from({length:Math.round(s.cloud/100*5)}, () => ({x:Math.random(), y:rnd(0, .55), r:rnd(.3, .6), a:rnd(.07, .15), v:rnd(1, 1.8)})) : [];
    const rain = s.rain ? Math.round(s.rain*area*1.1*perf) : 0;
    AT.drops = [0, 1].map(l => Array.from({length:Math.round(rain*(l ? .4 : .6))}, () => ({x:rnd(-.1, 1.1), y:Math.random(), l:l ? rnd(16, 30) : rnd(8, 16), v:l ? rnd(1, 1.3) : rnd(.6, .85)})));
    const sn = s.snow ? Math.round(s.snow*area*1.3*perf) : 0;
    AT.snow = [0, 1, 2].map(l => Array.from({length:Math.round(sn*[.5, .32, .18][l])}, () => ({x:Math.random(), y:Math.random(), r:[1.1, 2.2, 4.2][l]*rnd(.8, 1.3), v:rnd(.8, 1.2), p:rnd(0, 6.28)})));
    AT.fog = s.fog ? Array.from({length:5}, (_, i) => ({y:.14 + i*.18, x:Math.random(), w:rnd(.8, 1.5), v:rnd(.004, .01)})) : [];
    const clear = !s.rain && !s.snow && s.cloud < 65;
    AT.motes = Array.from({length:Math.round((clear ? 26 : 10)*perf)}, () => ({x:Math.random(), y:Math.random(), r:rnd(3, 15), a:rnd(.04, .1), v:rnd(.004, .014), p:rnd(0, 6.28), z:rnd(.1, .5)}));
  }
  function atColors(s) {
    let c = null;
    try { c = skyColors(s); } catch (e) {}
    if (!c) return {top:[10, 20, 36], bot:[12, 24, 40], k:.5, dusk:0};
    const f = .5 + .17*c.k - c.dusk*.14;
    return {top:mix(parse(c.top), BG, f), bot:mix(parse(c.bot), BG, f - .08), k:c.k, dusk:c.dusk};
  }
  function blob(cx, x, y, r, rgb, a, sq) {
    cx.save(); cx.translate(x, y); cx.scale(1, sq || .55);
    const g = cx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.6, `rgba(${rgb},${a*.5})`); g.addColorStop(1, `rgba(${rgb},0)`);
    cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, r, 0, 6.283); cx.fill(); cx.restore();
  }
  function atFrame(ts) {
    const s = AT.st || DEF, cx = AT.cx, W = AT.W, H = AT.H, dt = AT.last ? Math.min(.1, (ts - AT.last)/1000) : 0; AT.last = ts;
    AT.ax += (AT.mx - AT.ax)*.05; AT.ay += (AT.my - AT.ay)*.05;
    AT.sy += (scrollY - AT.sy)*.12;
    const px = (AT.ax - .5), py = (AT.ay - .35), sy = AT.sy, col = atColors(s), night = col.k < .5;
    const dark = s.rain || s.snow || s.storm, veil = 1 - clamp((s.cloud - 50)/50, 0, .8);

    /* небо */
    const bg = cx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgb(${col.top})`); bg.addColorStop(1, `rgb(${col.bot})`);
    cx.globalCompositeOperation = 'source-over'; cx.fillStyle = bg; cx.fillRect(0, 0, W, H);

    /* солнце или луна: свет сверху справа, плывёт при прокрутке и движении мыши */
    const A = {x:W*.8 - px*40, y:H*.1 - sy*.06 - py*24};
    if (s.elev > -6) {
      const warm = col.dusk, R = Math.max(W, H)*(.6 + .12*warm), g = cx.createRadialGradient(A.x, A.y, 6, A.x, A.y, R);
      g.addColorStop(0, `rgba(255,${Math.round(220 - 70*warm)},${Math.round(150 - 60*warm)},${(.34*veil).toFixed(3)})`);
      g.addColorStop(.4, `rgba(255,${Math.round(180 - 60*warm)},${Math.round(110 - 40*warm)},${(.1*veil).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,170,100,0)');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    } else {
      const R = Math.max(W, H)*.55, a = (.07 + .15*(s.moon ? s.moon.frac : .5))*veil, g = cx.createRadialGradient(A.x, A.y, 4, A.x, A.y, R);
      g.addColorStop(0, `rgba(205,222,255,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(205,222,255,0)');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    }

    /* солнечные лучи: медленно колышутся, когда небо не закрыто осадками */
    if (s.elev > -3 && veil > .3 && !s.rain && !s.snow) {
      const warm = col.dusk, rgb = `255,${Math.round(226 - 60*warm)},${Math.round(160 - 70*warm)}`, L = Math.max(W, H)*1.15;
      [-.35, -.1, .12, .34].forEach((a0, i) => {
        const a = 2.15 + a0 + Math.sin(ts/7000 + i*1.7)*.035 - px*.05, w = .045 + i*.012, g = cx.createRadialGradient(A.x, A.y, 0, A.x, A.y, L);
        g.addColorStop(0, `rgba(${rgb},${(.1*veil).toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},0)`);
        cx.fillStyle = g; cx.beginPath(); cx.moveTo(A.x, A.y);
        cx.lineTo(A.x + L*Math.cos(a - w), A.y + L*Math.sin(a - w)); cx.lineTo(A.x + L*Math.cos(a + w), A.y + L*Math.sin(a + w)); cx.fill();
      });
    }

    /* звёзды и падающая звезда */
    const starA = clamp((-s.elev - 2)/8, 0, 1)*(1 - s.cloud/110);
    if (starA > .02) {
      AT.stars.forEach(st => {
        cx.fillStyle = `rgba(235,242,255,${(starA*(.5 + .5*Math.sin(ts/900 + st.p))).toFixed(3)})`;
        cx.beginPath(); cx.arc(st.x*W - px*14, st.y*H - sy*.03, st.r, 0, 6.283); cx.fill();
      });
      if (starA > .35) {
        if (!AT.shoot && ts > AT.nextShoot) { AT.shoot = {x:rnd(.15, .9)*W, y:rnd(.02, .3)*H, t:0}; AT.nextShoot = ts + rnd(9000, 22000); }
        if (AT.shoot) {
          const o = AT.shoot; o.t += dt; const k = o.t/.8, L = 130;
          if (k >= 1) AT.shoot = null; else {
            const hx = o.x - 520*o.t, hy = o.y + 240*o.t, g = cx.createLinearGradient(hx, hy, hx + L*.9, hy - L*.42);
            g.addColorStop(0, `rgba(255,255,255,${(.8*(1 - k)).toFixed(3)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
            cx.strokeStyle = g; cx.lineWidth = 1.6; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(hx, hy); cx.lineTo(hx + L*.9, hy - L*.42); cx.stroke();
          }
        }
      }
    }

    /* облака двух слоёв с разной скоростью и глубиной */
    const ccol = col.k > .5 ? (dark ? '120,134,154' : '170,196,230') : (dark ? '60,72,96' : '96,118,170');
    const vx = (4 + s.ws*1.6)*(s.dx >= 0 ? 1 : -1)*Math.max(.35, Math.abs(s.dx)), M = Math.max(W, H);
    [[AT.far, .05, 24, .55], [AT.near, .12, 60, .5]].forEach(([arr, par, mx, sq]) => arr.forEach(c => {
      c.x += vx*c.v*dt/W; if (c.x > 1.4) c.x -= 1.8; if (c.x < -.4) c.x += 1.8;
      blob(cx, c.x*W - px*mx, c.y*H - sy*par, c.r*M, ccol, c.a*(.6 + s.cloud/160), sq);
    }));

    /* туман */
    AT.fog.forEach(f => {
      f.x += f.v*dt; if (f.x > 1.5) f.x = -.5;
      blob(cx, f.x*W, f.y*H - sy*.08, f.w*W*.7, '205,218,232', .09, .22);
    });

    /* пылинки света: в ясную погоду медленно всплывают, при ярких зонах расплываются */
    cx.globalCompositeOperation = 'lighter';
    const mrgb = night ? '170,200,255' : '255,214,150';
    AT.motes.forEach(m => {
      m.y -= m.v*dt; m.x += Math.sin(ts/3200 + m.p)*.00025; if (m.y < -.1) { m.y = 1.1; m.x = Math.random(); }
      blob(cx, m.x*W - px*m.z*160, m.y*H - sy*m.z*.5, m.r*(1 + .15*Math.sin(ts/1700 + m.p)), mrgb, m.a*veil*(night ? .8 : 1), 1);
    });
    cx.globalCompositeOperation = 'source-over';

    /* осадки */
    const slant = s.dx*Math.min(.6, .12 + s.ws*.05);
    if (s.rain) {
      AT.drops.forEach((arr, l) => {
        cx.strokeStyle = `rgba(190,215,255,${l ? .55 : .3})`; cx.lineWidth = l ? 1.6 : 1; cx.lineCap = 'round'; cx.beginPath();
        arr.forEach(p => {
          const dy = 800*p.v*dt/H; p.y += dy; p.x += dy*H*slant/W;
          if (p.y > 1.05) { p.y = -rnd(.02, .12); p.x = rnd(-.1, 1.1); }
          const X = p.x*W, Y = p.y*H; cx.moveTo(X, Y); cx.lineTo(X - p.l*slant, Y - p.l);
        });
        cx.stroke();
      });
    } else if (s.snow) {
      AT.snow.forEach((arr, l) => {
        const sp = [28, 48, 80][l], al = [.7, .55, .32][l];
        cx.fillStyle = `rgba(245,250,255,${al})`;
        arr.forEach(p => {
          p.y += sp*p.v*dt/H; p.x += (Math.sin(ts/1200 + p.p)*10 + slant*60)*dt/W;
          if (p.y > 1.03) { p.y = -.03; p.x = Math.random(); } if (p.x > 1.05) p.x -= 1.1; if (p.x < -.05) p.x += 1.1;
          cx.beginPath(); cx.arc(p.x*W - px*(l*10), p.y*H, p.r, 0, 6.283); cx.fill();
        });
      });
    }

    /* гроза: вспышка по всему небу и далёкая молния */
    if (s.storm) {
      if (ts > AT.nextFlash) {
        AT.flash = 1; AT.nextFlash = ts + rnd(4500, 11000);
        let x = rnd(W*.1, W*.9), y = 0; AT.bolt = [[x, y]]; while (y < H*.6) { x += rnd(-22, 22); y += rnd(14, 34); AT.bolt.push([x, y]); }
      }
      if (AT.flash > 0) {
        cx.fillStyle = `rgba(200,215,255,${(AT.flash*.14).toFixed(3)})`; cx.fillRect(0, 0, W, H);
        if (AT.bolt && AT.flash > .6) {
          cx.strokeStyle = `rgba(255,255,255,${(AT.flash*.5).toFixed(3)})`; cx.lineWidth = 1.6; cx.beginPath();
          AT.bolt.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.stroke();
        }
        AT.flash = Math.max(0, AT.flash - dt*2.4);
      }
    }

    /* свет вслед за курсором */
    if (fine) {
      const X = AT.ax*W, Y = AT.ay*H, g = cx.createRadialGradient(X, Y, 0, X, Y, 460);
      cx.globalCompositeOperation = 'lighter';
      g.addColorStop(0, 'rgba(120,180,255,.10)'); g.addColorStop(1, 'rgba(120,180,255,0)');
      cx.fillStyle = g; cx.fillRect(X - 460, Y - 460, 920, 920); cx.globalCompositeOperation = 'source-over';
    }

    /* низ чуть темнее: читаемость текста */
    const vg = cx.createLinearGradient(0, H*.5, 0, H); vg.addColorStop(0, 'rgba(7,12,20,0)'); vg.addColorStop(1, 'rgba(7,12,20,.4)');
    cx.fillStyle = vg; cx.fillRect(0, H*.5, W, H*.5);
  }
  function atState() {
    let st = null; try { st = typeof SKY !== 'undefined' ? SKY.st : null; } catch (e) {}
    if (st && st !== AT.st) {
      AT.st = st;
      const sig = [st.code, Math.round(st.cloud/10), st.rain, st.snow, st.fog].join('|');
      if (sig !== AT.sig) { AT.sig = sig; atSeed(st); }
      tint();
    }
  }
  function atLoop(ts) {
    AT.raf = 0;
    if (off || document.hidden || !AT.cv) return;
    if (ts - AT.t0 >= AT.gap) { AT.t0 = ts; atState(); atFrame(ts); }
    AT.raf = requestAnimationFrame(atLoop);
  }
  function atKick() { if (!AT.raf && !off && !document.hidden && AT.cv) { AT.last = 0; AT.raf = requestAnimationFrame(atLoop); } }

  /* цвет температуры для градиента цифр и «капли» */
  function tint() {
    try { if (typeof lastW !== 'undefined' && lastW && lastW.current) root.style.setProperty('--tt', tempColor(lastW.current.temperature_2m)); } catch (e) {}
  }

  try {
    const bg = document.createElement('div'); bg.className = 'mo-bg'; bg.setAttribute('aria-hidden', 'true');
    AT.cv = document.createElement('canvas'); bg.appendChild(AT.cv); AT.cx = AT.cv.getContext('2d');
    body.insertBefore(bg, body.firstChild);
    atSize(); atState(); if (!AT.st) atSeed(DEF);
    let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (atSize()) atSeed(AT.st || DEF); }, 150); });
    document.addEventListener('visibilitychange', () => { root.classList.toggle('mo-hidden', document.hidden); atKick(); });
    atKick();
  } catch (e) { console.warn('motion atmosphere', e); }

  /* при первой загрузке цифры температуры «накручиваются» от нуля до значения */
  let introDone = false;
  function intro() {
    if (introDone) return;
    const big = $('bigT'), hero = $('hero');
    if (!big || !hero) return;
    introDone = true;
    /* если карточка отрисована раньше, чем подключился этот файл, запускаем появление сами */
    const gz = hero.querySelector('.gauges'); if (gz && !gz.classList.contains('anim')) gz.classList.add('anim');
    const txt = big.textContent, m = txt.match(/[-−]?\d+(?:[.,]\d+)?/); if (!m) return;
    const raw = m[0], sign = /^[-−]/.test(raw) ? raw[0] : '', body = raw.replace(/^[-−]/, ''), to = parseFloat(body.replace(',', '.'));
    const dm = body.match(/[.,](\d+)/), dec = dm ? dm[1].length : 0, sep = body.indexOf(',') >= 0 ? ',' : '.';
    if (!isFinite(to) || to === 0) return;
    const t0 = performance.now(), D = 1500;
    const step = now => {
      const el = $('bigT'); if (!el) return;   /* карточку могут перерисовать посреди счёта (пришёл воздух) */
      const k = clamp((now - t0)/D, 0, 1), v = to*(1 - Math.pow(1 - k, 4));
      el.textContent = k >= 1 ? txt : txt.replace(raw, (Math.round(v*Math.pow(10, dec)) ? sign : '') + v.toFixed(dec).replace('.', sep));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ============================================================ прокрутка: индикатор, параллакс, липкая «капля» ============================================================ */
  let pill = null, raf = 0;
  try {
    const bar = document.createElement('div'); bar.className = 'mo-prog'; bar.setAttribute('aria-hidden', 'true'); body.appendChild(bar);

    pill = document.createElement('button'); pill.type = 'button'; pill.className = 'mo-pill';
    pill.innerHTML = '<span class="mo-pi" aria-hidden="true"></span><b class="mo-pt"></b><span class="mo-pn"></span>';
    body.appendChild(pill);
    const pi = pill.querySelector('.mo-pi'), pt = pill.querySelector('.mo-pt'), pn = pill.querySelector('.mo-pn');
    const fill = () => {
      const hero = $('hero'); if (!hero) return;
      const ico = hero.querySelector('.ico'), big = $('bigT'), pl = hero.querySelector('.place');
      if (!big || !pl) return;
      if (ico && pi.dataset.s !== ico.innerHTML) { pi.dataset.s = ico.innerHTML; pi.innerHTML = ico.innerHTML; }
      pt.textContent = big.textContent;
      const c = pl.cloneNode(true); c.querySelectorAll('button').forEach(b => b.remove());
      const name = c.textContent.trim(); pn.textContent = name; pill.setAttribute('aria-label', name + ' ' + big.textContent);
      tint();
    };
    let fr = 0; const kickFill = () => { if (!fr) fr = requestAnimationFrame(() => { fr = 0; fill(); intro(); }); };
    if ($('hero')) new MutationObserver(kickFill).observe($('hero'), {childList:true, subtree:true, characterData:true});
    fill(); intro();
    pill.addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));

    const frame = () => {
      raf = 0;
      const max = root.scrollHeight - innerHeight, y = scrollY;
      bar.style.setProperty('--sp', max > 0 ? clamp(y/max, 0, 1).toFixed(4) : '0');
      if (heroBox) {
        const r = heroBox.getBoundingClientRect(), p = r.bottom > 0 && r.height ? clamp(-r.top/r.height, 0, 1) : 1;
        heroBox.style.setProperty('--pp', p.toFixed(3));
        pill.classList.toggle('show', p > .82 && !!$('bigT'));
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', kick, {passive:true}); addEventListener('resize', kick); kick();
  } catch (e) { console.warn('motion scroll', e); }

  /* ============================================================ карточки ниже первого экрана появляются при прокрутке ============================================================ */
  try {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        let i = 0;
        es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).forEach(e => {
          const c = e.target; io.unobserve(c);
          c.style.setProperty('--rd', (i++*80) + 'ms'); c.classList.add('mo-in');
          setTimeout(() => c.style.setProperty('--rd', '0ms'), 1800);
        });
      }, {threshold:.06, rootMargin:'0px 0px -5% 0px'});
      document.querySelectorAll('main.grid > .card').forEach(c => {
        if (c.getBoundingClientRect().top > innerHeight*0.92) { c.classList.add('mo-rv'); io.observe(c); }
      });
    }
  } catch (e) { console.warn('motion reveal', e); }

  /* ============================================================ мышь ============================================================ */
  if (fine) try {
    const MAG = '.chip,.wbtn,.nowbtn,.play,.install,.star,.seg button';
    let px = 0, py = 0, tgt = null, hraf = 0, mt = null, gt = null, dockOn = false;
    const resetHero = c => { if (c && c === heroBox) { c.classList.remove('mo-tilting'); ['--rx', '--ry', '--dx', '--dy', '--gx', '--gy', '--go'].forEach(k => c.style.removeProperty(k)); } };
    const apply = () => {
      hraf = 0; if (!tgt) return;
      const r = tgt.getBoundingClientRect(), lx = px - r.left, ly = py - r.top;
      tgt.style.setProperty('--mx', lx.toFixed(0) + 'px'); tgt.style.setProperty('--my', ly.toFixed(0) + 'px');
      if (tgt === heroBox && r.width && r.height) {
        const nx = clamp(lx/r.width, 0, 1), ny = clamp(ly/r.height, 0, 1);
        tgt.style.setProperty('--ry', ((nx - .5)*9).toFixed(2) + 'deg'); tgt.style.setProperty('--rx', (-(ny - .5)*7).toFixed(2) + 'deg');
        tgt.style.setProperty('--dx', ((nx - .5)*2).toFixed(3)); tgt.style.setProperty('--dy', ((ny - .5)*2).toFixed(3));
        tgt.style.setProperty('--gx', (nx*100).toFixed(1) + '%'); tgt.style.setProperty('--gy', (ny*100).toFixed(1) + '%'); tgt.style.setProperty('--go', '.9');
      }
    };
    const dock = (strip, x) => {
      dockOn = true;
      strip.querySelectorAll('.hc').forEach(h => {
        const r = h.getBoundingClientRect(), d = Math.abs(x - (r.left + r.width/2)), f = clamp(1 - d/120, 0, 1), e = f*f*(3 - 2*f);
        h.style.transform = e > .01 ? `translateY(${(-10*e).toFixed(1)}px) scale(${(1 + .26*e).toFixed(3)})` : '';
        h.style.zIndex = e > .3 ? '2' : '';
      });
    };
    const undock = () => { dockOn = false; document.querySelectorAll('#h24 .hc').forEach(h => { h.style.transform = ''; h.style.zIndex = ''; }); };
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      AT.mx = e.clientX/innerWidth; AT.my = e.clientY/innerHeight;
      const el = e.target, c = el.closest && el.closest('.card');
      if (c !== tgt) { resetHero(tgt); tgt = c; if (c === heroBox) c.classList.add('mo-tilting'); }
      if (c) { px = e.clientX; py = e.clientY; if (!hraf) hraf = requestAnimationFrame(apply); }
      /* «лупа» в ленте часов */
      const strip = el.closest && el.closest('#h24'); if (strip) dock(strip, e.clientX); else if (dockOn) undock();
      /* наклон приборов */
      const g = el.closest && el.closest('.gauge');
      if (gt && gt !== g) gt.style.transform = '';
      gt = g || null;
      if (g) { const r = g.getBoundingClientRect(), nx = (e.clientX - r.left)/r.width - .5, ny = (e.clientY - r.top)/r.height - .5;
        g.style.transform = `perspective(500px) rotateX(${(-ny*14).toFixed(1)}deg) rotateY(${(nx*14).toFixed(1)}deg) translateY(-2px)`; }
      /* магнитные кнопки */
      const m = el.closest && el.closest(MAG);
      if (mt && mt !== m) { mt.style.removeProperty('--bx'); mt.style.removeProperty('--by'); }
      mt = m || null;
      if (m) { const r = m.getBoundingClientRect(); m.style.setProperty('--bx', clamp((e.clientX - r.left - r.width/2)*.2, -6, 6).toFixed(1) + 'px'); m.style.setProperty('--by', clamp((e.clientY - r.top - r.height/2)*.25, -4, 4).toFixed(1) + 'px'); }
    }, {passive:true});
    document.documentElement.addEventListener('mouseleave', () => {
      resetHero(tgt); tgt = null; undock(); AT.mx = .5; AT.my = .35;
      if (gt) { gt.style.transform = ''; gt = null; } if (mt) { mt.style.removeProperty('--bx'); mt.style.removeProperty('--by'); mt = null; }
    });
  } catch (e) { console.warn('motion pointer', e); }

  /* ============================================================ вкладки «24 часа» и «5 дней»: элементы выплывают по очереди ============================================================ */
  try {
    const h24 = $('h24');
    if (h24 && h24.animate) {
      let seen = '';
      new MutationObserver(() => {
        const items = h24.querySelectorAll('.hc,.row'); if (!items.length) return;
        const pressed = document.querySelector('#h24tabs [aria-pressed=true]'), key = pressed ? pressed.dataset.h : '';
        if (key === seen) return; seen = key;
        items.forEach((el, i) => el.animate([{opacity:0, transform:'translateY(18px) scale(.9)'}, {opacity:1, transform:'none'}],
          {duration:560, delay:Math.min(i*26, 620), easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards'}));
      }).observe(h24, {childList:true});
    }
  } catch (e) { console.warn('motion h24', e); }

  /* ============================================================ нижняя панель и касания ============================================================ */
  try {
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
      const el = $(b.dataset.go);
      if (!el || !el.animate) return;
      setTimeout(() => el.animate(
        [{outline:'2px solid rgba(255,255,255,.45)', outlineOffset:'0px'}, {outline:'2px solid rgba(255,255,255,0)', outlineOffset:'14px'}],
        {duration:1000, easing:'cubic-bezier(.2,.8,.2,1)'}), 450);
    }));
    /* лёгкая вибрация на телефонах при нажатии кнопок */
    if (coarse && navigator.vibrate) document.addEventListener('click', e => {
      if (e.target.closest && e.target.closest('.bnav button,.chip,.seg button,.nsheet button,.mo-pill')) { try { navigator.vibrate(7); } catch (x) {} }
    }, {passive:true});
  } catch (e) { console.warn('motion touch', e); }

  /* нижняя панель: подсветка текущего раздела плавно переезжает от кнопки к кнопке */
  try {
    const nav = $('bnav');
    if (nav) {
      const ind = document.createElement('i'); ind.className = 'mo-ind'; ind.setAttribute('aria-hidden', 'true'); nav.insertBefore(ind, nav.firstChild);
      const place = () => {
        const b = nav.querySelector('[aria-current=true]');
        if (!b || !b.offsetWidth) { ind.style.opacity = '0'; return; }
        ind.style.opacity = '1'; ind.style.setProperty('--x', b.offsetLeft + 'px'); ind.style.setProperty('--w', b.offsetWidth + 'px');
      };
      new MutationObserver(place).observe(nav, {attributes:true, subtree:true, attributeFilter:['aria-current']});
      addEventListener('resize', place); setTimeout(place, 400); place();
    }
  } catch (e) { console.warn('motion nav', e); }

  /* наклон телефона двигает главную карточку и фон (где события датчика приходят без запроса разрешения; разрешение мы не запрашиваем) */
  try {
    if (coarse && 'DeviceOrientationEvent' in window) {
      let gx = 0, gy = 0, on = false;
      addEventListener('deviceorientation', e => {
        if (e.gamma == null || off) return;
        if (!on && heroBox) { on = true; heroBox.classList.add('mo-tilting'); }
        gx += (clamp(e.gamma/22, -1, 1) - gx)*.12; gy += (clamp(((e.beta || 0) - 55)/22, -1, 1) - gy)*.12;
        AT.mx = .5 + gx*.5; AT.my = .35 + gy*.35;
        if (heroBox) {
          heroBox.style.setProperty('--dx', gx.toFixed(3)); heroBox.style.setProperty('--dy', gy.toFixed(3));
          heroBox.style.setProperty('--gx', (50 + gx*45).toFixed(1) + '%'); heroBox.style.setProperty('--gy', (30 + gy*40).toFixed(1) + '%'); heroBox.style.setProperty('--go', '.6');
        }
      }, {passive:true});
    }
  } catch (e) { console.warn('motion gyro', e); }

  /* блик на главной карточке (на телефоне он скользит сам, на компьютере следует за курсором) */
  try { if (heroBox) { const g = document.createElement('i'); g.className = 'mo-glare'; g.setAttribute('aria-hidden', 'true'); heroBox.appendChild(g); } } catch (e) {}
})();
