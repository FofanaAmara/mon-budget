# Cadrage du goal — Espaces financiers

Date :2026-10-22. Skill goal-authoring appliqué avec ses trois références de connaissance. Livrable : [condition prête à utiliser](espaces-financiers.goal.txt), condition seule dans le fichier. **Non activée** : la demande porte sur sa rédaction, pas sur le lancement d’une boucle ou d’une implémentation.

## Type et challenge
Travail substantiel, six stories et migration de données financières : un goal durable est justifié. Type livrable borné, cadre SMART adapté à une preuve affichable. Le résultat n’est ni « avoir terminé les stories », ni « l’API a répondu succès ». Le couple doit réellement créer un espace, recevoir le courriel, rejoindre avec compte existant/nouveau et contribuer sur les mêmes données. L’email et la migration ne sont pas réductibles à des simulations.

Sources : backlog approuvé61dc09e, maquettes corrigées approuvées7aaec6d, plan24708a0. Le plan et ses préconditions font référence ; la mise en place du mail reste explicitement non résolue, pas déduite de l’approbation des maquettes.

## Critères et preuves attendues
| Critère du goal | Preuve affichée |
|---|---|
| 1 — Création/onboarding/gestion/sidebar | Parcours E2E et captures mobile/desktop |
| 2 — Contexte complet/persistance | Tests sur vraie DB isolée, deux espaces et URL utilisable par l’humain |
| 3 — Invitation réelle et deux parcours auth | Email reçu anonymisé + lien et compte existant/nouveau jusqu’à acceptation |
| 4 — Égalité et isolation | Deux membres contribuent, tiers/mauvais compte/IDs croisés refusés ; double acceptation idempotente |
| 5 — Conservation/concurrence/cache | Comparaison avant/après, reprise/restauration, cas simultanés et offline |
| 6 — Qualité et couverture | Tests/CI verts, revue indépendante, preuve visuelle au sens du protocole et matrice17exigences/30AC |

## Envoi de courriels — constats vérifiés
- Au contrôle initial, `.env.local` ne contenait aucune variable non vide de transport courriel parmi les préfixes usuels ; l’humain a depuis ajouté sa configuration (voir actualisation ci-dessous). Aucune valeur secrète affichée.
- Aucun code ou paquet de transport applicatif repéré ; `.env.example` et `.app-factory/docs/infrastructure/env-vars.md` décrivent DB/Auth/VAPID/cron, sans transport courriel. Les champs notify_email décrivent des préférences, pas un envoi.
- VAPID_EMAIL est le contact technique des notifications Web Push ; ce n’est pas un compte SMTP/API d’envoi.
- Projet Vercel lié « mon-budget ». Lecture `vercel env ls` tentée ; premier accès limité par réseau sandbox, second en lecture seule autorisé : jeton CLI invalide. **Configuration hébergée non vérifiée**, ne pas la déclarer absente. Aucun login ni changement de configuration effectué.
- Neon Auth existe, mais cela ne démontre pas un transport pour les invitations métier de cette feature.
- À obtenir/configurer : transport adapté aux destinataires réels, expéditeur autorisé (domaine et DNS selon fournisseur), secrets serveur, coût/quotas validés, URL applicative accessible au destinataire et réception de test. localhost seul n’est pas un lien ouvrable par une autre personne hors de la machine ; une URL de recette accessible est donc exigée par le goal, sans déploiement prod implicite.
- L’humain confirme Resend, ainsi qu’un domaine existant et Mailpit utilisé sur un autre projet. Le goal les référence désormais explicitement. L’expéditeur est renseigné dans EMAIL_FROM, sans afficher sa valeur ; sa validation côté Resend reste à tester. Aucun fournisseur ou abonnement supplémentaire choisi.

## Coût, frontières et échappatoire
Profondeur pressentie lourde : six incréments verticaux, préparation, migration et recette globale ;16modules/86actions sont concernés d’après le plan. Aucun budget temps/jetons/chiffre monétaire fourni ; aucun plafond inventé. La condition impose estimation avant tranche, suivi, accord avant coût externe et déclaration des coûts indisponibles. Elle exige réévaluation/escalade après3tours sans progrès ou atteinte d’un plafond approuvé, sans faux DONE.
Le goal dit le résultat ; le pilotage ultérieur relève de goal-orchestration/awm-usage selon les signaux, sans capacité d’exécution sélectionnée maintenant. Pas de code, migration, envoi réel, push ou déploiement dans ce mandat de rédaction.

## Auto-check
Critères comportementaux avec preuves affichables : oui. Hors-scope : oui. Cinq invariants : verdict honnête, vérification/revue, coût, alternatives/hypothèses, verdict humain : présents. Budget non fixé et échappatoire : dans la condition. Sources et dépendances : explicites. Condition lue froide et longueur UTF-8 contrôlée mécaniquement,≤4000octets.

## Actualisation — Resend et Mailpit confirmés
L’humain a ajouté sa configuration dans .env.local. Vérification des noms et présence seulement : RESEND_API_KEY, EMAIL_FROM, EMAIL_TO, SMTP_HOST et SMTP_PORT non vides. Aucune valeur ni clé affichée. Hôte SMTP local et port valide ; premier test réseau EPERM sous sandbox, seconde vérification locale autorisée : connexion TCP réussie. Ceci prouve seulement la joignabilité SMTP, pas une réception de message.
Resend retenu pour les invitations réelles ; Mailpit pour capturer les essais locaux. Sélection du transport explicite par environnement avant exécution, jamais déduite de la présence simultanée des deux configurations. EMAIL_TO ne doit pas remplacer arbitrairement le destinataire d’une invitation ; une redirection de test doit être isolée et clairement déclarée. La clé Resend, le domaine expéditeur, les quotas et la réception externe ne sont pas encore validés ; aucun appel d’envoi ni changement de DNS effectué. Configuration Vercel toujours non vérifiée faute de jeton CLI valide.
