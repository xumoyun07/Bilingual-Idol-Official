# Responsive QA Report — Bilingual Idol Learning Centre

**Prepared by:** Manus AI  
**Verification environment:** local Chromium via Playwright, development server at `http://localhost:3000`  
**Report date:** 22 August 2026

## Executive summary

The public platform, universal login screen and Founder console were rechecked after targeted responsive fixes. The completed automated public matrix contains **56 route–viewport checks** (seven current public routes at eight target sizes), with **zero horizontal-overflow failures** and **zero primary-CTA touch-target failures**. The protected Founder console contains **eight authenticated layout checks**, again with **zero overflow or fixed-layout failures**.

The main corrections remove 40px desktop header CTA overrides, set the mobile navigation trigger to an explicit 48×48px control, and raise key Founder navigation, profile and mobile-menu controls to a 48px minimum. The public shell also contains resilient horizontal-overflow protection and media sizing rules. No fictional content, reviews or learner data were introduced during this work.

> **Scope boundary.** This report confirms the scripted public and authenticated Founder scenarios listed below. It does **not** claim a successful end-to-end login as a real non-Founder account because the centre has not yet provisioned a suitable account for testing. Cross-browser confirmation in Firefox, Safari and Yandex Browser also remains an external validation step.

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

The protected QA logs in with the configured Founder account, evaluates document width, scrolls the page, then compares the top coordinates of the workspace header and desktop navigation rail before and after scroll. It therefore tests the actual protected layout rather than a static mockup.

| Viewport | Overflow | Fixed workspace header | Fixed navigation rail | Status |
|---|---:|---|---|---|
| 360×640 | 0px | Top remains 0px after scroll | Compact mobile mode; rail is not rendered as a permanent control | Pass |
| 390×844 | 0px | Top remains 0px after scroll | Compact mobile mode; rail is not rendered as a permanent control | Pass |
| 412×915 | 0px | Top remains 0px after scroll | Compact mobile mode; rail is not rendered as a permanent control | Pass |
| 768×1024 | 0px | Top remains 0px after scroll | Present at top 0px in captured state | Pass |
| 1024×1366 | 0px | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| 1366×768 | 0px | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| 1920×1080 | 0px | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| 3840×2160 | 0px | Top remains 0px after scroll | Top remains 0px after scroll | Pass |
| **Total** | **0 failures** | **8/8 passing** | **All applicable desktop checks passing** | **Pass** |

The raw, reproducible output is preserved in [`public-qa.json`](/manus-storage/public-qa_d911ff04.json) and [`founder-qa-full.json`](/manus-storage/founder-qa-full_271aaca1.json).

### Orientation resize

An additional same-session resize test loaded each current public route at 360×640 and changed it to 640×360. All **7/7** routes retained zero horizontal overflow and no navigation menu was left open after the resize. The raw result is preserved in [`orientation-qa.json`](/manus-storage/orientation-qa_363418fe.json).

## Implemented responsive rules

| Area | Implemented rule | User-facing effect |
|---|---|---|
| Responsive baseline | Mobile-first layout from 360px, with design breakpoints at 640px (`sm`), 768px (`md`) and 1024px (`lg`) | Controls, grids and navigation adapt without an additional narrow-device layout fork |
| Wide screens | At 1440px and above, `.compass-shell` grows to `min(100% - 6rem, 82rem)` | A stable reading measure and deliberate whitespace are retained at 1920px and 4K instead of stretching cards and lines excessively |
| Public header | Desktop `Вход` and `Enroll Now` no longer force a 40px height; the mobile menu trigger uses `h-12 w-12` | The primary entry and conversion controls meet the 48px project baseline |
| Founder console | Rail toggle, menu rows, profile trigger and mobile sidebar trigger use 48px-height controls | More reliable touch interaction in the protected workspace |
| Overflow protection | Root horizontal clipping, responsive grid/flex patterns and `img, video { max-width: 100%; height: auto; }` | Prevents unexpected side scroll and media-induced layout expansion |
| Hero composition | The public header height is observed and used to size the home hero from the viewport | The hero fits the initial screen without hard-coded offsets or clipping |
| Motion and accessibility | Focus-visible treatment, skip link, ARIA labels and reduced-motion-safe motion rules remain active | Keyboard and assistive-technology paths are preserved while responsive changes are applied |

## Visual evidence

The following captures are rendered from the running application after the fixes. The complete evidence set is retained in project storage.

### Public mobile — Home, 360×640

![Bilingual Idol home page at 360×640](/manus-storage/home-mobile-360x640_12d233f7.png)

The mobile flow remains single-column from header through enquiry form and footer. Visible controls and cards stay inside the viewport boundary.

### Public tablet — Programmes, 768×1024

![Bilingual Idol programmes page at 768×1024](/manus-storage/programmes-tablet-768x1024_baa8ec23.png)

### Public wide screen — Home, 1920×1080

![Bilingual Idol home page at 1920×1080](/manus-storage/home-wide-1920x1080_56f76362.png)

### Public 4K — Home, 3840×2160

![Bilingual Idol home page at 3840×2160](/manus-storage/home-ultrawide-3840x2160_fc7267d3.png)

The 4K view retains a centred, intentionally bounded content shell. It uses whitespace to protect readability instead of scaling all interface elements to the full display width.

### Founder console — Mobile, 390×844

![Founder console at 390×844](/manus-storage/founder-mobile-390x844_97b50eb5.png)

### Founder console — Desktop, 1366×768

![Founder console at 1366×768](/manus-storage/founder-desktop-1366x768_546268db.png)

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
| Non-Founder account journey | No centre-issued non-Founder account has been supplied or provisioned for safe testing | Create a private scrypt-hashed test account, verify `/login` → `/dashboard`, and verify that `/admin` is denied |
| Full Founder 8-viewport matrix | The Founder console has five authenticated dimensions in this report, while public routes cover all eight target dimensions | Repeat authenticated Founder QA at 360×640, 412×915 and 3840×2160 if full matrix parity is required |
| Cross-browser review | Automated evidence is Chromium-only | Manually validate Firefox, Safari and Yandex Browser in their native environments |
| Founder acceptance | Real centre content and publishing actions have not been acceptance-tested with the Founder | Enter authentic content, test keyboard/form workflows, and record approval |
| Moderated usability testing | Target-group sessions have not yet occurred | Recruit representative users, run moderated sessions and prioritise findings |

## Reproduction

Run the following commands from the project root while the development server is running. The Founder checks need temporary authorised environment values and should not be copied into public documentation.

```bash
node scripts/responsive-layout-qa.mjs
FOUNDER_QA_EMAIL="…" FOUNDER_QA_PASSWORD="…" node scripts/founder-responsive-layout-qa.mjs
FOUNDER_QA_EMAIL="…" FOUNDER_QA_PASSWORD="…" node scripts/capture-responsive-evidence.mjs
```

The visual review notes are also preserved in [`visual-verification-notes.md`](/manus-storage/visual-verification-notes_d1e992e7.md).
