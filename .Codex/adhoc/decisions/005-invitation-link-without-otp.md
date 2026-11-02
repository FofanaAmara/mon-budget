# DEC-005 : Accepter depuis le lien reçu, sans code supplémentaire

**Date :** 2026-10-26
**Status :** Active

## Contexte
L’humain refuse entièrement la vérification OTP dans ce parcours. Mailpit transporte les invitations applicatives ; les codes dépendaient de Neon Auth hébergé et ne pouvaient pas être reçus sur une adresse fictive via notre SMTP local.

## Options considérées
- Conserver OTP et raccorder les emails hébergés : rejeté par l’humain, ajoute une étape non souhaitée.
- Retirer le contrôle d’adresse et accepter par ID seul : risque d’usurpation d’une adresse non vérifiée.
- Utiliser le lien secret reçu et la session du destinataire : retenu ; aucun deuxième code.

## Décision
La page publique transmet le jeton original à l’action d’acceptation/refus. Une session fraîche du même destinataire et un hash de jeton correspondant à l’invitation verrouillée suffisent pour un compte non vérifié. L’ID seul reste réservé aux comptes dont l’adresse est déjà vérifiée par Auth, depuis leur liste privée. Cette liste ne révèle aucun jeton à un compte non vérifié. Confirmation privée liée au répondant et à son adresse ; expiration, statut, rejeu et idempotence conservés. Le vrai flag Auth est conservé, jamais fabriqué.

## Conséquences
L’utilisateur suit le lien, s’authentifie puis accepte explicitement, sans code ni compte à rebours. Les modules OTP applicatifs et leurs tests obsolètes sont retirés ; tests de possession du lien ajoutés à leur place. La sécurité du lien et sa confidentialité restent nécessaires. La déduplication reconnaît les membres admis par lien même si Auth.emailVerified est false. Ni configuration SMTP hébergée ni vérification globale Neon modifiées.
