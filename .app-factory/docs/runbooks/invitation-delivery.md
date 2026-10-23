# Résoudre un envoi d’invitation incertain

Ce runbook concerne une réponse de transport perdue ou non confirmée. Il ne
prouve pas que le destinataire a reçu ou lu son email. Aucun script de l’app ne
l’applique automatiquement. Une intervention sur une base cible exige une
identification de cette base, une sauvegarde vérifiée et une autorisation
explicite ; la préparation du feature n’autorise aucune opération de production.

## Comportement normal

L’espace et l’invitation sont persistés avant l’envoi. Le retry conserve le même
ID, token, expéditeur et renderer v1. Il est borné à 23 heures depuis la première
tentative, en deçà de la fenêtre Resend de 24 heures. Après cette fenêtre, l’état
uncertain est visible et aucun nouvel envoi automatique n’a lieu. Le lien reçu
reste utilisable jusqu’à son expiration ; l’invitation est aussi accessible au
compte destinataire vérifié. L’appartenance exige toujours son acceptation.

Ne jamais remettre first_attempt_at à NULL, changer token/nonce/snapshots,
supprimer une tentative ou réutiliser une clé d’idempotence hors fenêtre pour
« débloquer » un envoi. Une absence de réception déclarée ne prouve pas une
absence d’envoi. MAILPIT, EMAIL_TO et une réponse API de succès ne prouvent pas
une réception externe.

## Rassembler les preuves en lecture seule

1. Identifier l’invitation et son espace dans la base autorisée. Relever status,
   delivery_status, expires_at, lease_until, first_attempt_at et last_attempt_at.
   Conserver les deux timestamps en texte avec leur précision PostgreSQL, pas
   dans une Date JavaScript qui perd les microsecondes.
2. Retrouver le message fournisseur dans les tentatives locales ou, si son ID a
   été perdu, dans le dashboard Resend autorisé pour ce projet. Ne pas parcourir
   sans discernement les courriels d’autres projets. Le message_id RFC SMTP est
   distinct de l’ID UUID de l’API Resend ; un ID Mailpit n’est pas un ID Resend.
3. Lire ce message exact via le dashboard ou GET /emails/{id}. Garder la clé dans
   le secret serveur, jamais dans un argument de shell, une capture ou un log.
   Comparer expéditeur figé, unique destinataire, absence de cc/bcc, sujet et
   corps v1, fenêtre temporelle des tentatives et lien exact : le hash du token
   contenu dans le message doit être le token_hash de cette invitation. Ne pas
   enregistrer le corps, le lien porteur ou les adresses dans les preuves publiques.
4. Conserver une preuve privée de corrélation (ID invitation/espace/message,
   état fournisseur, date de lecture, snapshots des tentatives, auteur et motif),
   puis un rapport anonymisé. Une recherche vide, un 404, une panne, un accès
   insuffisant ou un payload absent/divergent restent une incertitude.

Les métadonnées sent ou delivered du fournisseur ne sont pas une preuve de
lecture humaine. Un échec, bounce, délai ou état inconnu ne justifie pas une
réussite. Même une preuve delivered doit être complétée par la réception dans
la boîte de test contrôlée pour satisfaire le goal de livraison.

## Livraison confirmée et correspondance exacte

Après autorisation d’intervention, vérifier de nouveau en transaction l’unique
invitation ciblée. Elle doit rester pending, non expirée, avec livraison
uncertain et aucun lease actif. Comparer les snapshots first/last_attempt_at
exacts à ceux de la preuve fournisseur ; une tentative plus récente invalide
l’intervention prévue.

Le statement versionné `scripts/financial-spaces/reconcile-confirmed-delivery.sql`
prend quatre paramètres liés : invitation UUID, espace UUID, première tentative
exacte et dernière tentative exacte. L’opérateur ouvre une transaction, exécute
ce statement puis relit le résultat avant commit. Zéro ligne retournée signifie
STOP et rollback : relire la situation, sans élargir la condition.

La correction touche seulement delivery_status/lease/erreur. Elle invalide le
lease précédent pour qu’une vieille réponse de transport ne puisse annuler le
constat. Elle ne crée aucun envoi, espace ou membre, ne réécrit pas les anciennes
tentatives (l’échec de confirmation local reste historique), et ne change ni
validité ni token de l’invitation. Le rapport privé autorisé porte la trace de
cette réconciliation. Vérifier ensuite la fiche depuis l’app et l’acceptation
par le seul destinataire vérifié ; aucune acceptation administrative.

Ce statement a été testé uniquement sur clones locaux synthétiques. Il ne lit
pas Resend et ne valide donc pas lui-même les preuves fournisseur : ces
préconditions ne doivent jamais être omises ou automatisées par supposition.
Aucune commande ou mutation de production n’a été exécutée pendant ce chantier.

## Preuve absente, ambiguë ou livraison non réussie

Conserver uncertain et l’historique. Ne pas renvoyer aveuglément. Un lien déjà
reçu ou l’invitation visible après connexion reste acceptable jusqu’à expiration.
Sinon, attendre l’expiration métier puis demander une nouvelle invitation par le
parcours normal. Une annulation/renouvellement anticipé serait une décision
produit distincte avec invalidation explicite du lien antérieur ; cette fonction
n’est pas implémentée par ce runbook.

Si une correction validée ne peut être appliquée sans modifier des finances,
authentifications, membres ou snapshots, arrêter : ce n’est pas une simple
réconciliation de transport. Aucun paiement ou nouveau service n’est engagé.

## Références

- [Contrat d’idempotence Resend](https://resend.com/changelog/idempotency-keys)
- [Lire un message envoyé](https://resend.com/docs/api-reference/emails/retrieve-email)
- DEC-001 dans `.Codex/adhoc/decisions/` et matrice de recette dans `.Codex/plans/espaces-financiers-evidence/acceptance-matrix.md`.
