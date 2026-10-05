# Footer Redesign — Verification Note

Target file: `components/Footer.tsx` (default/live return used by `layout === 'standard'` and
`'modern'`). The `minimal` branch, `FooterProps`, `FooterWrapper`, `models/Settings.ts`,
`app/page.tsx`, and the admin page were NOT changed. `InlineNewsletterForm` logic (API POST,
validation, loading/success/error states, aria-live) is unchanged — only its input/button
styling (white connected row, 52px height, mobile stack) was restyled. `SocialIcon`, the
custom social SVGs, `defaultColumns`, `defaultBottomBarLinks`, the hydration-safe year guard,
and all `{year}`/`{siteName}`/`{heart}` token logic are preserved. No new npm packages;
`ChevronRight` and `ArrowRight` were added to the existing `lucide-react` import, and the
now-unused `Send` import was removed.

This is the FIRST iteration — `.agents/tasks/footer-redesign-review.json` does not exist.

## 1. TypeScript — `node_modules/.bin/tsc --noEmit`
Command run from repo root. Result: **0 errors** (exit code 0). No `any` introduced.

## 2. ESLint — `node_modules/.bin/eslint components/Footer.tsx`
Result: **0 errors, 1 warning** (exit code 0).

```
327:17  warning  Using `<img>` could result in slower LCP ... @next/next/no-img-element
```

This is the pre-existing, acceptable warning for the decorative mountain `<img>` (served from
an encoded path, intentionally not `next/image`). No other lint issues.

## 3. Live curl + grep against http://localhost:3000
Fetched `/` (home, 200, ~418 KB) and `/about` (200, ~123 KB) and grepped the SSR HTML to
confirm settings-driven content still renders (counts are occurrences in the full page HTML;
footer markers appear once in the footer plus, for some strings, elsewhere on the page):

| Marker (settings-driven) | `/` count | `/about` count |
|---|---|---|
| Mountain image ref (`Low-Poly%20Mountain`, URL-encoded) | 3 | 3 |
| Designed-with text (`Designed with` …) | 2 | 2 |
| Newsletter button / title (`सदस्यता`) | 4 | 4 |
| Bottom-bar link `Privacy Policy` | 4 | — |
| Bottom-bar link `Terms of Use` | 2 | — |
| Company name (`तपस्या` / `क्रियेशन`) | 5 / 4 | 5 |
| Column heading (`हाम्रो बारेमा`) | 6 | 34 |
| Column heading (`विषय`) | 1 | — |
| Newsletter card bg (`rgba(0,61,124,0.45)`) | 1 | 1 |
| Accent bar (`h-[30px]`) | 1 | — |
| Dynamic grid var (`footer-xl-cols`) | 2 | — |

Notes:
- The mountain ref is URL-encoded in HTML (`/Red%20and%20White%20Low-Poly%20Mountain%20Range.png`),
  so the raw-space grep returned 0 while the encoded grep returned 3 — the asset reference is
  present.
- The designed-with text is admin-configured as `Designed with {heart} for  तपस्या क्रियेशन
  प्रा. लि.`; the `{heart}` token is replaced by the red `Heart` SVG and the suffix is the
  configured company name. The default literal "for a better Nepal" is NOT in the DB, which is
  expected — content is settings-driven, so the configured value wins. The `{heart}` split and
  the `designedAfter === undefined` branch both work.
- All markers appear in BOTH `/` (rendered via `app/page.tsx`) and `/about` (rendered via
  `FooterWrapper`), confirming the redesign wiped no settings-driven content on either path.

## 4. Horizontal-overflow sanity check
- Main and bottom-bar containers: `max-w-[1500px] w-full mx-auto` with responsive padding
  `px-4 sm:px-6 lg:px-10 xl:px-14`.
- `<footer>` keeps `overflow-hidden` (also clips the full-width mountain strip).
- Only fixed pixel widths in the file: logo `w-[180px] xl:w-[210px]` (well under container) and
  newsletter card `max-w-[380px]` (bounded, per spec). No element wider than the container.
- Newsletter input uses `flex-1 min-w-0`; button `shrink-0` — no overflow when stacked or inline.
- Desktop grid uses fr units (`var(--footer-xl-cols)` = `1.2fr 1.4fr 0.8fr…1.5fr`), which cannot
  exceed the container width. Dynamic template adapts the number of `0.8fr` link slots to the
  actual enabled-column count so no empty slot / overflow when fewer/more than 3 columns.

## Summary
tsc clean, eslint clean except the accepted mountain `<img>` warning, all settings-driven
footer content renders on both the direct-import and FooterWrapper paths, and there is no
horizontal-overflow risk. No commit was made (the task spec explicitly says "Do NOT commit").
