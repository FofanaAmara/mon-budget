# DISC-ESP-002 — Vulnérabilités du socle existant

Type : TECH_DEBT. Severity : P1. Discovered by : Codex. Discovered during : espaces financiers, ajout du transport SMTP. Blocking : Oui pour livraison finale sécurisée ; travail local indépendant possible.

## Description
npm audit exécuté2026-10-23 :31alertes,3low/7moderate/17high/4critical. Comparaison avec audit du package-lock HEAD avant cette tranche : mêmescomptages et aucun nouveaupackagevulnérable. Nodemailer10.2.1 absent des alertes. Quatrepackages critiques : next, better-auth, vitest, @vitest/coverage-v8. Les détails/chaînes exactes sont dans les rapports privés .local/financial-spaces/invitations-audit.json et audit-baseline/report.json.

## Impact
L’authentification et le serveur de l’app sont concernés, en plus des outils de test. Une tranche feature verte ne résout pas ces alertes et ne constitue pas une validation production.

## Recommandation
Identifier les versions corrigées depuis les sources primaires et les compatibilités Neon Auth/Next/React ; appliquer les mises à jour nécessaires sur branche locale, régénérer lockfile, tester contratsauth et feature, réauditer. Ne pas lancer audit fix --force ni réduire les gates.

## Status
PARTIALLY_RESOLVED — Next 16.4.2, Neon Auth 0.6.0-beta et Vitest 4.1.12 installés et testés. Audit de production : zéro alerte ; quatre critiques initiales résolues. Installation propre et graphe vérifiés sans erreur.

Restent cinq alertes high de développement dans la chaîne ESLint Next → fast-glob/micromatch → braces 3.0.3 (GHSA-vfj7-8cjw-p6xm). Aucun patch braces disponible à la vérification ; le downgrade ESLint Next 14 suggéré par npm est incompatible et rejeté. Globs contrôlés par le dépôt, chaîne absente du runtime produit. Risque technique limité au développement accepté sous consigne d’autonomie, sans masquer le rapport ni déclarer le goal livré. Suivre un correctif amont.

Voir DEC-002 et `.Codex/plans/espaces-financiers-evidence/dependency-repair-execution.md`. Rapports finaux privés dans `.local/financial-spaces/dependency-repair/`. Aucun push ou déploiement.
