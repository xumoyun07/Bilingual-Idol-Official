# Full-Project Minimal Blue Theme System

## Scope

The visual system applies to the public website, universal sign-in, personal account dashboard, staff workspaces, route-level dashboards, tables, filters, forms, dialogs and mobile drawers. It does **not** alter roles, routing, API calls, privacy boundaries, navigation items or business logic. The public theme continues to use the official-site-inspired royal blue; protected areas use the same colours with denser information spacing and stronger state differentiation.

| Token | Value | Cross-project usage |
|---|---:|---|
| `--blue-primary` | `#173FAD` | Primary actions, current navigation, focus and active filters. |
| `--blue-deep` | `#102C7B` | Hover/pressed primary state and high-emphasis header areas. |
| `--ink` | `#10253E` | Primary text, footers and dark structural surfaces. |
| `--mist` | `#F4F7FC` | Application canvas, quiet state panels and secondary controls. |
| `--line` | `#D9E2F1` | Card, table, form and section boundaries. |
| `--sand` | `#F4E8D5` | Sparse guidance callouts only; not a primary navigation or error colour. |

## Application Rules

The universal sign-in page uses the same blue brand mark, focus outline, primary action and a quiet mist background. The personal account dashboard uses the same header, cards and status treatment as public pages, without decorative panels.

All protected workspaces retain their fixed rail and mobile drawer. The active rail item becomes royal blue with white text; inactive items remain ink/slate on white. Workspace headers, tables and dialog surfaces use white on mist with blue borders and states. Destructive controls retain a semantic error red; success retains green only for semantic confirmation—not as a competing brand colour.

Route-local hard-coded warm/green values are overridden inside the shared workspace root so User management, Field Builder, Student Profiles, Audit Logs, media library and create/edit dialogs follow the same hierarchy. This approach preserves existing component logic while covering every role-aware route.

## Interaction and Accessibility

Primary targets remain at least 48px tall. All controls receive a visible 3px royal-blue focus outline. Hover responses use border, background, colour, opacity or small transform changes under 180ms; reduced-motion disables nonessential transitions. Tables remain scroll-safe at constrained widths and continue to expose their mobile card variants.
