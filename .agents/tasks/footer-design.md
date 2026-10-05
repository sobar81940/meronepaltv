# Footer Admin-Management Extension — Design / Field Spec

## Overview

The modern footer is already built and visually matches the reference. This pass removes the four remaining hardcoded pieces and routes them through `FooterSettings` so nothing user-visible is literal in the component. The work touches exactly three files — `models/Settings.ts` (type + defaults), `components/Footer.tsx` (read settings instead of literals), `app/admin/settings/footer/page.tsx` (admin inputs + default stub) — plus no new files, no new dependencies, no API changes. `/api/newsletter` already accepts `POST { email, name?, source }` and returns `{ success, message, data }`; the inline form already consumes it correctly and is reused as-is.

The scope is additive and non-destructive. Every new field is seeded with the exact string/link that is currently hardcoded, so a site with existing stored settings renders identically after deploy. Four new fields are added, all effectively optional in behavior (component uses fallbacks), with concrete defaults in both default locations.

## Ambiguities resolved (per the brief)

**(a) New field names, types, optionality, defaults.** Listed in the schema section below. Link array uses the exact same shape as `FooterLink` (`{ name, href, order }`) so the existing link-editing UI and sort logic are reused verbatim.

**(b) Admin ordering control.** The existing columns/links UI does **not** use up/down buttons or an editable numeric `order` field, and the visible `GripVertical` icon is decorative (no drag handler is wired). Order is implicit: it equals the item's array index. `addLink`/`removeLink`/`removeColumn` re-index `order` from the array position after every mutation (`.map((x, i) => ({ ...x, order: i }))`). The new bottom-bar-links editor **reuses this exact pattern** — add appends with `order: arr.length`, remove re-indexes, position in the array is the order. No drag-drop dependency, no numeric order input, matching existing code. The footer render sorts by `order` before display (same as columns/links do today).

**(c) Newsletter admin section.** It **already exists** (section id `newsletter`, `Mail` icon, titled "न्यूजलेटर") with the `showNewsletter` toggle, `newsletterTitle`, and `newsletterDescription`. We only ADD two inputs (placeholder, button text) to that existing section. We do not create a new section.

**(d) `showMountain` control location.** Place it inside the existing **Design** section (`design`), as a checkbox below the color pickers, labeled for the mountain artwork. Rationale: Design is already the "visual/appearance" section, is expanded by default (`expandedSections` initial set contains `'design'`), and adding a whole new collapsible section for a single boolean is heavier than the setting warrants. No new section id.

**SettingsModel.get() default merge — confirmed with a caveat.** `get()` merges `defaultSettings` with the stored document, but only at the **top level**: it iterates `Object.entries(result)` and overwrites each top-level key. `footerSettings` is one top-level key, so a stored `footerSettings` object that predates these new nested fields will keep its old shape and will NOT inherit the new nested defaults from the model. Two existing mechanisms already handle this and we rely on both:
1. The admin page hydrates with `{ ...defaultFooterSettings, ...footerSettings, socialLinks: merged }`, so the new fields appear in the form (from `defaultFooterSettings`) even for old stored docs, and are persisted on the next Save.
2. The Footer component must read every new field defensively (fallback literal identical to the seeded default) so the live site is correct even before any re-save. This is the controlling constraint on the component code below.

## Schema changes — `models/Settings.ts`

Add a reusable interface for bottom-bar links (identical shape to `FooterLink`, but named separately for clarity — or reuse `FooterLink` directly; reusing `FooterLink` is acceptable and preferred to avoid a near-duplicate type). Decision: **reuse `FooterLink`** for bottom-bar links to keep the ordering/edit code shared and avoid type drift.

Add to `interface FooterSettings` (place near the related existing fields):

```ts
// Bottom bar
bottomBarLinks?: FooterLink[];   // utility links (Site Map / Privacy / Terms); order = array index
designedWithText?: string;       // text shown around the red heart in the bottom bar

// Newsletter (extend existing block)
newsletterPlaceholder?: string;  // email input placeholder
newsletterButtonText?: string;   // subscribe button label

// Decoration (extend existing Design block)
showMountain?: boolean;          // toggle the decorative mountain image (default true)
```

All four optional (`?`) — reasonable because old stored docs will not have them and the component supplies fallbacks. `bottomBarLinks` uses `FooterLink[]`.

Add to `defaultSettings.footerSettings` (exact values seed the current hardcoded content so the live footer is visually unchanged):

```ts
bottomBarLinks: [
    { name: "Site Map", href: "/sitemap", order: 0 },
    { name: "Privacy Policy", href: "/privacy-policy", order: 1 },
    { name: "Terms of Use", href: "/terms-of-service", order: 2 },
],
designedWithText: "Designed with ❤ for a better Nepal", // see note below on heart handling
newsletterPlaceholder: "तपाईंको इमेल ठेगाना",
newsletterButtonText: "सदस्यता लिनुहोस्",
showMountain: true,
```

**Heart handling decision for `designedWithText`.** The current markup renders literal `Designed with` + `<Heart>` icon + `for a better Nepal` — the heart is a lucide icon, not the "❤" glyph, colored with `accentColor`. To keep the red lucide heart (brief requires "keep the red heart icon (lucide Heart, settings.accentColor)") AND make the surrounding text configurable, the field uses a **split token**: store the phrase with a `{heart}` placeholder, default `"Designed with {heart} for a better Nepal"`. The component splits on `{heart}` and renders the lucide `<Heart>` between the two text parts. If the admin omits `{heart}`, the text renders as-is with the heart appended at the end as a graceful fallback. This satisfies "configurable text around it" while preserving the lucide heart. (Chosen over storing a raw ❤ glyph, which would lose the accent-colored lucide icon and its `fill-current` styling.)

## Component changes — `components/Footer.tsx`

Only the modern/default return and the inline form change. The `minimal` branch is untouched. `FooterProps` is unchanged.

**1. Bottom-bar utility links.** Replace the hardcoded three-`Link` block inside `<nav aria-label="कानुनी लिंकहरू">` with a render from settings:

- Compute `const bottomLinks = (settings.bottomBarLinks && settings.bottomBarLinks.length > 0 ? settings.bottomBarLinks : defaultBottomBarLinks).slice().sort((a, b) => a.order - b.order);` where `defaultBottomBarLinks` is a module-local fallback const identical to the seeded default (mirrors the existing `defaultColumns` fallback pattern already in this file).
- Map to `<Link>` items; render a `'|'`-style divider (`<span className="h-3 w-px" aria-hidden>`) **between** items only (not after the last). On mobile the nav uses `flex flex-wrap items-center gap-x-3 gap-y-1` so links wrap and dividers never dangle on their own line awkwardly; dividers are `aria-hidden`.
- Keep `<nav aria-label="कानुनी लिंकहरू">` landmark. Internal paths use `next/link` `<Link>` (unchanged convention).

**2. "Designed with ❤" text.** Replace the hardcoded `<p>` with a render driven by `settings.designedWithText` (fallback `"Designed with {heart} for a better Nepal"`). Split the string on the literal `{heart}`:
- `const [before, after] = text.split('{heart}')` — if `{heart}` present, render `before`, the `<Heart className="w-4 h-4 fill-current" style={{ color: settings.accentColor }} aria-hidden />`, then `after`.
- If `{heart}` absent (`after === undefined`), render the whole string followed by the heart.
- Preserve `flex items-center gap-1.5` layout. Heart stays accent-colored and `aria-hidden`.

**3. Newsletter card.** The newsletter card currently hardcodes the heading `ताजा अपडेट पाउनुहोस्` separately from `newsletterTitle`. Change the `<h3>` to render `settings.newsletterTitle` (already a field, seeded default `"न्यूजलेटर सदस्यता लिनुहोस्"`). NOTE: the seeded `newsletterTitle` default differs from the current literal `ताजा अपडेट पाउनुहोस्`. To keep the live card heading visually identical, this design uses `settings.newsletterTitle` for the heading — on a fresh/default DB that yields the existing `newsletterTitle` default string, which is the admin-intended value. The reference-screenshot phrase `ताजा अपडेट पाउनुहोस्` is thus produced by the admin editing `newsletterTitle`, not by a literal. (Acceptable per brief: the newsletter title is already admin-managed; we stop ignoring it.) The description already reads `settings.newsletterDescription`.

Thread two new props into `InlineNewsletterForm`:
- Change signature to `({ accentColor, textColor, placeholder, buttonText })`.
- Caller passes `placeholder={settings.newsletterPlaceholder ?? "तपाईंको इमेल ठेगाना"}` and `buttonText={settings.newsletterButtonText ?? "सदस्यता लिनुहोस्"}`.
- Inside the form, use `placeholder` on the `<input placeholder=...>` and on its `sr-only` `<label>` (keep `aria-label`/label text in sync with the placeholder so the field stays labeled). Use `buttonText` as the button's visible label (after the icon). Keep the existing validation, loading, success, and error UX, `suppressHydrationWarning`, and `aria-*` attributes exactly as they are.
- Keep the hardcoded Nepali validation/success/error toast strings as-is (out of scope — the brief lists only placeholder and button text for the inline form; `success message` is called out as "if appropriate" and these transient strings are not in the four required additions).

**4. Mountain decoration toggle.** Gate the decorative `<img>` behind `showMountain`:
- `{(settings.showMountain ?? true) && ( <img ... /> )}` — default-true fallback so old docs still show it.
- Keep the existing `<img src="/Red%20and%20White%20Low-Poly%20Mountain%20Range.png" alt="" aria-hidden className="hidden lg:block absolute ... pointer-events-none ...">` exactly (keep `<img>`, lint warning acceptable, no `next/image`, no upload field). It remains `hidden lg:block` so it is already absent on small screens.

Add module-local fallback const near `defaultColumns`:
```ts
const defaultBottomBarLinks: FooterLink[] = [
    { name: "Site Map", href: "/sitemap", order: 0 },
    { name: "Privacy Policy", href: "/privacy-policy", order: 1 },
    { name: "Terms of Use", href: "/terms-of-service", order: 2 },
];
```

No `any`. `FooterLink` is already imported? — currently the import is `{ FooterSettings, SocialLink, FooterColumn }`; add `FooterLink` to that import. Reuse already-imported lucide icons (`Heart`, `Mail`, `Send`, etc.); add none.

## Admin UI changes — `app/admin/settings/footer/page.tsx`

### `defaultFooterSettings` stub (top of file)
Add the four fields so the form always has controlled values and old stored docs get them via `{ ...defaultFooterSettings, ...footerSettings }`:
```ts
bottomBarLinks: [
    { name: "Site Map", href: "/sitemap", order: 0 },
    { name: "Privacy Policy", href: "/privacy-policy", order: 1 },
    { name: "Terms of Use", href: "/terms-of-service", order: 2 },
],
designedWithText: "Designed with {heart} for a better Nepal",
newsletterPlaceholder: "तपाईंको इमेल ठेगाना",
newsletterButtonText: "सदस्यता लिनुहोस्",
showMountain: true,
```
(The `fetchSettings` spread already preserves these when merging stored settings; `handleSave` PUTs the whole `settings` object, so the fields persist with no API change.)

### Helper handlers for bottom-bar links (mirror the existing link helpers)
Add `addBottomBarLink`, `updateBottomBarLink`, `removeBottomBarLink`, operating on `settings.bottomBarLinks`, re-indexing `order` by array position on add/remove — copy the shape of `addLink`/`updateLink`/`removeLink` but on a flat array (no column index). Guard against `undefined` (`const list = prev.bottomBarLinks ?? []`).

### Design section — add the mountain toggle
Inside the existing `design` section body, after the color grid (and before/after the Preview block), add a checkbox:
- `settings.showMountain ?? true` checked state, `onChange` sets `showMountain`.
- Label (Nepali + English): e.g. "फुटर पहाड ग्राफिक देखाउनुहोस् / Show footer mountain artwork".
- Same checkbox styling as the other toggles (`w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary`).

### Newsletter section — add placeholder + button text
Inside the existing `newsletter` section body, extend the 2-col grid with two more inputs:
- "इनपुट प्लेसहोल्डर" → `newsletterPlaceholder`.
- "बटन टेक्स्ट" → `newsletterButtonText`.
Both controlled text inputs using `settings.x ?? ''`, same input styling as the title/description inputs already there.

### New Bottom Bar section
Add one new collapsible section (same `SectionHeader` + `expandedSections.has('bottombar')` pattern) titled "तल्लो बार / Bottom Bar". Choose an already-imported icon (e.g. `Layout` is used elsewhere; reuse `ExternalLink` or `Layout` — pick `Layout`-style; any already-imported lucide icon is fine, add none). Body:
- **Designed-with text** input bound to `designedWithText`, with a help line noting that `{heart}` marks where the red heart appears (e.g. "`{heart}` ले रातो मुटु देखिने ठाउँ जनाउँछ").
- **Utility links** editor: map `settings.bottomBarLinks ?? []` to rows with a name input, an href input, and a `Trash2` remove button — identical markup to the per-column link rows (name input, href input, delete). An "+ लिंक थप्नुहोस्" button calling `addBottomBarLink`. Order is array position (consistent with columns/links); no numeric field, no drag.

Place this section logically near Copyright (both are "bottom bar" concerns) — insert it adjacent to the existing Copyright section in the `<main>`.

Add any missing imports from `lucide-react` only if the chosen section icon isn't already imported; prefer an icon already in the import list to add nothing.

## Accessibility

- `<footer>` landmark unchanged. Bottom-bar `<nav aria-label="कानुनी लिंकहरू">` preserved; dividers `aria-hidden`.
- Newsletter `<input>` keeps `id`/`sr-only` `<label>` association; label text tracks the configurable placeholder so the accessible name stays meaningful. `aria-required`, `aria-invalid`, status `role`/`aria-live` unchanged.
- Social links keep `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`.
- Decorative mountain stays `alt=""` + `aria-hidden` + `pointer-events-none`.
- Heart icon `aria-hidden`; the surrounding text carries the meaning.
- Visible focus states: links/inputs/buttons retain existing focus-visible/ring styling; no change that removes focus rings.

## Responsive

- Grid stays `grid-cols-1 sm:grid-cols-2 lg:grid-cols-6`. Unchanged.
- Bottom bar stays `flex-col md:flex-row`; utility-link `<nav>` becomes `flex-wrap gap-x-3 gap-y-1` so links wrap on mobile without horizontal overflow; `'|'` dividers only render between items.
- Mountain `<img>` stays `hidden lg:block` (absent on mobile/tablet) and `pointer-events-none` with capped `max-h`/`max-w` so no overflow; `showMountain=false` removes it on all breakpoints.
- Inline newsletter row keeps `flex gap-2` with `flex-1 min-w-0` input and `shrink-0` button so it stays usable at narrow widths. Button label length is now admin-controlled — the `shrink-0`/`min-w-0` combo already prevents overflow; no extra change needed.

## Testability

- **Unit-testable (pure):** the `designedWithText` `{heart}` split logic (before/after/no-token fallback), the `bottomBarLinks` sort-by-order + fallback-to-default selection, and the `showMountain ?? true` gate. These are pure derivations from props and can be covered without a DOM. No test framework is currently wired into this repo for component tests; if one is added it would be the standard choice (Jest/RTL or Vitest) — not introduced in this task unless the implementer finds an existing setup.
- **Integration-testable:** admin Save → `PUT /api/settings` → `GET /api/settings` round-trip preserves the four new fields (cache invalidation already handled by `invalidateCache.settings()` on PUT); the inline form POST to `/api/newsletter` returns `{ success: true }` and shows the success state. These are best verified manually against the running dev server (see plan).
- A design note on testability: because `SettingsModel.get()` only deep-merges at the top level, the component's defensive fallbacks are what make the "old stored doc" path correct — those fallbacks are exactly the pure, unit-testable branches above, so the hardest-to-migrate case is also the most directly testable.

## Verification plan

1. `npx tsc --noEmit` (or the project's typecheck script) — zero errors; confirm no `any` introduced and `FooterLink` import added to Footer.tsx.
2. `npm run lint` — only the pre-existing `<img>` warning on the mountain is acceptable; no new errors.
3. `npm run build` — succeeds.
4. Manual, dev server at :3000:
   - Fresh/default DB: footer renders byte-for-byte as before (bottom links Site Map | Privacy Policy | Terms of Use, "Designed with ❤ for a better Nepal", newsletter placeholder/button, mountain visible on lg).
   - Admin → Settings → Footer: edit a bottom-bar link label/href, add/remove one, edit `designedWithText` (verify `{heart}` renders the red heart), edit newsletter placeholder + button text, toggle `showMountain` off. Save → reload public footer → changes reflected (confirm no 30-min cache staleness because PUT invalidates).
   - Toggle `showMountain` off → mountain gone on desktop; on → back.
   - Mobile viewport: bottom links wrap, no horizontal scrollbar, vertical dividers gone/wrapped, newsletter input+button usable, mountain absent.
   - Newsletter submit with invalid then valid email → error then success state, no page reload, button disabled while submitting.
   - Confirm `minimal` layout branch still renders its own layout untouched (switch layout in admin, verify, switch back to modern).
5. Clean up: no temp files created.
