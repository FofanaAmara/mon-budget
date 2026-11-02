# Recette locale actuelle - invitation et Mailpit

2026-10-23, code c704c80. Plan parent P4/P7. Autorisation humaine explicite du navigateur/Playwright et demande de test local Mailpit. Aucun AWM.

## Parcours observe dans la vraie app

1. Runtime3002 absent : relance par npm run dev:spaces, controle de cible locale par le script ; Mailpit deja actif sur1025/8025. Session runtime98404.
2. Ancien onglet20 refuse car data: interne apres panne. Cette page n'est pas observee/contournee. Inventaire ulterieur : nouvel onglet21 HTTP de la vraie app disponible, selection sur son URL HTTP et acces autorise. Pas besoin d'une nouvelle confirmation humaine ; ce refus etait celui d'un protocole de page interne.
3. Depuis le compte de recette existant : Reglages > Espaces et membres > fiche couple, avec espace personnel toujours actif dans le selecteur. Trois espaces listes, aucune gestion supplementaire dans le selecteur.
4. Envoi a une adresse fictive de recette example.test depuis la fiche. Interface : Invitation envoyee, puis Courriel envoye - en attente d'acceptation. Pas d'appel a Resend : runtime force transportmailpit et DB locale.
5. Mailpit filtre exclusivement sur ce destinataire :1message, sujet et nom de l'espace corrects ; HTML dit memes droits, connexion/creation puis acceptation distincte et aucun acces avant acceptation.
6. Clic reel sur Voir l'invitation dans le mail : nouvel onglet de l'app, titre explicite Tu as ete invite dans un espace, bon nom et refus du mauvais compte. Le compte expediteur ne peut pas accepter pour le destinataire.
7. Recharge de la vraie fiche : invitation persistante. Nouvelle soumission du meme destinataire : toujours une seule invitation affichee et un seul message Mailpit.
8. Correlation SQL en lecture seule sur spaces_work17 : invitations=1,status=pending,delivery_status=sent,members=1. Aucun membre ajoute par l'envoi ou par la lecture du lien.

## Preuves et outils

Interactions CUA avec locators Playwright exposes, vraie app Next, cookies de session existants et SMTP Mailpit reel. Ces preuves ne sont pas renommees PlaywrightMCP : cet outil n'est pas expose dans le catalogue. Aucun transport/session simule sur ce parcours. La seconde surface Chrome retrouve aussi un mauvais compte ; elle ne prouve pas un destinataire authentifie ou une acceptation a deux membres.

Captures privees sous .local/financial-spaces/mailpit-current/ : mailpit-received.png, invitation-wrong-account.png, space-top-viewport.png, invitation-persisted-viewport.png, invitation-sent.png ; persistence-proof.json. Aucun bearer ni adresse reelle dans les fichiers versions. Les adresses visibles dans la capture app sont fictives. Mailpit d'autres projets n'est pas explore : filtrage du seul destinataire de ce test avant lecture du message.

Scan visuel du viewport mobile actuel, haut et bas de fiche : aucun chevauchement/troncature visible ; formulaire, invitations et guide inferieur utilisables. Capture fullPage depuis une position scrollee conservee comme artefact brut, mais non retenue pour juger les elements fixes ; les captures de viewport sont la preuve visuelle. Pas de modification CSS justifiee sur cette base. Pas de validation375/1280ouclavier complete revendiquee.

## Limites et suite

Ce test ferme la verification locale actuelle envoi/SMTP/reception/lien/mauvaiscompte/persistance/soumissionrepetee. Il ne ferme pas reception externe Resend, inscription et verification d'un nouveau destinataire, acceptation explicite et contributions a deux sessions, parcours complets de toutes finances, MCP et CI distante. La matrice reste partielle. Pas de push, pas de nouveau compte heberge ni credentials inventes, pas de mutation de la DB source.

Aucun changement du code produit, donc pas de reexecution des226unit/97PG/types/lint/build inchanges pour fabriquer du progres. Gardes de matrice executes apres cette mise a jour. Estimation reprise6-12kjetons, cout monetaire indisponible ; aucun service payant engage.
