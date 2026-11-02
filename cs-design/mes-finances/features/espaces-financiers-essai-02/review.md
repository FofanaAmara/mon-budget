# Regard neuf — mockups React

2026-10-22. Verdict : continuité visuelle convaincante et parcours ciblés utilisables ; un point Medium à corriger avant remise.

Revue réellement réalisée dans Chrome via CUA, pas Playwright MCP. Vraie application observée en lecture seule à375×812 (accueil) et1280×900 (dépenses). Prototype observé à375×812 puis1280×900 : shell, accueil, sidebar, feuilles de création, invitation, inscription simulée, gestion des membres, dépenses et réglages. Navigation cinq entrées et dashboard trois onglets conservés. Différences de données/notifications annoncées dans README ; comparaison non pixel-identique. Aucune mutation de la vraie application.

Parcours joués : créer « Voyage de Camille et Alex » sans invitation → espace vide ; invitation compte existant → accepter → confirmation après reload, Invitations0, actif personnel conservé avant ouverture ; inscription simulée → accepter → ouvrir commun → sélecteur désactivé avec une seule option ; Alex invité peut renommer Notre couple en Notre famille et dispose de l’invitation dans la gestion. Aucun chevauchement nouveau relevé dans ces vues.

## Medium — cible invitation mobile26×26

Reproduction : menu Démo → « Invitation — compte existant ». Dans la ligne des espaces sous le header, bouton « 1 invitation en attente ». Hitbox DOM réellement mesurée26×26px à375 ; exigence du mandat44px. Agrandir la cible interactive en préservant éventuellement le badge visuel26px. Bouton principal « Ouvrir la sidebar des espaces » mesuré340×44 : conforme. Point signalé au parent pour correction ; cette revue ne modifie pas le design.

## Sources et limites

Imports réels vérifiés dans src/App.jsx : LayoutShell, AccueilClient, DepensesTrackingClient, RevenusTrackingClient, ProjetsEpargneClient, ParametresClient et gestionnaires. Aucun diff app/, components/ ou package racine observé dans git status. next-env.d.ts et .serena/project.yml sont modifiés dans le checkout mais préexistants selon la baseline attestée par le parent ; inchangés par cette passe. Cela ne constitue pas une assertion générale de racine Git propre. Aucun build relancé par reviewer : build parent indépendant rapporté ; aucun backend/isolation serveur vérifié, ce sont des mockups.

Preuves reviewer locales dans proofs/review/ : created-space-375.png, accepted-reload-375.png, joined-only-common-375.png, depenses-1280.png, settings-1280.png. Ces captures ont été visuellement examinées pendant la revue. Deux onglets reviewer fermés et viewport réinitialisé. Revue ciblée ; pas de nouvelle certification exhaustive des formulaires financiers existants ni de tests clavier indépendants.
