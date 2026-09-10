/* =========================================================
   LUNLALIN — UI behaviour
   ---------------------------------------------------------
   dynamic.js replaces large parts of the DOM after fetching
   data/content.json. Anything bound before that injection is
   bound to detached nodes, so this file exposes an explicit
   init() that dynamic.js calls once the real DOM exists.
   ========================================================= */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var chromeReady = false;      // one-time page chrome
  var revealObserver = null;
  var counterObserver = null;
  var navObserver = null;
  var reviewsApi = null;

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  function i18n() { return window.Lunlalin && window.Lunlalin.i18n; }
  function t(key, vars) { var m = i18n(); return m ? m.t(key, vars) : key; }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function onRaf(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; fn(); });
    };
  }

  /* Keeps overlay scroll-locking from fighting between the mobile menu and
     the lightbox: the lock lifts only when nothing holds it. */
  var scrollLocks = 0;
  function lockScroll() {
    scrollLocks++;
    document.body.classList.add('is-locked');
  }
  function unlockScroll() {
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) document.body.classList.remove('is-locked');
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, event) {
    var items = $$(FOCUSABLE, container).filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  /* =========================================================
     PAGE CHROME — bound once, survives content injection
     ========================================================= */
  function initChrome() {
    if (chromeReady) return;
    chromeReady = true;

    document.documentElement.classList.remove('no-js');

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    initLanguageToggle();
    initNavbarScroll();
    initMobileMenu();
    initLightbox();
    initLashStudio();
    initBookingForm();
    motion('chrome');
  }

  /* motion.js is optional: it lives in its own file precisely so a failure
     there cannot take the page down with it. Call through this guard only. */
  function motion(hook) {
    var m = window.Lunlalin && window.Lunlalin.motion;
    if (!m || typeof m[hook] !== 'function') return;
    try { m[hook](); } catch (e) {
      if (window.console) console.warn('[lunlalin] motion.' + hook + ' failed:', e);
    }
  }

  /* ---------- Language toggle ---------- */
  function initLanguageToggle() {
    var m = i18n();
    if (!m) return;

    $$('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        m.setLang(btn.getAttribute('data-lang-btn'));
      });
    });

    /* Paint the stored language over the Thai markup the page ships with.
       silent: content is already hydrated in this language by dynamic.js. */
    m.setLang(m.lang, { persist: false, silent: true });
  }

  /* ---------- Navbar shrink + back-to-top ---------- */
  function initNavbarScroll() {
    var navbar = document.getElementById('navbar');
    var backToTop = document.getElementById('backToTop');

    var onScroll = onRaf(function () {
      var past = window.scrollY > 50;
      if (navbar) navbar.classList.toggle('scrolled', past);
      if (backToTop) backToTop.classList.toggle('show', window.scrollY > 400);
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTop) {
      backToTop.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
        });
        var brand = $('.navbar .brand');
        if (brand) brand.focus({ preventScroll: true });
      });
    }
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    var hamburger = document.getElementById('hamburger');
    var menu = document.getElementById('mobileMenu');
    if (!hamburger || !menu) return;

    function setOpen(open) {
      var isOpen = menu.classList.contains('open');
      if (open === isOpen) return;

      menu.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', t(open ? 'nav.closeMenu' : 'nav.openMenu'));
      /* inert removes the closed menu from the tab order and the a11y tree;
         the CSS visibility transition alone would leave links focusable. */
      if ('inert' in HTMLElement.prototype) menu.inert = !open;
      menu.setAttribute('aria-hidden', String(!open));

      if (open) {
        lockScroll();
        var firstLink = $('a', menu);
        if (firstLink) firstLink.focus();
      } else {
        unlockScroll();
        hamburger.focus();
      }
    }

    setOpen(false);
    if ('inert' in HTMLElement.prototype) menu.inert = true;
    menu.setAttribute('aria-hidden', 'true');

    hamburger.addEventListener('click', function () {
      setOpen(!menu.classList.contains('open'));
    });

    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('open')) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab') trapFocus(menu, e);
    });

    /* Resizing past the nav breakpoint must not leave a locked, hidden menu. */
    window.addEventListener('resize', onRaf(function () {
      if (window.innerWidth > 860) setOpen(false);
    }), { passive: true });
  }

  /* ---------- Gallery lightbox ---------- */
  function initLightbox() {
    var lightbox = document.getElementById('lightbox');
    var img = document.getElementById('lightboxImg');
    var counter = document.getElementById('lightboxCounter');
    if (!lightbox || !img) return;

    var closeBtn = document.getElementById('lightboxClose');
    var prevBtn = document.getElementById('lightboxPrev');
    var nextBtn = document.getElementById('lightboxNext');
    var items = [];
    var index = 0;
    var lastFocused = null;

    function show(i) {
      if (!items.length) return;
      index = (i + items.length) % items.length;
      var item = items[index];
      img.src = item.getAttribute('data-full') || '';
      img.alt = item.getAttribute('data-alt') || t('gallery.alt', { n: index + 1 });
      if (counter) counter.textContent = (index + 1) + ' / ' + items.length;
      if (prevBtn) prevBtn.hidden = items.length < 2;
      if (nextBtn) nextBtn.hidden = items.length < 2;
      if (counter) counter.hidden = items.length < 2;
    }

    function open(target) {
      /* Read the gallery at open time — dynamic.js may have replaced it. */
      items = $$('.gallery-item');
      var i = items.indexOf(target);
      if (i < 0) return;
      lastFocused = document.activeElement;
      show(i);
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      lockScroll();
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      if (!lightbox.classList.contains('open')) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      unlockScroll();
      window.setTimeout(function () {
        if (!lightbox.classList.contains('open')) img.removeAttribute('src');
      }, 400);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    /* Delegated: gallery items are re-rendered from content.json. */
    document.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.gallery-item') : null;
      if (item) { e.preventDefault(); open(item); }
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', function () { show(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(index + 1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'Tab') trapFocus(lightbox, e);
    });
  }

  /* ---------- Lash studio ----------
     Draws the chosen set onto a stylised eye and hands the spec to LINE.
     Lashes are generated along the upper-lid Bezier rather than drawn by
     hand, so style/curl/length combine the way a real lash map does:
     shorter at the inner corner, longest just past the outer third. */
  function initLashStudio() {
    var svgNS = 'http://www.w3.org/2000/svg';
    var group = document.getElementById('lashGroup');
    var specEl = document.getElementById('lashSpec');
    var sendBtn = document.getElementById('lashSend');
    if (!group) return;

    /* Upper lid control points, matching the path in the markup. */
    var P0 = [46, 146], P1 = [200, 42], P2 = [356, 120];

    function point(t) {
      var u = 1 - t;
      return [u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0],
              u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]];
    }
    function tangent(t) {
      var u = 1 - t;
      return [2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]),
              2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])];
    }
    function rotate(v, deg) {
      var r = deg * Math.PI / 180, c = Math.cos(r), s2 = Math.sin(r);
      return [v[0] * c - v[1] * s2, v[0] * s2 + v[1] * c];
    }
    function unit(v) {
      var m = Math.hypot(v[0], v[1]) || 1;
      return [v[0] / m, v[1] / m];
    }

    var CURL   = { C: 0.20, CC: 0.34, D: 0.50 };
    var LENGTH = { short: 30, medium: 38, long: 46 };
    var STYLE  = {
      classic: { count: 26, fan: 1, width: 2.2, spread: 0 },
      hybrid:  { count: 24, fan: 2, width: 1.8, spread: 7 },
      volume:  { count: 22, fan: 3, width: 1.25, spread: 9 }
    };

    /* Longest just past the outer third, tapering at the very corner —
       a flat length across the lid looks synthetic. */
    function lengthProfile(t) {
      var peak = 0.74;
      var d = (t - peak) / (t < peak ? 0.78 : 0.30);
      return 0.62 + 0.38 * Math.exp(-d * d * 1.6);
    }

    function draw(style, curl, length) {
      var cfg = STYLE[style] || STYLE.classic;
      var curlAmt = CURL[curl] != null ? CURL[curl] : CURL.C;
      var baseLen = LENGTH[length] || LENGTH.medium;
      var frag = document.createDocumentFragment();

      for (var i = 0; i < cfg.count; i++) {
        var t = 0.06 + (i / (cfg.count - 1)) * 0.92;
        var b = point(t);
        var tan = unit(tangent(t));
        /* Outward normal, fanned progressively toward the outer corner.
           Starts slightly positive: the lid rises steeply at the inner corner,
           so an unrotated normal there points back toward the nose, which no
           real lash map does. */
        var normal = rotate([tan[1], -tan[0]], 6 + t * 30);
        var len = baseLen * lengthProfile(t);

        for (var f = 0; f < cfg.fan; f++) {
          var offset = cfg.fan === 1 ? 0 : (f - (cfg.fan - 1) / 2) * cfg.spread;
          var dir = rotate(normal, offset);
          var L = len * (cfg.fan === 1 ? 1 : 1 - Math.abs(offset) / 60);
          var tip = [b[0] + dir[0] * L, b[1] + dir[1] * L];
          /* Control point pushed sideways from the shaft gives the curl. */
          var perp = [dir[1], -dir[0]];
          var ctrl = [b[0] + dir[0] * L * 0.55 + perp[0] * L * curlAmt,
                      b[1] + dir[1] * L * 0.55 + perp[1] * L * curlAmt];

          var path = document.createElementNS(svgNS, 'path');
          path.setAttribute('d',
            'M' + b[0].toFixed(1) + ',' + b[1].toFixed(1) +
            ' Q' + ctrl[0].toFixed(1) + ',' + ctrl[1].toFixed(1) +
            ' ' + tip[0].toFixed(1) + ',' + tip[1].toFixed(1));
          path.setAttribute('stroke-width', (cfg.width * (f === Math.floor(cfg.fan / 2) ? 1 : 0.82)).toFixed(2));
          frag.appendChild(path);
        }
      }
      group.textContent = '';
      group.appendChild(frag);
    }

    function selected(name) {
      var el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }
    function labelFor(name) {
      var el = document.querySelector('input[name="' + name + '"]:checked');
      var span = el && el.closest('.chip') && el.closest('.chip').querySelector('span');
      return span ? span.textContent.trim() : '';
    }

    function lineHref(message) {
      var el = $('.contact-card[href*="line.me"] span') || $('[data-contact="line"]');
      var raw = el ? el.textContent.trim() : '';
      var id = /^@?[\w.\-]+$/.test(raw) ? (raw[0] === '@' ? raw : '@' + raw) : '@lunlalin';
      return 'https://line.me/R/oaMessage/' + encodeURIComponent(id) + '/?' + encodeURIComponent(message);
    }

    function update() {
      var style = selected('lashStyle'), curl = selected('lashCurl'), len = selected('lashLength');
      draw(style, curl, len);

      var spec = [labelFor('lashStyle'), labelFor('lashCurl'), labelFor('lashLength')]
                   .filter(Boolean).join(' · ');
      if (specEl) specEl.textContent = spec;

      if (sendBtn) {
        var msg = [
          t('lash.msgTitle') + ' — Lunlalin', '',
          t('lash.style') + ': ' + labelFor('lashStyle'),
          t('lash.curl') + ': ' + labelFor('lashCurl'),
          t('lash.length') + ': ' + labelFor('lashLength')
        ].join('\n');
        sendBtn.href = lineHref(msg);
      }
    }

    $$('input[name="lashStyle"], input[name="lashCurl"], input[name="lashLength"]')
      .forEach(function (input) { input.addEventListener('change', update); });

    /* Labels are translated after this runs, so refresh on a language switch. */
    document.addEventListener('lunlalin:langchange', function () {
      window.setTimeout(update, 0);
    });

    update();
  }

  /* ---------- Booking form ---------- */
  function initBookingForm() {
    var form = document.getElementById('bookingForm');
    var note = document.getElementById('formNote');
    if (!form) return;

    function fieldOf(input) { return input.closest('.form-field'); }

    function messageFor(input) {
      if (input.validity.valueMissing) return t('form.required');
      if (input.validity.typeMismatch || input.validity.patternMismatch) return t('form.invalidFormat');
      return input.validationMessage || t('form.invalidFormat');
    }

    function validate(input) {
      var wrap = fieldOf(input);
      if (!wrap) return true;
      var errorEl = $('.form-error', wrap);
      var ok = input.checkValidity();
      wrap.setAttribute('data-invalid', String(!ok));
      input.setAttribute('aria-invalid', String(!ok));
      if (errorEl) errorEl.textContent = ok ? '' : messageFor(input);
      return ok;
    }

    var fields = $$('input, select, textarea', form);
    fields.forEach(function (input) {
      /* Validate on blur, then live-correct once the field is already marked. */
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        var wrap = fieldOf(input);
        if (wrap && wrap.getAttribute('data-invalid') === 'true') validate(input);
      });
    });

    /* A past appointment date is never valid. */
    var dateInput = document.getElementById('date');
    if (dateInput && !dateInput.min) {
      /* Local date, not toISOString(): in UTC+7 that would still read
         yesterday until 07:00 and let a past date through. */
      var now = new Date();
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      dateInput.min = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    }

    /* --- Compose the booking and hand it to LINE ---------------------- */

    var result = document.getElementById('bookingResult');
    var lineBtn = document.getElementById('bookingLine');
    var copyBtn = document.getElementById('bookingCopy');
    var summaryBox = document.getElementById('bookingSummary');

    function lineId() {
      /* Read the studio's LINE handle off the page so it follows content.json. */
      var el = $('.contact-card[href*="line.me"] span') || $('[data-contact="line"]');
      var raw = el ? el.textContent.trim() : '';
      return /^@?[\w.\-]+$/.test(raw) ? (raw[0] === '@' ? raw : '@' + raw) : '@lunlalin';
    }

    function fieldValue(id) {
      var el = document.getElementById(id);
      if (!el) return '';
      if (el.tagName === 'SELECT') {
        var opt = el.options[el.selectedIndex];
        return opt ? opt.textContent.trim() : '';
      }
      return el.value.trim();
    }

    function composeMessage() {
      var lines = [t('msg.title') + ' — Lunlalin', ''];
      [['msg.name', 'fullName'], ['msg.phone', 'phone'], ['msg.line', 'line'],
       ['msg.service', 'service'], ['msg.date', 'date'], ['msg.time', 'time'],
       ['msg.note', 'message']].forEach(function (pair) {
        var value = fieldValue(pair[1]);
        if (value) lines.push(t(pair[0]) + ': ' + value);
      });
      return lines.join('\n');
    }

    function showHandoff(message) {
      if (summaryBox) summaryBox.value = message;
      if (lineBtn) {
        /* oaMessage opens a chat with the official account, pre-filled. */
        lineBtn.href = 'https://line.me/R/oaMessage/' +
                       encodeURIComponent(lineId()) + '/?' + encodeURIComponent(message);
      }
      if (result) {
        result.hidden = false;
        result.scrollIntoView({
          behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
          block: 'nearest'
        });
      }
      if (lineBtn) lineBtn.focus({ preventScroll: true });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var label = $('span', copyBtn);
        var text = summaryBox ? summaryBox.value : '';

        function done() {
          if (!label) return;
          label.textContent = t('booking.copied');
          window.setTimeout(function () { label.textContent = t('booking.copy'); }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {
            if (summaryBox) { summaryBox.select(); }
          });
        } else if (summaryBox) {
          /* Older mobile browsers: select so the user can copy manually. */
          summaryBox.select();
          try { document.execCommand('copy'); done(); } catch (err) { /* leave selected */ }
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var invalid = fields.filter(function (input) { return !validate(input); });
      if (invalid.length) {
        if (note) {
          note.textContent = t('form.checkFields');
          note.setAttribute('data-state', 'error');
        }
        if (result) result.hidden = true;
        invalid[0].focus();
        return;
      }

      if (note) { note.textContent = ''; note.removeAttribute('data-state'); }

      var message = composeMessage();
      showHandoff(message);

      /* Opening here keeps the call inside the click gesture, so it is not
         treated as a pop-up. If the browser blocks it anyway, the panel above
         still carries the LINE button, the copy action and the phone number. */
      try {
        window.open(lineBtn.href, '_blank', 'noopener');
      } catch (err) { /* the panel is the fallback */ }
    });
  }

  /* =========================================================
     CONTENT-DEPENDENT — re-runnable after DOM injection
     ========================================================= */
  function initContent() {
    initReveal();
    initCounters();
    initScrollSpy();
    initReviews();
    motion('content');
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = $$('[data-reveal]');

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) {
      if (!el.classList.contains('is-visible')) revealObserver.observe(el);
    });
  }

  /* ---------- Stat counters ---------- */
  function initCounters() {
    var els = $$('[data-counter]');

    function finalValue(el) {
      return parseFloat(el.getAttribute('data-counter')) || 0;
    }
    function render(el, value) {
      el.textContent = Math.round(value).toLocaleString('en-US');
    }

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { render(el, finalValue(el)); });
      return;
    }

    if (counterObserver) counterObserver.disconnect();
    counterObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        obs.unobserve(el);

        var target = finalValue(el);
        var duration = 1400;
        var start = null;

        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          /* easeOutCubic — decelerates into the final number */
          render(el, target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) window.requestAnimationFrame(step);
          else render(el, target);
        }
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ---------- Nav scrollspy ---------- */
  function initScrollSpy() {
    var links = $$('.nav-links [data-nav]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var id = (link.getAttribute('href') || '').replace('#', '');
      var section = id && document.getElementById(id);
      if (!section) return;
      map[id] = link;
      sections.push(section);
    });
    if (!sections.length) return;

    function setCurrent(id) {
      links.forEach(function (link) {
        var active = link === map[id];
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    if (navObserver) navObserver.disconnect();
    /* Marks the section occupying the band just under the fixed navbar,
       instead of recomputing offsets on every scroll event. */
    navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { navObserver.observe(s); });
    setCurrent('home');
  }

  /* ---------- Reviews carousel ---------- */
  function initReviews() {
    var track = document.getElementById('reviewsTrack');
    var dotsWrap = document.getElementById('reviewsDots');
    if (!track) return;

    var cards = $$('.review-card', track);
    if (!cards.length) return;

    if (reviewsApi) reviewsApi.destroy();

    var prevBtn = document.getElementById('reviewPrev');
    var nextBtn = document.getElementById('reviewNext');
    var index = 0;
    var timer = null;
    var handlers = [];

    function on(el, type, fn, opts) {
      if (!el) return;
      el.addEventListener(type, fn, opts);
      handlers.push([el, type, fn, opts]);
    }

    /* Dots are rebuilt here from the live cards, so a content.json with a
       different number of reviews can never desync them. */
    var dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      dotsWrap.setAttribute('role', 'tablist');
      dotsWrap.setAttribute('aria-label', t('reviews.pick'));
      cards.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', t('reviews.dot', { n: i + 1, total: cards.length }));
        dot.addEventListener('click', function () { go(i, true); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function go(i, userInitiated) {
      index = (i + cards.length) % cards.length;
      cards.forEach(function (card, n) {
        var active = n === index;
        card.classList.toggle('active', active);
        card.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach(function (dot, n) {
        dot.setAttribute('aria-selected', String(n === index));
        dot.tabIndex = n === index ? 0 : -1;
      });
      if (userInitiated) restart();
    }

    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function restart() {
      stop();
      if (prefersReducedMotion.matches || cards.length < 2) return;
      timer = window.setInterval(function () { go(index + 1); }, 7000);
    }

    on(prevBtn, 'click', function () { go(index - 1, true); });
    on(nextBtn, 'click', function () { go(index + 1, true); });

    var carousel = track.closest('.reviews-carousel') || track;
    on(carousel, 'mouseenter', stop);
    on(carousel, 'mouseleave', restart);
    on(carousel, 'focusin', stop);
    on(carousel, 'focusout', restart);

    on(carousel, 'keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, true); }
    });

    /* Touch swipe */
    var startX = 0;
    var startY = 0;
    var tracking = false;
    on(track, 'touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    on(track, 'touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      /* Ignore mostly-vertical drags so page scrolling still feels normal. */
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1), true);
    }, { passive: true });

    /* Pause while the tab is hidden — a background timer is wasted work. */
    var onVisibility = function () {
      if (document.hidden) stop(); else restart();
    };
    on(document, 'visibilitychange', onVisibility);

    reviewsApi = {
      destroy: function () {
        stop();
        handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); });
        handlers = [];
      }
    };

    go(0);
    restart();
  }

  /* =========================================================
     BOOTSTRAP
     ========================================================= */
  function init() {
    initChrome();
    initContent();
    /* Tells the inline watchdog in index.html that booting succeeded. */
    window.Lunlalin.initialised = true;
  }

  window.Lunlalin = window.Lunlalin || {};
  window.Lunlalin.init = init;

  document.addEventListener('DOMContentLoaded', function () {
    /* dynamic.js sets deferInit synchronously on load and calls init() itself
       once content.json has been injected. If it never loaded, boot anyway so
       the static markup is still fully interactive. */
    if (!window.Lunlalin.deferInit) init();
  });

  prefersReducedMotion.addEventListener('change', function () {
    if (chromeReady) initContent();
  });
})();
