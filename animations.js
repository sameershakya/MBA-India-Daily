/* MBA India Daily — animation system.
   All durations/eases are read from the CSS custom properties defined
   at the top of index.html's :root (--reveal-duration, --stagger,
   --ease-out-expo, etc.) so the whole feel can be retuned from one place.
   Zero dependencies. Every viewport trigger uses IntersectionObserver;
   every animated property is transform/opacity only unless documented. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.MID = window.MID || {};
  window.MID.reduced = reduced;

  /* ── SVG hand-drawn underline for .display em accent words ──
     Injects one inline SVG per accent word sized to its rendered
     width, with a single wavy path whose length becomes --len so
     the CSS stroke-dashoffset transition draws it in exactly once,
     driven by the same [data-reveal].in / .layer-stack.in classes
     already used by the reveal system (no duplicate observer). */
  function buildUnderlines() {
    var words = document.querySelectorAll('.display em');
    words.forEach(function (em) {
      if (em.querySelector('.accent-underline')) return;
      var w = em.getBoundingClientRect().width;
      if (!w) return;
      var svgW = Math.round(w * 1.04);
      var pathLen = Math.round(svgW * 1.06); // slight wave adds ~6% length
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'accent-underline');
      svg.setAttribute('viewBox', '0 0 ' + svgW + ' 12');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.setProperty('--len', pathLen);
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      /* a gentle hand-drawn wave, not a ruler-straight line */
      var mid = svgW / 2;
      var d = 'M2 7 Q ' + (mid * 0.5) + ' 3, ' + mid + ' 6 T ' + (svgW - 2) + ' 5.5';
      path.setAttribute('d', d);
      svg.appendChild(path);
      em.appendChild(svg);
    });
  }

  /* Rebuild on resize (debounced) since underline width depends on layout */
  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      document.querySelectorAll('.accent-underline').forEach(function (s) { s.remove(); });
      buildUnderlines();
    }, 200);
  }, { passive: true });

  /* fonts can reflow em width after load; rebuild once webfonts settle */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(buildUnderlines);
  }
  buildUnderlines();

  /* ── HERO PARALLAX — gyroscope (mobile) / mouse (desktop) ───
     Drifts 3 decorative hero elements a few px for a tactile feel.
     Never requests iOS motion permission on load — only after the
     first user gesture, per Apple's requirement. Falls back to
     mouse-move on desktop, and to a static hero everywhere else. */
  (function () {
    if (reduced) return;
    var watermark = document.getElementById('hero-watermark');
    var chip1 = document.getElementById('hero-chip-1');
    var chip2 = document.getElementById('hero-chip-2');
    if (!watermark || !chip1 || !chip2) return;
    var targets = [
      { el: watermark, mx: 5, my: 5 },
      { el: chip1, mx: 12, my: -8 },
      { el: chip2, mx: -12, my: 8 }
    ];

    var raf = null, curX = 0, curY = 0; /* -1..1 normalized */
    function apply() {
      raf = null;
      targets.forEach(function (t) {
        t.el.style.transform = 'translate3d(' + (curX * t.mx).toFixed(1) + 'px,' + (curY * t.my).toFixed(1) + 'px,0)';
      });
    }
    function queue(x, y) {
      curX = Math.max(-1, Math.min(1, x));
      curY = Math.max(-1, Math.min(1, y));
      if (!raf) raf = requestAnimationFrame(apply);
    }

    /* desktop — mouse position relative to viewport centre */
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        queue((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
      }, { passive: true });
      return;
    }

    /* mobile — device orientation, gated behind a user gesture on iOS */
    if (typeof DeviceOrientationEvent === 'undefined') return; /* static */

    function attachTilt() {
      window.addEventListener('deviceorientation', function (e) {
        if (e.gamma === null || e.beta === null) return;
        queue(
          Math.max(-45, Math.min(45, e.gamma)) / 45,
          Math.max(-45, Math.min(45, e.beta - 45)) / 45
        );
      }, { passive: true });
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      /* iOS 13+: must be requested inside a user-gesture handler, never on load */
      var granted = false;
      function onFirstGesture() {
        document.removeEventListener('touchend', onFirstGesture);
        document.removeEventListener('click', onFirstGesture);
        if (granted) return;
        granted = true;
        DeviceOrientationEvent.requestPermission().then(function (state) {
          if (state === 'granted') attachTilt();
        }).catch(function () { /* denied — hero stays static, no error surfaced */ });
      }
      document.addEventListener('touchend', onFirstGesture, { passive: true });
      document.addEventListener('click', onFirstGesture, { passive: true });
    } else {
      /* Android / other browsers expose it without a permission prompt */
      attachTilt();
    }
  })();

  /* ── SCROLL REVEALS — once, never re-trigger ─────────────── */
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

  /* ── ANIMATED COUNTERS ─────────────────────────────────────
     threshold lowered + generous rootMargin so short stat rows on
     small mobile viewports reliably cross the trigger even with a
     fast scroll flick (this is the fix for "renders as 0 on mobile"
     — the old 0.5 threshold could be skipped past on short elements). */
  (function () {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    function run(el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduced) { el.textContent = String(target); return; }
      var start = null;
      var dur = 1000;
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
    }, { threshold: [0, 0.15, 0.3], rootMargin: '0px 0px -10% 0px' });
    counters.forEach(function (el) { io.observe(el); });
    /* safety net: if a counter is already fully in view before JS attaches
       (e.g. reload mid-scroll-restore), IO fires immediately on observe,
       so no extra fallback is needed — kept simple by design. */
  })();
})();
