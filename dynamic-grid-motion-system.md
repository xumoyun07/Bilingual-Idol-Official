# Dynamic Grid and Motion System

## Scope

The visual system applies a restrained blue grid only to non-media surfaces: public body sections, sign-in, dashboard canvas and workspace panels. The Home Hero retains its classroom media with its existing contrast overlay; it is not covered by a grid that could reduce legibility. Cards and dialogs retain opaque or near-opaque paper surfaces so content stays calm and readable above the visual field.

## Grid Treatment

The grid uses two subtle repeating linear gradients and a radial blue glow. It is a fixed decorative layer behind each scoped surface, uses `pointer-events: none`, and is isolated below content stacking contexts. Public routes use a low-opacity blue grid on mist; protected workspaces use an even lower-contrast variant to preserve task focus.

## Motion Rules

The document root receives smooth programmatic and anchor scrolling. Page-level content enters once through opacity and a short upward transform (220–360ms). Cards may receive a small staggered reveal and hover lift, but no layout properties are animated. Modal, keyboard and high-frequency controls remain instant where their component libraries already require it.

All non-essential animation and smooth scrolling are disabled when `prefers-reduced-motion: reduce` is active. This preserves clear focus, reading stability and functional navigation for motion-sensitive visitors.

## Implementation Record

The grid is now applied through shared public, access, member and workspace surface selectors in `client/src/index.css`. It uses a royal-blue 32px grid, low-opacity radial field and an in-viewport decorative orb. The orb is root-relative and clipped so the decoration cannot create horizontal scrolling. Existing Hero media retains its original visual contrast and is not obscured by a grid layer.

The update adds `bilc-page-reveal`, `bilc-item-reveal` and `bilc-grid-drift` keyframes. Each uses only opacity and transform. The root document continues to provide smooth scrolling and a 5.25rem anchor offset beneath persistent navigation.

## Verification Record

| Check | Result | Evidence |
|---|---|---|
| Automated regression suite | Passed | 17 Vitest files and 66 tests passed. The expected scheduled-audit failure-path diagnostic is emitted by its test and the suite passes. |
| Static type and whitespace validation | Passed | `pnpm check` and `git diff --check` completed successfully. |
| Responsive public QA | Passed | 25 browser checks passed across public routes at 1440px, 768px and 390px. The suite confirmed no horizontal overflow, programme navigation, News active state, News modal Escape dismissal and mobile navigation. |
| Overflow regression | Passed | A targeted browser measurement at 1440px reported matching document, body and viewport widths after the decorative orb was constrained. |
| Visual review | Passed | Desktop public, access and workspace surfaces plus 390px Home, access and News views retained readable hierarchy, functional controls and unclipped content. |
| Motion accessibility | Covered | Static test coverage asserts the scoped grid, transform-only keyframes and `prefers-reduced-motion` animation fallback. |

## Visibility Refinement

The first implementation was present but later blue-theme declarations overrode its background layers on several surfaces, making the grid too faint. The correction is deliberately declared after those theme rules. It applies a clearly visible but low-contrast 32px public grid and 30px access/workspace grid, with mist-blue radial depth. Opaque cards, forms and dialogs remain visual resting surfaces above the grid.

The corrected presentation was reviewed at 1440px on Programmes, News, sign-in and the protected News workspace. It is visibly present behind each surface without affecting text contrast, card clarity or the Hero media treatment. Responsive QA at 1440px, 768px and 390px completed without horizontal overflow; mobile falls back from fixed to scrolling background attachment for stable rendering.
