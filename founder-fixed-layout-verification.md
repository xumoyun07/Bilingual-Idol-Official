# Founder Fixed Navigation Verification

The Founder `DashboardLayout` now uses a fixed desktop sidebar and a sticky route header. The desktop review shows the protected navigation rail and workspace header at the viewport edge while the long Learning Operations content continues below it. The mobile review retains a compact sticky header without forcing a desktop sidebar onto the narrow viewport.

The automated browser check in `scripts/founder-fixed-layout-qa.mjs` signs in through transient environment variables, opens `/admin/operations`, scrolls the page by `900px`, and asserts that both the desktop sidebar and workspace header remain at viewport `top: 0`. The final run passed with `sidebarTop: 0` and `headerTop: 0` before and after scrolling.

The route transition transform is disabled only while a Founder dashboard rail is present. This prevents an animation containing block from breaking fixed positioning while preserving route motion on public pages.
