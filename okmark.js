/* Заменяет эмодзи ✅ на фиолетовую галочку в цветах приложения (цвет эмодзи изменить нельзя).
   Работает для любого текста на странице, в том числе для тех, что появляются позже. */
(function () {
  var MARK = '✅', SKIP = /^(SCRIPT|STYLE|TEXTAREA|TITLE)$/;
  function fix(root) {
    if (!root || !root.nodeType) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) if (n.nodeValue.indexOf(MARK) !== -1 && n.parentNode && !SKIP.test(n.parentNode.nodeName)) list.push(n);
    list.forEach(function (t) {
      var parts = t.nodeValue.split(MARK), f = document.createDocumentFragment();
      parts.forEach(function (p, i) {
        if (i) { var s = document.createElement('span'); s.className = 'okc'; s.setAttribute('role', 'img'); s.setAttribute('aria-label', '✓'); f.appendChild(s); }
        if (p) f.appendChild(document.createTextNode(p));
      });
      t.parentNode.replaceChild(f, t);
    });
  }
  function start() {
    fix(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') fix(m.target.parentNode);
        else m.addedNodes.forEach(function (a) { fix(a.nodeType === 1 ? a : a.parentNode); });
      });
    }).observe(document.body, {childList: true, subtree: true, characterData: true});
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
