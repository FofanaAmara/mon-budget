# Session — 2026-10-23 — Vérification depuis l’invitation

**Plan :** `.Codex/plans/espaces-financiers-session-and-delivery.md` ; DEC-004.

## Objectif
Permettre au destinataire connecté non vérifié de demander et saisir un code avec Neon, puis de revenir à l’acceptation distincte.

## Journal
Documentation officielle : API OTP dédiée disponible ; choix ciblé sans configuration globale de l’inscription. Actions serveur gardées par session fraîche/acteur/adresse/invitation. UI envoi/saisie/reprise avec contrôle des réponses tardives, aucune adhésion automatique. Tests des actions et du vrai SDK, vraie SQL avec Auth simulé, banc Chromium avec bords simulés ;246unit et99PG verts.
Recette CUA sur invitation réelle non vérifiée : rendu/saisie375et1280sans soumission externe. Survol générique des boutons de liste rendait le primaire illisible. Sélecteur limité aux lignes de réglages, états désactivés lisibles ; captures avant/après et revue fermée.
Ancien banc6cas et nouveau7cas verts ; nouveau banc inclus dans CI. Build/types/lint0warning/7gardesworkflow verts dans copie isolée. Aucun push/runCI/mailOTPexterne, pas de DBsource.

## Résumé
Tranche technique vérifiée, livraison globale ouverte. Réception et vérification OTP réelles restent à exécuter, ainsi que l’adhésion et les contributions à deux. État de reprise dans state.md ; preuves détaillées invitation-verification-execution.md.

## Fichiers modifiés
lib/actions/invitation-verification.ts ; lib/actions/invitations.ts ; components/spaces/InvitationVerification.tsx ; app/invitation/[token]/page.tsx ; app/spaces.css ; trois tests unitaires/contrat et suite PG ; banc navigateur verification(html/main/auth/services/check), configuration Vite/adaptateur de liens ; package.json ; workflow/gardeCI ; plan/décision/session/matrice/state/tâches/discoveries/mémoire.
