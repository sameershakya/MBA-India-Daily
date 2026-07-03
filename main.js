/* MBA India Daily — deferred interactions. Zero dependencies. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── PRELOADER — once per session ─────────── */
  (function () {
    var pre = document.getElementById('preloader');
    if (!pre) return;
    var seen = false;
    try { seen = sessionStorage.getItem('mid-preloaded') === '1'; } catch (e) {}
    if (seen || reduced) { pre.classList.add('skip'); return; }
    try { sessionStorage.setItem('mid-preloaded', '1'); } catch (e) {}

    var count = document.getElementById('pre-count');
    var n = 0;
    var t = setInterval(function () {
      n = Math.min(100, n + Math.ceil(Math.random() * 22));
      count.textContent = n + '%';
      pre.style.setProperty('--p', n / 100);
      if (n >= 100) {
        clearInterval(t);
        setTimeout(function () { pre.classList.add('done'); }, 180);
      }
    }, 90);
    /* hard safety: never trap the page */
    setTimeout(function () { pre.classList.add('done'); }, 2500);
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

  /* ── SCROLL REVEALS — once, never re-trigger ─ */
  (function () {
    var els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });

    /* the 3-layer spine draws when its stack enters */
    var stack = document.querySelector('.layer-stack');
    if (stack) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            stack.classList.add('in');
            io2.unobserve(stack);
          }
        });
      }, { threshold: 0.15 });
      io2.observe(stack);
    }
  })();

  /* ── ANIMATED COUNTERS ────────────────────── */
  (function () {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduced) { el.textContent = String(target); return; }
      var start = null;
      var dur = 900;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  })();
})();
