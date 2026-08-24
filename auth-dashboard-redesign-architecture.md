# Sign-in and Workspace UI Architecture

## Purpose

This document defines the presentation-only redesign of the universal sign-in route and protected workspaces. It deliberately preserves the current e-mail/password session flow, typed tRPC calls, role redirects, server-side authorization, data models, and mutation contracts. The interface is rebuilt around **clear next actions**, **reliable status visibility**, and **small-centre operational tasks** rather than decorative or media-led presentation.

## Shared Interaction Model

| Surface | Primary task | Layout decision | Accessibility requirement |
|---|---|---|---|
| Universal sign-in | Enter issued credentials and continue | One focused form with a quiet support panel | Explicit labels, autocomplete attributes, visible password control, alert feedback and 48 px controls |
| Personal dashboard | Understand account state and find next action | Compact account header and a single useful action panel | Clear heading hierarchy, honest empty states and keyboard-reachable sign-out |
| Operations overview | Choose an operational module | Stable sidebar, fixed context header and sparse task panels | Active route announced by page heading; sidebar and header remain available during scrolling |
| Directories and records | Find, review and safely change a record | Filter bar, responsive list/card views and focused dialogs | Search labels, no horizontal clipping, confirmation for destructive actions and visible errors |
| Audit and profile detail | Read status and evidence without cognitive overload | Content sections with concise labels and controlled data density | Mobile card rendering, logical reading order and document/action controls with accessible names |

## Visual Rules

The redesign inherits the public site's restrained palette: ink `#264653` for primary actions and active navigation, white and `#f6f8f8` for page surfaces, slate neutrals for supporting text, and the existing apricot accent only for secondary visual orientation. It uses thin borders, small radii, consistent 48 px interactive controls, no gradients, no floating ornaments, and no decorative imagery.

The workspace shell has a fixed desktop rail and a fully opaque mobile drawer. The active route is represented through both colour and icon treatment. Protected modules use the same page header, panel, filter, directory, dialog, notice, and data-label patterns to remove the legacy mixture of editorial and operational styles.

## Responsive Behaviour

| Breakpoint | Intended behaviour |
|---|---|
| Under 640 px | Single-column forms and records; toolbar actions wrap; directories retain content hierarchy rather than forcing tables; dialogs leave a readable viewport margin. |
| 640–1023 px | Two-column form groups where space permits; dashboard panels may form two columns; header and drawer controls remain visible. |
| 1024 px and above | Fixed 16 rem navigation rail; task panels use available columns; filters align horizontally only when every control remains usable. |

## Non-negotiable Boundaries

The redesign makes no change to any backend procedure, authentication credential handling, session cookie, user role, redirect target, API query/mutation, database record, scoped directory policy or confidential-role boundary. No user activity, metrics, payments, schedules or learning progress are invented. Empty states remain explicit until confirmed data is available.
