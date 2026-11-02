# Entrées privées et identité de saisie — 2026-10-23

Plan parent approuvé, extension de espaces-financiers-session-and-delivery.md. Exécution directe, aucune méthode AWM. Goal global toujours IN_PROGRESS.

## Finding et correction

La revue globale du HEADde4115e a relevé un P1 : l’onboarding n’était pas dans le layout financier gardé. Une saisie de A pouvait créer un espace pour B après un changement de compte interonglets ; le serveur vérifiait B, mais ignorait l’acteur de la saisie. Le choix des espaces et les invitations privées conservaient aussi leur contenu.

Onboarding et choix sont maintenant enveloppés par le garde existant attaché à l’identité serveur. Un layout invitations couvre liste et confirmation. Le wrapper privé est également keyé par userId : une actualisation autorisée sous un autre acteur démonte les anciens brouillons, même avec un espace commun. La page bearer publique reste inchangée.

createSpace exige expectedActorId dans son schéma et le compare à Auth avant toute écriture. inviteToSpace exige aussi cet acteur et le compare à la session fraîche et à l’acteur validé par requireSpace. Il ne remplace jamais l’autorisation. Formulaire et fiche transmettent leur acteur rendu ; tous les appelants de test adaptés. Le formulaire vérifie le montage après chaque attente, avant de poursuivre une invitation ou de naviguer.

## Vérification

RED : les deux nouveaux tests PG échouaient au comportement sur le code précédent (création et envoi indus), produisant aussi des échecs secondaires dus aux lignes alors créées dans leur clone jetable. Aucun test destructeur réel. Les clones sont supprimés par la suite.

GREEN : 226 unitaires, dont quatre tests sur les vraies entrées avec garde réel (contenus internes simulés), 97 services PostgreSQL sur baseline synthétique dont refus acteur changé/manquant sans nouvelle ligne/espace/mail. Auth et transport simulés ; aucun véritable changement de compte navigateur prouvé.

Types sortie0 et lint sortie0/14 avertissements existants, dans la copie durable sans secrets. Build Next16.4.2 Webpack en copie : sortie0 (session70972). Gardes CI/matrice7/7. Aucune modification de dépendance ou migration, les 29 tests natifs précédents restent une preuve de leur tranche inchangée.

Revue indépendante lecture seule : P1 fermé, pas de nouveau finding concret. Revue React : gardes serveur obligatoires, props sérialisées minimales, hooks inconditionnels et démontage des continuations conservés. Aucun design system ajouté.

Logs privés : private-entry-{red,unit,services,typegen,types,lint,build}.log sous .local/financial-spaces/. Première exécution PG refusée par sandbox Docker, relancée avec droit local ; une adaptation de fixture userId a corrigé les tests après évolution de contrat. Ajustement de format préparé dans la copie puis récupéré vers la source et vérifié avant commit.

## Limites

Toujours aucune nouvelle preuve navigateur après refus de politique ; pas de contournement, pas de prétendue validation PlaywrightMCP ou de remount observé à l’écran. Email externe réellement reçu, Auth existant/nouveau à deux sessions, UI actuelle mobile/desktop, onglets/offline/BFCache et CI distante restent ouverts. Recette3002 confirmée en écoute, aucune requête navigateur effectuée pour ce contrôle. Aucun envoi externe, push, mutation source ou base work17.

Estimation initiale6–10kjetons, coût monétaire indisponible ; aucun service payant engagé. Aucun plafond approuvé.
