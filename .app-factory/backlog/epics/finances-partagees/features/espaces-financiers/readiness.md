# Examen de readiness — 2026-10-22

Agent : af-pm. Portée : backlog uniquement, aucune validation d’implémentation.

## Verdicts distincts

- **ESP-001 : READY pour conception et plan technique**, pas READY pour build. Le besoin utilisateur est décidé : nommer un premier espace, démarrer seul, utiliser l’application, voir une seule option dans la sidebar. Transport d’invitation, mobile détaillé et cycle de vie ne bloquent pas ce cadrage. Pas de maquette, estimation de l’équipe ni plan technique validé à ce stade : la DoR complète n’est pas acquise.
- **Feature complète : NOT READY pour implémentation**. Les choix produit indiqués ci-dessous, le dimensionnement et le plan technique restent à traiter. Ce verdict ne bloque pas la préparation immédiate de l’incrément initial.

## Résultats des contrôles AF

| Contrôle | Résultat | Conclusion |
|----------|----------|------------|
| Couverture | 9 FR, 3 NFR, 2 UXR et 2 TR tous associés à des stories | PASS documentaire ; aucune preuve d’implémentation |
| Dépendances | 6 stories ; uniquement vers des numéros précédents ; aucun cycle | PASS ; parcours mental 001 seul, 002 après 001, 003 après conservation, invitations ensuite |
| Qualité | Chaque story : persona/objectif/bénéfice, 5 AC Given/When/Then, parcours nominal, erreur et limites, scénarios e2e | PASS documentaire |
| Valeur utilisateur | 6 titres décrivent une action/expérience observable dans l’application ; aucune story par couche | PASS |
| Alignement | Epic par résultat utilisateur ; architecture et entités au premier usage laissées au Builder | PASS |
| Taille | 5 AC par story, mais conservation globale (002) et contextualisation globale (003) à risque | NON ÉTABLI : nombre d’AC ne prouve pas une session ; avis et estimation de l’équipe requis |
| Design / technique | Pas de maquette ni plan technique validé ; assurance et sûreté migration non classifiées par le Builder | NON ACQUIS : requis avant build selon protocole applicable |

Les points ne sont pas inventés par le PM : l’agent interdit d’estimer le travail technique et aucune estimation de l’équipe n’a eu lieu. Aucun pourcentage de capacité sprint/MoSCoW n’est certifié en l’absence de sprint défini.

## Décisions produit désormais validées

L’humain a approuvé le 2026-10-22 : invitation par courriel et visible après connexion ; accès direct de l’invité au commun sans espace personnel supplémentaire forcé ; reprise du dernier espace utilisé à la connexion ; nom « Mes finances » modifiable pour le premier espace des comptes existants. Ces quatre points ne sont plus des blocages produit.

## Points restants pour la conception et l’implémentation

- ESP-003 et accueil ESP-005/006 : portée entre onglets/appareils, repli si le dernier espace est inaccessible, classification des préférences et progression du guide. Propositions du brief à examiner sans les attribuer à l’humain.
- ESP-004/005/006 : mécanisme garantissant le bon destinataire, lien éventuel et cycle d’invitation. Courriel vérifié, sept jours, renvoi/annulation/refus restent des propositions ; seul le canal courriel et la visibilité après connexion sont validés.
- Ensemble : conception de l’expérience autorisée via `/cs-create-experience`, puis dimensionnement équipe, plan technique et validation avant build. Aucun de ces livrables n’est réputé déjà réalisé.

La feature reste NOT READY pour build au titre de la DoR technique/design non acquise ; la conception peut avancer avec ces quatre décisions fermes. Les règles produit supplémentaires doivent être examinées avant d’implémenter le parcours affecté.

Les propositions de durée/renvoi/annulation/refus sont regroupées dans le brief pour validation ; aucune obligation supplémentaire n’est présentée comme acquise. Le périmètre recommandé reporte départ/exclusion/suppression d’espace. Si ces actions sont retenues dans la première livraison, leurs règles deviennent un blocage avant leur implémentation, sans privilège du créateur.

Le sélecteur mobile précis, les règles de longueur du nom et les détails visuels à une option relèvent normalement de la conception. Ils ne constituent pas, isolément, des inconnues produit empêchant ESP-001.

## Prochaine action

Préparer le plan technique d’ESP-001 et la stratégie d’ensemble permettant de conserver puis isoler toutes les finances. Faire examiner les risques/tailles de 002 et 003, sans découpage DB/API/UI. Présenter au propriétaire du produit le plan et les seules propositions restantes avant l’implémentation des parcours affectés. Ne pas redemander les quatre décisions déjà validées. Le backlog a bien la priorité demandée ; ni l’input ni cette priorité ne valent validation d’un plan absent.
