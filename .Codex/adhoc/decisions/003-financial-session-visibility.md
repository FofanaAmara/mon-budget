# DEC-003 : Masquer les finances conservées sans session correspondante

**Date :** 2026-10-23
**Status :** Active

## Contexte

Les gardes serveur refusent les lectures/écritures non autorisées, mais une page déjà rendue peut rester dans un onglet après une déconnexion ailleurs, un changement de compte, une coupure réseau ou une restauration d’historique. Le nom utilisateur réactif de BottomNav ne retire pas les finances déjà montées. Le goal exige l’absence de mélange de sessions et d’anciens contenus offline.

## Options considérées

- Garder la vue jusqu’à la prochaine action : conserve les brouillons mais laisse des finances visibles sans confirmation de session ; rejeté.
- Cacher la vue lors d’un doute et la rouvrir automatiquement à chaque signal online : peut réutiliser un vieux résultat en mémoire ; rejeté.
- Vérifier l’identité client contre celle validée par le serveur et verrouiller le document sur invalidation explicite : retenu.

## Décision

Le layout financier fournit seulement l’ID du compte autorisé au garde client. Session absente/en attente/en erreur/d’identité différente : les enfants financiers ne sont pas rendus. Une déconnexion, un signal interonglet de changement Auth, offline, pagehide ou pageshow persisté verrouille le document. Revenir online ne déverrouille pas un ancien document : une navigation complète recharge et revalide. L’expiration est surveillée même sans focus, avec délais bornés et nettoyage des timers. Le wrapper privé est caché impérativement avant capture d’historique.

Le signal localStorage ne contient qu’une génération aléatoire, jamais identité, cookie ou finance. Si ce stockage est indisponible, le verrou local reste actif et la comparaison de session continue de s’appliquer ; la propagation interonglet n’est alors pas garantie par ce canal. Les gardes serveur restent l’autorité d’accès.

Tous les parcours de déconnexion partagent le même helper, y compris Changer de compte via /auth/sign-out. L’invalidation précède la requête ; une erreur SDK ne navigue pas comme un succès. La vue contrôlée conserve uniquement un retour public d’invitation validé (ou /), sans query/hash/espaces/caractères blancs ; une réponse tardive ne navigue pas après démontage. Les autres AuthView et le callback d’invitation restent réutilisés.

## Conséquences

Les brouillons montés sont retirés avec le contexte lorsqu’il est invalidé, et l’écran l’indique. Ce choix privilégie la confidentialité ; il ne constitue pas une sauvegarde hors ligne. Les continuations anciennes conservent leur lifetime invalidé. Les nouvelles vues de revalidation/déconnexion réutilisent les styles existants, sans bibliothèque ou Storybook.

Douze tests supplémentaires de rendu serveur, EventTarget, séquencement signout et horloge vérifient les contrats sans navigateur. Cela ne prouve ni timing BFCache réel, ni propagation multi-onglets réelle, ni qualité visuelle mobile : ces gates restent ouverts.
