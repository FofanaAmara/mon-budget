# Actions financières — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Exécution directe sans AWM.

## Périmètre réel

38 des 78 exports financiers de la baseline ont une nouvelle implémentation explicite dans lib/actions/financial : cartes, catégories, dettes, épargne, revenus et revenus mensuels. Le registre action-conversion.json relie chaque export historique, son implémentation et ses appelants à raccorder. Les anciennes entrées servent encore l’UI historique et devront être supprimées avant activation. Ce résultat est un socle métier testé, pas un parcours produit livré.

## Comportements vérifiés

Chaque action vérifie l’appartenance et utilise le spaceId explicite ; user_id conserve l’acteur/provenance sans limiter la lecture à cet auteur. Les deux membres lisent et modifient les mêmes éléments. Les IDs de parents d’un autre espace sont refusés avant écriture ; les contraintes composites restent la dernière garde. Les suppressions de cartes/catégories dissocient seulement les références, sans perdre les space_id.

L’ordre des catégories est validé et modifié sous les mêmes verrous, y compris lorsqu’un autre writer supprime un ID. Les transferts verrouillent les deux projets dans un ordre stable ; contrôle du solde, débits/crédits et journaux sont atomiques. Un paiement supplémentaire ne journalise que la somme effectivement déduite du solde de dette. Le pot d’épargne libre utilise son discriminateur technique et reste unique après renommage.

Les montants monétaires refusent les fractions de cent, acceptent puis normalisent le bruit binaire et respectent NUMERIC(10,2), ou NUMERIC(12,2) pour principal/solde de dette. Le défaut 0.005 a été confirmé sur la copie par un SELECT constant, puis couvert par rejet des fractions, corrections négatives, arithmétique flottante et limites.

La génération de revenus calcule depuis les templates courants verrouillés, sans snapshot JavaScript ancien. La réception automatique utilise le même calcul dans la même instruction : une édition100→200 après génération reçoit200 ; un override mensuel60 reste60. Les montants déjà reçus restent figés. Les revenus historiques sans parent restent visibles dans leur espace. Les créations ponctuelles sont atomiques et leurs templates sont inactifs dès insertion.

La migration 004 autorise un montant fixe absent uniquement pour VARIABLE et impose un montant positif aux autres fréquences. Le préflight local a trouvé0 revenu fixe incompatible. Aucun montant ou lien historique n’est modifié ; échec, reprise et rejeu sont testés. Elle n’est appliquée qu’aux clones jetables.

## Vérifications exécutées

- Services : 40/40, dont25 tests financiers et15 tests d’espaces, PostgreSQL réel sur clones isolés. Auth serveur et invalidation Next sont explicitement simulées ; appartenance commune seedée, donc aucune preuve d’invitation réelle.
- Migrations : 19/19, dont rollback/rejeu004 et conservation de toutes les colonnes historiques.
- Unitaires : 181/181.
- TypeScript : sortie0.
- ESLint : 0 erreur,17 avertissements préexistants.
- Build Next final : sortie 0, configurations restaurées et sortie isolée dans .next-spaces-build.
- Revue indépendante : fractions de cent, snapshot de génération, réception après édition et état fixeNULL corrigés ; corrections ciblées du guide et du certificat relues. Aucun constat ouvert dans cette tranche.

Les tests de concurrence observent les requêtes en attente via pg_stat_activity avant de libérer le writer. L’observateur rafraîchit pg_stat_clear_snapshot dans sa transaction. Les tests ne remplacent pas l’action réelle par une fixture mettant à jour les objets dérivés à sa place.

## Écart détecté sur la copie utilisée par le navigateur

Le contrôle strict de conservation du work a échoué, correctement : une seule ligne setup_guide a son dismissed_at rafraîchi alors qu’elle était déjà fermée. Les703 lignes sont présentes, les17 autres tables sont identiques par empreinte, y compris toutes les tables financières. La cause est un effet de célébration actif pour un guide invisible lors du smoke test précédent.

Correction : effet conditionné à la visibilité et absence de fermeture locale ; UPDATE de fermeture seulement si dismissed_atISNULL. Un test PostgreSQL conserve les dates historiques après appels répétés et autorise une nouvelle fermeture après reset. Page locale rouverte après correction : aucun nouvel écart au-delà du délai du minuteur, observation supérieure à200 secondes. Source et baseline intactes. Work conservé sans reset ; il n’est plus présenté comme une copie immuable.

Le vérificateur conserve ses critères stricts et écrit preserved:false sur toute vérification échouée, même en cas d’échec de première/seconde connexion ; il ferme la connexion déjà ouverte. Deux tests ciblent l’invalidation d’un ancien certificat vert. La preuve de conservation de migration provient des clones propres et de la baseline, pas d’une exclusion silencieuse du guide.

## Observation visuelle complémentaire

Le viewport complet du carrousel existant a été scanné via CUA. L’indicateur Next recouvrait Passer ; devIndicators:false corrige ce chevauchement, comparé avant/après. Capture privée .local/financial-spaces/guide-after.png. Le lanceur de recette restaure à nouveau les configurations générées sur Ready après redémarrage. Aucun verdict Playwright MCP ni parcours multiespace/E2E ne découle de cette observation.

## Suite

Convertir dépenses, échéances, transactions et allocations ; séparer réglages/guide/compte et fermer les chemins de démo/reset/claim. Raccorder les routes canoniques, formulaires et maquettes puis retirer toutes les actions legacy avant bascule locale003+004. Ensuite invitations/Auth/email, cache/offline, CI et recette globale des17 exigences/30 AC. Aucun email, push Git ou déploiement production effectué.
