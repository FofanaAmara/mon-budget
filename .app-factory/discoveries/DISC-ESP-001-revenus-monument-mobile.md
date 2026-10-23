# DISC-ESP-001 — Monument Revenus trop large à 375 px

- Type : BUG
- Sévérité : P2
- Statut : OPEN — correctif applicatif à trier
- Découvert par : designer des mockups React espaces financiers, 2026-10-22
- Pendant : conception uniquement, aucune intégration applicative

## Constat et cause

Le composant réel `components/revenus/RevenusMonument.tsx`, importé dans le prototype React, déborde à 375 px lorsque reçu et attendu affichent chacun `3 400,00 $`. Le montant principal a un minimum de `3rem` (ligne 76), le séparateur `2rem` (ligne 101) et le dénominateur `1.8rem` (ligne 114). La ligne ne peut pas réduire suffisamment sa typographie pour sa largeur disponible.

## Preuves locales

Dans `cs-design/mes-finances/features/espaces-financiers-essai-02/proofs/` : `after-allocation-375.png` avant adaptation et `after-revenus-fit-375.png` après adaptation du prototype. Captures locales non commitées. Le prototype réemploie la vraie définition du composant ; ce constat ne résulte pas d'une nouvelle réplique.

## Traitement et recommandation

Le designer propose un ajustement responsive local aux maquettes qui conserve les deux montants et leur structure, documenté dans leur README. La source de l'application reste inchangée. Cette proposition ne vaut pas correction livrée du produit. Prévoir un correctif du composant réel, avec vérification visuelle avant/après à 375 px, petits et grands montants, puis desktop. Ne pas masquer ou tronquer un montant pour faire tenir la ligne.
