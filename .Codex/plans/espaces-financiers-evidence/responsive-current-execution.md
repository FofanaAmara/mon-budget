# Recette responsive et separation de saisies - 2026-10-23

Plan approuve P3/P7/S6/S7/S9/S11, extension du plan session-and-delivery. Code de depart1353d11. Vraie app3002 contre copie locale spaces_work17 ; runtime98404. Aucun AWM, push ou mutation de DBsource.

## Parcours reel observe

- Fiche de l'espace couple sous espace personnel actif :375x812 puis1280x900. Selecteur seul sur sidebardesktop, liste de membres/invitations et formulaire lisibles. Captures haut/bas mobile et desktop.
- Bascule par le selecteur vers couple, puis Depenses. Deux saisies par le formulaire reel :3.99 et1450, noms court/long fictifs. Les deux sont des depenses ponctuelles non payees, aucune operation bancaire reelle. Total exact1453.99.
- Recharge : chacune des deux lignes apparait exactement une fois. Guide couple1/4. Bascule vers Personnel > Depenses :0ligne, guide0/4, aucun des noms du couple. RetourCouple puis URLracine / : dernier espace couple repris.
- Correlation SQL lecture seule dans le clone : couple2lignesfictives/1453.99,personnel0/0,unmembrechacun. Ces donnees de recette restent consultables dans le clone. Pas de membre ou compteAuth cree par ce test.

## Deux defauts visuels corriges

1. A375px le FAB recouvrait le montant1450et son controle de paiement. Cause : placement viewportfixed sans place dans le flux, rehausse quand le guide est visible ; du padding en bas ne protege pas les lignes intermediaires. La meme action Nouvelledepense, deja presente dans l'entete desktop, est maintenant dans le flux sur mobile aussi (typebutton,hauteurminimum44). Le FAB local est retire, la condition mois courant et l'ouverture du meme modal restent identiques.
2. Le total du groupe finissait environ16px a droite des montants de ses lignes. Cause : chevron16+gap8 contre toggle28+gap12. Un rail commun28px et un gap12 alignent leurs fins ; le rail reste reserve quand aucune action de paiement n'est disponible (historique/progressif). Aucun format ni calcul change.

Reproduction exacte avant/apres avec3.99/1450ettotal1453.99, nom long reel, guide visible. Scan du viewport entier et controle apres defilement : montants/controles accessibles, aucun chevauchement nouveau observe. Les titres longs restent ellipses dans la colonne de libelle, sans pousser les montants. Le guide et la navigation fixes delimitent naturellement le bas du viewport ; les lignes completes restent accessibles par scroll.

Modal mobile ouvert depuis le bouton corrige : champs et boutonsAnnuler/Ajouter visibles a375x812, fermeture parEchap observee. Ce test ne constitue pas un audit clavier complet ni preuve des variantes historiques/progressives dans le navigateur.

## Preuves

.local/financial-spaces/responsive-current/ conserve captures privees : space-mobile-375-top.png,space-mobile-375-invitations.png,space-desktop-1280.png ; expenses-mobile-375.png avantFAB ; expenses-mobile-375-after.png et expenses-mobile-375-rows.png apresFAB/avantrail ; expenses-mobile-375-columns-after.png et expenses-desktop-1280-columns-after.png apresrail ; expense-modal-mobile-375.png ; personal-empty-desktop.png ; persistence-proof.json.

CUA et locatorsPlaywright exposes, sessionAuth existante, vrais formulaires/actions/DB. Aucun transport/session simule. Aucun resultat renomme PlaywrightMCP ; outil distinct toujours absent. Viewport temporaire restaure apres les captures.

Revue independante : premier correctif puis extension rail relus au code et captures ; aucun finding. Les actions/calculs et conditions paiement sont preserves. Historique/progressive verifies au code seulement. Checklist React appliquee : aucun hook/async ajoute, aucun composant ou etat duplique.

## Qualite et limites

Checks finaux executes :226unitaires,7gardesmatrice,types0,lint0warning,buildNext16.4.2Webpack0. Build/lint/typessequentiels en copie durable sans.env ; session80357terminee0. Logs unit/build/lint/types/delivery.log sous dossierresponsive-current. Aucun nouveau test mirroir d'un style CSS ajoute ; vraie reproduction visuelle avant/apres, unitaires existants et compilation verifies. SuitesPG/migrations precedentes inchangees,97PG/29natifs ne sont pas revendiques comme rejoues sur cette tranche de presentation.

La matrice17/30 restepartielle. Cette preuve porte sur les depenses et les fiches, pas toutes fonctions financieres, ni deux membres Auth, signup/verification/acceptation, receptionexterneResend, offline/reponsesRSCtardives, CI ou MCP. Estimationinitiale8-15kjetons, etendue par deux defauts visuels confirmes ; aucun plafond fixe, coutindisponible, aucun service payant engage.
