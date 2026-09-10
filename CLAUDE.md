# Lunlalin — ลัลล์ลลิล

Marketing site for a lash, nail and waxing studio in Bangkok, plus a
self-hosted admin panel the owner uses to edit its content.

- **Live:** `lunlalin.vercel.app` — Vercel deploys `main` on push. No custom domain.
- **Admin:** `/admin.html` — writes to this repo via the GitHub API.
- **Stack:** hand-written HTML/CSS/JS. No framework, no bundler, no build step.

## Running it

```bash
python3 -m http.server 8899      # then open http://localhost:8899
```

There is nothing to install or compile. `admin/node_modules` is committed to
the repo but nothing on the site imports from it.

## Architecture

Three scripts, loaded in this order, and **the order is load-bearing**:

| File | Role |
| --- | --- |
| `js/i18n.js` | Resolves the language before anything paints; holds the fixed chrome strings |
| `js/script.js` | Defines all behaviour, exposes `window.Lunlalin.init()`. Does **not** self-start when `dynamic.js` is present |
| `js/dynamic.js` | Fetches `data/content.json`, injects it, **then calls `Lunlalin.init()`** |

`dynamic.js` replaces large parts of the DOM. Anything bound before that
injection is bound to detached nodes. This once meant every section below the
hero rendered at `opacity: 0` for every visitor — observers were attached to
elements that no longer existed. **If you add behaviour, put it behind
`init()`; do not bind on `DOMContentLoaded` directly.**

`init()` splits into:
- `initChrome()` — bound once (navbar, menus, lightbox, booking form, lash studio)
- `initContent()` — re-runnable, re-binds anything whose nodes get replaced

### Content

`data/content.json` is the owner's editable copy. Translatable fields are
`{th, en}`; a plain string means "same in both languages". Resolve them through
`i18n.pick()`, never by reading `.th` directly.

Fields that are **not** translatable and stay plain strings: phone, LINE ID,
Instagram, prices, currency, image URLs, opening times, map URL.

### Language

Thai is the default, unconditionally. Browser-locale sniffing was implemented
and deliberately reverted: many Thai customers run their phone in English and
would otherwise be served the secondary language on their own local salon.
Only an explicit toggle, persisted in `localStorage`, overrides it.

`index.html` ships Thai markup so the majority sees no swap on load.

## Traps

**`atob()` corrupts this data.** `admin.html` must use the `b64ToUtf8` /
`utf8ToB64` pair. `atob()` decodes Latin-1, so every load→save round trip
mangled ฿, em dashes and Thai a little further — `฿1,500` reached visitors as
`Ã Â¸Â¿1,500` after two rounds.

**The admin has no draft state.** Both buttons write straight to `main`;
whatever is saved is live immediately.

**`[hidden]` needs `!important` here.** Component rules set `display`, which
out-ranks the UA `[hidden]` rule. Without the global override, hidden panels
and disabled buttons stay on screen.

**Seven references hardcode the domain** — `canonical`, `og:url`, `og:image`,
`twitter:image`, the JSON-LD `image`, `robots.txt` `Sitemap:`, and
`sitemap.xml` `<loc>`. They must change **together** or the social preview
breaks.

**No icon CDN.** Icons are an inline `<symbol>` sprite in `index.html`, used as
`<svg class="icon"><use href="#i-name"/></svg>`. Do not add FontAwesome back to
the public site (`admin.html` still uses it; it is an internal tool).

**Image uploads are resized in the browser** by `prepImage()` in `admin.html`
— 1400px long edge, JPEG q0.82. Without it a raw phone photo ships at several
megabytes to every visitor.

## Content rules

This is a real business. Do not invent facts about it.

- **No invented prices.** Only Signature Classic (฿1,500) is set. The lash
  studio deliberately sends a specification and lets the salon quote.
- **No invented address.** The JSON-LD carries `geo` read from the owner's own
  Maps embed, and `addressLocality: Bangkok`. `streetAddress` is absent
  because it is unknown — a wrong one sends customers to the wrong door.
- **No generated photographs.** Every image slot is a generated brand
  placeholder, by the owner's choice. Do not substitute AI imagery for a real
  studio's work.
- The Thai name is **ลัลล์ลลิล**, matching the Google Business listing. It is
  not a transliteration of "Lunlalin" — an earlier pass invented ลันลาลิน and
  had to be corrected across 29 places.

## Testing

No test suite. Changes are verified by driving the page in headless Chromium
(Playwright is available; Chromium lives at `PLAYWRIGHT_BROWSERS_PATH`).

Two lessons worth keeping, both from checks that reported success wrongly:

- A reveal check passed while **nothing was ever hidden** — it could not fail.
  Confirm a check fails when it should before trusting that it passed.
- An image check reported four broken images that were simply below the fold
  with `loading="lazy"`. Scroll before sampling `naturalWidth`.
