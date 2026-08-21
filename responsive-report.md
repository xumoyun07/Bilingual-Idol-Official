# Responsive QA Report — Bilingual Idol Learning Centre

**Prepared by:** Manus AI  
**Verification environment:** local Chromium via Playwright, development server at `http://localhost:3000`  
**Report date:** 22 August 2026

## Executive summary

The public platform, universal login screen, personal member dashboard and Founder console were rechecked after targeted responsive fixes. The completed automated public matrix contains **56 route–viewport checks** (seven current public routes at eight target sizes), with **zero horizontal-overflow failures** and **zero primary-CTA touch-target failures**. The personal dashboard contains **eight authenticated layout checks**, while the Founder console contains **40 route–viewport checks** (five protected screens at eight target sizes); both sets have zero overflow, fixed-layout or measured touch-target failures.

The main corrections remove 40px desktop header CTA overrides, set the mobile navigation trigger to an explicit 48×48px control, and raise Founder command-surface buttons and links, navigation, profile and mobile-menu controls to a 48px minimum. The public shell also contains resilient horizontal-overflow protection and media sizing rules. No fictional content, reviews or learner data were introduced during this work.

> **Scope boundary.** This report confirms the scripted public, personal-dashboard and authenticated Founder scenarios listed below. The non-Founder scenario uses a random, non-public QA account created only during the test and deleted immediately afterwards; it contains no learner data. Cross-browser confirmation in Firefox, Safari and Yandex Browser remains an external validation step.

## Tested matrix and results

### Public routes

The public QA script checks `documentElement` and `body` widths for overflow and checks visible primary and secondary `.compass-btn-*` controls against a 48px minimum height. The active route list intentionally includes `/news` and no longer includes the removed Learning Hub.

| Viewport | Routes checked | Checks | Horizontal overflow | Primary CTA target result | Status |
|---|---:|---:|---:|---|---|
| 360×640 | `/`, `/programs`, `/about`, `/news`, `/contact`, `/enroll`, `/login` | 7 | 0 | All measured controls ≥ 48px | Pass |
| 390×844 | Same seven routes | 7 | 0 | All measured controls ≥ 48px | Pass |
| 412×915 | Same seven routes | 7 | 0 | All measured controls ≥ 48px | Pass |
| 768×1024 | Same seven routes | 7 | 0 | All measured controls ≥ 48px | Pass |
| 1024×1366 | Same seven routes | 7 | 0 | All measured controls ≥ 48px | Pass |
| 1366×768 | Same seven routes | 7 | 0 | All measured controls ≥ 48px | Pass |
| 1920×1080 | Same seven routes | 7 | 0 | All measured controls ≥ 48px | Pass |
| 3840×2160 | Same seven routes | 7 | 0 | All measured controls ≥ 48px | Pass |
| **Total** | **7 current routes × 8 viewports** | **56** | **0 failures** | **0 failures** | **Pass** |

### Authenticated Founder console

The protected QA logs in with the configured Founder account, evaluates document width, scrolls the page, then compares the top coordinates of the workspace header and desktop navigation rail before and after scroll. It executes the same assertions on `/admin`, `/admin/submissions`, `/admin/announcements`, `/admin/announcements/edit` and `/admin/content`; it therefore tests the actual protected route set rather than a static mockup.

| Viewport | Overflow | Fixed workspace header | Fixed navigation rail | Status |
|---|---:|---|---|---|
| 360×640 | 0px on each route | Top remains 0px after scroll | Compact mobile mode; rail is not rendered as a permanent control | Pass |
| 390×844 | 0px on each route | Top remains 0px after scroll | Compact mobile mode; rail is not rendered as a permanent control | Pass |
| 412×915 | 0px on each route | Top remains 0px after scroll | Compact mobile mode; rail is not rendered as a permanent control | Pass |
| 768×1024 | 0px on each route | Top remains 0px after scroll | Present at top 0px in captured state | Pass |
| 1024×1366 | 0px on each route | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| 1366×768 | 0px on each route | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| 1920×1080 | 0px on each route | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| 3840×2160 | 0px on each route | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| **Total** | **40 checks, 0 failures** | **5 routes × 8 viewports passing** | **0 undersized measured button/link controls** | **Pass** |

The raw, reproducible output is preserved in [`public-qa.json`](/manus-storage/public-qa_60581f74.json) and [`founder-route-matrix-qa.json`](/manus-storage/founder-route-matrix-qa_adf9946e.json). The final Founder run measured every visible button and link on all five protected routes: **0 undersized targets** across the eight viewports.

### Authenticated personal dashboard and role denial

The self-cleaning non-Founder QA creates a random, active `user` account with a one-run scrypt hash; it verifies universal sign-in redirects it to `/dashboard`, checks every target viewport, verifies that `/admin` renders the safe **Founder access required** denial state, signs out and deletes the account in a `finally` block. The QA JSON is emitted only after that cleanup, and a direct database check after the final run confirmed **0** records with `loginMethod = 'qa-automation'`.

| Viewport | Personal dashboard overflow | Dashboard header controls | Role-protected `/admin` | Status |
|---|---:|---|---|---|
| 360×640 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| 390×844 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| 412×915 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| 768×1024 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| 1024×1366 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| 1366×768 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| 1920×1080 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| 3840×2160 | 0px | All measured targets ≥ 48px | Safe Founder-only denial verified | Pass |
| **Total** | **0 failures** | **8/8 passing** | **Access denied to non-Founder** | **Pass** |

The raw result is preserved in [`non-founder-e2e-qa.json`](/manus-storage/non-founder-e2e-qa_41123b50.json).

### Orientation resize

An additional same-session resize test loaded each current public route at 360×640 and changed it to 640×360. All **7/7** routes retained zero horizontal overflow and no navigation menu was left open after the resize. The protected QA then resized the personal dashboard and each of the five Founder routes from tablet portrait 768×1024 to tablet landscape 1024×768. All **6/6** protected resize checks retained zero overflow; the personal dashboard card stayed within bounds, while the Founder header, desktop rail and route surface stayed correctly positioned. The raw results are preserved in [`orientation-qa.json`](/manus-storage/orientation-qa_a09ae80b.json), [`non-founder-e2e-qa.json`](/manus-storage/non-founder-e2e-qa_41123b50.json) and [`founder-route-matrix-qa.json`](/manus-storage/founder-route-matrix-qa_adf9946e.json).

## Implemented responsive rules

| Area | Implemented rule | User-facing effect |
|---|---|---|
| Responsive baseline | Mobile-first layout from 360px, with design breakpoints at 640px (`sm`), 768px (`md`) and 1024px (`lg`) | Controls, grids and navigation adapt without an additional narrow-device layout fork |
| Wide screens | At 1440px and above, `.compass-shell` grows to `min(100% - 6rem, 82rem)` | A stable reading measure and deliberate whitespace are retained at 1920px and 4K instead of stretching cards and lines excessively |
| Public header | Desktop `Вход` and `Enroll Now` no longer force a 40px height; the mobile menu trigger uses `h-12 w-12` | The primary entry and conversion controls meet the 48px project baseline |
| Founder console | Rail toggle, menu rows, profile trigger, mobile sidebar trigger, command-surface buttons and links use a 48px-height baseline | More reliable touch interaction in the protected workspace |
| Dialog/modal scope | No production public, personal or Founder route mounts a dialog, sheet or drawer; reusable primitives are not an active route surface | Future mounted dialogs must be viewport-bounded, scrollable, focus-managed and use 48px actions before release |
| Overflow protection | Root horizontal clipping, responsive grid/flex patterns and `img, video { max-width: 100%; height: auto; }` | Prevents unexpected side scroll and media-induced layout expansion |
| Hero composition | The public header height is observed and used to size the home hero from the viewport | The hero fits the initial screen without hard-coded offsets or clipping |
| Motion and accessibility | Focus-visible treatment, skip link, ARIA labels and reduced-motion-safe motion rules remain active | Keyboard and assistive-technology paths are preserved while responsive changes are applied |

## Visual evidence

The following captures are rendered from the running application after the fixes. The complete evidence set is retained in project storage.

### Public mobile — Home, 360×640

![Bilingual Idol home page at 360×640](/manus-storage/home-mobile-360x640_c0303cdb.png)

The mobile flow remains single-column from header through enquiry form and footer. Visible controls and cards stay inside the viewport boundary.

### Public tablet — Programmes, 768×1024

![Bilingual Idol programmes page at 768×1024](/manus-storage/programmes-tablet-768x1024_71a63f5f.png)

### Public wide screen — Home, 1920×1080

![Bilingual Idol home page at 1920×1080](/manus-storage/home-wide-1920x1080_1bd5e577.png)

### Public 4K — Home, 3840×2160

![Bilingual Idol home page at 3840×2160](/manus-storage/home-ultrawide-3840x2160_2c8f1fc1.png)

The 4K view retains a centred, intentionally bounded content shell. It uses whitespace to protect readability instead of scaling all interface elements to the full display width.

### Founder console — Mobile, 390×844

![Founder console at 390×844](/manus-storage/founder-mobile-390x844_ebf7da2e.png)

### Founder console — Desktop, 1366×768

![Founder console at 1366×768](/manus-storage/founder-desktop-1366x768_99c77f96.png)

### Personal dashboard — Mobile, 390×844

![Personal dashboard at 390×844](/manus-storage/user-dashboard-390x844_adf0533a.png)

### Personal dashboard — Desktop, 1366×768

![Personal dashboard at 1366×768](/manus-storage/user-dashboard-1366x768_0c4387aa.png)

## Performance validation guidance

The stated product target is an LCP of **2.5 seconds or less on simulated 3G mobile**. This audit did not fabricate a performance score; it validates layout and interaction behaviour only. Before release, a Founder or implementation owner should run an external field/lab measurement against the deployed domain and record the device, network profile, Lighthouse version and page URL.

| Priority | Recommended verification or optimisation | Completion evidence |
|---:|---|---|
| 1 | Measure home-page LCP, CLS and INP on the published domain under a mobile 3G profile | Saved Lighthouse or PageSpeed report with test date and URL |
| 2 | Confirm font loading strategy does not block the first-screen hero | Network waterfall and render screenshot |
| 3 | Keep hero and navigation imagery absent or optimized until Founder-provided assets are available | Largest transferred image sizes and loading attributes |
| 4 | Re-run the 360px screenshot and public QA after any new programme, team or announcement media is introduced | Updated JSON evidence and screenshots |

## Remaining validation before production acceptance

| Open item | Why it remains open | Required closure |
|---|---|---|
| Cross-browser review | Automated evidence is Chromium-only | Manually validate Firefox, Safari and Yandex Browser in their native environments |
| Founder acceptance | Real centre content and publishing actions have not been acceptance-tested with the Founder | Enter authentic content, test keyboard/form workflows, and record approval |
| Moderated usability testing | Target-group sessions have not yet occurred | Recruit representative users, run moderated sessions and prioritise findings |

## Reproduction

Run the following commands from the project root while the development server is running. The Founder checks need temporary authorised environment values and should not be copied into public documentation.

```bash
node scripts/responsive-layout-qa.mjs
FOUNDER_QA_EMAIL="…" FOUNDER_QA_PASSWORD="…" node scripts/founder-responsive-layout-qa.mjs
node scripts/non-founder-e2e-qa.mjs
FOUNDER_QA_EMAIL="…" FOUNDER_QA_PASSWORD="…" node scripts/capture-responsive-evidence.mjs
```

The visual review notes are also preserved in [`visual-verification-notes.md`](/manus-storage/visual-verification-notes_3dc8dfd2.md).
