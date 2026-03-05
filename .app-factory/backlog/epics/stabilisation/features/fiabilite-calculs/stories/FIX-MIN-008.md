# FIX-MIN-008 — No cron job for push notification delivery

## Type
FIX

## Severity
MINEUR

## Feature
push-notifications

## Description
The push notification endpoint exists at `api/push/send` but there is no scheduled trigger (cron job) to invoke it. Push notifications are never actually sent because nothing calls the endpoint on a recurring basis. The entire notification feature is effectively dead code in production.

## Acceptance Criteria
Given the app is deployed on Vercel
When the configured cron schedule triggers (e.g., daily at 8:00 AM ET)
Then the `/api/push/send` endpoint is called and pending notifications are delivered

Given no pending notifications exist
When the cron triggers
Then the endpoint returns successfully with no notifications sent (no error)

## Technical Notes
- Files to modify: `vercel.json` (add cron configuration), potentially `src/app/api/push/send/route.ts` (ensure it handles cron auth)
- Root cause: Missing Vercel cron configuration
- Fix approach: Add a cron entry in `vercel.json` targeting `/api/push/send`. Add a secret-based auth check in the route to prevent unauthorized calls. Vercel free plan supports 1 cron job per day.
- Dependencies: None (endpoint already exists)

## Size
S
