# DISC-ESP-012 — Invitation réelle reçue dans les indésirables Gmail

Date :2026-10-23. État :àexaminer avantrelease. Source :recette Resend explicitement autorisée, espace neuf dédié, une seule tentative.

Gmail a reçu le message et affiche le motif générique « similar to messages ... identified as spam ». Resend GETconfirme delivered. Cela prouve réception, pas placementinbox. Expéditeur existant emprunté à unautreprojet et lienlocalhost : ne pas attribuer la cause à ces facteurs sansdiagnostic. Ne pas modifier lesDNS ou recréerunenvoi pour masquer le constat. Examiner authentificationSPF/DKIM/DMARC/réputation/contenu et domainepublic lors de lapréparationproduction. Captureprivée :`.local/resend-recipe/gmail-invitation.png`.

Autrelimitationobservée pendant inscription : liensConditions/Confidentialité pointentsur#. Aucun contenujuridique rédigé ou acceptation prétendue. L’inscriptionreste enattente d’une actionhumaine, pasdecontournement.


## Diagnostic réel complémentaire
Gmail « Show original » du seul message de recette indique SPF PASS, DKIM PASS et DMARC PASS. Preuves privées gmail-authentication.json et capture du résumé, sans original brut enregistré. Le classementspam n’est donc pas attribuable à un échec de ces trois contrôles sur ce message ; réputation/contenu/contexte restent des hypothèses non prouvées. Aucune modificationDNS, renvoi, suppression ou classementnotspam effectué.
