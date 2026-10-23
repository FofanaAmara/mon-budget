# DEC-004 : Vérifier le destinataire par l’API OTP dédiée

**Date :** 2026-10-23
**Status :** Active

## Contexte
La recette réelle a trouvé deux comptes Auth non vérifiés. La page d’invitation empêchait correctement l’adhésion mais ne permettait pas de demander un nouveau message. Le SMTP Resend/Mailpit de l’application transporte les invitations ; la vérification d’identité appartient à NeonAuth. La console de gestion affiche une connexion et sa configuration n’a pas été lue.

## Options considérées

### Option A — Modifier la méthode globale de vérification à l’inscription
Nécessite une session de gestion, modifie le parcours de tous les comptes et suppose de connaître les paramètres hébergés. Un lien exige aussi un fournisseur email personnalisé.

### Option B — Utiliser l’API explicite de vérification par code
La [documentation officielle Neon](https://neon.com/docs/auth/guides/plugins/email-otp) propose emailOtp.sendVerificationOtp avec type email-verification, puis verifyEmail. Ce parcours ciblé peut être ajouté depuis une invitation sans modifier la méthode globale d’inscription. Le fournisseur gère génération, livraison, expiration et limites des codes.

## Décision
Option B. Les actions serveur dérivent l’adresse d’une session fraîche et exigent l’acteur de départ ainsi qu’une invitation en attente, non expirée et correspondant à cette adresse. Le navigateur transmet le jeton et le code, sans choisir l’adresse. Après réponse du fournisseur, une nouvelle lecture Auth doit confirmer le même compte, la même adresse et emailVerified. Aucun token fournisseur n’est renvoyé au navigateur ; aucune appartenance n’est créée par ces actions.

## Conséquences
L’acceptation reste une action distincte après recharge de la même invitation. L’UI conserve le code seulement en mémoire, empêche la reprise d’une ancienne réponse après démontage/changement de compte et n’envoie rien au montage. Un échec d’envoi ambigu est affiché avec reprise manuelle et délai, sans renvoi automatique. Les tests du transport simulé ne prouvent pas la réception d’un OTP réel. Le fournisseur et le quota Neon effectivement configurés restent à vérifier avant la recette externe ; aucun changement hébergé ou mail externe n’est effectué dans cette tranche.
