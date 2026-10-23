# Baseline réelle — continuité des espaces financiers

Date : 2026-10-22 (Toronto). Observation CUA Chrome extension sur http://localhost:3001/, mobile375×812 d’abord, desktop1280×900 ensuite. Aucun test Playwright MCP revendiqué. Session déjà authentifiée : pas de login ni de soumission. Navigation, onglets et formulaires seulement ; aucun changement de préférences ni de données financières demandé/exécuté. Deux onglets propres fermés, viewport réinitialisé. Les captures contiennent un compte réel : preuves locales uniquement, ne pas publier.

## Écrans réellement vus et éléments à conserver

- **Shell mobile** : header fixe48px, marque « Mes Finances » à gauche (petit symbole32px avec marge interne), avatar teal à droite ouvrant un menu compact identité/courriel/déconnexion. Bottom-nav5 positions : Accueil, Depenses, Revenus, Patrimoine, puis icône hamburger vers Réglages (sans label). Icônes : maison, carte, dollar, horloge, hamburger. Pas de menu latéral mobile actuellement : l’accès sidebar des espaces est un ajout de feature, pas un remplacement de la navigation.
- **Shell desktop** : sidebar260px blanche, marque dans une zone haute bordée (environ85px), nav verticale5 liens, fond teal pâle + filet ambre gauche sur actif. Compte/avatar en pied. Contenu conservé centré max672px (`max-w-2xl`), pas étalé en dashboard pleine largeur. Le breakpoint réel est768px, pas1024px.
- **Accueil** : « Bonjour », mois et chevrons, grand montant central teal, « Disponible ce mois-ci », badge « Ton mois est sous contrôle ». Trois onglets : Tableau de bord, Timeline, Santé financière. Dashboard = quatre cartes2×2 revenus/dépenses/épargne/dettes, icône en haut et chevron, nom uppercase discret, gros montant, sous-texte, puis bandeau Valeur nette. Timeline vide = calendrier puis « Aucun événement ce mois ». Santé = jauge circulaire80/100, message, alertes, métriques. Pas de liste de dépenses sous les cartes du dashboard.
- **Dépenses** : mois en haut, monument « DÉPENSES », fraction dépensé/prévu avec dollar petit et dénominateur gris, barre progression, pourcentage/restant aux deux extrémités. Onglets Toutes/Récurrentes/Ponctuelles puis pills catégories horizontales. Label DÉPENSES(N). Vide calendrier/explication. FAB rond mobile à droite ; bouton « Nouvelle dépense » desktop. La session a des catégories répétées (Maison×3 etc.) : anomalie de données préexistante observée, ne pas en faire un pattern nouveau.
- **Ajout dépense** : feuille depuis bas, fond assombri/flouté, rayon24px en haut et poignée. « Nouvelle dépense », label uppercase, champ nom, grand champ montant centré, section/carte côte à côte, date optionnelle, boutons statut À venir/Déjà payée, footer Annuler/Ajouter. Pas de grand formulaire de page inventé.
- **Revenus** : mois, monument REVENUS fraction reçu/attendu, « reçu sur attendu ce mois-ci ». Deux onglets **Revenus / Allocation** (singulier). Sections REVENUS RÉCURRENTS(N) avec lien Gérer dans Réglages et REVENUS PONCTUELS(N). Cartes groupées blanches. FAB mobile revenu ponctuel et bouton desktop.
- **Ajout revenu** : feuille bas à poignée, titre « Revenu ponctuel », croix unique, Description, Montant($), Source puis bouton « Ajouter ce revenu ». Aucun split-screen illustré visible.
- **Allocation** : toujours dans Revenus. Carte résumé2 colonnes Total alloué/Dispo. attendu ; enveloppes ou état vide ; bandeau Reste libre ; lien Gérer les enveloppes dans les Réglages. Ne pas ajouter Allocations à la sidebar.
- **Patrimoine** : monument PATRIMOINE/valeur nette, sous-texte épargne/dettes, badge En croissance ; résumé épargne/dettes2 colonnes ; section ÉPARGNE avec Nouvel objectif, carte Épargne libre avec badges Permanent/Pot libre et actions +/transférer/historique ; état objectifs vide ; section DETTES et Nouvelle dette. Ne pas réduire à deux compteurs.
- **Réglages** : label RÉGLAGES central, icône engrenage dans tuile teal pâle, « Personnalisez votre expérience ». Ligne Mon compte séparée. Groupe Gestion : catégories dépenses, dépenses récurrentes, revenus récurrents, Allocation du revenu, cartes paiement. Groupe Preferences : devise/rappels/notifications. Groupe Donnees : guide/demo/vider puis déconnexion. L’ajout Espace et membres doit prolonger les listes, pas remplacer ces réglages par des raccourcis financiers.
- **Charges récurrentes et revenus récurrents** : breadcrumb Réglages, monument montant + nombre/mois, badge actif, section modèles/sources et état vide. Raccord gestion existant.
- **Onboarding** : URL `/onboarding` retourne404 dans la version réellement servie. Ne pas inventer sa disponibilité. Le carrousel est un overlay à la racine (`OnboardingCarouselWrapper.tsx`) ; sa fin écrit `markOnboardingSeen`, donc je ne l’ai pas relancé ni achevé sur la session réelle pour préserver les préférences. Pour la nouvelle étape, prendre le style réel du carrousel source (slide blanche à grand titre, corps vertical, nav en bas), pas le formulaire carte initial inventé. Point de raccord actuel `/?guide=open`.

## Sources utiles après la visite

`components/BottomNav.tsx` : logo, header, sidebar, footer compte, icônes et actif.
`components/LayoutShell.tsx` : wrapper mobile512/desktop672 et marge260.
`components/AccueilClient.tsx`, `components/accueil/TabTableauDeBord.tsx`, `TabTimeline.tsx`, `TabSanteFinanciere.tsx` : structures exactes accueil/onglets.
`components/depenses/ExpenseMonument.tsx`, `ExpenseFilters.tsx`, `components/AdhocExpenseModal.tsx` : dépenses et feuille.
`components/RevenusTrackingClient.tsx`, `components/revenus/RevenusMonument.tsx`, `IncomeTrackingTab.tsx`, `AllocationTrackingTab.tsx`, `components/AdhocIncomeModal.tsx` : revenus/Allocation/feuille.
`components/ProjetsEpargneClient.tsx`, `components/ParametresClient.tsx`, `ExpenseTemplateManager.tsx`, `IncomeTemplateManager.tsx` : patrimoine et réglages.
`components/onboarding/OnboardingCarousel.tsx`, `OnboardingCarouselWrapper.tsx`, `app/globals.css` (section ONBOARDING CAROUSEL) : onboarding réel.
Tokens réels de `app/globals.css` : Snow#FAFBFC, white, teal#0F766E, ink#0F172A, muted#64748B, line#E2E8F0, rayons8/12/18/24, Plus Jakarta Sans. Les montants accueil sont revenu attendu moins dépenses (pas moins épargne une seconde fois). L’ancienne démo retranchait encore l’épargne : corriger ses chiffres si cette formule est reprise.

## Preuves locales

Dossier `.tmp/cs-espaces-financiers/continuity/before/` :

- live-home-375.png, live-health-375.png
- live-depenses-375.png, live-expense-form-375.png
- live-revenus-375.png, live-income-form-375.png, live-allocation-375.png
- live-patrimoine-375.png
- live-settings-375.png, live-charges-375.png, live-recurring-income-375.png
- live-onboarding-route404-375.png
- live-home-1280.png, live-depenses-1280.png, live-revenus-1280.png
- old-mock-home-375.png (première passe, comparaison démontre le défaut).

Captures full-page. Les images ont été vues lors des captures ; animations d’entrée peuvent laisser certains éléments pâles sur quelques captures desktop. La baseline est une observation visuelle réelle, pas un verdict de maquettes corrigées.

## État à la nouvelle instruction React

L’humain demande désormais des mockups **React**, aucune bibliothèque. Arrêt immédiat de l’édition HTML. Première passe préservée intégralement dans `.tmp/cs-espaces-financiers/previous-standalone/`. Une correction JS de structure financière venait d’être commencée ; elle est **inachevée/non validée/non livrable** dans `.tmp/cs-espaces-financiers/continuity/interim-unfinished-experience.js`. Le fichier `mockups/experience.js` a été restauré byte-for-byte depuis la sauvegarde pour ne pas laisser une moitié de refonte incompatible avec l’ancien CSS. Aucun HTML/CSS modifié. Aucune nouvelle bibliothèque, aucune intégration application, aucun commit/push.

À reprendre en React : même shell/structures/screens réels avec seulement sélecteur sidebar, création, gestion membres et invitations, étapes onboarding nécessaires. Les acquis BR-01 de l’ancienne démo restent le contrat : zéro invitation en attente dès acceptation, confirmation persistante après reload, espace actif modifié seulement par Ouvrir cet espace. DR-01 : `.breadcrumb a` doit avoir44px (ancienne règle typo `.breadcrumbs a`). Ancien APPROVED superseded, nouvelle revue comparative requise.
