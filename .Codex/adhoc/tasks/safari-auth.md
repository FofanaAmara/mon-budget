# Safari login and Chrome session failure

| Task | Depends on | State |
|---|---|---|
| Reproduce browser/session failure | none | COMPLETED: WebKit rejects HTTP Secure cookie, Chromium accepts |
| Implement root-cause correction | reproduction | COMPLETED: localHTTPS, legacy redirect, per-render session sharing |
| Verify WebKit and Chromium | correction | COMPLETED: cookie/app redirect; no hosted credentials used |
| Verify upstream recovery and isolation | correction | COMPLETED: true Next production fixture/browser, fresh users/requests/error retry |
| Quality and documentation | verification | COMPLETED:265unit/99PG/9delivery/build/types/lint; private proofs, no push |
