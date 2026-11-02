# Certifier le schéma des fixtures, pas seulement les lignes

What happened : la revue a relevé qu’un certificat de baseline synthétique contrôlait les lignes et les fichiers sources, mais acceptait un index ou une contrainte supprimé dans la base réelle. Un premier seed avait aussi supposé created_at sur une table qui utilise sent_at.
Why it happened : le schéma effectif était traité comme une conséquence immuable du fichier importé ; un helper de ligne généralisait trop les colonnes communes.
How to prevent : certifier types/defaults/contraintes/index/enums/extensions/fonctions/triggers en plus des lignes ; tester une dérive réelle et son refus sans auto-réparation. Vérifier les colonnes de chaque table avant le seed et exécuter le jeu complet sur PostgreSQL. Conserver les fixtures/certificats antérieurs lors d’un changement de méthode, sans transformer leur verdict rétroactivement.
