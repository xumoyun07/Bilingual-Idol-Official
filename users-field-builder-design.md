# Users Field Builder — First Version Design

## Source pattern and safe adaptation

The attached reference describes a **Dynamic Schema / EAV** form system: a root form contains ordered sections, each section contains ordered metadata-driven fields, and values are stored independently from the account record. This first implementation adapts that pattern only to **Founder → Users → Create user**.

The account’s security-critical attributes remain intentionally fixed: **full name, e-mail, issued role, initial password and active state**. They are validated by the existing Founder-only Users contract and are not editable through the Field Builder. The Builder is limited to additional profile attributes, so no dynamic schema change can weaken credential, role or session protections.

## First-version data contract

| Entity | Purpose | Safety boundary |
|---|---|---|
| `userFormSections` | Ordered optional sections for the additional-profile area | Founder-only metadata; deleting a section moves fields to the ungrouped area rather than deleting field definitions |
| `userFormFields` | Ordered field metadata: label, type, required flag, placeholder, options and section | Only approved v1 types are allowed; system account fields are not represented here |
| `userProfileValues` | A user id + field id + validated value | Values are accepted only for active schema fields and are removed with a deleted account |

## Supported v1 field types

The runtime renderer supports **text**, **textarea**, **number**, **date**, **dropdown** and **checkbox**. Every value is validated again on the server against the currently active field definition. Dropdown values must match their configured options; number and date values use canonical formats; required fields cannot be submitted empty.

> Image upload, arbitrary e-mail/password fields, external document collection, multi-select options, drag-and-drop ordering and audit-log/IP capture are deliberately outside this first version. They require separate storage, retention, privacy and audit decisions before implementation.

## Founder workflow

Within the existing **Users** module, the Founder opens **Configure create form**. The Builder can add or remove sections, add/edit/disable/delete safe field metadata, choose section placement, set required flags, ordering, placeholders and dropdown options. The **New user** modal then renders the fixed account-access section followed by the active configured sections and ungrouped fields.

## Data integrity and compatibility

Adding a field never changes existing `users` columns or invalidates existing accounts. A missing profile value is rendered as an empty/unchecked value. Removing a field definition removes only its associated optional values; deleting a section preserves its field definitions by setting their section reference to null. Deleting a user removes only that user’s optional profile values alongside the account.
