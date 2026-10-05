# Footer Redesign — Design & Mapping Document

Status: design only (no code in this step). Target file: `components/Footer.tsx`.
Scope: redesign ONLY the default/live return at the bottom of `Footer.tsx` (the fall-through
used by both `layout === 'standard'` and `layout === 'modern'`). The `minimal` branch and all
external contracts stay byte-for-byte identical.

---

## 0. Context: how the component is wired

- `components/FooterWrapper.tsx` (server) calls `SettingsModel.get()` and renders
  `<Footer settings={settings.footerSettings} siteName logoUrl logoText />`.
- `Footer` is a `"use client"` component. It is also imported **directly** (not only via
  `FooterWrapper`) by many route pages (`app/page.tsx`, `app/event/page.tsx`,
  `app/search/page.tsx`, `app/tag/[tag]/page.tsx`, `app/gadgets/page.tsx`,
  `app/jyotish/page.tsx`, `app/share-market/page.tsx`, `app/event/[slug]/page.tsx`, …) all
  passing the same four props. **Therefore the `FooterProps` signature is load-bearing across
  the whole app and MUST NOT change.**
- `app/page.tsx` passes a hand-built fallback `FooterSettings` object when `settings` is
  missing — another reason the prop shape is frozen.
- `app/layout.tsx` reads `footerSettings.contactEmail` and `footerSettings.socialLinks` for
  JSON-LD. These are data reads only; they are unaffected by presentation changes but confirm
  the settings field names must not be renamed.
- Decorative asset confirmed to exist: `public/Red and White Low-Poly Mountain Range.png`
  (served at `/Red%20and%20White%20Low-Poly%20Mountain%20Range.png`).

---

## 1. Inventory — existing settings-driven data & reusable pieces that MUST be preserved

Everything below already exists in `Footer.tsx` and must survive the redesign. The redesign
re-skins and re-arranges these; it does not remove, rename, or hardcode any of them.

### 1.1 Props & derived values (keep exactly)
- `FooterProps`: `{ settings: FooterSettings; siteName: string; logoUrl?: string; logoText?: string }`.
- `isMounted` + `useEffect` hydration guard, producing `currentYear = isMounted ? new Date().getFullYear().toString() : "2025"`. **Keep this exact guard** — it prevents a hydration mismatch on the year.
- `copyrightText` = `settings.copyrightText.replace('{year}', currentYear).replace('{siteName}', siteName)`. Keep token substitution for `{year}` and `{siteName}`.
- `enabledSocialLinks` = `settings.socialLinks.filter(l => l.enabled && l.url)`.
- `columns` = `settings.columns?.length ? settings.columns : defaultColumns`.
- `linkColumns` = `columns.slice().sort((a,b)=>a.order-b.order)` — currently `.slice(0, 3)`; see §5 for the slot change.
- `bottomBarLinks` = `(settings.bottomBarLinks?.length ? settings.bottomBarLinks : defaultBottomBarLinks).slice().sort((a,b)=>a.order-b.order)`.
- `designedWithText` = `settings.designedWithText ?? "Designed with {heart} for a better Nepal"`, split on `{heart}` into `[designedBefore, designedAfter]`. Keep the split + the `designedAfter === undefined` branch logic.
- `heartIcon` — `<Heart>` filled with `settings.accentColor`.
- Module-level `defaultColumns` and `defaultBottomBarLinks` fallbacks — keep as-is.

### 1.2 Settings fields consumed (do not rename, do not hardcode)
- Columns/links: `settings.columns` (`FooterColumn[]` → `{ title, order, links: FooterLink[] }`).
- Social: `settings.socialLinks` (`SocialLink[]`), `settings.showSocial`, derived `enabledSocialLinks`.
- Company block: `settings.companyName`, `settings.registrationNumber`, `settings.pressCouncilNumber`, `settings.operatorName`, `settings.editorName`, `settings.contactAddress`, `settings.contactPhone`, `settings.contactEmail`, `settings.showContact`. Fallback: company heading uses `settings.companyName || siteName`.
- Newsletter: `settings.showNewsletter`, `settings.newsletterTitle`, `settings.newsletterDescription`, `settings.newsletterPlaceholder` (`?? "तपाईंको इमेल ठेगाना"`), `settings.newsletterButtonText` (`?? "सदस्यता लिनुहोस्"`).
- Bottom bar: `settings.bottomBarLinks`, `settings.designedWithText`, `settings.copyrightText`, `settings.showCopyright`.
- Decoration/background: `settings.backgroundImage`, `settings.showMountain` (default `true`), `settings.backgroundColor`, `settings.textColor`, `settings.accentColor`.

### 1.3 Reusable JSX / sub-components (keep & reuse — restyle only)
- `SocialIcon` component mapping platform → lucide icon or custom SVG. Keep as-is.
- Custom SVGs `TikTokIcon`, `WhatsAppIcon`, `TelegramIcon` (lucide has no equivalents). Keep as-is.
- `InlineNewsletterForm` component — **keep all behavior intact**:
  - local state `email`, `status: 'idle'|'loading'|'success'|'error'`, `message`;
  - client-side validation (`!email || !email.includes('@')` → error);
  - `POST /api/newsletter` with body `{ email, source: "footer" }`, `Content-Type: application/json`;
  - loading (`Loader2` spinner + disabled), success (clears email, auto-reset after 5s), error states;
  - `role="status"`/`role="alert"` + `aria-live` on messages; `aria-label`/`sr-only` label on input.
  - **Only its container/visual styling and the input/button layout change** (see §6). Keep its props contract (`accentColor, textColor, placeholder, buttonText`) — extend only if a new prop is genuinely needed; prefer reusing existing props.
- lucide icons already imported: `Facebook, Twitter, Instagram, Youtube, Linkedin, Phone, Mail, MapPin, Send, FileText, Heart, UserCog, PenLine, Loader2, CheckCircle, AlertCircle`. Reuse these. New icons needed for redesign: `ChevronRight` (optional link affordance) and `ArrowRight` (newsletter button) — add to the existing `lucide-react` import. No new npm packages.
- `isMounted`/year guard, the `settings.backgroundImage` overlay `<div>`, the top accent line, and the gated mountain `<img>` all stay (restyled per §7).

---

## 2. What must NOT change (hard constraints)

1. The entire `if (settings.layout === 'minimal') { ... return <footer>…</footer> }` branch — leave untouched.
2. `FooterProps` interface and the signature `export default function Footer({ settings, siteName, logoUrl, logoText }: FooterProps)`.
3. `components/FooterWrapper.tsx` — no edits.
4. `models/Settings.ts` — no edits; all needed fields already exist.
5. The admin settings page — no edits.
6. `app/page.tsx` and every other page importing `Footer` — no edits.
7. `InlineNewsletterForm` logic (API, validation, states), the `SocialIcon` map, and the three custom social SVGs — logic unchanged.
8. The hydration-safe year guard, `{year}`/`{siteName}` and `{heart}` token handling.
9. No new dependencies. TypeScript strict, no `any`.

---

## 3. Color tokens & shared helpers (define once at top of default return)

Use literal navy tokens for the premium gradient while keeping `settings.*` colors as the
configurable base where the component already uses them. Define these as local consts so JSX
stays readable:

```
const navyTop    = "#003f80";   // footer top
const navyMid    = "#00356f";   // footer middle
const navyBottom = "#002750";   // footer bottom
const barNavy    = "#00234a";   // bottom bar bg
const accent     = settings.accentColor;        // keep configurable (default #e61e2b; spec red #ff1738)
const primaryTxt = "#ffffff";
const secondaryTxt = "rgba(255,255,255,0.78)";   // 0.72–0.82 band, not too dim
const divider    = "rgba(0,145,255,0.28)";       // vertical separators
const overlay    = "linear-gradient(to bottom, rgba(0,40,90,0.15), rgba(0,30,70,0.35))";
```

Rules:
- Base `<footer>` keeps `style={{ backgroundColor: settings.backgroundColor, color: settings.textColor }}` (preserves configurability) but the **default gradient class** becomes the navy ramp `bg-gradient-to-b from-[#003f80] via-[#00356f] to-[#002750]` layered above the solid `backgroundColor`.
- Red icons/accents use `settings.accentColor` (keeps admin control). The spec's `#ff1738` is the intended visual target; since `accentColor` is admin-configurable we keep using it rather than hardcoding, matching the "do not hardcode" rule.
- Secondary text `rgba(255,255,255,0.78)` replaces the dim `settings.textColor`-derived greys for body copy inside the redesigned area, so Devanagari stays legible on navy. (The configurable `textColor` still colors the base `<footer>` and is still passed to `InlineNewsletterForm`.)

---

## 4. Overall layout container (REQ 1 & 2)

Replace the main content wrapper.

- Container: `max-w-[1500px] mx-auto w-full` (was `max-w-7xl mx-auto`). Responsive horizontal padding: `px-4 sm:px-6 lg:px-10 xl:px-14`.
- Vertical rhythm (REQ 2): `pt-14 lg:pt-[60px] pb-12 lg:pb-14` (pt ≈ 56–60px). The main content area should visually land in the ~380–460px band with the mountain near the bottom; the mountain is absolutely positioned and must never add to content height (see §7).
- Grid: single wrapper `grid` with responsive templates:
  - mobile `<768px`: `grid-cols-1` (single column).
  - tablet `768–1199px`: `md:grid-cols-2 xl:grid-cols-none` — 2 columns, newsletter can span full width (`md:col-span-2`).
  - desktop `≥1200px`: use arbitrary CSS grid
    `xl:[grid-template-columns:1.2fr_1.4fr_0.8fr_0.8fr_0.8fr_1.5fr]`.
  - Gap: `gap-x-8 gap-y-10 lg:gap-x-10`.

Note on breakpoint choice: Tailwind's default `xl` is 1280px, close to the spec's "desktop
>1200px". Use `xl:` for the 6-fr grid and `md:` for the 2-col tablet behavior. (If exact
1200px is required, add a `min-[1200px]:` arbitrary variant instead of `xl:`.) **Decision: use
`xl:` for simplicity and because it matches the existing Tailwind config; no custom breakpoint
needed.**

Column order in DOM (also the mobile stacking order, REQ responsive): Brand → Company → link
column(s) → Newsletter. This yields the required mobile order: logo, social, company, link
columns, newsletter, then bottom bar.

### Separators (REQ 9)
Vertical separators appear only at `xl+` and only between Brand/Company, Company/first-link, and last-link/Newsletter. Implement with `border-l` on the specific columns:
- Company column: `xl:border-l xl:border-[rgba(0,145,255,0.28)] xl:pl-10`.
- First link column: `xl:border-l xl:border-[rgba(0,145,255,0.28)] xl:pl-10`.
- Newsletter column: `xl:border-l xl:border-[rgba(0,145,255,0.28)] xl:pl-10`.
No borders at `md`/mobile (the `xl:` prefix guarantees this).

---

## 5. Rendering ALL enabled link columns (REQ 1 & 5)

Current code slices columns to a fixed `.slice(0, 3)`. The fr-grid has exactly 3 link slots
(positions 3,4,5 between Company and Newsletter). Decision:

- Keep `linkColumns = columns.slice().sort((a,b)=>a.order-b.order)` but slice to the number of
  available slots: **`.slice(0, 3)`** stays correct because the 6-fr grid reserves exactly 3
  link columns. The spec says "render what exists up to available slots" and "if exactly 3
  columns they map to Quick Links/Topics/About" — the current default has exactly 3 columns,
  so `.slice(0,3)` renders all of them.
- To avoid empty-slot gaps when fewer than 3 columns exist, derive the grid template from the
  actual link-column count. **Decision (chosen approach):** compute
  `const linkCount = linkColumns.length;` and build the desktop template string dynamically:
  `` `1.2fr 1.4fr ${"0.8fr ".repeat(linkCount)}1.5fr` `` applied via an inline
  `style={{ gridTemplateColumns: ... }}` guarded behind an `xl` check. Simpler alternative
  considered — a fixed `1.2fr_1.4fr_0.8fr_0.8fr_0.8fr_1.5fr` class that leaves blank slots when
  <3 columns. **Chosen: the dynamic style string**, because it prevents the "too empty"
  problem the task explicitly calls out when a site configures only 1–2 columns. Apply the
  static arbitrary class as the default and override with inline `gridTemplateColumns` only
  when `linkCount !== 3`.
  - Mobile/tablet unaffected (they use `grid-cols-1` / `md:grid-cols-2`), so the inline style
    must be applied only at `xl` width. Simplest robust implementation: set
    `style={{ ['--footer-cols' as string]: template }}` is overkill — instead gate with a
    `useState`-free approach: apply the inline `gridTemplateColumns` always but also set
    `grid-cols-1 md:grid-cols-2 xl:grid-cols-[var(...)]`. **Final decision:** keep it simple —
    use the fixed arbitrary class `xl:[grid-template-columns:1.2fr_1.4fr_0.8fr_0.8fr_0.8fr_1.5fr]`
    for the common 3-column case, and only when `linkCount < 3` add `xl:` style override. Since
    the shipped default and admin data both use 3 columns, the fixed class is the primary path.

Each link column (REQ 5):
- Heading `<h3>`: red vertical accent bar + title.
  - Accent bar: `<span aria-hidden className="inline-block w-1 h-[30px] rounded-[4px] mr-2.5" style={{ backgroundColor: accent }} />` (4px wide via `w-1`, 30–34px tall via `h-[30px]`).
  - Heading text: `text-[21px] xl:text-[22px] font-bold text-white leading-tight`.
- Links `<ul>`: `space-y-0 leading-[1.9]`.
  - `<Link>`: `text-[16px] xl:text-[17px] text-[rgba(255,255,255,0.75)] inline-flex items-center gap-1 transition-all duration-200 hover:text-white hover:translate-x-1 focus-visible:text-white`.
  - Optional affordance: leading `<ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />` — optional; keep subtle. Preserve current simple text link if preferred, but add `hover:translate-x-1`.
- Wrap each column's list in a `<nav aria-label={column.title}>` for the landmark requirement.
- Keep existing stable React keys (`modern-column-…`, `modern-link-…`).

---

## 6. Brand, Company, Newsletter columns

### 6.1 Brand (REQ 3)
- Logo: when `logoUrl` set, `next/image` at `width={210} height={70}` with `className="h-auto w-[180px] xl:w-[210px]"` (180–230px desktop, aspect preserved; set intrinsic width/height to a ratio matching the asset — use 210×70 placeholder and `w-auto h-auto` via `className` controlling width). When no `logoUrl`, keep the `logoText` badge but enlarge: `w-16 h-16 rounded-2xl text-2xl` with accent background + shadow (as today, slightly larger).
- Social buttons (gated by `settings.showSocial && enabledSocialLinks.length`):
  - Each `<a>`: `w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-300` with translucent blue bg `bg-[rgba(0,145,255,0.14)] hover:bg-[rgba(0,145,255,0.35)] hover:scale-110 focus-visible:ring-2 focus-visible:ring-[rgba(0,145,255,0.6)]`.
  - 11×11 = 44px (spec 40–44px), `rounded-xl` ≈ 12px.
  - Keep `target="_blank" rel="noopener noreferrer"`, keep `aria-label={`${link.platform} मा भेट्नुहोस्`}`, keep `suppressHydrationWarning`, keep `SocialIcon` (`className="w-5 h-5"`).
  - URLs from `enabledSocialLinks` only — never hardcoded.

### 6.2 Company info (REQ 4)
- Heading `<h3>`: `settings.companyName || siteName`, `text-[24px] xl:text-[26px] font-bold text-white mb-5 leading-snug` (Devanagari-safe line-height).
- Gate whole block on `settings.showContact`.
- Rows as `<ul className="space-y-3.5">`, each `<li className="flex items-start gap-2.5 text-[16px] leading-[1.7] text-[rgba(255,255,255,0.78)]">`:
  - address → `MapPin`; phone → `Phone` (wrapped in `tel:` link, `hover:text-white`); registration → `FileText` + label `सूचना विभाग दर्ता नं:`; press council → `FileText` + label `प्रेस काउन्सिल दर्ता नं:`; operator → `UserCog` + `सञ्चालक:`; editor → `PenLine` + `सम्पादक:`.
  - Icons: `w-4 h-4 mt-1 shrink-0` colored `style={{ color: accent }}`, `aria-hidden`.
  - Each `<li>` renders only when its value exists (keep current conditional rendering).
  - Note: the current code uses the label `संचालक:`; spec text is `सञ्चालक:`. **Decision: use `सञ्चालक:`** to match the spec's spelling (these labels are static UI strings, not admin content, so this is a label-copy fix, not hardcoding admin data). Keep all other labels.

### 6.3 Newsletter card (REQ 6)
- Gate on `settings.showNewsletter`.
- Card container: `w-full max-w-[380px] rounded-[15px] p-6 xl:p-7` with
  `style={{ backgroundColor: "rgba(0,61,124,0.45)", border: "1px solid rgba(0,145,255,0.45)" }}`.
- Top row: red rounded-square mail icon + title.
  - Icon box: `w-10 h-10 rounded-xl flex items-center justify-center text-white` `style={{ backgroundColor: accent }}` containing `<Mail className="w-5 h-5" aria-hidden />`.
  - Title `<h3>`: `settings.newsletterTitle`, `text-[21px] xl:text-[22px] font-bold text-white`.
- Description (when present): `settings.newsletterDescription`, `text-[16px] leading-[1.7] text-[rgba(255,255,255,0.85)] mb-5 line-clamp-2`.
- Form: reuse `InlineNewsletterForm` unchanged in logic; restyle its internals:
  - Desktop connected row: outer `flex items-stretch` with input `flex-1 h-[52px] rounded-l-lg bg-white text-gray-900 px-4 text-[16px]` and button `h-[52px] rounded-r-lg px-5 font-bold text-white` `style={{ backgroundColor: accent }}` with trailing `ArrowRight`/`Send` icon.
  - Mobile: `flex-col` so input and button stack full-width (`rounded-lg` on both, `gap-2`).
  - Keep the `sr-only` label + `aria-label` on the input; keep spinner, success (`CheckCircle`, green), error (`AlertCircle`, red) messaging and `aria-live`.
  - Pass existing props: `accentColor={accent}` (or `settings.accentColor`), `textColor={settings.textColor}`, `placeholder={settings.newsletterPlaceholder ?? "तपाईंको इमेल ठेगाना"}`, `buttonText={settings.newsletterButtonText ?? "सदस्यता लिनुहोस्"}`.
  - Implementation note: the connected-row styling lives inside `InlineNewsletterForm`'s JSX; change the input `className` from the current translucent style to white-bg, and the button from `rounded-lg` standalone to the connected `rounded-r-lg` + 52px height. Logic/handlers untouched.

---

## 7. Background layering (REQ 7)

Stacking order inside `<footer className="relative overflow-hidden">`:
1. Base: `style={{ backgroundColor: settings.backgroundColor }}` + navy gradient class `bg-gradient-to-b from-[#003f80] via-[#00356f] to-[#002750]`.
2. Optional admin `settings.backgroundImage` overlay `<div className="absolute inset-0 bg-cover bg-center pointer-events-none" aria-hidden>` (keep existing).
3. Mountain artwork `<img>` — gated by `settings.showMountain ?? true`:
   - `className="hidden lg:block absolute bottom-0 left-0 w-full pointer-events-none select-none opacity-90 object-cover object-bottom"` plus a height cap so it occupies only the lower ~25–35%: `max-h-[150px]` and placed at `bottom-0 left-0 w-full` (spec says left:0 width:100%). Keep `alt=""` and `aria-hidden`.
   - Decision: the current code pins the mountain `bottom-0 right-0` as a small badge. The spec wants it spanning the full width in the lower third. **Change to full-width bottom strip** per REQ 7 while keeping `hidden lg:block` (mountain reduced/hidden on small screens per responsive spec).
   - It stays `position:absolute` so it never pushes content height.
4. Dark overlay `<div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: overlay }}>` placed ABOVE the mountain but BELOW content, using `z` ordering: mountain `z-0`, overlay `z-[1]`, content wrapper `z-10`.
5. Top accent line (keep) at `z-10`.
6. Content (`z-10`).

---

## 8. Bottom bar (REQ 11)

- Section: `<div className="relative z-10 border-t" style={{ borderColor: "rgba(0,145,255,0.2)", backgroundColor: "#00234a" }}>`.
- Inner container: `max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 min-h-[72px] flex items-center` (≈70–76px).
- Layout:
  - Desktop `md+`: `md:grid md:[grid-template-columns:1fr_auto_1fr] md:items-center w-full gap-3`.
  - Mobile: `flex flex-col items-center text-center gap-2`.
- LEFT cell: copyright, gated by `settings.showCopyright`, `text-[15px] text-[rgba(255,255,255,0.75)] md:text-left text-center`. Uses the already-substituted `copyrightText` (`© {year} {copyright text}`).
- CENTER cell: `<nav aria-label="उपयोगी लिंकहरू">` with `bottomBarLinks` separated by `|` dividers (keep current index>0 divider span pattern), `text-[15px] hover:text-white focus-visible:text-white`.
- RIGHT cell: `designedWithText` with the `{heart}` split — keep `designedBefore`, `heartIcon`, `designedAfter` and the `designedAfter === undefined` branch. `md:justify-self-end`, `text-[15px]`, `flex items-center gap-1.5`.
- Keep stable keys (`bottombar-…`).

---

## 9. Typography summary (REQ 10)

| Element | Size | Weight | Notes |
|---|---|---|---|
| Company heading | 24–26px (`text-[24px] xl:text-[26px]`) | 700 | white |
| Column heading | 21–22px (`text-[21px] xl:text-[22px]`) | 700 | white, red accent bar |
| Newsletter title | 21–22px | 700 | white |
| Links / body / company metadata | 16–17px (`text-[16px] xl:text-[17px]`) | 400 | secondary white |
| Bottom bar | 15px (`text-[15px]`) | 400 | — |
| Devanagari line-height | 1.6–1.8 (`leading-[1.7]` / links `leading-[1.9]`) | — | avoids clipping of matras |

Do not touch the project's font config; the existing Nepali-compatible font applies via the
global layout. No `text-xs`/`text-sm` in the main area (those were the "tiny text" problem).

---

## 10. Responsive matrix

| Width | Columns | Separators | Mountain | Newsletter |
|---|---|---|---|---|
| `<768px` | 1 col, order: logo → social → company → link cols → newsletter → bottom bar | none | hidden (`hidden lg:block`) | full width |
| `768–1199px` (`md`) | 2 cols; newsletter may `md:col-span-2` | none | hidden until `lg` | ≤380px card, may span 2 |
| `≥1200px` (`xl`) | 6-fr grid `1.2 1.4 0.8 0.8 0.8 1.5` | between Brand/Company, Company/Links, Links/Newsletter | full-width bottom strip, lower ~30% | ≤380px card in last slot |

- No horizontal overflow at any width: container `w-full`, `overflow-hidden` on `<footer>`, inputs `min-w-0`, long tokens wrap.
- `overflow-hidden` on `<footer>` is already present — keep it (also clips the mountain strip).

---

## 11. Accessibility (REQ)

- Root stays `<footer>`.
- Each link column wrapped in `<nav aria-label={column.title}>`; bottom-bar utility links in `<nav aria-label="उपयोगी लिंकहरू">`.
- Social `<a>` keep `aria-label`; add `focus-visible:ring-2` visible focus.
- Newsletter input: keep `sr-only` label + `aria-label`; keep `aria-invalid`, `aria-required`.
- Decorative images (`backgroundImage` div, overlay div, mountain img) `aria-hidden` + `alt=""`.
- All interactive elements get visible `focus-visible` states (links `focus-visible:text-white`, buttons/inputs `focus-visible:ring-2`).

---

## 12. Testability notes

- **Unit (React Testing Library / Jest or Vitest if configured):**
  - renders all `enabledSocialLinks` as anchors with correct `href`, `target`, `rel`, `aria-label`;
  - renders every column heading + link from `settings.columns` (verify no `.slice` drops a configured column in the ≤3 case);
  - company rows render only when the corresponding field is set; hidden when `showContact` false;
  - copyright substitutes `{year}`/`{siteName}`; `showCopyright=false` hides it;
  - `designedWithText` splits around `{heart}` and renders the heart; also the `designedAfter === undefined` (no token) path;
  - mountain `<img>` present when `showMountain` true/undefined, absent when false;
  - `minimal` branch still returns its own markup (regression guard).
- **Component/interaction:** `InlineNewsletterForm` — invalid email shows error without fetch; valid email POSTs to `/api/newsletter` (mock `fetch`), shows loading→success, clears input, auto-resets after 5s; failed response shows error. These behaviors are unchanged, so existing tests (if any) must still pass.
- **Integration / visual:** manual check at 375px, 768px, 1024px, 1280px, 1500px on `http://localhost:3000` for no horizontal scroll, separators only at `xl`, mountain only `lg+`, content readable over artwork.
- The component is a pure function of props → easy to unit test; the only side effect is the newsletter `fetch`, which is already isolated in `InlineNewsletterForm` and mockable.

---

## 13. Edge cases to handle

- `logoUrl` empty and `logoText` empty → render neither (keep current null guard); brand column still holds social row.
- Fewer than 3 configured columns → grid should not leave a visibly empty slot (see §5 dynamic template decision); more than 3 → extra columns are dropped by `.slice(0,3)` (acceptable per spec "up to available slots").
- `enabledSocialLinks` empty → social row omitted.
- `settings.backgroundImage` empty → overlay div omitted (keep current guard).
- `showMountain === false` → no mountain img.
- `designedWithText` without `{heart}` → `designedAfter` is `undefined`; render text then heart (keep current branch).
- Very long company metadata values → wrap (`leading-[1.7]`, `break-words` if needed).
- `copyrightText` missing `{year}`/`{siteName}` tokens → `.replace` is a no-op, renders literal string (safe).
- Newsletter input on narrow screens → stacks; `min-w-0 flex-1` prevents overflow.

---

## 14. Implementation checklist (for the next step)

1. Add `ChevronRight`, `ArrowRight` to the existing `lucide-react` import (no new packages).
2. Leave `minimal` branch, `SocialIcon`, custom SVGs, `defaultColumns`, `defaultBottomBarLinks`, props, and all derived consts intact (adjust only the `linkColumns` slot handling per §5).
3. Rebuild the default `return` JSX per §4–§8 using the §3 tokens and §9 typography.
4. Restyle `InlineNewsletterForm`'s input/button (white connected row, 52px, mobile stack) — logic untouched.
5. Fix the two static label strings per §6.2 decision (`सञ्चालक:`).
6. Verify: `npm run build` / `npm run lint` (strict TS, no `any`), then visual check across the §10 breakpoints at `localhost:3000`. Confirm `minimal` layout unchanged and no page importing `Footer` breaks (signature unchanged).
```
