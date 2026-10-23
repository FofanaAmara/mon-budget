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
