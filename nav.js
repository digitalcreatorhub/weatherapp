/* Нижняя панель быстрых переходов по разделам (телефон и узкие окна; на широких экранах скрыта стилями).
   Кнопки и подписи лежат в index.html (переводы подставляет app.js по data-i18n); здесь — только поведение. */
(function () {
  const bar = document.getElementById('bnav'), sheet = document.getElementById('nsheet'), more = document.getElementById('navMore');
  if (!bar || !sheet || !more) return;
  const reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};

  const closeSheet = () => { sheet.hidden = true; more.setAttribute('aria-expanded', 'false'); };
  const go = id => {
    closeSheet();
    const beh = reduce.matches ? 'auto' : 'smooth';
    if (id === 'top') { scrollTo({top:0, behavior:beh}); return; }   /* «Сейчас» — в самый верх, где поиск и список мест */
    const el = document.getElementById(id); if (el) el.scrollIntoView({behavior:beh, block:'start'});
  };
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  more.addEventListener('click', e => {
    e.stopPropagation();
    const open = sheet.hidden; sheet.hidden = !open; more.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => { if (!sheet.hidden && !sheet.contains(e.target) && e.target !== more) closeSheet(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); more.focus(); } });

  /* пока человек что-то вводит (поиск, списки), клавиатура не должна поднимать панель над собой */
  const typingEl = el => !!el && !!el.matches && el.matches('input:not([type=range]):not([type=checkbox]):not([type=button]),textarea,select');
  document.addEventListener('focusin', e => { if (typingEl(e.target)) { document.body.classList.add('typing'); closeSheet(); } });
  document.addEventListener('focusout', e => { if (typingEl(e.target)) document.body.classList.remove('typing'); });

  /* какой раздел сейчас на экране: берём ближайший к верхней трети экрана; всё, что не названо здесь, относится к «Ещё» */
  const OWN = {heroBox:'now', 'sec-h24':'today', today:'today', plan:'today', util:'today', 'sec-map':'map', 'sec-radar':'radar', 'sec-road':'road'};
  const tabs = {}; bar.querySelectorAll('[data-tab]').forEach(b => { tabs[b.dataset.tab] = b; });
  let raf = 0, last = '';
  const mark = () => {
    raf = 0;
    const secs = [...document.querySelectorAll('main.grid > section')].map(s => [s, s.getBoundingClientRect().top]).sort((a, b) => a[1] - b[1]);
    if (!secs.length) return;
    const line = innerHeight*0.35; let cur = secs[0][0];
    for (const [s, top] of secs) if (top <= line) cur = s;
    /* в самом низу страницы последний раздел может не дотянуться до линии */
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1][0];
    const key = OWN[cur.id] || 'more';
    if (key === last) return; last = key;
    Object.keys(tabs).forEach(k => { if (k === key) tabs[k].setAttribute('aria-current', 'true'); else tabs[k].removeAttribute('aria-current'); });
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(mark); };
  addEventListener('scroll', kick, {passive:true});
  addEventListener('resize', kick);
  /* карточки появляются по мере загрузки данных и сдвигают друг друга */
  setInterval(kick, 1500);
  kick();
})();
