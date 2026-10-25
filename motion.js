/* Laiks: слой движения. Появление карточек при прокрутке, подсветка стекла под курсором, наклон и параллакс главной карточки,
   индикатор прокрутки, дрейфующий фон, подсветка раздела после перехода по нижней панели.
   Данных не трогает, текстов не содержит. При «уменьшить движение» и в режиме экономии трафика не делает ничего.
   Откат: убрать <link> и <script> на motion.* в index.html. */
(function () {
  'use strict';
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};
  const saver = !!(navigator.connection && navigator.connection.saveData);
  if (mq.matches || saver) return;
  const root = document.documentElement, body = document.body;
  const fine = window.matchMedia ? matchMedia('(hover:hover) and (pointer:fine)').matches : false;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  root.classList.add('mo');
  /* если человек включит «уменьшить движение» уже во время работы, слой просто выключается */
  try { mq.addEventListener('change', e => root.classList.toggle('mo', !e.matches)); } catch (e) {}

  const heroBox = document.getElementById('heroBox');
  let raf = 0;

  /* ---------- фон и индикатор прокрутки ---------- */
  try {
    const bg = document.createElement('div'); bg.className = 'mo-bg'; bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<i class="mo-orb a"></i><i class="mo-orb b"></i>';
    body.insertBefore(bg, body.firstChild);
    const bar = document.createElement('div'); bar.className = 'mo-prog'; bar.setAttribute('aria-hidden', 'true');
    body.appendChild(bar);
    /* пятна фона не крутятся, пока вкладка не видна */
    document.addEventListener('visibilitychange', () => root.classList.toggle('mo-hidden', document.hidden));

    const frame = () => {
      raf = 0;
      const max = root.scrollHeight - innerHeight, y = scrollY;
      bar.style.setProperty('--sp', max > 0 ? clamp(y/max, 0, 1).toFixed(4) : '0');
      if (heroBox) {
        const r = heroBox.getBoundingClientRect();
        heroBox.style.setProperty('--pp', r.bottom > 0 && r.height ? clamp(-r.top/r.height, 0, 1).toFixed(3) : '1');
      }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', kick, {passive:true});
    addEventListener('resize', kick);
    kick();
  } catch (e) { console.warn('motion bg', e); }

  /* ---------- карточки ниже первого экрана появляются, когда до них доходит прокрутка ---------- */
  try {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        let i = 0;
        es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).forEach(e => {
          const c = e.target; io.unobserve(c);
          c.style.setProperty('--rd', (i++*70) + 'ms');
          c.classList.add('mo-in');
          setTimeout(() => c.style.setProperty('--rd', '0ms'), 1400);
        });
      }, {threshold:.06, rootMargin:'0px 0px -5% 0px'});
      document.querySelectorAll('main.grid > .card').forEach(c => {
        if (c.getBoundingClientRect().top > innerHeight*0.92) { c.classList.add('mo-rv'); io.observe(c); }
      });
    }
  } catch (e) { console.warn('motion reveal', e); }

  /* ---------- мышь: подсветка стекла и наклон главной карточки ---------- */
  if (fine) try {
    let px = 0, py = 0, tgt = null, hraf = 0;
    const apply = () => {
      hraf = 0; if (!tgt) return;
      const r = tgt.getBoundingClientRect();
      tgt.style.setProperty('--mx', (px - r.left).toFixed(0) + 'px');
      tgt.style.setProperty('--my', (py - r.top).toFixed(0) + 'px');
      if (tgt === heroBox && r.width && r.height) {
        const nx = clamp((px - r.left)/r.width, 0, 1) - .5, ny = clamp((py - r.top)/r.height, 0, 1) - .5;
        tgt.style.setProperty('--ry', (nx*6).toFixed(2) + 'deg');
        tgt.style.setProperty('--rx', (-ny*5).toFixed(2) + 'deg');
      }
    };
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const c = e.target.closest && e.target.closest('.card');
      if (c !== tgt) { rest(tgt); tgt = c; if (c === heroBox) c.classList.add('mo-tilting'); }
      if (!c) return;
      px = e.clientX; py = e.clientY;
      if (!hraf) hraf = requestAnimationFrame(apply);
    }, {passive:true});
    const rest = c => {
      if (c && c === heroBox) { c.classList.remove('mo-tilting'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
    };
    document.addEventListener('pointerleave', () => { rest(tgt); tgt = null; });
    document.documentElement.addEventListener('mouseleave', () => { rest(tgt); tgt = null; });
  } catch (e) { console.warn('motion pointer', e); }

  /* ---------- после перехода по нижней панели раздел коротко подсвечивается рамкой ---------- */
  try {
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
      const el = document.getElementById(b.dataset.go);
      if (!el || !el.animate) return;
      setTimeout(() => el.animate(
        [{outline:'2px solid rgba(255,255,255,.38)', outlineOffset:'0px'}, {outline:'2px solid rgba(255,255,255,0)', outlineOffset:'12px'}],
        {duration:900, easing:'cubic-bezier(.2,.8,.2,1)'}), 450);
    }));
  } catch (e) { console.warn('motion ping', e); }
})();
