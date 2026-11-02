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

Le runner fournit un profil de cookies compatible HTTP : une passerelle liée
uniquement à127.0.0.1:3002 transmet vers Next sur127.0.0.1:3003. Elle utilise
un nom de cookie propre au profil local, sansSecure et sansDomain, en conservant
HttpOnly, SameSite=Lax, la valeur signée et son expiration. Les noms attendus
par Neon sont restaurés côté serveur. Le SDK et les cookies de production ne
sont pas modifiés. Ne pas utiliser directement le port interne3003.

Une nouvelle connexion est nécessaire : les anciens cookies HTTPS ne sont pas
repris implicitement. Le parcours connexion/rechargement/navigation/déconnexion
a été exécuté sur WebKit26 et ChromiumMCP ; WebKit ne constitue pas un test du
Safari natif de l’utilisateur. Les transitions Auth chargent un nouveau document
pour éviter la concurrence entre navigation et rafraîchissement RSC.

Les anciens outils HTTPS restent disponibles pour diagnostic explicite, mais
le runner ne génère plus de certificat et ne configure aucune confiance.
Aucun changement de trousseau, aucune suppression de clé/certificat et aucune
modification des cookies de production ou de son HTTPS ne sont effectués.
