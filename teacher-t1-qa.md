# Teacher T1 QA evidence

- Anonymous `GET /portal/teacher/class-sessions?range=today` returned HTTP 401 with `authentication-required`.
- The current signed-in non-teacher browser session received only `{ "error": "teacher-only" }`; no class-session data was returned.
- Direct handler tests cover teacher-only access, `today`/`week`/custom date parsing, invalid ranges, teacher-scoped list forwarding, and foreign session IDs returning 404 without disclosure.
- Full automated suite and TypeScript verification are recorded in the T1 checkpoint workflow. No teacher or class-session records were created solely for QA.
