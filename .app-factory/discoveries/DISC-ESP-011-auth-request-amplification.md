# DISC-ESP-011 - Auth request amplification and failed-page recovery

State: per-render amplification corrected and error recovery tested.
Report: Chrome expense route crashed when readSession received non-2xx. Historical HTTP status is unknown; do not call it429/503 without evidence.
Cause confirmed independently: ten concurrent session reads in a true Next RSC render made ten upstream requests. Layout/page/actions repeated the same authoritative read without request-scoped sharing.
Fix: React.cache wraps only the read-only reader, scoped to one render. New requests and different users reverify independently; fresh mutable verification remains on the SDK. Errors stay fail-closed. Log only numeric upstream status, no response/cookie/identity.
Recovery: parent spaces error boundary exposes no private data and reloads the same URL/query. Actual production fixture showed reset alone did not refetch the failed server payload; full reload was verified to recover.
Proof: RED actual10!=1; final production RSC/browser probe passes1perrequest, no cross-user retention,503thenrecovery and retry. 265unit/99PG/build/types/lint/9delivery pass. Upstream provider incident itself cannot be retrospectively identified; recurrence is now diagnosable by safe status.
