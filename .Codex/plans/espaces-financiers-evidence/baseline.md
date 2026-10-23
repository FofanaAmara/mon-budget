# Contexte vérifié — 2026-10-22

## Schéma
Connexion configurée confirmée sans affichage des secrets. Lecture des seules métadonnées public dans une transaction Neon readOnly :18 tables,175colonnes,49index,50contraintes. Résultats dans schema-live.json. Aucun SELECT sur les lignes financières et aucune mutation. Premier essai sous sandbox : NeonDbError ; seconde exécution autorisée avec réseau a réussi. Ce résultat ne certifie ni volumétrie, ni absence d’orphelins, ni capacité de restauration.

## Tests exécutés
Commande : node node_modules/vitest/vitest.mjs run
Résultat : sortie1 ;5fichiers,176tests réussis/177,1échec.
Échec : __tests__/unit/progressive-expenses.test.ts:146, getStatusBadge(IN_PROGRESS). Attendu var(--teal-50), retourné #ECFDF5. Source lib/expense-display-utils.ts:145 renvoie palette hex (#ECFDF5/#059669), test attend variables teal. Contrat visuel/test désaligné préexistant ; réconcilier contre UI validée avant développement, sans masquer le test.

## Sources
package.json ; lib/db.ts et auth ;16modules lib/actions contenant86exports async ; app/layout.tsx, providers.tsx, pages financières, proxy.ts ; public/sw.js ; app/api/cron/push et api/push ; scripts/migrate-*.mjs ; supabase/schema-current.sql ; deux discoveries référencées au plan ; backlog et prototype React7aaec6d.
Le snapshot SQL historique n’inclut pas toutes les tables actives : expense_transactions, setup_guide et user_onboarding sont présents en base réelle. Schéma stocké dans le fichier de preuve, pas d’URL de connexion, jeton, donnée métier ni identifiant utilisateur.

## Ressources
Nodev24.9.0, Next16.1.6/React19.2.3, Vitest4.0.18, PostgreSQLNeon. .env.local et configurations DB/Auth présents ; aucun provider de courriel applicatif trouvé par recherche de code/paquets et clés connues, à confirmer côté hébergeur. Aucun workflow .github ni configuration e2e versionnée trouvés ; @playwright/test est installé. Aucun outil Playwright MCP dédié exposé parmi les outils courants ; les tests CLI et CUA ne satisfont pas à eux seuls l’exigence explicite Playwright MCP de livraison.
