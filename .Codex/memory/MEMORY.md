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

- [Certificat des fixtures et schéma réel](feedback_fixture_schema_certification.md) — lignes seules insuffisantes ; prouver le refus des dérives de contraintes/index/defaults.

- [Propagation des échecs de gates](feedback_gate_exit_codes.md) — contrôler le diff après staging puis conditionner réellement le commit au succès.

- [Protocole de page navigateur](feedback_browser_url_protocol.md) - distinguer ancien onglet interne refuse et vraie page HTTP autorisee ; Mailpit reste une preuve locale distincte.

- [Actions et montants mobiles](feedback_fixed_action_layout.md) - interaction FAB/guide et rails de controles variables a verifier sur les listes financieres.

- [Contrat du fournisseur Auth UI](feedback_auth_ui_provider.md) — effets du wrapper, script de thème au repli, options publiques et contrôles SSR/types/navigateur.

- [Styles des actions dans les listes](feedback_list_action_styles.md) — cibler la ligne prévue, vérifier primaire/hover/focus/disabled après changement de contenu.

- [Liens Auth avant hydratation](feedback_auth_link_ssr.md) — vérifier les vrais href SSR et leur retour après clic/recharge, pas seulement les props de formulaire.

- [MCP startup verification](feedback_mcp_startup_validation.md) - enabled state is not tool availability; diagnose package, protocol, project and language server separately.

- [Safari Secure localhost cookies](feedback_safari_secure_localhost.md) - HTTPS development, no Auth cookie downgrade or silent system CA install.
- [Auth render deduplication and retry](feedback_auth_render_deduplication.md) - per-render cache, cross-request isolation and real server recovery.

- [Fermetures de feuilles dupliquées](feedback_duplicate_sheet_controls.md) — inventorier les contrôles existants avant ajout transversal, recharger le vrai rendu et vérifier les dimensions des captures.

- [Entités sélectionnées et props fraîches](feedback_current_entity_selection.md) — conserver les IDs et les brouillons séparément, vérifier les modales ouvertes pendant un refresh.

- [Prédicats métier du guide](feedback_guide_domain_predicates.md) — une ligne dans expenses peut être un pot technique, pas une dépense configurée.
