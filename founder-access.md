# Founder Access Setup

Founder access is available only through the private `/admin/login` screen. The form contains exactly two required fields—e-mail and password—and there is no public registration flow. The configured Founder e-mail is checked server-side, while the submitted password is verified against a salted `scrypt` hash stored as a server secret.

The Founder role is higher than `super_admin` and is required for protected centre-data operations: programme, team, testimonial, operating-hours, submission, and announcement management. The original password is not stored in the source code or database. Successful authentication issues an httpOnly session cookie; production HTTPS requests use `SameSite=None; Secure`, while local development uses a compatible `SameSite=Lax` cookie.

The form was visually verified at desktop and mobile sizes. Browser QA confirms both rejection of invalid credentials and successful navigation to the Founder dashboard with valid credentials; the complete automated suite passed with 17 tests.
