# Overview -- Mes Finances

## Objectif

Mes Finances est une PWA de gestion financiere personnelle en francais (fr-CA). Elle permet de planifier, suivre et controler son budget mensuel de maniere simple et automatisee.

## Utilisateur cible

Phase actuelle (alpha) : le createur du projet, pour un usage personnel quotidien.
Phases suivantes : famille et amis, puis potentiellement le grand public en mode SaaS.

## Fonctionnalites cles

- **Charges fixes** -- Definir des templates de depenses recurrentes (loyer, abonnements, etc.) avec frequence et date d'echeance. Generation automatique des instances mensuelles.
- **Suivi mensuel des depenses** -- Marquer les depenses comme payees, reporter au mois suivant, ajouter des depenses imprevues.
- **Revenus** -- Templates de revenus recurrents avec generation mensuelle et suivi des montants recus.
- **Allocation des revenus** -- Repartir les revenus entre les sections de depenses (enveloppes budgetaires).
- **Patrimoine** -- Suivi de l'epargne et des dettes avec transactions.
- **Cartes bancaires** -- Associer les depenses a des cartes pour le suivi par carte.
- **Sections** -- Organiser les depenses en categories (Habitation, Transport, etc.).
- **Notifications push** -- Rappel quotidien via Web Push pour ne pas oublier de noter ses depenses.
- **PWA** -- Installable sur mobile et desktop, shell accessible hors ligne.

## Documentation

| Document | Contenu |
|----------|---------|
| [architecture.md](architecture.md) | Stack technique, structure du projet, patterns |
| [data-model.md](data-model.md) | Schema de la base de donnees (15 tables) |
| [api-reference.md](api-reference.md) | Endpoints REST et Server Actions |
| [vision.md](vision.md) | Roadmap et direction produit |
| [current-state.md](product/current-state.md) | Etat actuel des features et problemes connus |
| [env-vars.md](infrastructure/env-vars.md) | Variables d'environnement |
