# Comprehensive Dashboard Cleanup & Governance Isolation Plan

This plan outlines the architecture, layout refactoring, and state simplification to perform a complete, uniform cleanup of all user dashboards on the BILC platform. All additional pages, widgets, analytics charts, and telemetry elements are stripped out for every user role, leaving a single, pristine dashboard page with a beautifully styled future-content placeholder. 

For the unique, non-duplicable **Founder** role, we preserve access to the critical **User Accounts** and **Audit Logs** governance modules, while leaving the founder's main dashboard screen empty.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions incorporate the user's interactive choices made during Phase 1:
> 
> *   **Founder Portfolio Retention**: The founder account will retain access to exactly **two functional modules** (User Accounts for global account management, and Audit & Security Logs for tamper-evident activity tracking) in the sidebar. All other sections (Settings, Dossier, Schema, news, media, timetables) are stripped out.
> *   **Visual Posture of Cleared Dashboards**: All cleared dashboard screens will render a highly professional, visually cohesive zero-state placeholder stating that the page is prepared for subsequent content filling. This avoids completely blank screens while upholding the design constitution.
> *   **Unified UI Elements**: Sidebar user profile identity cards, logout handlers, and the localized language switcher remain fully intact to ensure layout integrity and accessible navigation.

---

## 1. Overview & Core Concept

### What It Does
This refactoring replaces several high-density operational pages with a uniform, low-elevation, single-page zero-state console. It prevents visual clutter and unifies the platform's focus towards its upcoming features.

### Architecture & Menu Transition Diagram

```
[All Non-Founder Users]
        │
        └──► Sidebar (Only 1 active link: "My Dashboard")
                  │
                  └──► Main Content Area (Clean layout placeholder)

[Founder User]
        │
        ├──► Module 1: Dashboard (Prisine empty placeholder)
        │
        ├──► Module 2: User Accounts (Full functional CRUD modal directory)
        │
        └──► Module 3: Audit & Security Logs (Tamper-evident logs viewer)
```

---

## 2. User Experience & Visual Design

### Key User Flows
1.  **Student, Teacher, Marketing, Admin, Super Admin Login**:
    *   The user authenticates and redirects to their respective dashboard URL.
    *   The sidebar renders exactly **one single active navigation control**: "My Dashboard". No nested collapsibles, accordion sections, or secondary links.
    *   The main content displays a beautifully spaced off-white card containing a centered `LayoutDashboard` icon, a headline: *"Dashboard is ready for subsequent filling"*, and a descriptive body text.
2.  **Founder Login**:
    *   The founder logs in and lands on `/admin`.
    *   The sidebar displays exactly **three options** (Dashboard, User Accounts, and Audit Logs) grouped under a single clean "Platform Governance" section.
    *   The Dashboard view renders the same empty zero-state placeholder.
    *   Clicking "User Accounts" displays the interactive, fully operational directory where the founder can search, filter, create, and manage staff and student accounts.
    *   Clicking "Audit Logs" displays the secure, tamper-evident timeline of administrative events.

### Typography, Color & Spacing (3_saas_dashboard.md & frontend-design)
*   **60-30-10 Color Posture**: 60% off-white grid canvas (`#f8faff`), 30% clean white cards with subtle hairline dividers (`border-neutral-200/60`), 10% dark navy action anchors (`#10253e` / `#173fad`).
*   **Zero-Pill Restraint**: Visual hierarchy is created through type weight (Regular 400 vs. SemiBold 600) and unboxed text separation instead of candy-colored capsule badges.
*   **Aesthetic Alignment**: Zero code-comment titles, zero ornamental footer engines, and zero artificial Innovations scoreboards.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Keeping Separate Routing Pages vs. a Single Page
*   **Chosen Approach**: Retain the separate pages (`UserDashboard.tsx`, `TeacherDashboard.tsx`, `MarketingDashboard.tsx`, `SuperAdmin.tsx`, `Admin.tsx`) but clean their internal markup to render the shared empty placeholder.
*   **Why**: It maintains routing compatibility with existing wouter structures, keeps role-based redirects active, and allows future modular additions to be developed in isolation per role.

### Decision 2: Retaining the Audit logs for Founder
*   **Chosen Approach**: Keep the full, functional Audit logs alongside the User Accounts module in the founder's sidebar navigation.
*   **Why**: Crucial for tracking operational changes, satisfying security constraints, and matching the explicit request of the user in Turn 1.

---

## 4. Technical Architecture & Data Strategy

```
                          ┌─────────────────────────┐
                          │     Express Backend     │
                          │   (server/_core/trpc)   │
                          └────────────┬────────────┘
                                       │
                    tRPC APIs (users.list, audit.list)
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │     DashboardLayout Context   │
                       └───────────────┬───────────────┘
                                       │
                   Conditional Sidebar Menu Construction
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │ (user.role === "founder")   │ (user.role !== "founder")   │
         ▼                             ▼                             ▼
  Strategic Portfolios           "My Dashboard"               "My Dashboard"
   (Dashboard, Users, Audit)      (Only navigation link)      (Only navigation link)
```

### Component & State Mapping
*   **DashboardLayout.tsx**:
    *   Modify `STRATEGIC_PORTFOLIOS` to only contain two active modules: `founder-users` and `founder-audit`, plus an empty `founder-overview` overview module.
    *   Restrict the super_admin, marketing, and student navigation links to a single, static "Dashboard" button.
*   **Dashboard Pages (Student, Teacher, Marketing, SuperAdmin, Admin-Overview)**:
    *   Strip out all child components (charts, calendars, test forms, CMS forms, and tables).
    *   Render a standardized `<ModuleEmptyState>` inside a clean, centered container.
*   **Founder Security Reinforcement**:
    *   Ensure that client-side forms and API boundaries in `users.ts` strictly enforce the inability to choose "founder" as a managed role during user creation.
    *   Verify that `updateManagedUser` and `deleteManagedUser` throw validation errors if any actions attempt to modify or delete the founder's account records.

---
