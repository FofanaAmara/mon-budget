# Feature Brief — Sante financiere

## Section A — Fonctionnel

### Titre
Sante financiere et indicateurs

### Objectif utilisateur (Job-to-be-done)
En tant qu'utilisateur, je veux voir un score synthetique de ma sante financiere, des alertes prioritaires, et des metriques cles pour comprendre rapidement si je suis sur la bonne voie.

### Description
Onglet "Sante financiere" du tableau de bord. Affiche un score circulaire 0-100, des alertes prioritaires colorees (critique/warning/good), et une grille de metriques : taux d'epargne, couverture depenses, jours restants, coussin de securite, valeur nette.

### Flows cles

1. **Voir son score** : Score circulaire anime avec couleur (vert >= 80, jaune >= 50, rouge < 50) et message contextuel.
2. **Consulter les alertes** : Liste d'alertes colorees selon la severite : charges en retard (critique), gros paiements a venir (warning), depassement (warning), sous controle (good), taux epargne (good).
3. **Analyser les metriques** : Grille 2x2 + 1 full-width : taux epargne, couverture depenses, jours restants ($/jour disponible), coussin de securite (mois couverts), valeur nette.

### Criteres d'acceptation (niveau feature)

**AC-1 : Calcul du score**
- Given les donnees du mois sont chargees
- When le score est calcule
- Then score = (couverture_actual * 0.6) + (savings_rate * 0.2) + (overdueBonus: 20 si aucun overdue, 0 sinon)
- And couverture_actual = min(actualTotal / planned_total * 100, 100)
- And savings_rate = min(totalEpargne / actualTotal * 100, 100)
- **Edge case** : si planned_total = 0, couverture = 100 (pas de charges a couvrir)
- **Edge case** : si actualTotal = 0, savings_rate = 0

**AC-2 : Couleurs et messages du score**
- Given le score est calcule
- When score >= 80 → vert "Bonne sante financiere"
- When score >= 50 et < 80 → jaune "Quelques points a surveiller"
- When score < 50 → rouge "Situation critique"

**AC-3 : Alertes dynamiques**
- Given les donnees du mois sont chargees
- Then les alertes sont generees dynamiquement :
  - Charges en retard (>0) → critique
  - Gros paiements a venir (>=500$) → warning
  - Depassement budget (paid > planned) → warning
  - Mois sous controle (balance >= 0 ET 0 overdue) → good
  - Taux d'epargne >= 10% → good
- And les alertes ne sont PAS hard-codees (seuil 500$ est en dur pour "gros paiement")

**AC-4 : Coussin de securite**
- Given des depenses mensuelles et de l'epargne existent
- When le coussin est calcule
- Then coussin = epargne_totale / depenses_mensuelles_totales (en mois)
- And la barre atteint 100% a 3 mois de coussin

**AC-5 : Metriques affichees**
- Given les donnees sont chargees
- Then les metriques affichees sont : taux d'epargne (%), couverture depenses (%), jours restants ($/jour dispo), coussin de securite (Nx mois), valeur nette ($)

### Stories (squelette)
1. Score ring anime
2. Alertes prioritaires dynamiques
3. Grille de metriques

### Dependances
- Depends on : Tableau de bord (donnees), Suivi depenses, Suivi revenus, Epargne, Dettes
- Used by : Aucune (c'est un onglet du dashboard)

---

## Section B — Technique

### Source files
- `components/accueil/TabSanteFinanciere.tsx`

### Tables DB
- Aucune table directe (consomme les donnees deja chargees par le dashboard)

### Notes techniques
- Composant purement presentationnel, recoit toutes les donnees via props.
- Les seuils (500$ pour "gros paiements", 3 mois pour coussin, 10% pour taux epargne) sont hard-codes dans le composant.
