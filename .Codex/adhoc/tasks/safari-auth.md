# Safari login and Chrome session failure

| Task | Depends on | State |
|---|---|---|
| Reproduce browser/session failure | none | COMPLETED: WebKit rejects HTTP Secure cookie, Chromium accepts |
| Implement root-cause correction | reproduction | COMPLETED: localHTTPS, legacy redirect, per-render session sharing |
| Verify WebKit and Chromium | correction | COMPLETED: cookie/app redirect; no hosted credentials used |
| Verify upstream recovery and isolation | correction | COMPLETED: true Next production fixture/browser, fresh users/requests/error retry |
| Quality and documentation | verification | COMPLETED:265unit/99PG/9delivery/build/types/lint; private proofs, no push |


## Reconnaissance du certificat local

| Tâche | Dépendance | État |
|---|---|---|
| Vérifier cause des avertissements et portée de confiance | certificat existant | COMPLETED : autosigné non reconnu, HTTP incompatible WebKitSecure |
| Préparer commande limitée au certificat/localhost/utilisateur | diagnostic | COMPLETED :dev:spaces:trust, SSLlocalhost/utilisateur, refusCA et clésincompatibles |
| Vérifier préparation et absence d’installation implicite | commande | COMPLETED :dry-run réel,11deliveryverts etlint ciblé0warning |
| Installation humaine puis test MCP sans exception TLS | handoff | PENDING |
