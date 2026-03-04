# FIX-MIN-005 — No cascade protection on section delete

## Type
FIX

## Severity
MINEUR

## Feature
gestion-sections

## Description
In sections.ts, deleting a section does not handle the expenses linked to it. Depending on the DB constraint setup, this either (a) causes a foreign key violation error that crashes the delete, or (b) silently orphans all expenses under that section, making them invisible in the UI. Neither outcome is acceptable.

## Acceptance Criteria
Given a section has expenses linked to it
When the user attempts to delete the section
Then the app shows a confirmation dialog listing the affected expenses and offers options: (1) move expenses to another section, or (2) delete expenses along with the section

Given a section has no linked expenses
When the user deletes the section
Then the section is deleted without any warning

## Technical Notes
- Files to modify: `src/app/actions/sections.ts`, potentially the section delete UI component
- Root cause: DELETE query has no pre-check for dependent records and no cascade/reassignment logic
- Fix approach: Before delete, query for linked expenses. If any exist, return an error with the count or prompt for reassignment. Optionally support CASCADE DELETE with user confirmation.
- Dependencies: None

## Size
S
