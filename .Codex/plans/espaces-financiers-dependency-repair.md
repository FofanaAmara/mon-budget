# Réparation du socle avant recette finale des espaces

Plan parent approuvé : `.Codex/plans/espaces-financiers-implementation.md`.
Discovery : DISC-ESP-002. Révision 2, 2026-10-23 : décisions prises sous la consigne d’autonomie, sans AWM.

## État initial

Le commit 3cced35 fournit les parcours locaux de création et d’invitation. La réception Resend et les parcours Auth à deux sessions restent à prouver. L’audit initial recense 31 alertes préexistantes, dont quatre critiques, dans Next, Better Auth et Vitest. Versions initiales : Next 16.1.6, Neon Auth 0.2 beta et Vitest 4.0.18.

## Écarts et stratégie

Mettre à jour les versions corrigées et conserver React 19.2.3 ainsi que la majeure 4 de Vitest. Vérifier le graphe publié de Neon plutôt que se fier au numéro le plus récent : le SDK 0.6 correspond au peer de son UI ; ses transitives sont alignées sur la matrice officielle Neon. Ne pas employer audit fix --force, legacy-peer-deps ou une réduction silencieuse des gates.

La revue a identifié une incompatibilité RSC : le SDK écrit des cookies et peut émettre une seconde requête implicite. Séparer lecture serveur autoritative sans mutation et opérations Auth autorisées à renouveler les cookies. Les décisions d’invitation doivent demander une session fraîche.

Next 16.4 écrit aussi la configuration après son signal Ready. Préserver les octets humains avant toute commande génératrice et ne restaurer automatiquement que les modifications générées connues.

## Séquence et dépendances

1. Examiner les sources officielles et sauvegarder lock/config avant installation.
2. Mettre à jour Next/ESLint, Neon et Vitest ; contrôler une installation propre et le graphe de dépendances.
3. Adapter les contrats Auth, tester la lecture RSC et la fraîcheur des mutations ; corriger les incompatibilités de lint sans affaiblir les règles.
4. Vérifier unitaires, PostgreSQL, migrations, navigation isolée, types, lint, build et audit. Puis démarrer la recette et vérifier la conservation des configurations.
5. Fermer les findings par revue indépendante, consigner les preuves et créer un commit local.
6. Reprendre la recette globale du plan parent : Auth réel, réception externe, caches, CI, matrice et Playwright MCP.

## Critères de la tranche

Installation npm ci et npm ls sans erreur ; aucun avis critique ; audit de production sans alerte ; résultats des suites exécutées conservés. Les alertes sans patch restent explicites dans DISC-ESP-002. L’absence de validation navigateur ne vaut pas réussite de cette validation.

Source PostgreSQL, baseline et archive inchangées. Aucun push, déploiement ou envoi externe sans autorisation applicable.

## Effort

Estimation initiale : 15–25 k jetons ; coût monétaire indisponible. La tranche a été étendue par les reproductions RSC et les écritures tardives de Next, documentées dans les preuves. Aucun service payant engagé.
