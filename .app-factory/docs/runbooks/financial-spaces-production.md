# Espaces financiers — bascule de production

Contrat : `.Codex/goals/espaces-financiers-production.md`, P1–P10. Le présent runbook complète les runbooks historiques ; il ne certifie aucune exécution distante.

## Préparer et identifier

Confirmer le dépôt/branche/SHA, projet Vercel, domaine, projet/branche Neon et endpoint direct. Comparer les variables de production par présence/portée, jamais afficher leurs valeurs. Le runner refuse URL poolée, autre host/base/rôle, surcharge de paramètres, cible locale ou TLS non vérifié. La branche de livraison n’est pas publiée sur main avant les gates et la maîtrise du déclenchement Vercel. Préserver les commits locaux et modifications humaines ; PR protégée obligatoire. Aucune préproduction imposée.

Préparer un profil privé dans `.local/production-release/` **canonique**. Les champs sont : `environment: production`, SHA courant, `projectId` Vercel, `neonProjectId`, `neonBranchId`, `target: {host,database,user}`, `credentialEnv: POSTGRES_URL_NON_POOLING` (ou `POSTGRES_DATABASE_URL_UNPOOLED`), `through: 002` pour expansion ou `006` pour cutover, chemins absolus privés `backupFile`, `proofFile`, `reportFile` et `writersStopped`. Aucune URL avec mot de passe dans le profil. Nouveaux noms pour chaque essai ; ne jamais écraser une preuve. Les chemins exécutables de release et SQL doivent correspondre exactement au SHA commité.

## Sauvegarder et répéter

Les credentials restent dans l’environnement serveur existant. Commandes depuis le worktree et avec `--env-file` pointant explicitement le fichier serveur existant si nécessaire ; ne pas recopier ses valeurs.

```sh
node scripts/financial-spaces/production-migration.mjs --profile=<profil-prive> --dry-run
node scripts/financial-spaces/release-backup.mjs --profile=<profil-prive>
```

Le dry-run est une transaction readonly : diagnostic, pas répétition. La sauvegarde exporte un snapshot PostgreSQL cohérent du schéma public avec empreintes de toutes les colonnes historiques et du schéma ; pg_dump17 utilise TLS verify-full et les CA système. Neon Auth reste un service séparé que cette migration ne modifie pas. Une extension inattendue bloque la restauration.

La répétition restaure **une nouvelle base vide** dans le cluster Docker appartenant au projet, compare lignes et schéma, exécute le même runner puis le rejoue sans doublon. Archive, manifeste, preuve et copie migrée sont conservés privés. Aucun restore par-dessus une base réelle ou la recette humaine ; aucun seed. Le certificat est lié à l’archive SHA256, cible host/base/rôle, projets/branche, révision et SQL. Un nouvel état de source exige une nouvelle sauvegarde/répétition.

## Coordonner la publication

L’expansion001–002 reste compatible avec les anciens writers. Le cutover final003–006 rend les anciens writers incompatibles. Vérifier les capacités Vercel effectives pour empêcher une publication automatique prématurée ; préparer une version construite et saine avant de changer l’alias public. Arrêter les anciens writers et les crons pendant la fenêtre de bascule, puis prendre la sauvegarde finale et répéter. `writersStopped` est une attestation de cette vérification opérationnelle, pas un mécanisme qui suspend le trafic à lui seul.

```sh
node scripts/financial-spaces/production-migration.mjs --profile=<profil-prive> --apply
```

L’apply prend un advisory lock sans attente indéfinie et les verrous des18tables avant de comparer la source avec la sauvegarde. Timeouts bornés. Le préflight refuse propriétaires ambigus et liens croisés ; aucune attribution arbitraire. Le ledger et la phase doivent former un préfixe cohérent avec les checksums connus. La dernière passe002 et003–006 partagent **une seule transaction** ;002 ne tourne qu’une fois. Toutes les colonnes historiques, attributions, appartenances et copies de réglages/guide sont vérifiées avant commit. `ready` n’est visible qu’avec l’ensemble du schéma requis.

Publier/promouvoir seulement la révision validée et compatible. Vérifier domaine/SHA/health/logs, puis rouvrir écritures et crons appropriés. Production : HTTPS valide, cookies Secure, Neon et Resend réels, APP_ORIGIN public, secret d’invitation stable (`INVITATION_TOKEN_SECRET` ou secret Auth existant), expéditeur vérifié ; aucun EMAIL_TO forcé, Mailpit, gateway HTTP local ou fixture.

## Circuit existant vérifié le 26 octobre 2026

Le projet Vercel `mon-budget` (`prj_nDXmq3vVVNRK4ryS2im8Z5R63UdK`) est lié à `FofanaAmara/mon-budget`, branche de production `main`. Le tableau de bord confirme le déploiement automatique au push de main. Réutiliser ce circuit ; aucune publication CLI ou préproduction supplémentaire nécessaire. Domaine canonique HTTPS vérifié : `https://www.mesfinances.app` (l’apex y redirige).

Neon intégré : projet `wispy-breeze-86800451`, branche `main` / `br-bold-union-aivpl4jf`, explicitement identifiée comme production dans la console SSO. La base/rôle/endpoint affichés correspondent aux credentials directs existants. Les identifiants ne dispensent pas du contrôle de cible par le runner.

Séquence opérationnelle avant toute mutation :

1. Terminer la configuration serveur de production (Auth existant, Resend, expéditeur et origine canonique), vérifier les gates de la PR et garder le schéma public inchangé.
2. Utiliser **Settings > General > Pause Project** sur ce seul projet, mécanisme existant et réversible. Vérifier le refus du trafic de production sur domaine canonique et URL de l’ancien déploiement. Vérifier le drainage des transactions applicatives et les writers/cron avant d’attester `writersStopped=true`. Ne pas laisser la production arrêtée pour résoudre des prérequis qui pouvaient être traités avant.
3. Prendre une nouvelle sauvegarde après gel et restaurer/répéter avec le SHA alors courant. La préparation avec `writersStopped=false` n’est pas cette sauvegarde finale.
4. Appliquer001–006 avec le profil final certifié ; vérifier ledger, phase et conservation. Si échec ou résultat COMMIT incertain, appliquer la procédure d’incident, sans merge aveugle.
5. Merger la PR protégée : Vercel déploie automatiquement main. Attendre build Vercel sain et CI entière sur le SHA main exact ; vérifier que la pause reste effective pendant cette attente. Aucun retour au code historique après cutover.
6. Reprendre le projet seulement sur la version compatible, contrôler domaine/SHA, Auth et logs ; commencer les parcours QA de production. Contrôler le rétablissement des crons existants sans les déclencher globalement comme test.

Cette séquence reste à exécuter. La capacité de pause a été vue dans l’UI existante et son effet503 est documenté par [Vercel](https://vercel.com/docs/projects/managing-projects#pausing-a-project). La pause réelle et le drainage doivent être observés avant l’apply ; aucune attestation n’est présumée vraie.

## Incident et récupération

- Échec avant commit : transaction annulée ; conserver archive/rapport, diagnostiquer la cause et comparer phase/ledger en lecture seule avant reprise.
- `COMMIT_UNKNOWN` : réponse réseau perdue, état non présumé annulé. Reconnexion readonly et inspection ledger/checksums/phase/conservation. Ne pas restaurer ou réappliquer aveuglément.
- `COMMITTED_REPORT_FAILED` : commit confirmé mais écriture du rapport échouée. Production peut déjà être migrée ; reconstituer la preuve en readonly avant toute autre opération.
- Après cutover, **interdiction de revenir à l’ancien code filtrant par user_id**. Garder une version compatible espaces ou corriger en avant. Rollback applicatif ne restaure pas la base. Une restauration après nouvelles écritures peut perdre ces écritures : suspendre, préserver et exposer le risque ; aucune restauration destructrice implicite.

La recette P7–P9 utilise seulement des comptes/espaces QA : invitation reçue par Resend, existant/nouveau compte, acceptation distincte sans OTP, contributions à deux persistantes, absence de guide invité, séparation et cache/session, MCP desktop/mobile et WebKit. Ne pas déclencher le cron global comme test. La remise P10 lie chaque preuve au SHA/URL et expose tout manque ; ni build ni déploiement seuls ne valent livraison fonctionnelle.

La restauration compare tout le catalogue. Seules les définitions CHECK sont reparsées par PostgreSQL sur des TEMP dans la copie certifiée : les casts peuvent être normalisés au restore. Noms, validation, autres contraintes, colonnes, index et autres objets restent stricts. Le manifeste conserve le hash brut source pour le contrôle de fraîcheur sur Neon ; la répétition locale utilise séparément le hash restauré.
