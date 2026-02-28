# Mes Finances — Application de gestion financiere personnelle

## Vue d'ensemble

**Mes Finances** est une Progressive Web App (PWA) de gestion financiere personnelle complete. Conçue pour offrir une vision claire et detaillee de sa situation financiere, elle couvre le suivi des depenses, des revenus, de l'epargne, des dettes et du patrimoine net — le tout dans une interface mobile-first intuitive.

L'application est entierement en français (fr-CA) et utilise le dollar canadien (CAD) comme devise par defaut.

---

## Architecture technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19 + CSS variables (design system custom) |
| Base de donnees | Neon PostgreSQL (serverless) |
| Authentification | Neon Auth (multi-utilisateur) |
| Hebergement | Vercel (plan gratuit) |
| PWA | Service Worker + manifest.json |
| Notifications | Web Push API |

**Contrainte budgetaire** : 0$ — l'ensemble de l'infrastructure fonctionne sur les plans gratuits de Vercel et Neon.

---

## Fonctionnalites

### 1. Tableau de bord (Accueil)

La page d'accueil offre une vue synthetique du mois en cours, organisee en **3 onglets** :

#### Tableau de bord
- **Carte Patrimoine** : affiche la valeur nette (actifs - passifs) avec un lien vers la page Patrimoine
- **Carte Revenus** : revenus attendus vs recus avec barre de progression
- **Carte Depenses** : total attendu, paye, reste a payer avec barre de progression et compteur de retards
- **Carte Charges fixes** : cout mensuel normalise de toutes les charges recurrentes
- **Carte Solde previsionnel** : difference entre revenus et depenses du mois

#### Timeline
- Vue chronologique jour par jour fusionnant depenses et revenus
- Affichage des evenements passes et a venir sur le mois selectionne
- Badges de statut colores (paye, en retard, a venir, reporte)

#### Sante financiere
- **Score de sante** sur 100 (base sur le taux de paiement, ratio revenus/depenses, retards, epargne)
- **Reste a vivre** : revenus - depenses = montant disponible
- **Alertes prioritaires** : depenses en retard, a venir dans les prochains jours, revenus manques
- Jauge visuelle avec code couleur (vert > 70, orange > 40, rouge <= 40)

**Navigation mois** : fleches precedent/suivant avec parametre `?month=YYYY-MM` dans l'URL.

---

### 2. Suivi des depenses (/depenses)

Page de suivi mensuel des depenses avec generation automatique des instances a partir des charges fixes (templates).

#### Fonctionnalites
- **Hero card** : Total attendu / Paye / Reste a payer avec barre de progression et badge retards
- **Filtres par section** : pills horizontales scrollables pour filtrer par categorie
- **Groupes par statut** : OVERDUE (en retard) → UPCOMING (a venir) → DEFERRED (reporte) → PAID (paye)
- **Actions par depense** :
  - Marquer comme paye (avec date de paiement)
  - Reporter au mois suivant
  - Remettre a "a venir"
- **FAB (Floating Action Button)** : ajouter une depense imprevue (ad-hoc) pour le mois courant
  - Selecteur de section
  - Selecteur de carte bancaire (optionnel)
  - Montant et nom libres
  - Option "deja payee"

#### Logique automatique
- **Generation mensuelle** : les charges fixes (RECURRING) generent automatiquement des instances `monthly_expenses` pour chaque mois
- **Auto-marquage retard** : les depenses depassant leur date d'echeance passent en OVERDUE
- **Auto-marquage prelevement** : les depenses en prelevement automatique (`auto_debit`) sont automatiquement marquees comme payees

---

### 3. Suivi des revenus (/revenus)

Page de suivi mensuel des revenus, identique en philosophie au suivi des depenses.

#### Fonctionnalites
- **Hero card** : Revenus attendus vs Recus avec barre de progression
- **Liste complete** des revenus du mois (generes depuis les templates)
- **Types de revenus** :
  - Emploi, Business, Investissement, Autre
  - Frequences : Mensuel, Bihebdomadaire, Annuel, Variable
- **Actions** :
  - Marquer comme recu (montant exact ou partiel)
  - Revenus variables : saisie du montant reel
- **FAB** : ajouter un revenu ponctuel (non lie a un template)
- **Navigation mois** : meme systeme que les depenses

---

### 4. Patrimoine (/projets)

Page dediee a la gestion du patrimoine avec deux onglets : **Actifs** et **Passifs**.

#### Onglet Actifs
- **Epargne libre** : montant cumule sans objectif specifique (versements libres)
- **Projets d'epargne** : objectifs financiers avec suivi de progression
  - Nom, montant cible, date cible, montant epargne
  - Barre de progression avec pourcentage
  - Suggestion mensuelle calculee (reste / mois restants)
  - Historique des contributions
- **FAB** : creer un nouveau projet d'epargne ou ajouter a l'epargne libre

#### Onglet Passifs (Dettes)
- **Liste des dettes** : prets, credits, soldes a rembourser
  - Solde initial, solde restant, taux d'interet
  - Montant et frequence de paiement
  - Barre de progression du remboursement
- **Transactions de dette** : paiements et charges avec historique
- **FAB** : ajouter une nouvelle dette

#### Valeur nette
- Affichee en haut de la page d'accueil
- Calcul : Total epargne (actifs) - Total dettes (passifs)
- Code couleur : vert si positif, rouge si negatif

---

### 5. Reglages (/parametres)

Hub centralise pour la configuration de l'application.

#### Preferences
- **Notifications push** : activer/desactiver
- **Rappels par defaut** : configurer les delais de rappel avant echeance
- **Devise** : CAD par defaut

#### Gestion
- **Sections** : categories personnalisables avec icone emoji et couleur
  - Sections par defaut : Logement, Transport, Alimentation, Loisirs, Sante, Abonnements
- **Cartes bancaires** : gestion des cartes avec nom, 4 derniers chiffres, banque, couleur
- **Mes charges fixes** : templates de depenses recurrentes et ponctuelles
  - Total mensuel normalise en haut
  - Groupement par section avec sous-totaux
  - Actions : creer, modifier, supprimer
  - Badge de prochaine echeance avec jours restants
- **Mes revenus recurrents** : templates de revenus
  - Actions : creer, modifier, supprimer

#### Compte
- Deconnexion

---

### 6. Systeme de charges fixes (Templates)

Le coeur de l'application repose sur la separation **Templates** vs **Transactions** :

| Concept | Table | Role |
|---------|-------|------|
| Template | `expenses` | Definition d'une charge (nom, montant, frequence, section, carte) |
| Transaction | `monthly_expenses` | Instance mensuelle generee automatiquement |

#### Types de charges
- **Recurrente (RECURRING)** : generee chaque mois selon la frequence
- **Ponctuelle (ONE_TIME)** : charge fixe unique
- **Planifiee (PLANNED)** : projet d'epargne avec objectif (geree dans /projets)

#### Frequences supportees
| Frequence | Description | Cout mensuel normalise |
|-----------|-------------|----------------------|
| WEEKLY | Chaque semaine | montant x 52/12 |
| BIWEEKLY | Toutes les 2 semaines | montant x 26/12 |
| MONTHLY | Chaque mois | montant x 1 |
| BIMONTHLY | Tous les 2 mois | montant x 1/2 |
| QUARTERLY | Tous les 3 mois | montant x 1/3 |
| YEARLY | Chaque annee | montant x 1/12 |

#### Fonctionnalites associees
- **Prelevement automatique** (`auto_debit`) : la depense est marquee payee automatiquement
- **Rappels** : notifications push configurables (ex: 3 jours avant, 1 jour avant)
- **Section** : categorisation visuelle avec emoji et couleur
- **Carte bancaire** : association optionnelle a une carte

---

### 7. Gestion des cartes bancaires

- Ajout de cartes avec nom, 4 derniers chiffres, banque, couleur personnalisee
- Page de detail par carte : liste des depenses associees, total mensuel
- Association aux charges fixes et depenses ad-hoc

---

### 8. Fonctionnalites transversales

#### Progressive Web App (PWA)
- Installation sur l'ecran d'accueil (mobile et desktop)
- Fonctionne hors ligne (service worker)
- Manifeste avec icones, couleur de theme, ecran de demarrage

#### Authentification multi-utilisateur
- Neon Auth avec inscription/connexion par email
- Chaque utilisateur a ses propres donnees (sections, charges, revenus, projets)
- Migration de donnees anonymes vers un compte authentifie (ClaimBanner)

#### Notifications push
- Rappels d'echeance configurables
- Permission demandee au premier lancement
- Delais personnalisables par charge ou via les reglages globaux

#### Design system
- Variables CSS pour couleurs, typographie, espacement, rayons de bordure
- Composants reutilisables : `.card`, `.btn-primary`, `.badge`, `.sheet`, `.divider`
- Theme clair avec palette neutre et accent bleu (#2563EB)
- Animations : `--ease-spring`, `--ease-out`, transitions fluides
- Responsive : sidebar 240px sur desktop, bottom nav 56px sur mobile

#### Navigation
- **Desktop** : sidebar fixe a gauche avec 5 items + branding
- **Mobile** : barre de navigation en bas avec 5 onglets
  - Accueil, Depenses, Revenus, Patrimoine, Menu (hamburger)
- Indicateur visuel de page active (couleur accent + dot)

---

## Structure des donnees

### Tables principales

| Table | Description |
|-------|-------------|
| `expenses` | Templates de charges (recurrentes, ponctuelles, planifiees) |
| `monthly_expenses` | Instances mensuelles des depenses |
| `incomes` | Templates de revenus |
| `monthly_incomes` | Instances mensuelles des revenus |
| `debts` | Dettes et prets |
| `debt_transactions` | Paiements et charges sur les dettes |
| `sections` | Categories de depenses |
| `cards` | Cartes bancaires |
| `settings` | Preferences utilisateur |
| `savings_contributions` | Contributions aux projets d'epargne |

---

## Roadmap potentielle

- Export PDF/CSV des rapports mensuels
- Graphiques d'evolution (depenses par mois, epargne cumulee)
- Budget par section (plafond mensuel avec alerte)
- Depenses partagees entre utilisateurs
- Import automatique de releves bancaires
- Mode sombre
