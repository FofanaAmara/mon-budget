# FIX-MIN-009 — Favicon not cached by service worker for offline PWA use

## Type
FIX

## Severity
MINEUR

## Feature
pwa-install

## Description
The service worker (`sw.js`) and PWA manifest (`manifest.json`) do not include the favicon and PWA icons in the precache list. When the app is installed as a PWA and used offline, the favicon and app icons may fail to load, showing broken image placeholders in the browser tab and on the home screen.

## Acceptance Criteria
Given the PWA is installed on a device
When the user opens the app while offline
Then the favicon and all manifest icons display correctly

Given the service worker is updated
When the precache manifest is inspected
Then it includes all favicon sizes and manifest icon paths

## Technical Notes
- Files to modify: `public/sw.js`, `public/manifest.json`
- Root cause: Favicon and icon assets not listed in SW precache array
- Fix approach: Add all icon paths from manifest.json to the service worker's precache list. Ensure cache versioning is updated.
- Dependencies: None

## Size
XS
