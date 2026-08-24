# Minimal frontend architecture

## Product principle

The interface is rebuilt around a small learning centre’s everyday questions: **What can I study? How do I ask for help? How do I access my workspace?** The new frontend removes editorial imagery, decorative counters, floating panels, ornamental shapes and non-essential motion. Each screen leads to one practical decision or task.

## Public information architecture

| User need | Route | Primary action | Simplified UI rule |
|---|---|---|---|
| Understand the centre | `/` and `/about` | View programmes or contact the centre | Short summary, practical links, no promotional visual layers. |
| Find an option | `/programs` and `/programs/:slug` | Filter or open a programme | Search and filters always precede the results. |
| Ask a question | `/contact` | Call, WhatsApp, email or send an enquiry | Contact methods are visible before the form. |
| Start an enquiry | `/enroll` | Submit validated learner details | One clear form, required-field explanation and no distraction. |
| Access an account | `/login` and `/dashboard` | Sign in or sign out | Calm, direct credential flow and only relevant account state. |

## Workspace architecture

Authenticated workspaces use a fixed desktop sidebar and a mobile drawer. Navigation contains only modules that map to an operational task. A slim header displays the current module; the account area has a direct sign-out action. Resizing, decorative motifs, non-essential cards and hidden alternate paths are removed.

| Role group | Core tasks | Navigation principle |
|---|---|---|
| Students and teachers | Review information shared with their account and return to programmes | Personal dashboard with a single summary and clear exit. |
| Centre staff | Manage users, student profiles and operational records | Persistent task navigation with a single active state. |
| Scoped administrators | View allowed user and audit operations | Only authorised modules are rendered. |

## Visual system

The visual system is deliberately restrained: white workspace surfaces, ink text (`#1f3442`), muted blue-grey support text, a single deep teal action colour (`#264653`) and a soft coral active cue. Typography uses a legible sans-serif for controls and content; display typography is reserved for no more than one page title per public page. All primary controls have at least a 48px target and visible keyboard focus.

## Usability validation boundary

Automated validation can verify responsive widths, button sizes, focus affordances, role-based navigation and complete interaction paths. It cannot replace feedback from actual learners, parents, teachers and staff. The usability protocol therefore defines a short moderated test before launch: each participant should attempt to find a programme, contact the centre, submit a safe test enquiry or sign in to a designated test account, then report clarity, time-to-completion and any hesitation. No production personal data should be entered during that study.
