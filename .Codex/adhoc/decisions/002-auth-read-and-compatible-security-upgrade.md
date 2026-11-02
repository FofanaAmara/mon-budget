# DEC-002 : Socle corrigé et lectures de session sans mutation

**Date :** 2026-10-23
**Status :** Active

## Contexte

DISC-ESP-002 établit 31 alertes préexistantes, dont quatre critiques. La mise à jour doit préserver la vérification du destinataire et le rendu serveur Next. L’humain demande de décider pendant son absence.

## Options considérées

- Conserver le socle : laisse des alertes critiques sur l’authentification et le serveur ; rejeté.
- Installer les derniers numéros sans contrôler les peers : Neon 0.7 duplique un SDK attendu en version 0.6 par son UI ; rejeté.
- Aligner les versions corrigées et les contrats effectifs : retenu.

## Décision

Next et ESLint Next 16.4.2, Vitest et coverage 4.1.12, Neon Auth 0.6.0-beta. React 19.2.3 est conservé. Le seul sous-graphe Neon reprend les pins de sa matrice officielle : Better Auth/core/passkey/telemetry/api-key 1.7.6, better-call 1.4.0, better-fetch 1.3.2 et utils 0.4.2 pour la plage 0.4. Le peer optionnel AJV 8 du résolveur de formulaire est fourni explicitement en développement ; ESLint conserve AJV 6 dans son propre graphe. npm ci et npm ls complets sont vérifiés.

La lecture autoritative sans mutation est le défaut de requireIdentity, y compris pour les pages et gardes financiers ; hasSeenOnboarding utilise aussi ce lecteur. Les mutations d’invitation utilisent le SDK avec disableCookieCache:'true'. SameSite Lax est configuré à la source et remplace l’ancien patch de réponse. Le rendu RSC emploie un unique GET public get-session avec préfixe d’URL conservé, cookies Neon filtrés, protocole de version SDK, cache et refresh désactivés, no-store, redirections refusées et délai de dix secondes. Il ne renouvelle aucun cookie et n’émet aucun mint implicite. Les pannes ou réponses invalides échouent explicitement sans repli sur un cache. Null/401 signifient absence de session. Le parseur officiel reste utilisé.

Next 16.4 peut écrire après Ready. Le lanceur local surveille les deux configurations générées et restaure exclusivement les changements Next connus. Un changement humain inattendu est préservé et arrête le processus appartenant à la recette. La génération automatique d’AGENTS.md est désactivée par agentRules:false pour préserver la gestion explicite des instructions du dépôt.

## Conséquences et limites

Sept tests de contrat exécutent les chemins de production requireIdentity et hasSeenOnboarding ; six tests couvrent le garde de configuration, dont les changements humains. Les acceptations concurrentes PostgreSQL vérifient chacune la demande de session fraîche.

L’audit de production ne signale aucune alerte. Cinq alertes high restent dans la chaîne de développement ESLint/fast-glob/micromatch/braces 3.0.3, avis GHSA-vfj7-8cjw-p6xm. Aucun patch braces n’est publié à la vérification ; la suggestion npm de rétrograder ESLint Next 14 est incompatible. Les globs sont contrôlés par le dépôt ; cette chaîne n’est pas exposée dans le runtime produit. Risque limité accepté pour poursuivre le développement, discovery maintenue ouverte ; aucune déclaration de livraison globale.

Le navigateur a refusé l’accès pendant cette tranche. Les preuves précédentes ne sont pas une validation visuelle de la nouvelle version. Réception externe et Auth réel à deux sessions restent à établir.

## Sources

- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://raw.githubusercontent.com/neondatabase/neon-js/main/package.json
- https://raw.githubusercontent.com/neondatabase/neon-js/main/packages/auth/CHANGELOG.md
- Métadonnées npm officielles et sources installées ; rapports privés dans .local/financial-spaces/dependency-repair/.
