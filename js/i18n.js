/* =========================================================
   LUNLALIN — bilingual UI (Thai primary, English secondary)
   ---------------------------------------------------------
   Covers the fixed chrome only. Editable copy lives in
   data/content.json, where each translatable field may be a
   plain string (used for both languages) or {th, en}.
   ========================================================= */
(function () {
  'use strict';

  var DEFAULT_LANG = 'th';
  var STORAGE_KEY = 'lunlalin.lang';

  var STRINGS = {
    th: {
      'skip': 'ข้ามไปยังเนื้อหาหลัก',
      'brand.home': 'ลันลาลิน — หน้าแรก',

      'nav.home': 'หน้าแรก',
      'nav.about': 'เกี่ยวกับเรา',
      'nav.services': 'บริการ',
      'nav.promotions': 'โปรโมชั่น',
      'nav.gallery': 'ผลงาน',
      'nav.reviews': 'รีวิว',
      'nav.book': 'จองคิว',
      'nav.main': 'เมนูหลัก',
      'nav.mobile': 'เมนูมือถือ',
      'nav.openMenu': 'เปิดเมนู',
      'nav.closeMenu': 'ปิดเมนู',
      'nav.lang': 'เปลี่ยนภาษา',

      'hero.cta': 'จองคิวเลย',
      'hero.explore': 'ดูบริการทั้งหมด',
      'hero.scroll': 'เลื่อนลงเพื่อดูเพิ่มเติม',

      'services.viewPricing': 'ดูราคา',
      'promo.book': 'จองแพ็กเกจนี้',

      'reviews.prev': 'รีวิวก่อนหน้า',
      'reviews.next': 'รีวิวถัดไป',
      'reviews.label': 'รีวิวจากลูกค้า',
      'reviews.pick': 'เลือกรีวิว',
      'reviews.dot': 'รีวิวที่ {n} จาก {total}',
      'reviews.stars': '{n} จาก 5 ดาว',

      'gallery.empty': 'กำลังอัปเดตผลงานใหม่ — ติดตามได้ที่',
      'gallery.emptyTail': 'เพื่อชมผลงานล่าสุด',
      'gallery.open': 'เปิดดูภาพขนาดเต็ม',
      'gallery.alt': 'ผลงานของลันลาลิน ภาพที่ {n}',

      'lightbox.label': 'ตัวดูรูปภาพ',
      'lightbox.close': 'ปิด',
      'lightbox.prev': 'ภาพก่อนหน้า',
      'lightbox.next': 'ภาพถัดไป',

      'form.name': 'ชื่อ-นามสกุล',
      'form.namePlaceholder': 'ชื่อของคุณ',
      'form.phone': 'เบอร์โทรศัพท์',
      'form.line': 'ไลน์ไอดี',
      'form.service': 'บริการที่สนใจ',
      'form.selectService': 'เลือกบริการ',
      'form.date': 'วันที่ต้องการ',
      'form.time': 'เวลาที่ต้องการ',
      'form.message': 'ข้อความเพิ่มเติม',
      'form.messagePlaceholder': 'บอกเราเกี่ยวกับลุคที่ต้องการ อาการแพ้ หรือคำถามอื่น ๆ…',
      'form.submit': 'ส่งคำขอจองคิว',
      'form.sending': 'กำลังเตรียมข้อมูล…',
      'form.required': 'กรุณากรอกข้อมูลในช่องนี้',
      'form.invalidFormat': 'รูปแบบข้อมูลไม่ถูกต้อง',
      'form.checkFields': 'กรุณากรอกข้อมูลในช่องที่ไฮไลต์ไว้',
      'form.serviceOther': 'อื่น ๆ',
      'service.lashes': 'ต่อขนตา',
      'service.nails': 'ทำเล็บ',
      'service.waxing': 'แว็กซ์ขน',

      'booking.ready': 'เตรียมข้อมูลการจองเรียบร้อยแล้ว — กด “ส่งทาง LINE” เพื่อส่งให้เรา',
      'booking.openLine': 'ส่งทาง LINE',
      'booking.copy': 'คัดลอกข้อมูล',
      'booking.copied': 'คัดลอกแล้ว',
      'booking.fallback': 'หาก LINE ไม่เปิดขึ้นมา คุณสามารถคัดลอกข้อมูลด้านล่าง หรือโทรหาเราได้ที่',
      'booking.summaryLabel': 'ข้อความการจองของคุณ',

      'msg.title': 'ขอจองคิว',
      'msg.name': 'ชื่อ',
      'msg.phone': 'เบอร์โทร',
      'msg.line': 'ไลน์ไอดี',
      'msg.service': 'บริการ',
      'msg.date': 'วันที่',
      'msg.time': 'เวลา',
      'msg.note': 'ข้อความ',

      'contact.callUs': 'โทรหาเรา',
      'contact.hours': 'เวลาทำการ',
      'contact.mapTitle': 'แผนที่ร้านลันลาลิน กรุงเทพฯ',

      'footer.links': 'ลิงก์ด่วน',
      'footer.contact': 'ติดต่อเรา',
      'footer.tagline': 'สตูดิโอต่อขนตา ทำเล็บ และแว็กซ์ พรีเมียม ใจกลางกรุงเทพฯ',
      'footer.rights': 'สงวนลิขสิทธิ์',
      'footer.nav': 'เมนูส่วนท้าย',

      'social.instagram': 'ลันลาลินบนอินสตาแกรม',
      'social.line': 'ลันลาลินบนไลน์',
      'social.phone': 'โทรหาลันลาลิน',
      'backToTop': 'กลับขึ้นด้านบน'
    },

    en: {
      'skip': 'Skip to content',
      'brand.home': 'Lunlalin — home',

      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.services': 'Services',
      'nav.promotions': 'Promotions',
      'nav.gallery': 'Gallery',
      'nav.reviews': 'Reviews',
      'nav.book': 'Book Now',
      'nav.main': 'Main',
      'nav.mobile': 'Mobile',
      'nav.openMenu': 'Open menu',
      'nav.closeMenu': 'Close menu',
      'nav.lang': 'Change language',

      'hero.cta': 'Book an Appointment',
      'hero.explore': 'Explore Services',
      'hero.scroll': 'Scroll to About',

      'services.viewPricing': 'View Pricing',
      'promo.book': 'Book This Package',

      'reviews.prev': 'Previous review',
      'reviews.next': 'Next review',
      'reviews.label': 'Client reviews',
      'reviews.pick': 'Choose a review',
      'reviews.dot': 'Review {n} of {total}',
      'reviews.stars': '{n} out of 5 stars',

      'gallery.empty': 'Our gallery is being updated — follow',
      'gallery.emptyTail': 'for the latest work.',
      'gallery.open': 'Open full size',
      'gallery.alt': 'Lunlalin gallery image {n}',

      'lightbox.label': 'Gallery image viewer',
      'lightbox.close': 'Close viewer',
      'lightbox.prev': 'Previous image',
      'lightbox.next': 'Next image',

      'form.name': 'Full Name',
      'form.namePlaceholder': 'Your name',
      'form.phone': 'Phone Number',
      'form.line': 'LINE ID',
      'form.service': 'Service',
      'form.selectService': 'Select a service',
      'form.date': 'Preferred Date',
      'form.time': 'Preferred Time',
      'form.message': 'Message',
      'form.messagePlaceholder': 'Tell us about your desired look, any allergies, or questions…',
      'form.submit': 'Request Appointment',
      'form.sending': 'Preparing…',
      'form.required': 'This field is required.',
      'form.invalidFormat': 'Please check the format.',
      'form.checkFields': 'Please complete the highlighted fields.',
      'form.serviceOther': 'Other',
      'service.lashes': 'Eyelash Extensions',
      'service.nails': 'Nail Services',
      'service.waxing': 'Waxing',

      'booking.ready': 'Your booking details are ready — tap “Send via LINE” to send them to us.',
      'booking.openLine': 'Send via LINE',
      'booking.copy': 'Copy details',
      'booking.copied': 'Copied',
      'booking.fallback': 'If LINE did not open, copy the details below or call us at',
      'booking.summaryLabel': 'Your booking message',

      'msg.title': 'Appointment request',
      'msg.name': 'Name',
      'msg.phone': 'Phone',
      'msg.line': 'LINE ID',
      'msg.service': 'Service',
      'msg.date': 'Date',
      'msg.time': 'Time',
      'msg.note': 'Message',

      'contact.callUs': 'Call Us',
      'contact.hours': 'Studio Hours',
      'contact.mapTitle': 'Map showing the Lunlalin salon location in Bangkok',

      'footer.links': 'Quick Links',
      'footer.contact': 'Contact',
      'footer.tagline': 'Premium eyelash extensions, nails, and waxing studio in Bangkok.',
      'footer.rights': 'All rights reserved.',
      'footer.nav': 'Footer',

      'social.instagram': 'Lunlalin on Instagram',
      'social.line': 'Lunlalin on LINE',
      'social.phone': 'Call Lunlalin',
      'backToTop': 'Back to top'
    }
  };

  var current = DEFAULT_LANG;

  function read() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && STRINGS[stored]) return stored;
    } catch (e) { /* private mode — fall through to the default */ }

    /* Thai is the default regardless of browser locale: plenty of Thai
       customers run their phone in English, and sniffing navigator.language
       would serve them the secondary language on their own local salon. */
    return DEFAULT_LANG;
  }

  function save(lang) {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* non-fatal */ }
  }

  /* t('reviews.dot', {n: 1, total: 4}) */
  function t(key, vars) {
    var table = STRINGS[current] || STRINGS[DEFAULT_LANG];
    var value = table[key];
    if (value == null) value = STRINGS.en[key];
    if (value == null) return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, function (m, name) {
      return vars[name] == null ? m : vars[name];
    });
  }

  /* Picks the right side of a content.json field. Accepts a plain string
     (shared by both languages) or {th, en}, falling back to whichever
     side has been filled in so a half-translated field never renders blank. */
  function pick(value) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      var mine = value[current];
      if (mine != null && mine !== '') return String(mine);
      var other = current === 'th' ? value.en : value.th;
      if (other != null && other !== '') return String(other);
    }
    return '';
  }

  /* Applies every data-i18n* binding in the document. */
  function apply(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  function setLang(lang, opts) {
    if (!STRINGS[lang]) return;
    current = lang;
    document.documentElement.setAttribute('lang', lang === 'th' ? 'th' : 'en');
    if (!opts || opts.persist !== false) save(lang);
    apply();

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang-btn') === lang;
      btn.setAttribute('aria-pressed', String(active));
    });

    /* Content rendered from content.json has to be rebuilt in the new
       language; dynamic.js owns that and re-runs the UI init afterwards.
       Skipped on the boot call: dynamic.js has already hydrated in the
       stored language, and firing here would force-reveal every section
       before the scroll observer ever runs. */
    if (!opts || opts.silent !== true) {
      document.dispatchEvent(new CustomEvent('lunlalin:langchange', { detail: { lang: lang } }));
    }
  }

  window.Lunlalin = window.Lunlalin || {};
  window.Lunlalin.i18n = {
    t: t,
    pick: pick,
    apply: apply,
    setLang: setLang,
    get lang() { return current; },
    init: function () {
      current = read();
      document.documentElement.setAttribute('lang', current === 'th' ? 'th' : 'en');
    }
  };

  /* Resolve the language before first paint so the toggle never flickers. */
  window.Lunlalin.i18n.init();
})();
