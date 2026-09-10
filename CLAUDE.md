# Lunlalin — ลัลล์ลลิล

Marketing site for a lash, nail and waxing studio in Bangkok, plus a
self-hosted admin panel the owner uses to edit its content.

- **Live:** `lunlalin.vercel.app` — Vercel deploys `main` on push. No custom domain.
- **Admin:** `/admin.html` — writes to this repo via the GitHub API.
- **Stack:** hand-written HTML/CSS/JS. No framework, no bundler, no build step.

## Running it

```bash
npm ci            # only for the anime.js dependency; see below
npm start         # python3 -m http.server 8899 -> http://localhost:8899
```

There is still nothing to compile. `npm ci` is not required to serve the site
— every file the browser loads is committed — it only restores `node_modules`
so `npm run vendor:anime` can refresh the vendored bundle.

`admin/node_modules` is a committed blob with no manifest of its own; nothing
on the site imports from it. Leave it alone. The root `.gitignore` ignores
`/node_modules` while keeping that exception.

## Architecture

Three scripts, loaded in this order, and **the order is load-bearing**:

| File | Role |
| --- | --- |
| `js/i18n.js` | Resolves the language before anything paints; holds the fixed chrome strings |
| `js/script.js` | Defines all behaviour, exposes `window.Lunlalin.init()`. Does **not** self-start when `dynamic.js` is present |
| `js/dynamic.js` | Fetches `data/content.json`, injects it, **then calls `Lunlalin.init()`** |
| `js/motion.js` | Optional. Registers `Lunlalin.motion`; `init()` calls it through a guard |

`dynamic.js` replaces large parts of the DOM. Anything bound before that
injection is bound to detached nodes. This once meant every section below the
hero rendered at `opacity: 0` for every visitor — observers were attached to
elements that no longer existed. **If you add behaviour, put it behind
`init()`; do not bind on `DOMContentLoaded` directly.**

`init()` splits into:
- `initChrome()` — bound once (navbar, menus, lightbox, booking form, lash studio)
- `initContent()` — re-runnable, re-binds anything whose nodes get replaced

### Signature motion

`js/motion.js` is the anime.js layer, and it is **optional by construction**.
It draws the lash-fan mark stroke by stroke: once in the hero on load, then
once per section heading as that heading scrolls into view.

anime.js is a real npm dependency, pinned exactly in `package.json`
(`animejs: 4.2.2`) with `package-lock.json` committed. The browser does **not**
load it from `node_modules`: this site has no bundler and no build step, and
Vercel's treatment of `node_modules` in a static deployment is not something to
bet the hero on. The served copy is a byte-for-byte vendored one at
`js/vendor/anime.esm.min.js` (MIT, licence alongside it) — no CDN, same rule as
the icons.

```bash
npm run vendor:anime    # re-copy dist bundle + licence into js/vendor
npm run check:vendor    # fail if js/vendor has drifted from node_modules
```

**Bump the version in `package.json`, then run `vendor:anime`.** Editing
`js/vendor/anime.esm.min.js` by hand, or bumping the dependency without
re-running the copy, silently ships a different library than the lockfile
claims. `check:vendor` is what catches that.

It is `import()`ed lazily, so its ~89 KB never sits on the critical path, and
it is not downloaded at all under `prefers-reduced-motion`.

The safety contract, which exists because this site has already shipped
content that was invisible: **everything motion.js touches ships fully drawn
in the markup.** Nothing is hidden by CSS waiting for a script to reveal it.
motion.js only ever winds an element *back* to undrawn after anime.js has
actually resolved, then plays it forward. Delete the file, break the import,
throttle the network — the page is still finished. `script.js` calls it only
through the `motion()` guard, and it lives in its own file so a parse error
there cannot take the page down.

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

**`el.hidden = false` does nothing on an SVG element.** `hidden` is an
`HTMLElement` IDL attribute; on an `<g>` the assignment silently creates an
expando and leaves `display: none` in place. Use `removeAttribute('hidden')`.
The hero's stroked twin animated perfectly while invisible for one round of
this.

**anime.js drawables animate the dash *length*, not the offset.** A drawable
path reads `stroke-dasharray: <drawn>px, <rest>px` with `stroke-dashoffset`
pinned at `0`. A check that samples `strokeDashoffset` therefore reports "fully
drawn" always and can never fail — which is exactly what happened here.
Measure `drawn / (drawn + rest)`.

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
- A draw check sampled `strokeDashoffset`, which anime.js never moves, so
  every element read as drawn. Third time a check here measured the wrong
  property and passed. Drive motion.js in four modes — normal,
  `prefers-reduced-motion`, anime.js unreachable, and mobile — because the
  middle two are where this layer is allowed to vanish and the page must
  still be whole.
