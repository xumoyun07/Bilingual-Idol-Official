# Home Hero Viewport Verification

The first homepage hero now uses `100svh` minus the **measured** public header height. `PublicLayout` observes its own header with `ResizeObserver` and publishes the result as `--public-header-height`; no viewport offset is hardcoded. The combined public header and initial hero therefore fill the current viewport without creating an extra first-screen scroll.

| Viewport | Hero behaviour | Result |
|---|---|---|
| Desktop `1280×720` | The two-column composition, both CTAs, language row, and Learning Compass card fit within the initial screen. | Passed. |
| Mobile `390×844` | The single-column primary message, both CTAs, and language row fit in the initial screen; the secondary card is intentionally deferred to avoid overflow. | Passed. |

On short desktop viewports, the internal spacing and type scale contract without changing the hero’s exact viewport boundary. On mobile, the hero uses a purposeful single-column composition: the primary route message, both required CTAs and language row remain visible, while the desktop-only orientation card is deferred to protect the exact first-screen boundary.

The reproducible check `scripts/home-hero-viewport-qa.mjs` passed at `1280×720` and `390×844`. In both cases, measured `header.height + hero.height` matched the viewport height within one pixel; the hero CTA and language row bottom bounds were inside the hero bottom bound. The check does not rely on clipping.
