# DISC-ESP-001 — Précision monétaire et dérivations concurrentes

**Type :** BUG
**Sévérité :** P1
**Découverte :** revue indépendante et intégration des espaces financiers, 2026-10-23
**Statut :** corrigé dans les nouvelles actions ; retrait des anciennes entrées requis avant activation

## Constat et cause

Les schémas numériques acceptaient 0.005. PostgreSQL arrondit les soldes séparément : source100−0.005 devient100.00 et destination0+0.005 devient0.01. Un SELECT constant sur la copie a reproduit le défaut. Les nouveaux schémas refusent les fractions de cent, normalisent le bruit binaire et bornent les montants à la précision de leur colonne.

La génération de revenus lisait puis calculait dans une seconde requête. Une ancienne lecture pouvait écraser un montant plus récent ; une réception automatique séparée pouvait aussi figer un montant dérivé avant édition. Les nouvelles actions calculent et reçoivent depuis les templates verrouillés dans une instruction commune, en préservant les overrides et les revenus déjà reçus.

Le formulaire autorisait un revenu VARIABLE sans montant fixe alors que la base imposait NOT NULL. La migration 004 autorise NULL pour VARIABLE et ajoute un CHECK de montant positif pour les fréquences fixes. Le préflight sur copie a trouvé0 revenu fixe incompatible ; aucune valeur n’est changée.

Le réordonnancement pouvait modifier certains IDs avant de découvrir une suppression concurrente. Le contrôle et les modifications utilisent désormais tous les verrous de catégories dans un ordre stable avant toute mutation.

## Preuves et suite

Voir .Codex/plans/espaces-financiers-evidence/financial-actions-execution.md. Tests de fractions de cent, limites, deux membres, IDs croisés, journal atomique, concurrence avec attentes PostgreSQL observées, reprise de migration et réception après updateIncome réel.

Les anciennes actions non contextualisées restent transitoirement raccordées à l’ancienne app. Elles ne doivent pas subsister au raccordement des routes canoniques. Ne pas annoncer ces corrections comme déjà déployées ni activer le multiespace partiellement.
