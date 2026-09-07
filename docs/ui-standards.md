# UI Standards & RTL Design System Architecture
**Bilingual Idol Language Centre**
*Version 1.0 — Architecture & Quality Standards*

---

## 1. Overview & Core Philosophy

The Bilingual Idol platform serves an international community across English (`en`), Bahasa Melayu (`ms`), and Arabic (`ar`). 
Arabic localization is treated not as a superficial text translation, but as a complete mirror and cultural adaptation of the user experience.

All newly authored components, style rules, and page layouts must strictly adhere to the standards outlined in this specification.

---

## 2. Dynamic Directionality (`dir="rtl"`)

1. **Root-Level Execution**:
   - `dir="rtl"` or `dir="ltr"` is managed dynamically via `LanguageContext` (`document.documentElement.dir = dir`).
   - Hardcoding static `dir="rtl"` in `index.html` is strictly prohibited.
   - Accompanying CSS state classes (`.rtl` on `<html>` and `<body>`) ensure predictable selector scoping.

2. **Bidirectional Isolation (`<bdi>` / `dir="ltr"`)**:
   Under the Unicode Bidirectional Algorithm (UBA), weak directional characters (punctuation, dashes, arithmetic signs, plus symbols, currency symbols) will visually flip or misalign when interspersed with RTL text.
   
   **The following items MUST NEVER be mirrored and MUST ALWAYS be wrapped in `<bdi>` or `<span dir="ltr">`**:
   - **Telephone numbers**: e.g., `<bdi dir="ltr">+6 03 6731 0449</bdi>`
   - **Currency and amounts**: e.g., `<bdi dir="ltr">RM 2,950</bdi>` or `<bdi dir="ltr">MYR 7,900</bdi>`
   - **Latin brand names**: e.g., `<bdi dir="ltr">Bilingual Idol</bdi>`, `<bdi dir="ltr">WhatsApp</bdi>`, `<bdi dir="ltr">Touch 'n Go</bdi>`
   - **Dates and numerical ranges**: e.g., `<bdi dir="ltr">2026-09-01 – 2026-10-15</bdi>`

---

## 3. Logical CSS Properties (Tailwind CSS v4 & Vanilla CSS)

The use of physical directional utility classes (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`) is **strictly deprecated** for all new UI code. Developers must exclusively use logical CSS properties.

### Logical Property Migration Matrix

| Legacy Physical Class | Modern Logical Class | CSS Equivalent (Logical) |
| :--- | :--- | :--- |
| `ml-*` (`margin-left`) | `ms-*` | `margin-inline-start` |
| `mr-*` (`margin-right`) | `me-*` | `margin-inline-end` |
| `pl-*` (`padding-left`) | `ps-*` | `padding-inline-start` |
| `pr-*` (`padding-right`) | `pe-*` | `padding-inline-end` |
| `left-*` | `start-*` | `inset-inline-start` |
| `right-*` | `end-*` | `inset-inline-end` |
| `text-left` | `text-start` | `text-align: start` |
| `text-right` | `text-end` | `text-align: end` |
| `border-l-*` | `border-s-*` | `border-inline-start` |
| `border-r-*` | `border-e-*` | `border-inline-end` |
| `rounded-l-*` | `rounded-s-*` | `border-start-start-radius`, `border-end-start-radius` |
| `rounded-r-*` | `rounded-e-*` | `border-start-end-radius`, `border-end-end-radius` |

---

## 4. Typography System & Per-Locale Tokens

Arabic typography features cursive letterforms with position-dependent glyph variants (isolated, initial, medial, final), prominent ascenders, descenders, and optional diacritical marks.

### 4.1. Font Families
- **English & Malay (`en`, `ms`)**: `Manrope` (body) / `DM Serif Display` (headings/display).
- **Arabic (`ar`)**: `Cairo` and `IBM Plex Sans Arabic` with full contextual ligature coverage and 9 weights. High-legibility geometric proportions designed specifically to harmonize with modern UI design.

### 4.2. Per-Locale Design Tokens
| Token | Latin (`en`, `ms`) | Arabic (`ar`) | Rationale |
| :--- | :--- | :--- | :--- |
| `--locale-font-family` | `"Manrope", sans-serif` | `"Cairo", "IBM Plex Sans Arabic", sans-serif` | Certified Arabic glyph coverage. |
| `--locale-font-size-base` | `1rem` (16px) | `0.9375rem` (15px) | Slightly reduced to avoid optical bulk in Arabic script. |
| `--locale-line-height-base`| `1.6` | `1.82` (+14%) | Prevents overlap of vertical ascenders, descenders, and marks. |
| `font-style: italic` | Permitted for accent | **STRICTLY PROHIBITED** | Arabic script cannot be slanted. Use `font-weight: 700` instead. |

### 4.3. Calendar & Date Conventions
In Arabic UI, names of days of the week and months must always be rendered as **complete, unabbreviated words**:
- **Days**: الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، الجمعة، السبت (never shortened).
- **Months**: يناير، فبراير، مارس، أبريل، مايو، يونيو، يوليو، أغسطس، سبتمبر، أكتوبر، نوفمبر، ديسمبر (never abbreviated).

---

## 5. Sliders, Carousels & Interactive Components

1. **Directional Inversion**:
   - In RTL mode, horizontal carousels (hero banners, student testimonials, facility showcase, media galleries) MUST invert their swipe logic, autoplay movement, and keyboard arrow controls.
   - Right arrow (`ArrowRight`) moves to previous slide in RTL; Left arrow (`ArrowLeft`) moves to next slide.
   - Embla Carousel instances must receive `{ direction: isRTL ? 'rtl' : 'ltr' }`.
   - Previous/Next button icons (`ChevronLeft` / `ChevronRight`) must flip orientations logically or use directional rotate tokens (`rtl:rotate-180`).

2. **Form Elements**:
   - Text inputs, search bars, and dropdown menus must align text to `start` (`text-start`).
   - Input icons (e.g., search magnifying glass, calendar icon) must sit at `start-3`, with input padding `ps-10`.
   - Action buttons (e.g. submit, reset) are positioned at the inline end of form groups.
   - Telephone and email input fields remain LTR (`dir="ltr" text-start`) to maintain international number conventions.

---

## 6. Content, Regional SEO & Cultural Guidelines

1. **Regional Search Engine Optimization**:
   - Arabic meta titles, descriptions, and keywords must reflect actual search queries used by prospective students from the MENA region (e.g., *"معهد تعليم اللغة الإنجليزية في كوالالمبور"*, *"دورات آيلتس في ماليزيا"*), avoiding literal word-for-word translations.
   - OpenGraph `og:locale` must dynamically output `ar_AE` or `ar_SA` when Arabic is active.

2. **Cultural Moderation**:
   - Imagery displayed in public sections must comply with regional cultural standards.
   - Media cards and testimonials featured on Arabic views must showcase modest, academic, and respectful photography.

---

## 7. Automated Testing & Verification Checklist

Before releasing any new feature or module for the Arabic locale, verify:
- [ ] `document.documentElement.dir === "rtl"` and `<html class="rtl">` are present.
- [ ] No `font-style: italic` appears in rendered Arabic text.
- [ ] All phone numbers (`+6 03...`) and currency references (`RM...`, `MYR...`) are wrapped in `<bdi>`.
- [ ] Carousels advance correctly with swipe gestures and arrow keys.
- [ ] Forms submit and validate cleanly with proper RTL alignment.
- [ ] Date formats display full unabbreviated months and weekdays.
