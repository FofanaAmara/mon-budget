# Safari and Secure localhost cookies

What happened: the user could sign in using Chrome but Safari returned to login on plain HTTP localhost.
Why it happened: Chromium accepted Secure/__Secure cookies through its loopback exception; installed WebKit26 rejected them. Testing Chrome alone hid the transport failure.
How to prevent: use local HTTPS for Auth development while retaining Secure/HttpOnly protections. Keep certificates private and do not silently install a system CA. Test cookie return in both Chromium/WebKit and distinguish certificate acceptance from actual hosted login. When retaining an HTTP redirect on another localhost port, do not apply development HSTS to that host; keep production HSTS intact.
