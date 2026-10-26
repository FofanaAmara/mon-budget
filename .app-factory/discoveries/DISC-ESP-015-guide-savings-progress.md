# DISC-ESP-015 — Pot d’épargne compté comme dépense de configuration

Date : 2026-10-23. Correction et preuve de régression.

## Constat
Patrimoine personnel sans dette, revenu récurrent ou dépense : seul pot technique Épargnelibre0, mais guide1/4. getOrInitSetupGuideData comptait toute ligneexpenses active. Les projets d’épargne PLANNED et FREE_SAVINGS partagent cette table sans représenter une dépense configurée.

## Correction
L’étapeexpense exige un typeRECURRING ouONE_TIME actif. Préserver la prise en compte historique des ponctuelles, documentée dans les tests existants ; exclure projets et pots techniques. Aucun montant, date de guide ou schéma migré.

## Preuves
Capture réelle guide-free-pot-before.jpg, après stable guide-free-pot-after-steady.jpg :1/4→0/4 avec même patrimoine0. TestPG sur clone synthétique, RED39076 exit1(false attendu/true obtenu), puis100services/6fichiers81042exit0. Cas potlibre/objectif/inactif exclus,ONE_TIME/RECURRING actifs admis. SQLREADONLY partagé4/4 etpersonnel0/4, total personnel0.00. Build/types/lint/9delivery56136exit0 en copie isolée. Objectif global non atteint ; pas de nouvelle adhésion ou preuveMCP.

## Autre correction de guide
Branche de sous-titre4/4 manquante ajoutée : « Tout est prêt ! » remplace « Déjà à mi-chemin ! ». Reproduction via bouton Revoir et captures avant/après desktop/mobile, sans modification de finances ou de seuils. Pas de test miroir pour cette seule phrase.
