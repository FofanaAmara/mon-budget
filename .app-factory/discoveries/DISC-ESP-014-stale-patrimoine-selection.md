# DISC-ESP-014 — Modale patrimoine figée sur un ancien objet

Date : 2026-10-23. Correction implémentée et régression reproduite.

## Reproduction réelle
Dans l’espace de recette dédié, dette500, charge25.50, ouverture immédiate du versement pendant le rafraîchissement : carte et total525.50 mais modale500. L’écart persiste après arrivée des nouvelles props. Capture privée debt-payment-stale-before.jpg.

## Cause et correction
ProjetsEpargneClient conservait les objetsDebt/Expense sélectionnés dans son état. Le RSC actualisait les collections mais pas ces copies. Stocker les six identifiants sélectionnés et retrouver les entités dans les props courantes à chaque rendu. Ne pas réinitialiser les brouillons. Une entité supprimée ne demeure pas une cible de modale ; les contrôles serveur restent autoritatifs et inchangés.

## Validation
Vraie UI : charge5 supplémentaire puis ouverture immédiate, modale530.50 comme la carte ; versement fictif75.25, recharge455.25. SQLREADONLY confirme500+25.50+5-75.25. Banc Chromium avec vrai parent et vraies feuilles, props/services simulés : échec de l’ancien composantdc01350 sur solde525.50 absent, puis trois cas verts avec correction (solde et brouillon conservé, historique épargne actualisé, cible supprimée masquée). Commande `npm run test:spaces:selection` ajoutée à la CI locale et à son garde ; aucun run distant prétendu.265unit/build/types/lint/9delivery verts, bancnavigation6cas vert. Les preuves simulées ne remplacent ni vraie adhésion ni PlaywrightMCP.
