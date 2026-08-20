# Founder Learning-State QA Evidence

The learning-management routes were exercised in a live private browser session with the Founder sign-in flow. Credentials were supplied through transient environment variables only and are not stored in this repository.

| Route | State transitions exercised | Result |
|---|---|---|
| `/admin/operations` | Founder sign-in; create, update, and delete success notices; query-load failure; mutation failure | All checks passed. |
| `/admin/learning-data` | Founder sign-in; create and update success notices; delete success notice; query-load failure; mutation failure | All checks passed. |

Each scenario used a uniquely named **unpublished temporary learning item**. The item was deleted through the Founder UI during the same run. Both QA results reported `temporaryDataPersisted: false`, so no placeholder learning content remains in the platform.

The checks confirm visible `role="status"` confirmations for successful actions, `role="alert"` feedback for mutation failures, skeleton loading patterns, honest empty states, and non-destructive query-error states across both Founder workspaces.
