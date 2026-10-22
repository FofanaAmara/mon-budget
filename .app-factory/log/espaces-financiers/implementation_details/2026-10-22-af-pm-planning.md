# af-pm — Planning : Espaces financiers

Date : 2026-10-22
Source : `.Codex/inputs/espaces-financiers/input.md` et instruction humaine de priorisation immédiate.

## Prise de contexte

Le besoin décrit un contexte financier complet, pas une enveloppe commune. Aucun doublon trouvé dans les features existantes : seule la vision mentionnait le partage familial. La décision humaine place ce chantier avant les autres fonctionnalités ; elle autorise sa préparation maintenant, sans valider encore le plan technique.

Le tableau de bord historique annonce encore des travaux à faire alors que des états/logs indiquent code_complete ou done. Aucun `state/current.yaml` ne désigne de commande active. Les états de features anciennes ne sont pas réécrits sur cette seule lecture. Les discoveries ouvertes sur les relations parent/enfant et les écritures multiples sont à examiner dans la conception de l'isolation, sans en déduire une correction déjà effectuée.

## Découpage en cours

Extraction préalable des exigences, puis stories par parcours utilisateur. Le fonctionnement global et la reprise de données sont indispensables avant toute exposition d'un deuxième espace. L'égalité des membres exclut tout privilège du créateur. Les inconnues produit restent marquées comme telles.

## Raffinement et priorisation

Six parcours verticaux rédigés : premier espace solo, conservation des comptes existants, création/bascule complète, invitation d’un compte existant, inscription invitée, invitation pendant onboarding. Le nom du premier espace existant, le transport/destinataire d’invitation, la première appartenance de l’invité et les règles de contexte/préférences ont des propositions explicites dans le brief ; elles ne sont pas attribuées à l’humain.

Le premier incrément peut passer immédiatement en conception. La feature complète est NOT READY pour build : les arbitrages et le plan manquent, et les stories de conservation/contextualisation demandent une vraie analyse de taille. Aucun chiffre d’estimation inventé. Départ/exclusion/suppression ne sont pas ajoutés comme stories ; report recommandé à faire confirmer sans inventer de propriétaire privilégié.

Le dashboard et la vision portent la nouvelle priorité ; les libellés historiques restent identifiés comme à rapprocher. L’état de cette nouvelle feature indique planned/refinement, aucune commande d’implémentation n’est déclarée active.

## Contrôles exécutés

Vérification documentaire exécutée le 2026-10-22 : les six stories ont chacune cinq blocs AC, chacun avec Given/When/Then ; leurs dépendances ne visent que des numéros précédents ; les seize exigences extraites apparaissent toutes dans la couverture ; zéro lien Markdown local cassé parmi les nouveaux documents et les trois index/vision modifiés. `git diff --check` ne remonte aucune erreur.

Aucun build, test applicatif ou navigateur exécuté : seuls les documents changent. Ces contrôles ne certifient pas la fonctionnalité ni les états historiques. Aucun commit, push, migration ou invitation ; modifications préexistantes `.serena/project.yml` et `next-env.d.ts` non touchées. Livrables transmis au lead pour relecture et commit documentaire dédié.

## État de fin

Backlog documentaire complet, prochaine priorité visible ; conception ESP-001 à préparer et plan à soumettre. Feature entière NOT READY pour build ; ne pas passer le gate sur la seule base de critères rédigés. Les propositions à consolider avec l’humain se trouvent dans le brief ; l’input source reste inchangé.
