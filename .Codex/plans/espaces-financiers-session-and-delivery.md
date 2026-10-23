# Sessions privées et envois incertains

Plan parent approuvé : espaces-financiers-implementation.md, P3.4/P4.2/P7.1. Méthode directe sans AWM, décisions autonomes pendant absence.

## État et écart

Commit1c9bef8 : services et migrations testés, matrice17/30 partielle. Runtime3002 confirmé vivant. L’AuthProvider rafraîchit après ses parcours Auth, mais aucun garde ne masque explicitement les finances déjà rendues si la session devient nulle/change de compte, ni en offline ou restauration BFCache. BottomNav lit la session pour le nom seulement. Les contrôles serveur restent actifs : l’écart concerne l’affichage conservé dans les onglets.

L’envoi uncertain après23h reste volontairement sans retry ; il faut une procédure opérationnelle de vérification, sans prétendre qu’un ack fournisseur prouve la réception humaine.

## Séquence

1. Garde client autour du layout financier, attaché à l’identité validée côté serveur. Aucune finance tant que la session client est en attente/erreur/absente ou différente. Invalidation avant déconnexion, entre onglets après changement de session, au passage offline et au pagehide/BFCache. Les anciennes continuations sont démontées avec le contexte.
2. Centraliser la déconnexion et diffuser seulement un signal sans identité/finance dans localStorage. Conserver intégralement les retours Auth d’invitation ; aucun nouveau rôle ou service.
3. Tests du contrôleur d’invalidation (événements, erreurs stockage, BFCache, démontage) et rendu SSR des vraies branches du garde, plus les contrôles types/lint/build appropriés. Pas de prétendue validation visuelle ou E2E : navigateur refusé, ne pas contourner.
4. Formaliser le runbook d’envoi incertain : preuves fournisseur exactes, tentative identifiée, livraison vs réception, absence de preuve reste incertitude ; pas de mutation de production ou renvoi aveugle.
5. Revue indépendante autorisée, mise à jour matrice/preuves/état et commit local automatique sans push.

## Validation et limites

Les tests sans navigateur prouvent les états et le masquage rendu, pas un événement multi-onglets réel ou l’absence de flash à l’écran. Ce gate reste ouvert jusqu’à l’accès autorisé et PlaywrightMCP. La page de revalidation réutilise le style existant, aucun design system/Storybook. Toute interruption de brouillon liée à une invalidation de session est explicitement affichée ; la confidentialité prime en l’absence de session vérifiée.

Estimation :10–20kjetons, coût monétaire indisponible ; réévaluer après le garde. Aucun email/service payant/push/DBsource.

## Extension issue de la revue globale — 2026-10-23

État vérifié au commit de4115e : seul le layout financier contient le garde. Onboarding, choix des espaces et invitations privées gardent leur contenu après changement de compte ; la création vérifie la session courante mais pas l’acteur de la saisie. Écart P1 confirmé par revue indépendante.

Cible : appliquer le même garde aux trois entrées privées, y compris la confirmation ; refuser une création ou invitation de formulaire quand l’acteur attendu diffère de la session serveur, avant toute écriture/envoi. Le jeton public reste public. L’acteur attendu est un témoin de contexte, jamais une autorité remplaçant la session ou l’appartenance.

Séquence : (1) reproduire le refus manquant avec tests PG ; (2) étendre le contrat création/invitation et arrêter les continuations de formulaire démonté avant toute nouvelle requête ; (3) gardes privés et tests de rendu des vraies pages ; (4) types, unités, services PG, lint/build en copie isolée, revue et commit.

Pré-mortem : une option acteur facultative laisserait les anciens appelants exposés → champ obligatoire ; une création résolue après démontage pourrait lancer son email → vérifier le montage après chaque await. Mise à jour des appelants et fixtures sans changer les finances ou le schéma. Revenir par revert du commit isolé si nécessaire, aucune migration. Hypothèse : garde existant réutilisable hors layout, validée par tests de rendu. Preuve réelle multi-onglets/MCP toujours ouverte, aucun contournement du refus navigateur. Estimation6–10kjetons, coût indisponible. Autorisation d’exécution : plan parent accepté et consigne humaine de décider sans questions.

## Correction visuelle issue de la recette375px - 2026-10-23

Planparent P7/S11, autorisation de corriger les defauts observes. Deux depensesfictives3.99/1450 creees via vraieUI. Capture responsive-current/expenses-mobile-375.png : FAB fixe recouvre montant1450etboutonpayer. Cause : bouton viewportfixed sans place dans le flux, sureleve par le guide actif ; ajouter un padding en fin de liste ne protege pas les lignes intermediaires.

Correction locale : utiliser pour mobile le bouton Nouvelledepense deja dans l'entete desktop, supprimer le FAB des seules depenses. Meme action/modal/style, aucune finance modifiee. Ne pas deplacer un autre overlay ou reformater les montants pour masquer le probleme. Verification : captures avant/apres375/1280, longlibelle et3.99/1450, ouverture/fermeture modal mobile, persistancereload/bascule ; puisunit/types/lint/build en copie et revue. Revert du commit isole possible, aucune migration. Autres FAB hors ecrans observes non modifies speculativement.

Extension de la meme comparaison : total du groupe decale des lignes d'environ16px car chevron16+gap8 alors que toggle28+gap12 ; lignes progressives/historiques n'ont pas de toggle. Correction structurelle : rail commun28px reserve sur toutes les lignes et en-tetes, gap12 identique. Aucun montant ou format modifie. Capturesavant/apres3.99/1450etgroupe1453.99, revue puis checks finaux apres cette extension. Les variantes progressive/historique restent a exercer dans la vraie app si non disponibles dans cette recette.
