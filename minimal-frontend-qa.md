# Minimal frontend QA

## Automated scenario evidence

The browser scenario script completed **23 checks**. It verified that the public routes Home, Programmes, About, News, Contact, Enroll and Sign in had no horizontal overflow at 1440px desktop, 768px tablet and 390px mobile widths. It also verified the primary programme-discovery path from Home and the labelled mobile menu path to Contact.

The focused frontend suite confirms the shared accessible public shell, the task-first discovery/search/contact paths, the absence of storage-backed media in rewritten public routes, responsive CSS breakpoints, 48px interaction baseline and the minimal workspace shell. The full project regression must be run before release.

## Accessibility checks

The rewrite retains a skip link, labelled primary and mobile navigation, explicit active route state, descriptive field labels and visible keyboard focus. Public controls use at least 48px height where they are primary actions. Decorative motion and media have been removed from the rewritten public flows.
