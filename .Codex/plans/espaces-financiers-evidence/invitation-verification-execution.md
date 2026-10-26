# Parcours de vérification du destinataire

2026-10-23. Goal global **non atteint**. Plan parent et extension session-and-delivery ; décision DEC-004. Travail direct sans AWM.

## Changement
La page d’invitation propose de recevoir un code, d’utiliser un code déjà reçu ou de recharger après confirmation par lien. Envoi et validation passent par les API OTP dédiées de Neon. L’adresse est dérivée côté serveur, l’acteur attendu et l’invitation sont contrôlés avant tout endpoint fournisseur. Pas d’adhésion ou d’espace personnel ajouté lors de la vérification. Un succès n’est reconnu qu’après une nouvelle session Auth fraîche du même compte et de la même adresse.
L’UI utilise les styles existants, un champ numérique compatible autofill/collage et des messages accessibles. Pas d’envoi au montage, renvoi temporisé60s, erreur ambiguë sans retry automatique, suppression des effets tardifs après démontage ou changement de compte. Après succès, nouveau document sur la même invitation et invalidation des vues financières des autres onglets. La confirmation de rejoindre reste explicite.

## Vérifications exécutées
-246tests unitaires verts, dont huit tests d’actions, quatre de rendu de la vraie page et un nouveau contrat des endpoints du SDK installé. Le transport est remplacé par fetch simulé ; aucun email externe envoyé.
-99tests PostgreSQL verts. Deux nouveaux cas vérifient le filtre réel de l’invitation et les refus : acteur différent/absent, autre email, jeton forgé, expiration et réponse déjà donnée. Vérification Auth simulée puis absence d’appartenance et de nouvel espace ; acceptation distincte via le service réel ensuite. Ce n’est pas une preuve de deux comptes hébergés ayant accepté.
- Banc Chromium du vrai composant : sept contrôles verts (montage sans envoi, saisie/trim/pending, erreur sans navigation, envoi incertain avec saisie et délai, réponse après fermeture, réponse après changement de compte, retour exact après succès sans acceptation). Auth/actions/destination simulés, fichier report.json privé explicite sur ces limites.
- Ancien banc de navigation : six contrôles rejoués verts après extension de sa configuration Vite. L’adaptateur de lien du banc ignore le prop Next prefetch pour éviter un warning DOM ; il n’affecte pas les liens produits.
- BuildWebpack, types, lint0warning et sept gardes du workflow verts en copie isolée sans secrets. Nouveau banc raccordé au jobquality, sans skip. Aucun run GitHub ni push effectué. Dépendances inchangées, audit production0du socle conservé ; aucune migration nouvelle ni relance inutile des29tests natifs de migration inchangés.
- Revue indépendante source/contrat/CI/captures : aucun finding restant. La première fixture PG d’invitation refusée violait une contrainte ; corrigée pour utiliser la vraie action de refus, puis suite99/99rejouée.

## Navigateur dans la vraie app
CUA avec locators Playwright, distinct du critère Playwright MCP. IAB compte destinataire existant non vérifié, invitation de recette reçue précédemment dans Mailpit. Contrôles375x812et1280x900 après rechargement : intro, ouverture « J’ai déjà un code », champ vide/3chiffres désactive,6chiffres et espaces collés normalisés activent le bouton. Aucun envoi ni validation OTP soumis. Champ vidé après captures. Tab passe du champ vide au renvoi, en sautant le bouton désactivé. Viewport restauré.
Scan entier mobile/desktop : un défaut découvert puis corrigé, voir DISC-ESP-007. Les captures après correction sont lisibles, sans chevauchement/débordement apparent ; revue indépendante des captures confirme. Pas d’audit clavier global revendiqué.

## Preuves privées
`.local/financial-spaces/verification-current/` : logs unit/services/build/types/lint/delivery/browser-harness/navigation-harness, action-red.log ; intro375, formulaire avant correction375, états vide/prêt après correction375, desktop1280etverification-controls.png sans informations personnelles. Captures d’invitation et jetons exclus de Git. `.local/financial-spaces/verification-harness/report.json` précise les bords simulés. Les données de saisie illustrées sont fictives, le champ a été vidé.

## Limites et prochaine étape
OTP reçu et vérifié chez Neon non prouvé, acceptation et contributions réelles de deux membres toujours ouvertes. Nouveau compte, réception externe Resend, parcours de toutes les finances/automatismes, inter-onglets/offline/historique, CI distante et Playwright MCP restent à compléter selon la matrice. SMTP applicatif local opérationnel ne configure pas la livraison de vérification de Neon. Aucun changement de configuration, de bit emailVerified, de source DB ou de credentials ; aucun mail externe ni engagement payant.
