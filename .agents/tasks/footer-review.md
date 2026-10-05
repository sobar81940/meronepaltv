# Footer admin-management extension — settings-driven bottom bar, newsletter labels, and mountain toggle

This pass removes the last four hardcoded pieces from the already-shipped modern footer and routes them through `FooterSettings`: the bottom-bar utility links, the "Designed with ❤" line, the newsletter input placeholder and button label, and the decorative mountain image. The work is confined to the three expected files (`models/Settings.ts`, `components/Footer.tsx`, `app/admin/settings/footer/page.tsx`) with no new files, no new dependencies, and no API changes. Every new field is optional and seeded with the exact string/link that was previously hardcoded, in both default locations, so a site with pre-existing stored settings renders identically after deploy.

Watch for: nothing blocking. The newsletter card `<h3>` now reads `settings.newsletterTitle` (default `न्यूजलेटर सदस्यता लिनुहोस्`), which differs from the old literal `ताजा अपडेट पाउनुहोस्` — a deliberate, design-documented choice since the title was already admin-managed (confirmed). The repo has no git history and no source baseline, so this review compares the current file state against the spec rather than a mechanical diff (confirmed).

**Verdict**: APPROVED

## High-level view

The schema side is complete and symmetric: `models/Settings.ts` adds `newsletterPlaceholder`, `newsletterButtonText`, `bottomBarLinks` (reusing `FooterLink[]`), `designedWithText`, and `showMountain` to the `FooterSettings` interface, all optional, and seeds `defaultSettings.footerSettings` with the current live values. The admin page's `defaultFooterSettings` stub carries the identical five values, so old stored docs pick the fields up through the existing `{ ...defaultFooterSettings, ...footerSettings }` hydration spread and persist them on next Save. Because `SettingsModel.get()` only deep-merges at the top level, the component also supplies the same literals as fallbacks, so the old-stored-doc path renders correctly before any re-save.

The component reads each new field with a default-identical fallback. Bottom-bar links sort by `order` and render with `|` dividers between items only, inside the preserved `<nav aria-label="कानुनी लिंकहरू">`, in a `flex-wrap` row that wraps on mobile without overflow. The "Designed with" line splits `designedWithText` on a `{heart}` token and renders the accent-colored lucide `<Heart>` in place, with a graceful append fallback when the token is absent. The mountain `<img>` is gated behind `settings.showMountain ?? true` and keeps its `hidden lg:block`, `pointer-events-none`, `alt=""`, `aria-hidden` attributes. `FooterProps` and the `minimal` branch are untouched; `FooterWrapper.tsx` is unchanged.

The admin UI reuses the existing patterns: the mountain checkbox sits in the Design section, two text inputs for placeholder/button text extend the existing Newsletter section, and a new "तल्लो बार / Bottom Bar" collapsible section holds the `designedWithText` input (with `{heart}` help text) plus a utility-link editor whose add/update/remove handlers mirror the existing column-link helpers and re-index `order` by array position — no drag-drop dependency, no numeric order field.

Verification evidence is recorded in `footer-verification.md`: `tsc --noEmit` clean with no `any`, eslint reporting only pre-existing warning classes, and a live GET/PUT/GET round-trip against `localhost:3000` that confirmed the four fields persist and the mountain toggle takes effect, with originals restored afterward.

<details>
<summary>Issues (1)</summary>

1. **Newsletter heading default drift** (non-blocking, informational) — the newsletter `<h3>` now renders `settings.newsletterTitle` (default `न्यूजलेटर सदस्यता लिनुहोस्`) rather than the old literal `ताजा अपडेट पाउनुहोस्`. This is design-documented as intentional (the title was already admin-managed). No action required unless the reference phrase must be the shipped default, in which case update the `newsletterTitle` default string.

</details>

<details>
<summary>Details</summary>

### Schema and defaults are symmetric across both locations

`models/Settings.ts` adds the five fields to `interface FooterSettings` — `newsletterPlaceholder?`, `newsletterButtonText?`, `bottomBarLinks?: FooterLink[]`, `designedWithText?`, `showMountain?` — all optional (confirmed, lines 117–125). `bottomBarLinks` reuses the existing `FooterLink` interface rather than introducing a near-duplicate type, which keeps the admin ordering/edit code shared. `defaultSettings.footerSettings` seeds the exact current values (confirmed, lines 404–412): the three bottom-bar links in order, `"Designed with {heart} for a better Nepal"`, the two Nepali newsletter labels, and `showMountain: true`.

The admin page's `defaultFooterSettings` stub carries the identical five values (confirmed, lines 59–67). This matters because `SettingsModel.get()` deep-merges only at the top level, so a stored `footerSettings` object predating these nested keys will not inherit the model defaults. Two existing mechanisms cover that gap and both are honored: the admin hydration spread `{ ...defaultFooterSettings, ...footerSettings, socialLinks: merged }` surfaces the new fields in the form (confirmed, line 100) and persists them on Save, and the component reads every new field with a fallback literal identical to the seeded default. No destructive migration, no field removal, stored settings untouched.

### Component reads settings with default-identical fallbacks

Bottom-bar links select `settings.bottomBarLinks` when non-empty, otherwise a module-local `defaultBottomBarLinks` const that mirrors the seeded default, then `.slice().sort((a, b) => a.order - b.order)` — the same shape as the existing `defaultColumns` fallback. They render inside the preserved `<nav aria-label="कानुनी लिंकहरू">` as a `flex flex-wrap items-center justify-center gap-x-3 gap-y-1` row, with the `|`-style divider (`<span className="h-3 w-px" aria-hidden>`) emitted only when `index > 0`, so no dangling divider before the first item or after the last. Wrapping handles mobile without horizontal overflow and the dividers are `aria-hidden` (confirmed).

The "Designed with" line splits `designedWithText` on the literal `{heart}`:

```tsx
const designedWithText = settings.designedWithText ?? "Designed with {heart} for a better Nepal";
const [designedBefore, designedAfter] = designedWithText.split('{heart}');
```

When the token is present, it renders `before` + lucide `<Heart className="w-4 h-4 fill-current" style={{ color: settings.accentColor }} aria-hidden>` + `after`; when absent (`designedAfter === undefined`), it renders the whole string followed by the heart. The heart stays accent-colored and `aria-hidden`, with the text carrying the meaning. The surrounding spaces in the stored string are preserved as text nodes, so spacing around the heart is correct.

`InlineNewsletterForm` takes `placeholder` and `buttonText` props; the caller passes `settings.newsletterPlaceholder ?? "तपाईंको इमेल ठेगाना"` and `settings.newsletterButtonText ?? "सदस्यता लिनुहोस्"`. The placeholder drives the `<input placeholder>`, the `sr-only` `<label>`, and the `aria-label`, so the accessible name tracks the configurable value. Validation, loading, success/error states, `suppressHydrationWarning`, and `aria-required`/`aria-invalid`/`role`/`aria-live` are unchanged. The transient Nepali toast strings remain literal — out of scope per the spec, which lists only placeholder and button text for the inline form.

The mountain `<img>` is gated behind `(settings.showMountain ?? true)`, keeping the raw `<img>` (the accepted LCP lint warning), `hidden lg:block absolute bottom-0 right-0`, capped `max-h`/`max-w`, `pointer-events-none select-none`, `alt=""`, and `aria-hidden` (confirmed). Default-true fallback means old docs still show it; `showMountain=false` removes it on all breakpoints.

`FooterProps` is exactly `{ settings, siteName, logoUrl, logoText }` (confirmed, line 197), the `minimal` branch is untouched, and `FooterWrapper.tsx` still passes the same four props from `SettingsModel.get()` (confirmed). `FooterLink` was added to the `@/models/Settings` import; no new lucide icons were added.

### Admin UI reuses existing patterns with no new dependency

The mountain toggle is a checkbox in the existing Design section bound to `settings.showMountain ?? true` with the standard checkbox styling (confirmed, lines 425–428). The Newsletter section gains two controlled text inputs — "इनपुट प्लेसहोल्डर" → `newsletterPlaceholder`, "बटन टेक्स्ट" → `newsletterButtonText`, both `?? ''` controlled — slotted into the existing 2-col grid alongside the title/description inputs (confirmed, lines 722–741). No new Newsletter section was created.

The new "तल्लो बार / Bottom Bar" collapsible section (id `bottombar`, reusing the imported `Layout` icon) holds the `designedWithText` input with a help line noting that `{heart}` marks the red heart, plus a utility-link editor: each row has name and href text inputs and a `Trash2` remove button, with a `Plus` "लिंक थप्नुहोस्" button. The handlers `addBottomBarLink`/`updateBottomBarLink`/`removeBottomBarLink` operate on `settings.bottomBarLinks ?? []`, append with `order: list.length`, and re-index `order` by array position on remove (`.map((link, i) => ({ ...link, order: i }))`) — the exact shape of the existing column-link helpers. No drag-drop dependency and no numeric order input were introduced (confirmed, lines 213–241, 789–845).

### Newsletter heading now reads settings.newsletterTitle

The newsletter card `<h3>` renders `settings.newsletterTitle` instead of the old hardcoded `ताजा अपडेट पाउनुहोस्`. The seeded default for `newsletterTitle` is `न्यूजलेटर सदस्यता लिनुहोस्`, so on a fresh DB the heading changes from the old literal to the admin-intended default string. The design doc resolves this explicitly as acceptable because the title was already an admin-managed field being ignored by the component; the reference phrase is now produced by editing the setting rather than by a literal (confirmed in the design doc, section "Newsletter card"). Flagged as informational, not blocking.

### Verification evidence

`footer-verification.md` records: `tsc --noEmit` with 0 errors and no `any` introduced; eslint on the three files reporting 14 problems that are all pre-existing classes (`react-hooks` component-in-render on each `<SectionHeader>`, the new Bottom Bar section reusing that same existing pattern; unused-var warnings; the accepted mountain `<img>` LCP warning) with no new rule classes; and live checks against `localhost:3000` covering a default-DB SSR render of `/about`, a GET/PUT/GET round-trip that changed `designedWithText`, `bottomBarLinks[0].name`, and `showMountain` and confirmed all three reflected in the public footer, followed by a restore to the original state. Year hydration is handled by the unchanged `isMounted` guard rendering `© 2025` server-side. The evidence is specific and matches the code; no spot-check was warranted.

</details>

<details>
<summary>File map</summary>

- `models/Settings.ts` — added five optional fields to `FooterSettings` and seeded `defaultSettings.footerSettings`.
- `components/Footer.tsx` — modern/default branch and inline form read the new fields with default-identical fallbacks; added `defaultBottomBarLinks` const and `FooterLink` import; mountain gated behind `showMountain`.
- `app/admin/settings/footer/page.tsx` — `defaultFooterSettings` stub, bottom-bar link handlers, Design mountain checkbox, Newsletter placeholder/button inputs, new Bottom Bar section.

No git history is available in this workspace, so there is no diff to link; this review is against the current file state and `footer-verification.md`.

</details>
