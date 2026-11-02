# DISC-ESP-008 — Réservation de navigation sans navigation

État : corrigé techniquement et vérifié sur Auth desktop/mobile ; contrôle financier mobile final ouvert.
Détection : vraie recette revenus1280x720 et connexion375x812, body global réserve68px en bas et48px en haut mobile même si ces composants sont absents.
Cause : règle globale indépendante du LayoutShell.
Correction : body0, réservation mobile seulement body:has(.space-product-content). Override onboarding/landing conservé.
Preuve : rapport isolation-current-execution ; captures avant/après dans trace ChromeDevToolsMCP, mesures réelles et scan page entière ; build/types/lint/gardes verts.
Impact métier : aucun. Validation PlaywrightMCP globale et mobile financier authentifié toujours ouvertes.
