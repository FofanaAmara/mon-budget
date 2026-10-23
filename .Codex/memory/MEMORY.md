# Mémoire projet

- [Continuité des features avec la vraie app](feedback_feature_continuity.md) — correction humaine du 2026-10-22, à lire avant toute conception de feature.
- [Périmètre du runtime des mockups](feedback_mockup_runtime_scope.md) — React demandé ne signifie pas Storybook autorisé.

- [Copies PostgreSQL vérifiées](feedback_postgres_restore_verification.md) — dépendances de schéma, CHECK normalisés, identité de cible et preuve de restauration.

- [Backfill rejouable et copies dérivées](feedback_repeatable_backfill_copies.md) — reprendre la dernière configuration avant bascule, pas seulement conserver les originaux.

- [Destination PostgreSQL effective](feedback_effective_database_target.md) — vérifier les paramètres réellement interprétés par le pilote avant connexion.

- [Montants exacts et état courant](feedback_money_and_current_state.md) — centimes, génération/réception atomique et tests de concurrence réels.

- [Réponses après bascule](feedback_async_space_navigation.md) — lifetime, continuations, sélecteur et brouillons par boutons.
- [Types Next générés](feedback_generated_next_types.md) — préserver les changements humains pour toutes les commandes génératrices, y compris typegen.

- [Déduplication des courriels](feedback_email_idempotency_window.md) — fenêtre fournisseur, payload figé et état incertain.

- [Sessions Auth en rendu serveur](feedback_auth_rsc_session.md) — tester les effets réels du SDK et séparer lecture RSC de renouvellement mutable.
