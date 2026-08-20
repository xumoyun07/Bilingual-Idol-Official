# Learning Operations Guide

## Purpose

The redesigned platform now uses a single `learningItems` model for five operational areas: `schedule`, `material`, `teacher`, `payment`, and `report`. This keeps the learning hub useful without fabricating personal learner, payment, or class information.

| Area | Use it for | Public learning-hub behavior |
|---|---|---|
| Schedule | Confirmed session, time, preparation, or timetable notice. | Appears in **Schedule** and in the combined **Today** view after publication. |
| Material | Verified worksheet, class resource, or learning link. | Appears in **Materials** after publication. |
| Teacher | Approved teacher-support route or contact guidance. | Appears in **Teacher** after publication. |
| Payment | General verified service or payment guidance. | Appears in **Payments** after publication; do not add private billing data. |
| Report | Published learning-feedback or report guidance. | Appears in **Reports** after publication; do not add personally identifiable learner data. |

## Founder Workflow

The Founder opens **Founder console → Learning operations**, selects a learning area, enters an accurate title and description, optionally provides a valid action URL, chooses the display order, and publishes only after the content has been confirmed. Draft records remain in the Founder list and do not appear in the learning hub. Editing, publishing, and deletion are restricted by the highest `founder` role.

## State Rules

The learning hub has distinct loading, error, empty, and content states. It never converts an empty database into fictional learner activity. The Founder workspace uses the same principle: it provides an operational empty state until verified items are introduced, and a skeleton state while records are loading.

## Focused Support Requests

The **Teacher**, **Payments**, and **Reports** areas contain a focused, validated request form. A visitor supplies an e-mail and a clear question; the request becomes a `learningSupportRequest` with a `new` status. The Founder reviews it in **Founder console → Learning data → Teacher, payment & report inbox**, then marks it `reviewed` or `resolved`. A successful public submission has its own visible confirmation state. The workflow records a service request only; it does not process a payment or expose a personal learning report.

| Verified end-to-end step | Evidence |
|---|---|
| Public request submission | The `createLearningSupportRequest` public procedure validates type, e-mail, and question content before it creates the request. |
| Founder review | The `learningSupportRequests` Founder procedure loads the inbox and exposes the new request state. |
| Founder resolution | The `updateLearningSupportRequestStatus` Founder procedure moves the request from `new` to `reviewed` and then `resolved`. |

The automated in-memory integration test `server/learning-support-journey.integration.test.ts` verifies this exact cross-role sequence without inserting persistent test records.

## Founder Learning Item Lifecycle

The Founder creates a schedule, material, teacher, payment, or report item as a draft in **Founder console → Learning data**. Drafts remain visible only in Founder data. When the Founder marks the item published, the public `publicLearningItems` query exposes it in the matching learning-hub area; an update is reflected on the next query refresh. The integration test `server/learning-item-lifecycle.integration.test.ts` verifies the complete draft → Founder update → public-hub appearance sequence without inserting persistent test records.

## Future Personalisation Boundary

The current learning items are centre-managed and are suitable for shared learning guidance. Before publishing student-specific schedules, materials, messages, payments, or reports, introduce a separate student account and consent-aware learner-to-item relationship. This protects privacy and keeps individual educational records out of shared public views.
