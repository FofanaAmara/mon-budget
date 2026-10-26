# DISC-ESP-010 - Safari local login loses Secure cookie

State: root-cause correction implemented and browser transport verified; real user login must be retried.
Report: Safari remained on login while Chrome succeeded at localHTTP3002.
Cause: real Chromium145 returned a Secure/__Secure cookie on HTTP localhost; WebKit26 returned the ordinary control cookie but rejected the secure cookie. Neon SDK always emits Secure session cookies. Safari installed26.6.2. Official reference: https://bugs.webkit.org/show_bug.cgi?id=231035 .
Fix: owned recipe HTTPS3443 with project-only certificate; HTTP3002 redirects old links preserving path/query. Keep Secure/HttpOnly/SameSite and all session checks. Explicit HTTPS app origin; no system CA/trust changes. No local HSTS pin, production policy unchanged.
Proof: private http-before.json/https-after.json; both engines retain secure cookie on HTTPS and reach real app login from old URL. Login screenshots scanned. No hosted login or real credential submitted by tests.
