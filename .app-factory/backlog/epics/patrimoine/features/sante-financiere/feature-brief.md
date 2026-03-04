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
- AC-1 : Score = couverture_actual * 0.6 + savings_rate * 0.2 + (0 ou 20 si aucun overdue)
- AC-2 : Score >= 80 = vert "Bonne sante", >= 50 = jaune "Points a surveiller", < 50 = rouge "Situation critique"
- AC-3 : Alertes dynamiques basees sur les donnees du mois (pas hard-codees)
- AC-4 : Coussin de securite = epargne_totale / depenses_mensuelles, barre a 100% pour 3 mois

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
