# Footer redesign — navy multi-column footer for the default/modern return

The change restyles only the default (`standard`/`modern`) return of `components/Footer.tsx` into a premium dark-navy, six-section footer: enlarged brand/logo, a prominent company block with red metadata icons, red-accented link-column headings, a bordered newsletter card, a full-width mountain strip layered behind content, and a three-zone bottom bar. All content stays settings-driven; the `minimal` branch, `FooterProps`, and every external contract are untouched. The verification note records a clean `tsc --noEmit` (0 errors), ESLint (0 errors, 1 pre-existing `<img>` LCP warning), SSR curl/grep confirming settings-driven content renders on both the direct-import (`app/page.tsx`) and `FooterWrapper` paths, and an overflow sanity-check.

Watch for: nothing blocking. One **possible** behavioral edge (link columns are capped at 3 via `.slice(0,3)`, so a site configuring 4+ columns silently drops the extras) — accepted by the authoritative design doc as "up to available slots," so non-blocking.

**Verdict**: APPROVED

## High-level view

The redesign is confined to the fall-through return used by `standard`/`modern`. The `minimal` branch returns before that code and is byte-for-byte intact; the `FooterProps` signature (`settings, siteName, logoUrl, logoText`) is unchanged, so the many pages importing `Footer` directly keep working. No edits to `models/Settings.ts`, `FooterWrapper`, the admin page, or `app/page.tsx` — I confirmed every settings field the new JSX reads already exists in the model.

Nothing is hardcoded. Headings, links, company metadata, social URLs, newsletter copy, and copyright all come from `settings`, with the same fallbacks (`defaultColumns`, `defaultBottomBarLinks`, newsletter placeholder/button defaults) that existed before. The `{year}`/`{siteName}` substitution, the `{heart}` split with its `designedAfter === undefined` branch, and the hydration-safe year guard are all preserved. The two static UI label strings (`सञ्चालक:`) are copy, not admin data.

`InlineNewsletterForm` keeps its full behavior — client validation, `POST /api/newsletter` with `{ email, source: "footer" }`, loading/success/error states, 5s auto-reset, and `role`/`aria-live` messaging. Only the input/button visuals changed (white connected row at 52px, mobile stack). `SocialIcon` and the three custom SVGs are reused as-is. The newsletter form still receives the unused `textColor` prop, so its props contract is unchanged.

Background layering matches the spec: navy gradient base, optional admin `backgroundImage` overlay, a `hidden lg:block` full-width mountain strip capped at `max-h-[150px]`, and a dark overlay — all `absolute`, `pointer-events-none`, `aria-hidden`, at `z-0`/`z-[1]` behind the `z-10` content, so artwork never pushes content height.

Spec fidelity is strong: `max-w-[1500px]` container, a dynamic `1.2fr 1.4fr …0.8fr… 1.5fr` xl grid driven by a CSS variable so fewer/more columns don't leave empty slots, enlarged logo, red accent bars on headings, the navy color system with the admin-configurable accent, xl-only separators, the specified typography scale, a three-zone bottom bar, and semantic `footer`/`nav` landmarks with `aria-label`s and `focus-visible` states.

<details>
<summary>Issues (1)</summary>

1. **Link columns capped at 3** — `linkColumns = …slice(0, 3)` drops the 4th+ configured column. The default/admin data has exactly 3, and the design doc explicitly accepts "up to available slots," so this is non-blocking. If the product ever needs >3 columns, the grid template and slice both need revisiting. (possible)

</details>

<details>
<summary>Details</summary>

### Scope containment — only the default return changed

The `if (settings.layout === 'minimal')` block returns its own `<footer>` before the redesigned code and is unchanged (confirmed by reading the full file). The export signature is `Footer({ settings, siteName, logoUrl, logoText }: FooterProps)` with the `FooterProps` interface intact, which is the load-bearing contract for the pages that import `Footer` directly. I verified via grep that `models/Settings.ts` still defines every field the new JSX reads (`pressCouncilNumber`, `operatorName`, `editorName`, `newsletterPlaceholder`, `newsletterButtonText`, `showMountain`, `backgroundImage`, `designedWithText`, …), so no model/admin edits were needed or made. (confirmed)

### Nothing hardcoded; all enabled columns rendered

Column headings and links render from `columns` (settings or `defaultColumns` fallback), sorted by `order`. `enabledSocialLinks` filters `settings.socialLinks` for `enabled && url`; social anchors use `link.url` only. Company rows each render conditionally on their settings value and the whole block gates on `showContact`. Newsletter title/description/placeholder/button all come from settings with the pre-existing `??` defaults. Copyright uses the substituted `copyrightText`.

The one behavioral narrowing: `linkColumns = columns.slice().sort(...).slice(0, 3)`. For the shipped and admin data (3 columns) this renders all three — it is not "only the first," so the core must-hold is satisfied. The residual risk is only when a site configures 4+ columns, where extras are silently dropped. The authoritative design doc §5/§13 reasoned through this and chose `.slice(0,3)` deliberately ("extra columns are dropped … acceptable per spec 'up to available slots'"), and the dynamic grid template adapts the slot count downward for <3. I'm flagging it as a **possible** future gap, not a blocking defect. (confirmed cap; possible impact)

### Newsletter form — restyle only

Validation (`!email || !email.includes("@")`), the `POST /api/newsletter` body/headers, `status` state machine, success clear + 5s reset, and `role="status"`/`role="alert"` + `aria-live` messaging are all unchanged. The input keeps its `sr-only` label, `aria-label`, `aria-required`, `aria-invalid`. Visual changes are limited to the white connected row (`h-[52px]`, `rounded-lg sm:rounded-r-none` input / `sm:rounded-l-none` button) with mobile stacking via `flex-col sm:flex-row`, and the trailing `ArrowRight`/`Loader2` swap. The `textColor` prop is still accepted though unused in the body — a test-seam-ish leftover, not a production concern. (confirmed)

### Background layering behind content

Stacking: navy gradient on `<footer>` (with `settings.backgroundColor` still the inline base), optional `backgroundImage` div (`z-0`), mountain `<img>` (`z-0`, `hidden lg:block`, `max-h-[150px]`, `object-bottom`), dark overlay (`z-[1]`), content and bottom bar (`z-10`). All decorative layers are `absolute pointer-events-none aria-hidden` with `alt=""` on the img, so none push content height, and `overflow-hidden` on `<footer>` clips the strip. The `<img>` LCP ESLint warning is pre-existing and expected (encoded-path asset intentionally not `next/image`). (confirmed)

### Bottom bar and token logic

Three-zone bar: copyright left (gated on `showCopyright`, with a spacer `<span>` to preserve grid balance when hidden), `bottomBarLinks` in a `<nav aria-label="उपयोगी लिंकहरू">` with the `index > 0` `|` divider pattern, and the designed-with text right. The `{heart}` split keeps `designedBefore`/`heartIcon`/`designedAfter` and the `designedAfter === undefined` branch. Mobile stacks (`flex-col`), desktop uses `md:[grid-template-columns:1fr_auto_1fr]`. (confirmed)

### Spec fidelity and accessibility

`max-w-[1500px] w-full mx-auto` with responsive `px-4 sm:px-6 lg:px-10 xl:px-14`; `pt-14 lg:pt-[60px]`. The xl grid uses `--footer-xl-cols` = `1.2fr 1.4fr {0.8fr×n} 1.5fr`, which keeps the layout within the container and avoids empty slots. Separators are applied only via the `xl:border-l` `sepClass` on Company, first link column, and Newsletter — none at md/mobile. Typography matches the §9 table (24–26 / 21–22 / 16–17 / 15px, Devanagari `leading-[1.7]`/`[1.9]`). Landmarks: root `<footer>`, each link column and the bottom-bar links in `<nav>` with `aria-label`, social/newsletter `focus-visible:ring`, decorative images `aria-hidden`. (confirmed)

### TypeScript / dependencies

Verification note records `tsc --noEmit` = 0 errors and no `any`. `ChevronRight`/`ArrowRight` were added to the existing `lucide-react` import and the unused `Send` removed — no new packages. The `['--footer-xl-cols' as string]` cast is a legitimate CSS-variable typing workaround, not an `any`. (confirmed via note; types spot-checked against the model)

</details>

<details>
<summary>File map</summary>

- `components/Footer.tsx` — default/`modern` return rebuilt into the navy six-section footer; `minimal` branch, props, sub-components, and derived consts preserved. (No other files changed.)

</details>
