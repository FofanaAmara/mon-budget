# HTTPS local sur macOS

L’authentification actuelle utilise des cookies `Secure`. WebKit les refuse sur
HTTP localhost ; supprimer simplement HTTPS réintroduirait la boucle de connexion
Safari. Le certificat de recette est une feuille autosignée propre au projet,
conservée avec sa clé privée dans `.local/financial-spaces/https/` et ignorée par Git.

Pour préparer sa reconnaissance sans modifier le trousseau :

```sh
npm run dev:spaces:trust
```

Vérifier l’empreinte, la date de validité et le chemin affichés. Pour installer
explicitement cette confiance, exécuter soi-même :

```sh
npm run dev:spaces:trust -- --install
```

macOS peut demander une confirmation. La commande vise seulement la politique SSL
pour `localhost`, le certificat feuille exact et le trousseau de l’utilisateur.
Elle n’installe pas d’autorité de certification générale, ne modifie pas le
trousseau système et n’autorise ni nom incorrect ni certificat expiré.

Recharger ensuite <https://localhost:3443>. La correction n’est validée que si le
navigateur ne présente plus d’avertissement, sans exception TLS dans Playwright,
et que Safari conserve la connexion. Le simple succès de la commande n’est pas
une preuve de ces deux résultats. Certains navigateurs peuvent nécessiter un
redémarrage pour relire la confiance utilisateur.

Le runner ne configure jamais la confiance automatiquement. Il continue à
préserver `.env.local` et utilise la copie PostgreSQL locale vérifiée. Les anciens
liens HTTP sur le port 3002 gardent leur chemin et redirigent vers HTTPS.

Pour revenir en arrière, retirer dans Trousseaux d’accès uniquement le certificat
dont l’empreinte SHA-256 correspond à celle affichée par la commande. Ne pas retirer
tous les certificats nommés `localhost`. Un renouvellement produit une nouvelle
empreinte et nécessite une nouvelle décision de confiance ; aucune rotation
silencieuse n’est effectuée.
