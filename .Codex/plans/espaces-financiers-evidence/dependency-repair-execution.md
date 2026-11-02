# Preuves — réparation des dépendances et lecture Auth

Date : 2026-10-23. Plan : `.Codex/plans/espaces-financiers-dependency-repair.md`. Décision : DEC-002. Feature globale toujours en cours.

## Changements vérifiés

Next 16.4.2, Neon Auth 0.6.0-beta et Vitest 4.1.12. Codemod officiel middleware-to-proxy en dry-run : aucun changement requis. Installation propre finale réussie ; npm ls --all ne relève aucun problème de graphe. Audit initial : 31 alertes dont quatre critiques. Audit final : cinq high dans le lint ; audit de production : zéro alerte. Risque résiduel documenté dans DISC-ESP-002.

Le lecteur RSC est sans mutation ni requête SDK implicite. Il est le défaut de requireIdentity pour toutes les pages ; la lecture annexe hasSeenOnboarding l’utilise également. Les mutations d’invitation demandent une session fraîche. Suppression de l’ancien patch de cookie ; configuration SameSite Lax officielle. Reproduction puis correction des incompatibilités : cookie interdit en RSC, peer AJV mal résolu après installation propre, logger SDK partiel, écritures Next après Ready. Tests de contrat sur le véritable adaptateur avec transport simulé, sans prétendre prouver l’Auth hébergé.

## Résultats exécutés

| Contrôle | Résultat | Portée |
|---|---|---|
| Unitaires Vitest | 206/206 | Dont sept contrats Auth et six gardes de config |
| Services PostgreSQL | 95/95 | DB réelle isolée ; identité Auth simulée |
| Migrations | 21/21 | Conservation/rejeu/contraintes sur copies |
| Navigation navigateur isolée | 6/6 | Vrais composants ; routeur/actions simulés |
| TypeScript | 0 erreur | tsc --noEmit |
| Lint | 0 erreur, 15 warnings | Avertissements visibles, règles conservées |
| Build Next 16.4.2 Webpack | Succès | Routes app et proxy générés ; Turbopack bloqué par environnement |
| Installation propre / graphe | Succès / 0 problème | Lockfile final |
| Revue indépendante | P1 et P2 fermés | Lecture seule ; pas de revue globale du goal |

Les rapports détaillés privés sont dans `.local/financial-spaces/dependency-repair/` : unit.log, types.log, lint.log, build-webpack.log, build-turbopack-blocked.log, clean-install-final.log, dependency-tree-clean-final.json, audit-final.json et audit-production.json. Les 95 tests PG ont été réexécutés après le changement du lecteur par défaut. Les suites migrations/navigation ont été produites auparavant sur les mêmes schémas/composants. Le dernier build a d’abord échoué sur l’accès réseau à Google Fonts ; relancé avec accès réseau, il a été bloqué par la création du processus CSS Turbopack (bind port, EPERM). Le build Webpack officiel a ensuite terminé avec succès sur le dernier code, sans substitution de police. Configurations sauvegardées puis restaurées dans tous les cas. Le build Turbopack final ne peut pas être compté vert.

## Recette et limites

`npm run dev:spaces` démarre la vraie app sur http://localhost:3002 avec spaces_work17 et Mailpit. Le runtime a survécu aux écritures tardives de Next ; tsconfig est revenu aux octets HEAD et le diff next-env préexistant est conservé. Pas de boucle de redémarrage observée. Un build lancé pendant la recette a ensuite déclenché le garde sur sa génération différente : arrêt explicite de la recette, aucun écrasement silencieux ; après fin du build et restauration, recette redémarrée. Séquencer désormais build et dev, car ils partagent les fichiers de configuration même avec des dossiers de sortie distincts. Baseline, source et archive before_invitations inchangées.

L’ouverture de l’onglet a été refusée par la politique du navigateur ; aucune autre surface n’a été utilisée pour contourner ce refus. Aucune preuve visuelle nouvelle, aucun Playwright MCP, aucune preuve de réception Resend ou de création de compte ajoutée. Les captures de la tranche précédente gardent leur portée antérieure. Pas de push, déploiement ni mail externe.

## Suite

Reprendre la matrice des 17 exigences et 30 AC, la recette Auth réelle à deux sessions et réception externe autorisée, puis les preuves caches/offline/CI/Playwright MCP. Le goal reste actif.
