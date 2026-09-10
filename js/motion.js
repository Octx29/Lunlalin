/* =========================================================
   LUNLALIN — SIGNATURE MOTION (anime.js v4)
   ---------------------------------------------------------
   One idea, applied consistently: the lash-fan mark draws
   itself, stroke by stroke, the way a lash set is built.

     · the hero backdrop fan draws on load, then settles
       into the soft filled motif the page already used
     · a small fan flourish under every section heading
       draws itself as that heading scrolls into view

   SAFETY CONTRACT — read before editing.
   The page must look finished with this file absent, failed
   or still loading. Every element this file touches ships
   fully drawn in the markup; nothing is ever hidden by CSS
   waiting to be revealed. This file only ever winds an
   element BACK to undrawn once anime.js has actually
   resolved, then plays it forward. That ordering is
   deliberate: an earlier pass on this site hid content
   behind a script that never ran, and every section below
   the hero shipped invisible.

   anime.js is vendored (js/vendor/) rather than pulled from
   a CDN, and imported dynamically so its ~89 KB never sits
   on the critical path. prefers-reduced-motion skips the
   download entirely.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Kicked off at parse time, not at init(): the sooner the module lands,
     the smaller the window in which an above-the-fold flourish is briefly
     seen already drawn. */
  var animePromise = null;
  function loadAnime() {
    if (reduceMotion.matches) return null;
    if (!animePromise) {
      var url = new URL('js/vendor/anime.esm.min.js', document.baseURI).href;
      animePromise = import(url).catch(function (err) {
        /* Swallowed on purpose. A missing motion layer is a cosmetic
           downgrade, not a broken page. */
        if (window.console) console.warn('[lunlalin] motion layer unavailable:', err);
        return null;
      });
    }
    return animePromise;
  }
  loadAnime();

  function withAnime(fn) {
    var p = loadAnime();
    if (!p) return;
    p.then(function (mod) { if (mod) fn(mod); });
  }

  /* ---------------------------------------------------------
     Hero — the signature draw
     Two stacked groups inside one <svg>: the filled motif the
     page has always shown, and a stroked twin used only for
     the draw. The stroked twin is [hidden] in the markup, so
     without this file the hero is exactly as it was.
     --------------------------------------------------------- */
  var heroDone = false;

  function drawHeroFan(mod) {
    if (heroDone) return;
    var svg = document.querySelector('[data-signature]');
    if (!svg) return;

    var fill = svg.querySelector('[data-signature-fill]');
    var line = svg.querySelector('[data-signature-line]');
    var paths = line ? line.querySelectorAll('path') : [];
    if (!fill || !line || !paths.length) return;

    heroDone = true;

    var animate = mod.animate;
    var utils = mod.utils;
    var svgUtils = mod.svg;
    var stagger = mod.stagger;

    /* Read the resting opacity off the stylesheet rather than repeating it
       here: animating back to a hardcoded 1 lit the backdrop motif up to full
       strength and it slashed straight across the headline. */
    var rest = parseFloat(window.getComputedStyle(fill).opacity);
    if (!(rest > 0)) rest = 0.06;

    /* Hand over from fill to stroke in one frame — no paint in between. */
    utils.set(fill, { opacity: 0 });
    /* removeAttribute, not `line.hidden = false`: `hidden` is an HTMLElement
       IDL attribute and this is an SVG <g>, so the property assignment would
       silently create an expando and leave display:none in place. */
    line.removeAttribute('hidden');

    var drawables = svgUtils.createDrawable(paths);
    utils.set(drawables, { draw: '0 0' });

    animate(drawables, {
      draw: '0 1',
      ease: 'outQuart',
      duration: 1500,
      delay: stagger(150, { start: 260 }),
      onComplete: function () {
        /* Settle: the stroke dissolves as the filled motif returns. */
        animate(line, { opacity: 0, duration: 700, ease: 'inOutSine' });
        animate(fill, { opacity: rest, duration: 900, ease: 'inOutSine' });
      }
    });
  }

  /* ---------------------------------------------------------
     Section headings — the flourish
     Re-runnable: dynamic.js rewrites section titles, and the
     flourish sits beside them in .section-head. data-drawn
     marks the ones already handed to anime.js so a second
     initContent() pass does not restart them.
     --------------------------------------------------------- */
  function drawFlourishes(mod) {
    var nodes = document.querySelectorAll('.section-flourish:not([data-drawn])');
    if (!nodes.length) return;

    var animate = mod.animate;
    var utils = mod.utils;
    var svgUtils = mod.svg;
    var stagger = mod.stagger;
    var onScroll = mod.onScroll;

    Array.prototype.forEach.call(nodes, function (node) {
      var paths = node.querySelectorAll('path');
      if (!paths.length) return;
      node.setAttribute('data-drawn', '');

      var drawables = svgUtils.createDrawable(paths);
      utils.set(drawables, { draw: '0 0' });

      /* autoplay:false + an explicit play() on enter, rather than
         `autoplay: onScroll(...)`. Linking the animation to the observer
         makes it pause when the heading leaves the viewport, which left
         flourishes stranded half-drawn for anyone scrolling quickly. */
      var anim = animate(drawables, {
        draw: '0 1',
        ease: 'outQuad',
        duration: 850,
        delay: stagger(90),
        autoplay: false
      });

      onScroll({
        target: node,
        enter: 'bottom-=40 top',
        repeat: false,
        onEnter: function () { anim.play(); }
      });
    });
  }

  /* ---------------------------------------------------------
     Public surface — called from Lunlalin.init()
     --------------------------------------------------------- */
  window.Lunlalin = window.Lunlalin || {};
  window.Lunlalin.motion = {
    chrome: function () { withAnime(drawHeroFan); },
    content: function () { withAnime(drawFlourishes); }
  };
})();
