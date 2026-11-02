# Recette reproductible des espaces financiers

Plan parent approuvé : espaces-financiers-implementation.md, P0.4/P7.1. Exécution directe, sans AWM. L’humain demande de décider sans questions.

## État courant

Commit e990b5d : 206 unitaires, 95 tests PG sur copie privée, 21 migrations, six scénarios de composants ; build Webpack vert. Le runtime de recette 3002 est actif. Les preuves Auth réel à deux sessions, réception externe, visuel Playwright MCP et CI distante restent absentes. L’accès navigateur a été refusé ; ne pas contourner cette autorité.

## Écarts

Les tests PostgreSQL clonent spaces_baseline17 restauré depuis une sauvegarde privée, impossible à transmettre à la CI. La conservation de cette copie reste une preuve distincte et ne doit pas être remplacée par un petit seed. La CI doit pouvoir exécuter les mêmes suites et contraintes avec un schéma historique complet et des données entièrement fictives. Aucune CI existante n’est présente dans le worktree ; paramètres distants/protection inconnus.

## Travail prévu

1. Préparer un schéma historique sans lignes, propriétaires ou secrets ; ajouter des fixtures synthétiques couvrant relations et valeurs extrêmes. Initialiser uniquement une base nommée spaces_ci_baseline17 dans le conteneur local vérifié. Ne jamais modifier spaces_baseline17/work17.
2. Rendre le choix du template de test explicite et limité à private/synthetic ; conserver les contrôles d’identité serveur et les noms de DB jetables. Exécuter les mêmes suites sur le template synthétique, puis prouver que la copie privée reste intacte.
3. Formaliser le profil de vérification depuis les commandes réelles ; établir des gardes RED de CI avant sa création. Préparer un workflow de validation sans déploiement, avec permissions minimales et check final inconditionnel. La preuve distante reste non acquise tant qu’aucun push n’est autorisé.
4. Établir une matrice 17 exigences/30 AC avec portée des preuves et lacunes explicites. Vérifier en lecture seule la disponibilité Resend si utile, sans envoyer à EMAIL_TO ni modifier DNS/webhooks.
5. Contrôles locaux appropriés, revue indépendante autorisée, documentation et commit local ; poursuivre la recette globale ensuite.

## Limites

Aucune substitution entre DB synthétique et certificat 703 lignes privées ; aucune substitution de navigateur ou de CI locale aux preuves MCP/distantes exigées. Aucun envoi externe sans destinataire de test contrôlé et quota applicable ; aucun coût ou déploiement imposé.

## Effort

15–25 k jetons estimés, coût monétaire indisponible. Réévaluer si la portabilité du schéma ou les outils de CI demandent une tranche distincte.
