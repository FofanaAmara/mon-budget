# HTTP-PRIVACY-MCP — contrôle réel local

26 octobre2026. Application réelle HTTP3002, navigateur QA séparé piloté par Playwright MCP, profil durable, sandbox actif. Aucun changement du code applicatif. Une session QA existante a été réutilisée par les cookies natifs ; ce n’est pas une nouvelle connexion du compte historique.

## Résultats observés

- BFCache explicitement activé, aucun drapeau de désactivation ; aller sur la landing puis retour aux finances du même compte réussi. `pageshow.persisted=false`, exclusion CDP : MainResourceHasCacheControlNoStore, WebSocketUsedWithCCNS, BrowsingInstanceNotSwapped. Le WebSocket de développement fait partie des conditions ; aucune restauration BFCache effective ni comportement de production déduit.
- Hors ligne : masque de session et aucun marqueur financier. Le retour réseau conserve le masque. Le bouton de revalidation conduit au tableau de bord du bon espace ; la navigation Dépenses retrouve ensuite la ligne QA. Les premiers waits cherchaient à tort la ligne de dépense sur le dashboard, corrigés sans modification produit.
- Déconnexion réelle par le menu dans un second onglet du même profil, puis retour navigateur : landing publique, aucun contenu privé. Requête anonyme de la route privée :307verslanding, aucun marqueur financier. Le compte QA partagé a été déconnecté ; les onglets Chrome personnels ne sont pas pilotés par ce profil.
- Service worker actif constaté avant le test. Ancien cache mes-finances-v1 créé avec HTML entièrement synthétique, puis activation QA explicite du script réel servi par l’app, avec query de version ; les bytes sont vérifiés identiques à /sw.js. Une simple réinscription du worker identique n’avait pas relancé son activation : pas de réussite prétendue à ce stade. Après nouvelle activation : contrôleur actif, seul cache mes-finances-static-v3, ancienne entrée privée absente.
- Navigation froide vers les finances après passage hors ligne : erreur réseau navigateur, ni sentinelle synthétique ni contenu financier. Aucun contournement no-store/TLS/CSP, aucune action financière soumise. Six captures avant/retour/horsligne/revalidation/déconnexion/navigationfroide inspectées sur tout le viewport ; aucun défaut visuel bloquant observé.

Preuve privée : `.local/resend-recipe/bfcache-http-mcp-proof.json` et six captures bfcache-http*.png. Navigateur QA fermé. Revue distincte des artefacts et captures favorable ; reviewer n’a pas réexécuté le navigateur.

## Limites maintenues

L’environnement est le serveur de développement local. `persisted=true` n’est pas prouvé ; l’exclusion réelle avec BFCache activé est documentée. La purge a été éprouvée sur une activation explicitement déclenchée dans le profil QA, pas sur le rollout naturel de production. P9 en production doit encore vérifier activation, purge, retours et isolement sur le domaine publié. Le nouveau signin du compte historique reste non prouvé, donc29/30AC locaux inchangés. Aucun cookie, mot de passe ou contenu financier réel en Git.
