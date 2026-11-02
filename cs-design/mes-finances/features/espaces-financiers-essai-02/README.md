# Espaces financiers — Mockups React

Prévisualisation directe : http://127.0.0.1:4301/ . Aucun Storybook, aucune bibliothèque, aucune installation ajoutée. React19 et Vite7 déjà présents dans le dépôt.

Depuis la racine du projet :

```sh
node node_modules/vite/bin/vite.js --config cs-design/mes-finances/features/espaces-financiers-essai-02/vite.config.mjs --configLoader runner
```

Le petit bouton « Maquette React · Démo » ouvre le choix de parcours et la réinitialisation : couple+personnel, solo, compte vide, premier espace, invitation connectée ou avant connexion, nom long. Il permet aussi de jouer l’autre membre. Les données fictives et l’écran courant persistent dans le stockage local de cette seule origine.

## Réemploi et ajouts

Les vraies définitions React sont importées : LayoutShell/BottomNav, AccueilClient et ses trois onglets, DepensesTrackingClient et filtres/feuilles, RevenusTrackingClient avec Allocation, ProjetsEpargneClient, ParametresClient et gestionnaires/réglages. `app/globals.css` est importé directement. La police provient du fichier local déjà généré par la vraie app. Aucun fichier de l’application n’est modifié.

Ajouts React locaux : sélecteur dans la sidebar desktop ; ouverture d’une sidebar d’espaces par une ligne sous le header mobile ; création/nom/choix personnel ou partagé ; invitation uniquement si partagé ; liste Espaces et membres dans Réglages, création puis détail par espace ; entrée publique d’invitation vers connexion ou inscription existante, invitations reçues et confirmation ; étapes de premier espace. La navigation existante reste à cinq entrées. Le guide de configuration réel reste présent pour un nouvel espace vide.

La page Auth réelle (`app/auth/[path]/page.tsx`) est également importée : la transformation Vite locale résout ses params sans async, sans éditer le fichier. Seule AuthView est substituée par un formulaire de démonstration sans mot de passe ni service. Le cadre, le logo, le texte de marque et le responsive viennent de la vraie page.

## Simulations et limites

Tous les modules actions serveur et le client auth sont remplacés AVANT leur résolution ; pas de .env, Neon, requête métier ou courriel. Création/renommage/invitation/acceptation/bascule sont simulés en local. Ajout de dépenses et revenus ponctuels, statut payé, versement d’épargne et devise disposent aussi d’adaptateurs locaux. Les autres actions financières conservent leur interface et indiquent leur simulation ; ce prototype ne remplace pas le fonctionnement complet des services existants. Les réglages récurrents utilisent des fixtures simplifiées. Le formulaire Auth simule la sortie d’inscription ; il ne teste ni authentification réelle, ni validation de courriel, ni conditions contractuelles.

L’acceptation fait immédiatement disparaître l’invitation en attente et met son compteur à0 ; la confirmation survit à une recharge. L’espace actif ne change qu’avec « Ouvrir cet espace ». Une personne invitée peut n’avoir que l’espace commun. Tous les membres ont les mêmes commandes de gestion/invitation.

## Vérifications et comparaison

Visite réelle en lecture seule à375×812 puis1280×900 : accueil, dépenses, réglages. Comparaison visuelle de pages entières avec la preview aux mêmes formats ; fixtures volontairement fictives et compte réel vide dans la baseline. La baseline affiche aussi une suggestion de notifications et un guide de configuration ; aucune permission de notification n’a été activée pour le prototype. Ces différences de données/état ne sont pas une promesse d’identité pixel par pixel.

Parcours joués via CUA Chrome : création avec/sans invitation ; nom long ; contribution de3,99$ puis bascule et isolation visuelle ; filtres dépenses ; trois onglets accueil ; revenus/Allocation ; patrimoine ; gestion/renommage ; invitation par les deux membres ; acceptation, compteur0, recharge, ouverture explicite ; inscription simulée sans espace personnel imposé. Sur desktop également création solo et bascule. Tab/Escape sur la nouvelle feuille, focus clavier, sidebar mobile, unique option désactivée contrôlés. Aucune erreur console observée à la fin. Aucun test Playwright MCP revendiqué.

Build local Vite exécuté avec succès (903ms). Warnings : bundle principal585kB et mélange imports statiques/dynamiques des mocks ; aucun effet sur le rendu. Aucun test backend/migration/isolation serveur effectué.

Preuves locales dans `proofs/` (ignorées par Git, certaines baseline contiennent les données privées de la session réelle). Paires `before-home/depenses/settings-{375,1280}.png` et `after-*` ; nouvelles surfaces onboarding, sidebar, gestion, signup et acceptation. Pour les nouvelles surfaces, aucun faux « avant » n’est inventé.

## Découverte visuelle explicite

Le vrai `RevenusMonument` déborde à375px avec3 400,00$/3 400,00$ : minimum typographique48px et28,8px pour les deux termes. La preview propose UNIQUEMENT sur Revenus à≤420px un ajustement local des tailles, sans masquer ni tronquer les montants ni déplacer les données. Avant : `proofs/after-allocation-375.png` ; après, mêmes données et onglet : `proofs/after-revenus-fit-375.png`. Source application inchangée : correctif réel à prévoir séparément. Les autres monuments conservent les tailles de l’application.

Correction après regard neuf : la cible mobile du compteur d’invitation passe de26×26 à44×44px ; le badge intérieur reste26×26. Validation visuelle avec nom long et rejouage invitation→acceptation→compteur0 ; mesures et captures dans proofs/. Voir correction.md ; review.md conserve le finding historique.

## Liens directs

Un lien avec `scenario` ouvre une copie initiale du parcours demandé, même si une autre démo était sauvegardée. Les interactions suivantes restent locales. Sans paramètre, la dernière vue est reprise.

- [Couple + personnel](http://localhost:4301/?scenario=couple)
- [Un seul espace](http://localhost:4301/?scenario=solo)
- [Compte existant vide](http://localhost:4301/?scenario=empty)
- [Premier espace / onboarding](http://localhost:4301/?scenario=onboarding)
- [Invitation — compte existant](http://localhost:4301/?scenario=invite)
- [Invitation — avant connexion](http://localhost:4301/?scenario=signup)
- [Nom long](http://localhost:4301/?scenario=long)
- [Créer un autre espace](http://localhost:4301/?scenario=couple&dialog=create)
- [Liste Espaces et membres](http://localhost:4301/parametres/espace?scenario=couple)
- [Dépenses du couple](http://localhost:4301/depenses?scenario=couple)
- [Revenus du couple](http://localhost:4301/revenus?scenario=couple)
- [Patrimoine du couple](http://localhost:4301/projets?scenario=couple)
- [Réglages du couple](http://localhost:4301/parametres?scenario=couple)

Vérification : les13 adresses ont été ouvertes dans le navigateur et leur écran initial contrôlé. Build Vite exécuté avec succès.

### Révision demandée après test humain

- Onboarding et création : choix explicite personnel/partagé. Non crée directement ; oui propose l’invitation facultative.
- La sidebar contient uniquement le sélecteur. Gestion, liste et création sont dans Réglages > Espaces et membres. Le détail ouvre l’espace choisi sans basculer l’espace actif ; renommage et invitation ciblent cet ID.
- Page publique explicite d’invitation, avant auth, avec deux liens vers les routes existantes. AuthPage réelle réemployée pour connexion et inscription, formulaire service simulé ; l’acceptation reste une étape distincte.
- [Détail de Notre couple](http://localhost:4301/parametres/espace/couple?scenario=couple)
- [Détail de Mes finances](http://localhost:4301/parametres/espace/personal?scenario=couple)
- [Connexion depuis invitation](http://localhost:4301/auth/sign-in?scenario=signup)
- [Inscription depuis invitation](http://localhost:4301/auth/sign-up?scenario=signup)

Preuves de cette révision : proofs/revision-*.png, ignorées par Git. Les captures et vérifications antérieures décrivent la version précédente ; les commandes de gestion en sidebar qui y figurent sont supprimées par cette révision.
