/* site.js — Araneda Office (versión estática, sin React) */
document.addEventListener('DOMContentLoaded', function () {

  /* Nav: fondo + barra de progreso al hacer scroll */
  var nav = document.querySelector('.nv5');
  var prog = document.querySelector('.nv5-prog');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 10) nav.classList.add('scr');
    else nav.classList.remove('scr');
    if (prog) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      prog.style.width = pct + '%';
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Menú móvil */
  var hmb = document.querySelector('.hmb');
  var mob = document.querySelector('.mob5');
  var mobClose = document.querySelector('.mob5-hd .hmb-close');
  if (hmb && mob) {
    hmb.addEventListener('click', function () { mob.classList.add('on'); });
  }
  if (mobClose && mob) {
    mobClose.addEventListener('click', function () { mob.classList.remove('on'); });
  }
  document.querySelectorAll('.mob5-lnk a').forEach(function (a) {
    a.addEventListener('click', function () { mob.classList.remove('on'); });
  });

  /* FAQ acordeón */
  document.querySelectorAll('.fq5-it').forEach(function (item) {
    var q = item.querySelector('.fq5-q');
    var a = item.querySelector('.fq5-a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var isOpen = q.classList.contains('on');
      document.querySelectorAll('.fq5-q.on').forEach(function (o) {
        o.classList.remove('on');
        o.nextElementSibling && o.nextElementSibling.classList.remove('on');
      });
      if (!isOpen) { q.classList.add('on'); a.classList.add('on'); }
    });
  });

  /* Ripple de agua al pasar el mouse sobre elementos [data-ripple] */
  var cool = new WeakMap();
  document.addEventListener('pointerover', function (e) {
    if (!window.WaterFX || !e.target.closest) return;
    var el = e.target.closest('[data-ripple]');
    if (!el) return;
    var now = Date.now();
    if (now - (cool.get(el) || 0) < 1400) return;
    cool.set(el, now);
    var r = el.getBoundingClientRect();
    window.WaterFX.drop(r.left + r.width / 2, r.top + r.height / 2, 0.45, true);
  });

  /* Scroll suave para anclas internas (#id) */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      var navH = 84;
      var y = el.getBoundingClientRect().top + window.scrollY - navH - 24;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
  });

});
