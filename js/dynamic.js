/* =========================================================
   LUNLALIN — content injection
   ---------------------------------------------------------
   Pulls data/content.json (written by the admin panel) into
   the static markup, then hands control to script.js.
   Ordering matters: script.js binds observers and carousels,
   and several of the nodes it needs are replaced here.
   ========================================================= */
(function () {
  'use strict';

  /* Claimed synchronously so script.js's DOMContentLoaded handler waits for
     the injection instead of binding to markup this file is about to replace. */
  window.Lunlalin = window.Lunlalin || {};
  window.Lunlalin.deferInit = true;

  var PLACEHOLDER_BG = '%232E4B39';
  var PLACEHOLDER_FG = '%23A8CDB5';

  function placeholder(w, h, label) {
    return 'data:image/svg+xml;utf8,' +
      "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'>" +
      "<rect width='100%25' height='100%25' fill='" + PLACEHOLDER_BG + "'/>" +
      "<text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' " +
      "font-family='sans-serif' font-size='22' fill='" + PLACEHOLDER_FG + "'>" +
      encodeURIComponent(label || 'Image') + '</text></svg>';
  }

  /* Values reaching an HTML attribute or plain-text slot are escaped. The
     rich-text fields (hero title, descriptions, paragraphs) intentionally
     allow markup — the schema ships `<em>` in the hero title. */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setHTML(root, selector, value) {
    if (value == null || value === '') return;
    var el = root && root.querySelector(selector);
    if (el) el.innerHTML = value;
  }

  function setText(root, selector, value) {
    if (value == null || value === '') return;
    var el = root && root.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setImage(root, selector, url) {
    if (!url) return;
    var el = root && root.querySelector(selector);
    if (el) el.src = url;
  }

  /* ---------- Sections ---------- */

  function renderHero(data) {
    var hero = document.querySelector('.hero');
    if (!hero || !data) return;

    setHTML(hero, '.eyebrow', data.eyebrow);
    setHTML(hero, '.hero__title', data.title);
    setHTML(hero, '.hero__desc', data.description);
    setText(hero, '.hero__badge span', data.badge);
    setImage(hero, '.hero__image-frame img', data.heroImage);

    var items = hero.querySelectorAll('.hero__trust-item');
    (data.stats || []).forEach(function (stat, i) {
      var item = items[i];
      if (!item) return;
      var value = item.querySelector('strong');
      var label = item.querySelector('span');
      if (value && stat.value != null) value.textContent = stat.value;
      if (label && stat.label != null) label.textContent = stat.label;
    });
  }

  function renderAbout(data) {
    var about = document.querySelector('.about');
    if (!about || !data) return;

    setHTML(about, '.eyebrow', data.eyebrow);
    setHTML(about, '.section-title', data.title);
    setImage(about, '.about__image-main img', data.imageMain);
    setImage(about, '.about__image-accent img', data.imageAccent);

    var paras = about.querySelectorAll('.about__content > p');
    (data.paragraphs || []).forEach(function (text, i) {
      if (paras[i]) paras[i].innerHTML = text;
    });

    var valueList = about.querySelector('.value-list');
    if (valueList && data.values && data.values.length) {
      valueList.innerHTML = data.values.map(function (value) {
        return '<li><svg class="value-list__icon" viewBox="0 0 64 40" aria-hidden="true">' +
               '<use href="#lash-fan"/></svg>' + esc(value) + '</li>';
      }).join('');
    }

    var cards = about.querySelectorAll('.stat-card');
    (data.counters || []).forEach(function (counter, i) {
      var card = cards[i];
      if (!card) return;
      var num = card.querySelector('.stat-card__num');
      var suffix = card.querySelector('.stat-card__suffix');
      var label = card.querySelector('.stat-card__label');
      if (num) {
        num.setAttribute('data-counter', counter.value);
        num.textContent = '0';
      }
      if (suffix && counter.suffix != null) suffix.textContent = counter.suffix;
      if (label && counter.label != null) label.textContent = counter.label;
    });
  }

  function renderServices(data) {
    var section = document.querySelector('.services');
    if (!section || !data) return;

    setHTML(section, '.eyebrow', data.eyebrow);
    setHTML(section, '.section-title', data.title);
    setHTML(section, '.section-sub', data.subtitle);

    var grid = section.querySelector('.services-grid');
    if (!grid || !data.items || !data.items.length) return;

    grid.innerHTML = data.items.map(function (item) {
      var img = item.image || placeholder(800, 600, item.name || 'Service');
      return '' +
        '<article class="service-card" data-reveal>' +
          '<div class="service-card__img">' +
            '<img src="' + esc(img) + '" alt="' + esc(item.name || '') + '" ' +
                 'loading="lazy" decoding="async" width="800" height="600">' +
          '</div>' +
          '<div class="service-card__body">' +
            '<svg class="service-card__icon" viewBox="0 0 64 40" aria-hidden="true"><use href="#lash-fan"/></svg>' +
            '<h3>' + esc(item.name || '') + '</h3>' +
            '<p>' + esc(item.description || '') + '</p>' +
            '<a href="#promotions" class="service-card__link">View Pricing ' +
              '<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-arrow-right"/></svg>' +
              '<span class="visually-hidden"> for ' + esc(item.name || 'this service') + '</span>' +
            '</a>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderPromotions(data) {
    var section = document.querySelector('.promotions');
    if (!section || !data) return;

    setHTML(section, '.eyebrow', data.eyebrow);
    setHTML(section, '.section-title', data.title);
    setHTML(section, '.section-sub', data.subtitle);

    var grid = section.querySelector('.pricing-grid');
    if (!grid || !data.items || !data.items.length) return;

    grid.innerHTML = data.items.map(function (item) {
      var features = (item.features || []).map(function (f) {
        return '<li><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-check"/></svg> ' + esc(f) + '</li>';
      }).join('');

      return '' +
        '<article class="pricing-card' + (item.featured ? ' pricing-card--featured' : '') + '" data-reveal>' +
          (item.tag ? '<span class="pricing-card__tag">' + esc(item.tag) + '</span>' : '') +
          '<h3 class="pricing-card__name">' + esc(item.name || '') + '</h3>' +
          '<p class="pricing-card__desc">' + esc(item.description || '') + '</p>' +
          '<div class="pricing-card__price">' +
            '<span>' + esc(item.currency || '') + '</span>' + esc(item.price || '') +
          '</div>' +
          '<ul class="pricing-card__features">' + features + '</ul>' +
          '<a href="#contact" class="btn ' + (item.featured ? 'btn--primary' : 'btn--outline') + '">' +
            'Book This Package' +
            '<span class="visually-hidden">: ' + esc(item.name || '') + '</span>' +
          '</a>' +
        '</article>';
    }).join('');
  }

  function renderGallery(data) {
    var section = document.querySelector('.gallery');
    if (!section || !data) return;

    setHTML(section, '.eyebrow', data.eyebrow);
    setHTML(section, '.section-title', data.title);
    setHTML(section, '.section-sub', data.subtitle);

    var grid = section.querySelector('.gallery-grid');
    if (!grid) return;

    var images = data.images || [];
    if (!images.length) {
      /* An empty gallery previously rendered as a blank void. */
      grid.innerHTML = '<p class="gallery-empty">Our gallery is being updated — ' +
        'follow <a href="https://instagram.com/lunlalin.th" target="_blank" rel="noopener">@lunlalin.th</a> ' +
        'for the latest work.</p>';
      return;
    }

    grid.innerHTML = images.map(function (src, i) {
      /* A 4-column rhythm: every 5th and 8th tile runs tall. The previous
         `i % 4 === 4` test could never be true, so nothing ever spanned. */
      var tall = (i % 7 === 1 || i % 7 === 4);
      var alt = 'Lunlalin gallery image ' + (i + 1);
      return '' +
        '<button type="button" class="gallery-item' + (tall ? ' gallery-item--tall' : '') + '" ' +
                'data-full="' + esc(src) + '" data-alt="' + esc(alt) + '" ' +
                'aria-label="Open ' + esc(alt) + ' in full size">' +
          '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
          '<span class="gallery-item__zoom" aria-hidden="true"><svg class="icon" aria-hidden="true" focusable="false"><use href="#i-zoom-in"/></svg></span>' +
        '</button>';
    }).join('');
  }

  function renderReviews(data) {
    var section = document.querySelector('.reviews');
    if (!section || !data) return;

    setHTML(section, '.eyebrow', data.eyebrow);
    setHTML(section, '.section-title', data.title);

    var track = document.getElementById('reviewsTrack');
    if (!track || !data.items || !data.items.length) return;

    /* script.js rebuilds the dots from these cards, so they cannot desync. */
    track.innerHTML = data.items.map(function (review) {
      var stars = Math.max(0, Math.min(5, parseInt(review.stars, 10) || 0));
      return '' +
        '<article class="review-card">' +
          '<div class="review-card__stars" role="img" aria-label="' + stars + ' out of 5 stars">' +
            '★'.repeat(stars) +
          '</div>' +
          '<p class="review-card__text">' + esc(review.text || '') + '</p>' +
          '<div class="review-card__author">' +
            '<strong>' + esc(review.author || '') + '</strong>' +
            '<span>' + esc(review.role || '') + '</span>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderBanner(data) {
    var banner = document.querySelector('.banner');
    if (!banner || !data) return;
    setHTML(banner, '.eyebrow', data.eyebrow);
    setHTML(banner, '.banner__title', data.title);
    setHTML(banner, '.banner__desc', data.description);
  }

  function renderContact(data) {
    if (!data) return;
    var contact = document.querySelector('.contact');

    if (contact) {
      setText(contact, 'a[href^="tel:"] span', data.phone);
      setText(contact, 'a[href*="line.me"] span', data.line);
      setText(contact, 'a[href*="instagram.com"] span', data.instagram);

      var tel = contact.querySelector('a[href^="tel:"]');
      if (tel && data.phone) tel.href = 'tel:' + String(data.phone).replace(/[^\d+]/g, '');

      var map = contact.querySelector('.contact-map iframe');
      if (map && data.mapUrl) map.src = data.mapUrl;

      var hours = contact.querySelector('.contact-hours');
      if (hours && data.hours && data.hours.length) {
        hours.innerHTML = '<h4>Studio Hours</h4>' + data.hours.map(function (h) {
          return '<div class="contact-hours__row"><span>' + esc(h.days) +
                 '</span><span>' + esc(h.time) + '</span></div>';
        }).join('');
      }
    }

    /* Footer contact lines, addressed by a stable hook rather than by walking
       up from an icon — a missing icon used to throw and abort the injection. */
    var footerIcons = { phone: 'i-phone', line: 'i-line',
                        instagram: 'i-instagram', location: 'i-location' };
    Object.keys(footerIcons).forEach(function (key) {
      var el = document.querySelector('[data-contact="' + key + '"]');
      if (el && data[key]) {
        el.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#' +
                       footerIcons[key] + '"/></svg> ' + esc(data[key]);
      }
    });
  }

  /* ---------- Boot ---------- */

  function hydrate(data) {
    renderHero(data.hero);
    renderAbout(data.about);
    renderServices(data.services);
    renderPromotions(data.promotions);
    renderGallery(data.gallery);
    renderReviews(data.reviews);
    renderBanner(data.banner);
    renderContact(data.contact);
  }

  function boot() {
    fetch('data/content.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('content.json: HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) { hydrate(data || {}); })
      .catch(function (err) {
        /* The static markup is a complete fallback — log and carry on. */
        console.error('Content injection failed, using static markup:', err);
      })
      .then(function () {
        /* Always hand off, so a failed or slow fetch can never leave the page
           un-initialised with every [data-reveal] section stuck at opacity 0. */
        window.Lunlalin.init();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
