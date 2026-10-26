# Dépenses et allocations — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Travail direct sans AWM.

## Périmètre et limites
72/78 exports financiers ont une implémentation avec spaceId explicite. Cinq familles supplémentaires : dépenses, échéances mensuelles, transactions de dépenses, transactions de dettes et allocations. Les anciens appelants ne sont pas encore raccordés ; les anciennes entrées doivent disparaître avant activation. Aucun parcours multiespace livré à ce stade.

## Preuves exécutées
- Services PostgreSQL isolés : 60/60 (15 espaces,25 premières familles,20 nouvelles familles). Auth et invalidation Next simulées, SQL réel ; aucune preuve d'invitation.
- Migrations : 20/20, conservation des colonnes originales, rollback et rejeu005.
- Unitaires : 181/181 ; types : sortie0 ; lint : 0 erreur/17 avertissements préexistants.
- Revue indépendante : allocation ponctuelle inactive pour éviter génération hors mois, report classé planifié, archivage stable même après solde zéro. Trois constats fermés ; revue statique sans réexécution des tests par le reviewer.

Paiements et journaux sont atomiques et rejouables ; le débit réel est mémorisé pour les nouveaux versements. Générateurs calculent depuis les modèles verrouillés, conservent les overrides et historiques. Dépenses progressives gardent leur nature historique après édition du modèle. Reports liés et modifications d'allocations avec leurs catégories sont atomiques ; IDs croisés et non-membres refusés. Tests de rollback provoquent des erreurs SQL réelles. Calendrier vérifié sur72 combinaisons, montants arrondis au centime. Une assertion de date UTC erronée a été corrigée pour comparer la date civile attendue dans le fuseau local du pilote, sans modification métier.

## Historique : décision non approuvée
L'analyse d'anciens versements ne permet pas toujours de prouver le montant réellement déduit. Aucun montant historique n'est recalculé ou corrigé. Le nouveau garde d'annulation historique reste non raccordé et ne constitue pas une décision produit acceptée. L'humain a contesté la pertinence de la question ; réponse apportée : conserver les montants et traiter toute réparation séparément. Ne pas activer silencieusement ce changement de comportement lors du raccordement.

005 est testée seulement sur des clones jetables ; work17 reste backfilled et source/baseline intactes. Le certificat strict du work reste false pour l'ancien écart connu d'une date du guide ; aucun affaiblissement du contrôle. Les tests de migration utilisent des clones propres.

## Suite
Finir réglages/guide/compte et chemins legacy, raccorder les routes canoniques et maquettes puis supprimer les anciennes actions avant cutover local. Invitations/Auth/Resend reçu, cache/offline, CI et Playwright MCP restent à prouver. Aucun email, push ou déploiement.

Build Next final : sortie0 dans .next-spaces-build, configurations restaurées aux octets initiaux. La première tentative était bloquée par le téléchargement de la police existante ; la relance avec accès réseau autorisé réussit. git diff --check : sortie0.
