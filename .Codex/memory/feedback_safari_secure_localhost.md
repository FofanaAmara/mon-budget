# Safari and Secure localhost cookies

What happened: the user could sign in using Chrome but Safari returned to login on plain HTTP localhost.
Why it happened: Chromium accepted Secure/__Secure cookies through its loopback exception; installed WebKit26 rejected them. Testing Chrome alone hid the transport failure.
How to prevent: use local HTTPS for Auth development while retaining Secure/HttpOnly protections. Keep certificates private and do not silently install a system CA. Test cookie return in both Chromium/WebKit and distinguish certificate acceptance from actual hosted login. When retaining an HTTP redirect on another localhost port, do not apply development HSTS to that host; keep production HSTS intact.

A local HTTPS endpoint with an untrusted self-signed leaf is only a partial fix: it still blocks fresh browsers and service workers. Prepare an explicit, reviewable trust step and verify a fresh browser without TLS exceptions before claiming completion. This project now provides dev:spaces:trust (dry run) and an explicit human --install scoped to the leaf/localhost SSL/user keychain; never install it silently to bypass a browser warning.
