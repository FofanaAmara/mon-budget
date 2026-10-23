# Examen de readiness — actualisé le 2026-10-22 après validation des maquettes

Portée : backlog et préparation de la prochaine priorité. Aucune implémentation métier déclarée.

## Verdicts distincts

- **Design : APPROUVÉ par l’humain**, après test et corrections du prototype React, commit `7aaec6d` : « ok c’est parfait ça me va ». Référence et limites dans le [brief](feature-brief.md#design-approuvé-après-test-humain--2026-10-22).
- **ESP-001 : READY pour préparation du plan technique**, design disponible ; pas READY pour build tant que le plan et les preuves de sûreté nécessaires ne sont pas préparés/validés.
- **Feature complète : NOT READY pour build**. Le design n’est plus un blocage. Dimensionnement, architecture de contexte, conservation/migration, isolation et points produit restants doivent être traités avant les parcours concernés.
- Les six stories restent REFINED, prochaine priorité immédiate ; aucune n’est DONE ou en cours de développement.

## Résultats des contrôles AF

| Contrôle | Résultat | Conclusion |
|----------|----------|------------|
| Couverture | 10 FR, 3 NFR, 2 UXR et 2 TR associés aux stories | PASS documentaire ; 17 exigences, aucune preuve d’implémentation |
| Dépendances | 6 stories, uniquement vers des numéros précédents | PASS, aucun cycle ni découpage par couche |
| Critères | 5 AC Given/When/Then par story, 30 au total | PASS documentaire ; nominal, erreurs et limites maintenus |
| Design | Maquettes React corrigées approuvées par le sponsor | ACQUIS pour l’expérience ; simulation locale seulement |
| Taille | Conservation globale002 et contextualisation003 à risque | NON ÉTABLI : estimation/dimensionnement requis, aucun point ni date inventé |
| Technique | Plan, assurance et sûreté migration pas encore validés | NON ACQUIS : à préparer avant build |

## Décisions produit et UX acquises

- Tous les membres ont tous les droits, sans privilège du créateur.
- Invitations par courriel, également visibles après connexion ; nouvel invité pouvant rejoindre directement le commun sans espace personnel supplémentaire forcé.
- Dernier espace utilisé repris ; données existantes dans « Mes finances », nom modifiable.
- Onboarding : nom et question explicite du partage. Non crée sans page invitation ; Oui la propose, sans rendre l’envoi obligatoire.
- Page d’invitation avant authentification : annonce explicite de l’espace, boutons Se connecter / Créer un compte vers les pages existantes ; acceptation distincte après authentification.
- Sidebar desktop/mobile : uniquement le sélecteur pour la section espace. Avec une seule appartenance, option unique et aucune bascule.
- Réglages > Espaces et membres : liste de mes espaces et création, clic vers fiche pour renommer, voir les membres et inviter. Consulter une fiche ne change pas l’espace actif.

Ces décisions et l’approbation du design ne doivent pas être redemandées.

## Points restants avant implémentation des parcours concernés

- Inventorier tous les chemins de données/traitements/caches et concevoir le contexte ; classifier préférences individuelles vs financières et progression du guide, onglets/appareils et repli si un espace devient inaccessible.
- Concevoir une migration conservant montants, relations et unicité des instances ; stratégie de reprise, classification de sûreté/assurance et tests réels d’isolation à deux membres et un non-membre. Examiner les discoveries et l’échec de test cités dans l’input, sans les supposer résolus.
- Garantir le bon destinataire et la continuité de l’invitation entre page publique, auth et acceptation. Vérification du courriel, durée de sept jours, modalités de renvoi/annulation/refus restent des propositions ; un bouton simulé ne les valide pas.
- Dimensionner ESP-002/003 et redécouper par capacité utilisateur si nécessaire, sans stories DB/API/UI. Préparer le plan technique et le faire valider avant exécution.

Le report des actions de départ/exclusion/suppression reste une proposition de périmètre ; aucune action destructrice ni rôle propriétaire ne s’ajoute tacitement.

## Prochaine action

Préparer le plan technique d’ESP-001 et la stratégie d’ensemble de conservation/isolation, avec migration introduite dans la story qui en a besoin. Le mandat de cette mise à jour reste documentaire : pas de migration, d’envoi réel, de développement applicatif ou de push.
