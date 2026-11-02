# Request-scoped Auth and retrying server failures

What happened: a user saw AuthSessionUnavailableError on expenses; the actual upstream status was not recorded. A real RSC fixture exposed ten upstream reads for ten guards. A new retry boundary initially reset React but reused the failed server payload.
Why it happened: no render-scoped session sharing, and reset was assumed to imply a new authoritative server request.
How to prevent: share authoritative reads only with React.cache per render, never a global cookie/user cache. Prove fresh users and later requests independently, including failure then recovery. Preserve explicit fresh mutation verification. Log safe numeric status only. Test the real Next production boundary; a same-URL full reload reliably retries the server when resetting the client boundary does not.
