# Footer Admin-Management Extension — Verification Note

First iteration (no `footer-review.json` present). Implemented from `footer-design.md`.

## Files changed
- `models/Settings.ts` — FooterSettings type + `defaultSettings.footerSettings` defaults.
- `components/Footer.tsx` — read new fields instead of literals (modern/default branch + inline form). `minimal` branch untouched. `FooterProps` unchanged.
- `app/admin/settings/footer/page.tsx` — `defaultFooterSettings` stub, bottom-bar link handlers, Design mountain toggle, Newsletter placeholder/button inputs, new Bottom Bar section.

No new files (except this note), no new npm packages, no API changes. `FooterWrapper.tsx` untouched.

## FooterSettings fields added (all optional) + defaults
| Field | Type | Default (model + admin stub) |
|---|---|---|
| `newsletterPlaceholder` | `string?` | `"तपाईंको इमेल ठेगाना"` |
| `newsletterButtonText` | `string?` | `"सदस्यता लिनुहोस्"` |
| `bottomBarLinks` | `FooterLink[]?` | `[{Site Map,/sitemap,0},{Privacy Policy,/privacy-policy,1},{Terms of Use,/terms-of-service,2}]` |
| `designedWithText` | `string?` | `"Designed with {heart} for a better Nepal"` |
| `showMountain` | `boolean?` | `true` |

`bottomBarLinks` reuses the existing `FooterLink` interface. `{heart}` token marks where the lucide `<Heart>` (accentColor, `fill-current`, aria-hidden) renders; text before/after is configurable. Component supplies the identical fallback literal for every field so pre-existing stored docs (which lack these nested keys — `SettingsModel.get()` only deep-merges at top level) render unchanged.

## Public footer changes (components/Footer.tsx)
- Bottom-bar nav renders `bottomBarLinks` (sorted by order; fallback `defaultBottomBarLinks` const) with `'|'` dividers only between items; nav is `flex flex-wrap items-center justify-center gap-x-3 gap-y-1` (wraps on mobile, no overflow); dividers `aria-hidden`; `<nav aria-label="कानुनी लिंकहरू">` preserved.
- "Designed with" `<p>` splits `designedWithText` on `{heart}`; renders before + heart + after, or whole-string + heart if token absent.
- Newsletter `<h3>` now uses `settings.newsletterTitle` (was hardcoded `ताजा अपडेट पाउनुहोस्`); `InlineNewsletterForm` takes `placeholder` + `buttonText` props (used on input placeholder, sr-only label, aria-label, and button label). Validation/loading/success/error UX, `suppressHydrationWarning`, aria-* unchanged.
- Decorative mountain `<img>` gated behind `(settings.showMountain ?? true)`. Kept `<img>` (lint warning acceptable), `hidden lg:block absolute ... pointer-events-none`, `alt="" aria-hidden`.
- Added `FooterLink` to the `@/models/Settings` import.

## Admin page changes
- `defaultFooterSettings` seeded with the five new fields.
- Design section: added "Show footer mountain artwork" checkbox (`showMountain ?? true`).
- Newsletter section: added "इनपुट प्लेसहोल्डर" and "बटन टेक्स्ट" inputs (`?? ''` controlled).
- New "तल्लो बार / Bottom Bar" collapsible section (id `bottombar`, `Layout` icon): `designedWithText` input with `{heart}` help text + utility-link editor (name/href inputs, Trash2 delete, "+ लिंक थप्नुहोस्"). Order = array index; handlers `addBottomBarLink`/`updateBottomBarLink`/`removeBottomBarLink` mirror the existing column-link helpers (re-index on add/remove). No new drag-drop, no numeric order field.

## Verification results
1. `node_modules/.bin/tsc --noEmit` → **0 errors**. No `any` introduced.
2. `node_modules/.bin/eslint components/Footer.tsx app/admin/settings/footer/page.tsx models/Settings.ts` → 14 problems (10 errors, 4 warnings), **all pre-existing patterns**:
   - `react-hooks/immutability` on `fetchSettings` (line 87) — pre-existing.
   - 9× `react-hooks/no-...` "Cannot create components during render" on each `<SectionHeader>` usage — pre-existing component-in-render pattern; my new Bottom Bar section reuses this exact existing pattern (adds the 9th instance, consistent with the other 8 and the design doc's "reuse SectionHeader" instruction).
   - `no-unused-vars` warnings `Eye`/`EyeOff`/`error` — pre-existing.
   - `<img>` LCP warning at Footer.tsx mountain — the acceptable pre-existing warning.
   - No NEW rule classes introduced; my additions follow existing file conventions.
3. Live checks against http://localhost:3000:
   - (a) `/about` SSR with seeded defaults: bottom-bar links `Site Map` / `Privacy Policy` / `Terms of Use` present; `Designed with` + `for a better Nepal` present; newsletter title `न्यूजलेटर` present; a column heading (`कानुनी`) present; footer mountain `hidden lg:block absolute bottom-0 right-0` present (1×).
   - (b) GET /api/settings → stored doc predates new fields (returned `undefined`, as the design anticipates — component falls back to defaults, confirmed in SSR). Merged a changed `footerSettings` (designedWithText → "TEST CHANGED {heart} verification", bottomBarLinks[0].name → "TESTMAP", showMountain → false) → PUT → GET: all three reflected. Public `/about` re-render: `TESTMAP` + `TEST CHANGED` present, footer mountain class count → **0** (toggle works; the other `Red%20and%20White` matches on /about are a separate About-page graphic, not the footer). Then RESTORED originals via PUT: GET shows fields back to original (undefined), public footer shows `Site Map` restored, `TESTMAP` gone (0), footer mountain back (1). Site left in default state.
4. Hydration: copyright renders `© 2025` server-side via the unchanged `isMounted` year guard; no hydration-mismatch markers in markup.

## Responsive notes
- Grid unchanged: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-6` (single → 2 → 6 cols).
- Bottom bar `flex-col md:flex-row`; utility nav `flex-wrap gap-x-3 gap-y-1` wraps on mobile with no horizontal overflow; `'|'` dividers only between items (hidden/absent at wrap boundaries, all aria-hidden).
- Mountain `hidden lg:block` (absent on mobile/tablet) with capped `max-h`/`max-w` + `pointer-events-none`; `showMountain=false` removes it on all breakpoints.
- Newsletter row keeps `flex gap-2`, `flex-1 min-w-0` input + `shrink-0` button → usable at narrow widths even with admin-controlled button label length.

## Remaining visual differences from reference
None introduced by this pass — it is additive and non-destructive; the default-DB footer renders identically to before. Transient inline-form toast strings (validation/success/error) remain Nepali literals, intentionally out of scope per the design (only placeholder + button text were in the four required additions).
