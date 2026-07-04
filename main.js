/* MBA India Daily — deferred interactions. Zero dependencies. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── PRELOADER — once per session ─────────── */
  (function () {
    var pre = document.getElementById('preloader');
    var html = document.documentElement;
    if (!pre) { html.classList.add('hero-ready'); return; }
    var seen = false;
    try { seen = sessionStorage.getItem('mid-preloaded') === '1'; } catch (e) {}
    if (seen || reduced) {
      pre.classList.add('skip');
      html.classList.add('hero-ready'); /* hero must still play if no curtain */
      return;
    }
    try { sessionStorage.setItem('mid-preloaded', '1'); } catch (e) {}

    var count = document.getElementById('pre-count');
    var n = 0;
    /* ~2s total: 100ms ticks, avg +5 per tick */
    var t = setInterval(function () {
      n = Math.min(100, n + Math.ceil(Math.random() * 9));
      count.textContent = n + '%';
      pre.style.setProperty('--p', n / 100);
      if (n >= 100) {
        clearInterval(t);
        finish();
      }
    }, 100);
    /* hard safety: never trap the page */
    var safety = setTimeout(finish, 3500);

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(t);
      clearTimeout(safety);
      setTimeout(function () {
        pre.classList.add('done');
        html.classList.add('hero-ready'); /* hero plays as the curtain lifts */
      }, 180);
    }
  })();

  /* ── NAV shrink after 80px ────────────────── */
  (function () {
    var nav = document.getElementById('nav');
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle('scrolled', window.scrollY > 80);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ── MOBILE MENU ──────────────────────────── */
  (function () {
    var btn = document.getElementById('menu-btn');
    var menu = document.getElementById('menu');
    var nav = document.getElementById('nav');
    if (!btn || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('open', open);
      nav.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = menu.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      } else {
        btn.focus({ preventScroll: true });
      }
    }
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
    });
  })();

  /* Scroll reveals, accent underlines, and stat counters now live in
     animations.js so all animation logic sits in one dedicated module. */
})();
