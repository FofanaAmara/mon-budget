# Plan — Concevoir les espaces financiers avec /cs-create-experience

## Résumé exécutif
Exécuter le protocole Creative Studio historique 3.34.0 pour mes-finances / espaces-financiers, autorisé par « ok ça me va » après présentation des prérequis et quatre propositions produit. Concevoir seulement ; aucune intégration app ni migration.

## État actuel
Marque cs-brand/mes-finances/brand-config.md et préférences cs-design/mes-finances/project-preferences.md présentes et validées. Brief et six stories AF existent. Pas de dossier de design pour espaces-financiers, ni component-library, ni shared/assets du design. Les travaux de redesign précédents sont completed. Modifications préexistantes .serena/project.yml et next-env.d.ts à préserver. TaskCreate/TaskUpdate et Playwright MCP non exposés ; disponibilité du navigateur à vérifier sans prétendre à une validation Playwright.

## État cible
Mockups HTML interactifs, specs de marque, design-plan avec inventaire, handoff, creative-log, preuves visuelles 375 puis 1280 et deux revues indépendantes, prêts pour décision humaine. Statut design_complete, pas validated sans décision humaine.

## Analyse des écarts
| Écart | Actuel | Cible | Approche |
|---|---|---|---|
| Décisions récentes | Quatre propositions acceptées | Sources PM actualisées | Agent PM propriétaire amende input/backlog |
| Specs | Absentes | Gate 7 et mobile-first | Brander mode Spec |
| Expérience | Absente | Plan puis maquettes | Designer exploration puis assemblage |
| Preuves | Absentes | Gates et revues | Revue visuelle designer, brander Validate, design-reviewer |

## Analyse d'impact
Créer cs-design/mes-finances/features/espaces-financiers/ et runtime canonique nécessaire dans cs-design/mes-finances/shared/assets/. Append index global créatif. PM actualise les seules sources de cadrage et leurs logs. Rayon faible sur code applicatif (aucun changement), moyen sur cohérence UX et propositions financières communes. Pas de capture source ou screenshot fournis au designer selon commande historique.

## Délimitation du périmètre
IN : tous parcours des six stories, états erreurs/reprises, solo et couple, viewport mobile et desktop, log/gates.
OUT : code app, schéma DB, compte réel, envoi d'email, migration, push, déploiement ; leur intégration nécessite mandat ultérieur.

## Hypothèses
HTML peut être servi sur port local libre : vérifier serveur et navigateur. Assets runtime absents : designer vérifie puis scaffold depuis plugin, sans références cache en runtime. Dark absent : Gate12 N/A selon convention. Pas de bibliothèque : fallback créatif permis explicitement par commande, documenter au design-plan.

## Pre-Mortem
| Risque | Probabilité | Prévention |
|---|---|---|
| Sidebar mobile inaccessible ou espace courant invisible | Moyenne | Tester menu, bascule, contextes 375px, identité persistante |
| Invité forcé à créer espace personnel ou accès avant acceptation | Moyenne | Mapper parcours aux sources et revue croisée |
| Mockups visuellement déclarés bons sans navigateur | Moyenne | Screenshot réel mobile puis desktop pour designer et brander ; blocage honnête si impossible |

## Stratégie de rollback
Ne pas modifier les données applicatives. Si génération interrompue, conserver artefacts et état pour reprise (aucune suppression automatique). Si commit documentaire doit être annulé, git revert du seul commit concerné après examen du diff ; préserver les modifications préexistantes. Arrêter uniquement les serveurs de preview lancés par ce cycle si inutiles.

## Plan d'implémentation
1. Sources/prérequis et plan : vérifier fichiers, PM capture quatre décisions, statut brief_ready.
2. Brander Spec : produire brand-specs et vérifier Gate7/section mobile, puis brand_specs_ready.
3. Designer exploration : plan mobile avant desktop et mapping existants/manquants. Vérifier Gate8. Pas de library => fallback documenté, sinon protocole composants.
4. Designer assemblage : mockups, runtime includes, handoff, log et revue visuelle mobile puis desktop. Vérifier Gates1/3/8/10/13 ; aucune déclaration implicite Playwright.
5. Brander Validate : examen visuel, verdict Gate11 ; rejection => designer corrige, maximum protocolaire puis escalade.
6. Design-reviewer : Gate5 ; correction et revue si nécessaire ; contrôler livrables et index, présenter pour décision, commit dédié sans push.

## Critères de succès
- [deterministic] Présence des livrables exigés et des cinq includes runtime par mockup ; liens/ressources résolvent.
- [semantic-cross] Parcours et états respectent les décisions/backlog selon grille Gates1/5/7/8/10/11/13.
- [factual] Screenshots réels 375px avant 1280px, verdicts traçables et défauts connus corrigés.
- [deterministic] Diff limité aux dossiers de design, sources PM et suivi, hors modifications préexistantes.

## Stratégie de tests
Tests des interactions du prototype dans navigateur, sans mutations externes ; noms longs, option unique, multi-espace, invitation reçue/acceptée/erreur, formulaire interrompu, clavier et responsive. Mesures DOM complémentaires uniquement, jamais substitut des screenshots. Pas de tests de finance pour le seul prototype. Vérifier diff et gates après chaque phase.

Relecture de plan : les huit questions planning-methodology sont satisfaites pour ce mandat de conception. Le protocole choisi est la séquence de référence ; ce plan ne vaut pas plan d'implémentation applicative.

## Révision humaine — Continuité avec existant

La première passe est rejetée par le sponsor pour déconnexion de la vraie app, malgré qualité esthétique. Avant correction, designer visite http://localhost:3001 sur mobile puis desktop, prend captures baseline et relève shell/navigation/structures/parcours. Cette instruction humaine prime sur la restriction de la commande historique ne pas regarder sources/screenshots. Corriger les mockups existants en prolongeant la vraie app, sans code app ni bibliothèque ; comparer avant/après en revue indépendante. Les anciens verdicts ne valident pas la continuité de la nouvelle passe. Préserver la passe initiale et BR-01 corrigé. Le finding breadcrumb cible44px reste à corriger.

## Révision humaine — Support React obligatoire

L’humain demande React et refuse HTML. Route courante : skill creative-studio-new:create-feature-experience, runtime React/Storybook. Ancienne passe conservée mais superseded ; nouveau dossier cs-design/mes-finances/features/espaces-financiers-essai-02/, brief par chemin. Source normative = vraie app et composants réels, baseline live déjà capturée. Pas de library ni extraction. Setup preview et dependencies isolés dans essai02, ports3001/4300 conservés ; preview4301. Designer neuf puis relecteur neuf, correction si nécessaire, comparaison visuelle réelle375/1280 contre app. Workspace natif .agent-works/standalone/ui-ux-designer/espaces-financiers-react-essai-02/. Aucun patch racine/app/package, pas intégration. Coût monétaire runtime non disponible, aucune estimation fictive.

## Révision humaine — React simple sans Storybook

L’humain rejette explicitement le skill dépendant de Storybook : arrêt de cette direction. Npm arrêté sortie130, aucun package installé ni serveur Storybook lancé ; artefacts préservés .tmp/cs-espaces-financiers/abandoned-storybook/. Mandat courant : mockups React simples avec Vite/React déjà présents ; brief essai02 remplacé, même agent cs_react_experience relancé sans cycle/skills-new/Storybook/library. Aucun code app modifié. Auto-revue puis regardneuf comparatif ordinaires, pas machinerieStorybook.
