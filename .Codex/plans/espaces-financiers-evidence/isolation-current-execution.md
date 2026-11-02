# Recette isolation et réservation de navigation — 2026-10-23

## Résultats persistants

Sur la vraie app avec Auth A et PostgreSQL isolé work17 : revenu ponctuel personnel125.25 et couple987.65 créés depuis UI, rechargement et bascule conservant leurs données respectives. Lecture read-only enregistrée dans `.local/financial-spaces/isolation-current/persistence-proof.json` à13:16:02Z : une ligne par espace, amount=actual_amount, RECEIVED ; préférence personnel, deux espaces avec un seul membre chacun. Cela prouve ces deux revenus, pas toutes les familles ni une contribution de deux membres.

Deux onglets ont conservé leurs espaces distincts. Le dialogue de brouillon n’a pas été validé : commande CUA bloquée, seul onglet de recette fermé ; rappel7jours resté actif en base. Navigation retour a retrouvé le bon contexte personnel ; aucune preuve BFCache/offline. L’appel natif Chrome précédent a été interrompu, aucun résultat à lui attribuer.

## Défaut visuel et correction

DISC-ESP-008 : padding du body réservé à une navigation absente. Avant : revenus desktop1280x720, body788px/padding68 ; capture privée `desktop-before-padding.jpg`. Reproduit sur connexion réelle dans Chrome DevTools MCP : mêmes788/68. Après : body720/padding0/scrollHeight720. Connexion375x812 avant : top48/bottom68/scroll928 ; après : top0/bottom0/scroll812, aucun débordement horizontal. Images avant/après effectivement affichées et scannées dans la trace MCP, pas des mesures seules. La sauvegarde filePath MCP a été refusée par sa configuration de racines ; aucun fichier MCP déclaré sauvegardé. Les captures inline demeurent dans la trace. La première demande resize375 donnait500px ; seule émulation375x812x1 a été retenue comme preuve375.

Cause : body global réservait header/nav sur tous les écrans, indépendamment de leur présence. Correction : padding-bottom0 par défaut ; media max767 réserve header/nav uniquement à body:has(.space-product-content), marqueur du LayoutShell financier réel. Override onboarding/landing conservé. Connexion aux seuils767 et768 : top/bottom0, aucun débordement. Desktop final1280x720 et mobile375x812 scannés entièrement : formulaire lisible, pas de chevauchement ni bande supérieure artificielle. Aucun montant, Auth ou donnée modifié.

Le serveur de recette servait encore le CSS compilé précédent, confirmé dans sa réponse HTTP locale, pas seulement dans le navigateur. Relance contrôlée du seul serveur propriétaire31557 puis nouveau81598 : source recompilée et mesure après correcte. Ne pas attribuer un rendu ancien au nouveau CSS. Le watch a ensuite bien pris la seconde modification. Cause exacte du premier événement de watch manqué non établie, pas de changement spéculatif de config.

## Parcours public actuel et limite découverte

Invitation fictive de recette relue dans Mailpit et ouverte dans la nouvelle session DevTools anonyme. Landing réelle375px affiche explicitement invitation, nom d’espace et deux liens connexion/inscription. Créer un compte ouvre la vraie page sign-up avec redirectTo attendu. Aucun nouveau compte soumis, aucune condition d’utilisation acceptée, aucun email externe.

DISC-ESP-009 : le lien interne Connexion de sign-up mène à /auth/sign-in sans redirectTo, donc le contexte d’invitation peut être perdu après rechargement. Reproduit via clic réel ; correction et tests dédiés à venir. La première extraction manuelle du lien Mailpit tronquait au point : extraction corrigée, le lien complet valide fonctionne. Ce n’était pas un défaut produit.

## Qualité et limites

Copie de build isolée mise à jour avec le CSS final : buildWebpack0, types0, lint0warning,7gardesworkflow0 ; session45790 terminée0, logs dans isolation-current. Aucun test miroir CSS ajouté. Dernier socle inchangé246unit/99PG/13casChromium ; non rejoué pour cette seule modification CSS. Revue manuelle du delta faite ; aucune nouvelle revue indépendante de cette tranche, revue globale reste exigée.

Nouvelle session DevTools anonyme : pas de recette mobile financière authentifiée sur le CSS final. Contrat du marqueur vérifié dans components/LayoutShell.tsx ; ce contrôle source ne remplace pas l’E2E. DevTools MCP n’est pas Playwright MCP. Aucune adhésion réelle, réception OTP, réception externe Resend, CI distante, nouvel inscrit ou preuve offline/BFCache ajoutée. Goal global IN_PROGRESS.
