# Classification: FIX-MIN-005

Date: 2026-03-05
Level: 1
Scope: [backend, frontend]
Fast track: YES

## Rationale
Backend: add pre-check for linked expenses + cascade/nullify options. Frontend: enhance inline confirmation with expense count. Pattern already exists (inline confirm "Supprimer ? Oui | Non"). Extends it with conditional warning.

## Notes
- Simplest approach: before delete, count linked expenses. If count > 0, set section_id = NULL on those expenses (nullify), then delete section.
- The AC says "move to another section OR delete expenses" but moving requires a section picker UI which is heavy. Pragmatic: nullify (set section_id = NULL, expenses become "unsectioned") + delete section. This preserves the expenses (they're not deleted) and removes the section.
- Alternative: cascade SET NULL in the DB constraint itself — but that's a migration and less explicit.
