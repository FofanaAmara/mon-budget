# Transport local

Le runner `npm run dev:spaces` sert désormais l’app directement sur
<http://localhost:3002>, sans certificat ni redirection vers HTTPS.
`npm run dev:spaces -- --resend` garde cette origine HTTP pour les nouvelles
invitations. `.env.local`, la copie PostgreSQL vérifiée et les protections de
production sont préservées.

Les anciens liens `https://localhost:3443/...` ne sont plus servis. Pour un lien
de recette existant, remplacer uniquement cette origine par
`http://localhost:3002`, en gardant son chemin et sa query. Ne pas publier de jeton.
Les liens déjà envoyés ne sont pas réécrits et aucune invitation n’est renvoyée
automatiquement.

**Limite connue :** Neon Auth 0.6.0-beta utilise des cookies `__Secure-*` avec
`Secure`. Le rejet de ces cookies en HTTP local par WebKit a été reproduit ;
ce retour HTTP ne prouve donc pas la correction de la connexion Safari.
Les cookies Auth ne sont ni renommés ni réécrits pour retirer `Secure`.

Les anciens outils HTTPS restent disponibles pour diagnostic explicite, mais
le runner ne génère plus de certificat et ne configure aucune confiance.
Aucun changement de trousseau, aucune suppression de clé/certificat et aucune
modification des cookies ou du HTTPS de production ne sont effectués.
