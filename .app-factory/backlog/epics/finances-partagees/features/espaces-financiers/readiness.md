# État de préparation et de recette — 2026-10-23

> Statut : IN_PROGRESS — implémentation locale présente, livraison complète non démontrée.

Le précédent état du22octobre décrivait uniquement la préparation. Il est remplacé par ce relevé après exécution directe autorisée par l’humain, sans AWM. Les six stories sont en cours ; aucune n’est DONE. Ni le code présent, ni les maquettes, ni un test simulé ne suffisent à valider leur Definition of Done.

## État vérifié

| Sujet | Acquis | Reste à prouver |
|-------|--------|----------------|
| Design | Maquettes React essai-02 approuvées, commit7aaec6d | Conformité finale sur toutes pages, clavier et PlaywrightMCP |
| Plan | Plan global approuvé, exécution directe autorisée ; décisions techniques documentées | Respect des gates restants, sans nouvelle approbation implicite pour push ou production |
| Conservation | Copie PostgreSQL17 restaurée,703lignes/18tables/175colonnes conservées avant recette, migrations001–006 | Validation globale de release ; aucune migration de production réalisée |
| Espaces | Création/gestion/bascule et78actions financières contextualisées, servicesPG | Parcours Auth réels et toutes familles en E2E, cache/offline/BFCache |
| Persistance | Revenus distincts125.25personnel/987.65couple saisis via vraieUI, rechargés et certifiés en lecture SQL | Contributions de deux membres réels ; les deux espaces ont encore un seul membre chacun |
| Invitations | Réception Mailpit, landing explicite et liens vers Auth ; vérification OTP raccordée, retour entre vues corrigé | Réception externe Resend, compte vérifié, acceptation réelle existant/nouveau compte |
| Qualité |260unitaires au code5101fa5, build/types/lint et7gardes verts ;99PG/13casChromium du socle précédent | CI distante SHAexact, revue globale indépendante et visuel PlaywrightMCP |

Recette locale : http://localhost:3002 ; boîtes locales : http://localhost:8025. Aucune donnée financière source modifiée, aucun push ou déploiement effectué. La recette est sur une copie privée isolée ; l’authentification utilise le service Neon existant.

## Preuves et statuts

- [Matrice17exigences/30AC](../../../../../../.Codex/plans/espaces-financiers-evidence/acceptance-matrix.md) : correspondance exhaustive et limites de chaque preuve ; tous les critères non prouvés restent ouverts.
- [Audit courant](../../../../../../.Codex/plans/espaces-financiers-evidence/delivery-current-audit.md) : état au code `5101fa50a7c827ff3b508836a51af39d46e8a2a0`, conditions externes vérifiées et prochains contrôles nécessaires.
- Plan : `.Codex/plans/espaces-financiers-implementation.md`, compléments de session et décisions dans `.Codex/adhoc/decisions/`.
- Pas de points ni de dates inventés rétrospectivement. Estimations par tranches tracées dans plans/journaux ; coût monétaire indisponible, aucun nouveau service payant engagé.

## Décisions produit et UX acquises

- Tous les membres ont tous les droits, sans privilège du créateur.
- Invitations par courriel, également visibles après connexion ; nouvel invité pouvant rejoindre directement le commun sans espace personnel supplémentaire forcé.
- Dernier espace utilisé repris ; données existantes dans « Mes finances », nom modifiable.
- Onboarding : nom et question explicite du partage. Non crée sans page invitation ; Oui la propose, sans rendre l’envoi obligatoire.
- Page d’invitation avant authentification : annonce explicite de l’espace, boutons Se connecter / Créer un compte vers les pages existantes ; acceptation distincte après authentification.
- Sidebar desktop/mobile : uniquement le sélecteur pour la section espace. Avec une seule appartenance, option unique et aucune bascule.
- Réglages > Espaces et membres : liste de mes espaces et création, clic vers fiche pour renommer, voir les membres et inviter. Consulter une fiche ne change pas l’espace actif.

Ces décisions et l’approbation du design ne doivent pas être redemandées.

## Conditions de clôture restantes

1. Une boîte de recette contrôlée, une adresse Auth réellement vérifiée et des sessions accessibles doivent permettre réception Resend puis acceptation distincte, contribution et recharge à deux. Configuration expéditeur Resend vérifiée en lecture le23octobre ; cela ne prouve aucune réception. Gmail n’est pas connecté. EMAIL_TO n’impose pas le destinataire.
2. Inscription réelle puis vérification et retour invitation sans espace personnel forcé. Aucun compte créé ou statutemailVerified fabriqué pour remplacer cette preuve.
3. Recette financière complète, onglets/saisies/réponses tardives/offline/BFCache et clavier/visuel exigé. ChromeDevTools actuel est anonyme ; anciennes sessions de recette non disponibles dans cet outil. PlaywrightMCP absent.
4. CI distante verte sur le commit exact et revue globale indépendante. Aucun push n’est autorisé par le seul goal ; aucun run actuel au5101fa5.

Les actions de départ/exclusion/suppression et les rôles différenciés ne s’ajoutent pas à cette livraison. La reprise vise les conditions manquantes, sans réduire les30AC pour déclarer DONE.
