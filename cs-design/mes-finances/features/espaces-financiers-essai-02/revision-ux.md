# Révision UX — retours humains du 2026-10-22

## Changements
Question explicite de partage dans le formulaire : Non crée directement, Oui ouvre invitation facultative. Landing publique d’invitation avec choix Connexion ou Inscription ; cadre AuthPage existant importé, service auth simulé. Sidebar limitée au sélecteur. Réglages > Espaces et membres liste les espaces accessibles et la création ; fiche par ID pour renommer et inviter sans basculer le contexte actif.

## Vérification effectuée
- Navigateur intégré via CUA,375×812 puis1280×900. Captures proofs/revision-before-* et revision-after-* : onboarding, landing, inscription, connexion desktop, liste, création et drawer.
- Non : création directe et dashboard vide, sans étape invitation. Oui : étape2 avec champ courriel, focus placé sur ce champ. Création d’un autre espace partagé depuis la liste avec invitation simulée confirmée.
- Landing : les deux liens ouvrent les routes auth existantes adaptées localement. Chaque formulaire simulé revient à invitation en attente ; acceptation explicite puis confirmation, sans espace personnel créé d’office.
- Réglages : liste des deux espaces, création, ouverture détail. Renommage du personnel alors que le couple reste actif : seul nom personnel change, nom couple et contexte actif conservés.
- Sélecteur desktop : bascule effective ; scénario solo : contrôle présent et désactivé. Drawer mobile : aucun lien ni bouton de gestion.
- Scan de pages entières : pas de chevauchement/troncature observés. Boutons de footer alignés à hauteur égale lorsque le texte revient à la ligne ; titre d’étape invitation cohérent entre onboarding et feuille. Pas d’erreur console en fin de contrôle.
- Dernier build Vite exécuté : sortie0,1,18s. Avertissements existants directives use client, sourcemaps, imports des mocks et taille bundle ; aucun nouvel échec. git diff --check sans sortie.

## Limites
Maquettes uniquement : aucune authentification ni invitation réelle, aucun test backend, aucune validation Playwright MCP revendiquée. Validation humaine de cette révision encore attendue. Anciens review.md/correction.md documentent la version précédente ; cette révision remplace les actions sidebar qui y figurent.
