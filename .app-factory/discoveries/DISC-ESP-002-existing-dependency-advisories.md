# DISC-ESP-002 — Vulnérabilités du socle existant

Type : TECH_DEBT. Severity : P1. Discovered by : Codex. Discovered during : espaces financiers, ajout du transport SMTP. Blocking : Oui pour livraison finale sécurisée ; travail local indépendant possible.

## Description
npm audit exécuté2026-10-23 :31alertes,3low/7moderate/17high/4critical. Comparaison avec audit du package-lock HEAD avant cette tranche : mêmescomptages et aucun nouveaupackagevulnérable. Nodemailer10.2.1 absent des alertes. Quatrepackages critiques : next, better-auth, vitest, @vitest/coverage-v8. Les détails/chaînes exactes sont dans les rapports privés .local/financial-spaces/invitations-audit.json et audit-baseline/report.json.

## Impact
L’authentification et le serveur de l’app sont concernés, en plus des outils de test. Une tranche feature verte ne résout pas ces alertes et ne constitue pas une validation production.

## Recommandation
Identifier les versions corrigées depuis les sources primaires et les compatibilités Neon Auth/Next/React ; appliquer les mises à jour nécessaires sur branche locale, régénérer lockfile, tester contratsauth et feature, réauditer. Ne pas lancer audit fix --force ni réduire les gates.

## Status
OPEN — correction avant livraison finale ; aucun push ou déploiement autorisé.
