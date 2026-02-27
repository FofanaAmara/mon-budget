# PRD — Mon Budget

**Auteur** : Amara  
**Date** : 26 février 2026  
**Statut** : ✅ Validé  
**Scope immédiat** : Phase 1  
**Type** : Application personnelle (usage familial)

---

## Changelog

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-02-26 | PRD initial : CRUD dépenses, sections, cartes, dashboard, notifications push, PWA |
| v1.1 | 2026-02-26 | Ajout du concept de squelette mensuel & suivi du mois. Nouvelle table `MonthlyExpense`. Nouvelle vue "Mon mois" (section 4.5) avec statuts (À venir/Payé/En retard/Reporté), barre de progression, et auto-marquage des auto-chargées. Phase 1 étendue pour inclure le suivi mensuel. |
| v1.2 | 2026-02-26 | Réorganisation du phasage : Phase 2 = revenus, vue par carte, dépenses planifiées, historique. Phase 3 = toutes les intégrations externes (Resend, Twilio, cron Vercel, tendances, export). |
| v1.3 | 2026-02-26 | Ajout Phase 4 "Vision Cash Flow" : revenus multi-sources (Emploi, Business, Investissement) fixes et variables, nouvelle table `MonthlyIncome`, vue cash flow entrées/sorties avec solde, section Épargne & Investissements, dépenses adhoc. Nouveaux concepts 3.5 (Sources de revenus) et 3.6 (Vision Cash Flow). Modèle `Income` enrichi (source, estimated_amount, frequency VARIABLE). Section Épargne & Investissements ajoutée aux sections par défaut. Phases 1-3 inchangées. |

## 1. Problème

Je n'ai pas de visibilité claire sur mon cash flow réel. Mes revenus viennent de plusieurs sources (salaire, business, investissements), mes dépenses sont éparpillées entre plusieurs cartes et catégories, et je ne sais pas précisément où va chaque dollar. J'oublie des échéances, je n'ai pas de vue consolidée entrées/sorties, et je ne peux pas facilement planifier des dépenses futures importantes.

## 2. Solution

Une Progressive Web App (PWA) qui capture toutes les entrées et sorties d'argent — revenus multiples, dépenses récurrentes/ponctuelles/variables, épargne et investissements — organisés par sections de vie. L'app me donne une vue cash flow claire : ce qui rentre, ce qui sort, et où va chaque dollar.

## 3. Concepts clés

### 3.1 Sections budgétaires

Les dépenses sont organisées en **sections** qui représentent les grandes sphères de ma vie. Chaque section a son propre sous-total, ce qui permet de voir immédiatement combien coûte chaque aspect de ma vie.

**Sections par défaut (modifiables) :**

| Section | Exemples de dépenses |
|---|---|
| 🏠 Maison | Hypothèque, Hydro-Québec, Internet, taxes municipales, assurance habitation |
| 👤 Perso | Gym, abonnements streaming, téléphone, vêtements |
| 👨‍👩‍👧‍👦 Famille | Garderie, activités enfants, épicerie, sorties familiales |
| 🚗 Transport | Paiement auto, assurance auto, essence, entretien |
| 💼 Business | Hébergement Vercel Pro, domaines, outils SaaS, comptable |
| 💰 Épargne & Investissements | Virement courtage, REER, CELI, épargne projet |
| 🎯 Projets planifiés | Piscine, nouvelle voiture, voyage, rénovations |

L'utilisateur peut créer, renommer, réordonner et supprimer des sections.

### 3.2 Types de dépenses

| Type | Description | Exemple |
|---|---|---|
| **Récurrente** | Se répète automatiquement selon une fréquence | Hypothèque (mensuel), Netflix (mensuel), assurance (annuel) |
| **Ponctuelle** | Paiement unique à une date précise | Réparation toiture, achat meuble |
| **Planifiée** | Dépense future avec objectif d'épargne | Piscine (25 000$ dans 18 mois), voiture (45 000$ dans 2 ans) |

### 3.3 Squelette mensuel & suivi du mois

Les dépenses récurrentes forment un **squelette mensuel** — une image de ce à quoi ressemble un mois type (ex : hypothèque + Netflix + gym + assurance = 3 800$/mois).

Chaque 1er du mois, l'app **matérialise** ce squelette en générant des **instances mensuelles** : une ligne par dépense attendue ce mois-là. Les dépenses ponctuelles dont la date tombe dans le mois sont aussi incluses.

Chaque instance a un **statut de suivi** :

| Statut | Description | Exemple |
|---|---|---|
| ⏳ À venir | Pas encore à l'échéance | Hypothèque le 15 (on est le 3) |
| ✅ Payé | Confirmé payé (manuellement ou auto-chargé) | Netflix auto-chargé le 1er |
| ⚠️ En retard | Échéance passée, non marqué payé | Plombier dû le 10, on est le 14 |
| ⏭️ Reporté | Décalé au mois suivant | Rendez-vous annulé |

**Vue "Mon mois"** — l'écran principal du suivi :
- Liste de toutes les dépenses du mois avec leur statut
- Barre de progression : "14/22 complétées — 2 340$ payé / 3 800$ total"
- Séparation visuelle : ce qui est réglé vs ce qui reste
- Les auto-chargées peuvent être marquées payées en un tap (ou auto-marquées après la date)
- Filtre par section possible

**Mécanique de génération :**
- Les instances sont créées automatiquement pour le mois en cours
- Les récurrences annuelles n'apparaissent que dans leur mois (ex : assurance annuelle en mars)
- Si une dépense récurrente est ajoutée en milieu de mois et que sa date est future ce mois-là, elle est ajoutée au mois en cours
- L'historique des mois passés est conservé pour la consultation (Phase 3)

### 3.4 Dépenses planifiées (projets futurs)

Une dépense planifiée est un objectif financier avec :
- Un montant cible (ex : 25 000$)
- Une date cible (ex : été 2027)
- Un montant épargné à ce jour (mis à jour manuellement)
- Un montant mensuel suggéré (calculé : reste ÷ mois restants)

Cela permet de répondre à : "Si je veux une piscine à 25K dans 18 mois, combien dois-je mettre de côté par mois ?"

### 3.5 Sources de revenus (Phase 4)

Les revenus sont organisés par **source** pour savoir exactement d'où vient l'argent.

| Source | Type | Exemples |
|---|---|---|
| Emploi | Fixe | Salaire net 5 000$/mois |
| Business | Variable | Airbnb (~2 000$/mois), Contrats Kiyali |
| Investissement | Variable | Dividendes, revenus locatifs |
| Autre | Variable | Remboursements, ventes ponctuelles |

Chaque revenu est soit **fixe** (montant connu d'avance, fait partie du squelette mensuel) soit **variable** (estimation optionnelle, montant réel saisi quand reçu).

### 3.6 Vision Cash Flow (Phase 4)

L'objectif central est de répondre à : **"J'ai X$ qui rentre, où est-ce que ça va ?"**

Chaque dollar de revenu est traçable vers une sortie :

```
ENTRÉES (7 000$)
├── Salaire              5 000$
├── Airbnb               2 000$
│
SORTIES (7 000$)
├── 🏠 Maison            2 500$  (hypothèque, hydro, internet...)
├── 👤 Perso               400$  (gym, Netflix, téléphone...)
├── 👨‍👩‍👧‍👦 Famille          800$  (garderie, épicerie...)
├── 🚗 Transport           600$  (auto, assurance, essence...)
├── 💼 Business            200$  (outils, domaines...)
├── 💰 Épargne & Invest  1 500$  (courtage 1000$, CELI 500$)
└── 🎯 Projets planifiés  1 000$  (épargne voyage)

SOLDE : 0$ (chaque dollar est affecté)
```

Les dépenses et les allocations (épargne, investissements) sont traitées de la même façon — ce sont des sorties dans des sections différentes. Pas de module séparé, juste des sections bien nommées.

Les dépenses **variables ou adhoc** (réparation imprévue, achat spontané) sont ajoutées comme dépenses ponctuelles dans la section appropriée — elles apparaissent dans le suivi du mois en cours.

## 4. Fonctionnalités

### 4.1 Gestion des dépenses

| Fonctionnalité | Détails |
|---|---|
| Créer une dépense | Nom, montant, devise, date d'échéance, section |
| Type | Récurrente, Ponctuelle, ou Planifiée |
| Récurrence | Hebdomadaire, mensuelle, annuelle, personnalisée |
| Prélèvement auto | Oui/Non — si oui, quelle carte |
| Section | Associer à une section budgétaire |
| Notes | Champ libre optionnel (ex : "numéro de contrat : X") |
| Modifier / Supprimer | CRUD complet |

### 4.2 Gestion des cartes

| Fonctionnalité | Détails |
|---|---|
| Ajouter une carte | Nom + 4 derniers chiffres + type (Visa, MC, Amex) |
| Vue par carte | Voir toutes les dépenses auto-chargées sur une carte |
| Total par carte | Montant total mensuel chargé par carte |

### 4.3 Vue budget

| Vue | Description |
|---|---|
| **Vue mensuelle** | Total des dépenses du mois en cours, ventilé par section |
| **Vue par section** | Détail de chaque section avec la liste de ses dépenses et son sous-total |
| **Revenus vs dépenses** | Saisir ses revenus mensuels pour voir le solde disponible |
| **Vue par carte** | Total mensuel par carte de paiement |
| **Projets planifiés** | État d'avancement de chaque projet avec progression vers l'objectif |

### 4.4 Dashboard

Le dashboard est l'écran principal et affiche :
- **Mon mois** : barre de progression (X/Y dépenses complétées — Z$ payé / W$ total)
- Prochaines dépenses (7 jours) avec statut
- Répartition par section (barres visuelles simples)
- Alertes : dépenses en retard + dépenses à venir non auto-chargées (action requise)
- Progression des projets planifiés

### 4.5 Vue "Mon mois"

L'écran de suivi mensuel détaillé :
- Liste complète des dépenses du mois, groupées par statut (En retard → À venir → Payé)
- Barre de progression globale
- Action rapide : marquer comme payé (tap)
- Les dépenses auto-chargées sont auto-marquées payées après leur date d'échéance
- Filtre par section
- Navigation mois précédent / suivant (consultation uniquement pour les mois passés)

### 4.6 Notifications et rappels

| Canal | Détails |
|---|---|
| Push (PWA) | Web Push API — canal principal |
| Email | Via Resend (optionnel, configurable par dépense) |
| SMS | Via Twilio (optionnel, configurable par dépense) |

**Configuration des rappels :**
- Délai configurable par dépense (ex : J-7, J-3, J-1, Jour J)
- Délai par défaut paramétrable globalement
- Canaux de notification sélectionnables par dépense
- Distinction dans le message : "Rappel : ta facture Hydro (auto-chargée sur Visa ***4532)" vs "Rappel : payer le plombier 350$ demain"

### 4.7 Paramètres

| Paramètre | Description |
|---|---|
| Revenus | Revenu(s) mensuel(s) net(s) — possibilité d'en saisir plusieurs |
| Sections | Créer, renommer, réordonner, supprimer |
| Cartes | Gestion des cartes de paiement |
| Email / Téléphone | Pour les notifications |
| Rappels par défaut | Délais et canaux par défaut |
| Devise par défaut | CAD (modifiable) |

## 5. Architecture technique

```
PWA (Next.js App Router) — Vercel (gratuit)
├── Frontend : React + Tailwind CSS
├── Base de données : Supabase PostgreSQL (free tier)
├── Notifications push : Web Push API + Service Worker
├── API Routes Vercel :
│   ├── /api/notify — Proxy Resend (email) + Twilio (SMS)
│   └── Vercel Cron — Check quotidien des rappels à envoyer
└── PWA manifest + Service Worker → installable sur iPhone
```

## 6. Modèle de données

```
Section
  - id (uuid)
  - name (string) — ex: "Maison"
  - icon (string) — ex: "🏠"
  - sort_order (int)
  - created_at (timestamp)

Card
  - id (uuid)
  - name (string) — ex: "Visa Desjardins"
  - last_four (string)
  - type (string) — Visa, MC, Amex
  - created_at (timestamp)

Income
  - id (uuid)
  - name (string) — ex: "Salaire", "Airbnb", "Contrats Kiyali"
  - source (enum: EMPLOYMENT, BUSINESS, INVESTMENT, OTHER)
  - amount (decimal | null) — montant fixe si connu, null si variable
  - estimated_amount (decimal | null) — estimation pour les revenus variables
  - currency (string, default: "CAD")
  - frequency (enum: MONTHLY, BIWEEKLY, WEEKLY, YEARLY, VARIABLE)
  - is_active (boolean)
  - notes (text | null)
  - created_at (timestamp)

MonthlyIncome (instances mensuelles — Phase 4)
  - id (uuid)
  - income_id (FK → Income)
  - month (string) — ex: "2026-03"
  - expected_amount (decimal | null) — copié depuis Income.amount ou estimated_amount
  - actual_amount (decimal | null) — montant réel saisi quand reçu
  - received_at (date | null)
  - status (enum: EXPECTED, RECEIVED, PARTIAL, MISSED)
  - notes (text | null)
  - created_at (timestamp)

Expense
  - id (uuid)
  - name (string)
  - amount (decimal)
  - currency (string, default: "CAD")
  - type (enum: RECURRING, ONE_TIME, PLANNED)
  - section_id (FK → Section)
  - recurrence (enum: WEEKLY, BIWEEKLY, MONTHLY, YEARLY, CUSTOM | null)
  - recurrence_day (int | null)
  - next_due_date (date)
  - is_auto_charged (boolean)
  - card_id (FK → Card | null)
  - notes (text | null)
  - reminder_offsets (int[]) — ex: [7, 3, 1]
  - notify_push (boolean, default: true)
  - notify_email (boolean, default: false)
  - notify_sms (boolean, default: false)
  - is_active (boolean, default: true)
  - created_at (timestamp)

  -- Champs spécifiques aux dépenses planifiées (type = PLANNED) :
  - target_amount (decimal | null) — montant objectif
  - target_date (date | null) — date cible
  - saved_amount (decimal | null) — montant épargné à ce jour

Settings
  - id (singleton)
  - email (string | null)
  - phone (string | null)
  - default_currency (string, default: "CAD")
  - default_reminder_offsets (int[])
  - default_notify_push (boolean)
  - default_notify_email (boolean)
  - default_notify_sms (boolean)

Notification_Log
  - id (uuid)
  - expense_id (FK → Expense)
  - channel (enum: PUSH, EMAIL, SMS)
  - scheduled_for (timestamp)
  - sent_at (timestamp | null)
  - status (enum: PENDING, SENT, FAILED)

MonthlyExpense (instances mensuelles)
  - id (uuid)
  - expense_id (FK → Expense)
  - month (string) — ex: "2026-02" (clé de regroupement)
  - name (string) — copié depuis Expense (pour historique si l'expense change)
  - amount (decimal) — copié depuis Expense
  - due_date (date) — date effective ce mois-là
  - status (enum: UPCOMING, PAID, OVERDUE, DEFERRED)
  - paid_at (date | null) — date réelle du paiement
  - section_id (FK → Section)
  - card_id (FK → Card | null)
  - is_auto_charged (boolean)
  - notes (text | null)
  - created_at (timestamp)
```

## 7. Phasage recommandé

### Phase 1 — Aujourd'hui (MVP opérationnel)
- CRUD dépenses (récurrentes + ponctuelles) avec sections
- Gestion des cartes
- Squelette mensuel : génération automatique des instances du mois
- Vue "Mon mois" : suivi des dépenses avec statuts (À venir / Payé / En retard)
- Dashboard : progression du mois + prochaines dépenses + total par section
- Notifications push locales (PWA)
- Installable sur iPhone

### Phase 2 — Cette semaine
- Revenus + vue "reste à vivre"
- Vue par carte (total mensuel par carte)
- Dépenses planifiées (projets futurs avec objectif d'épargne)
- Historique / navigation entre les mois passés

### Phase 3 — Plus tard (intégrations externes)
- Notifications email via Resend (API Route Vercel)
- Notifications SMS via Twilio (API Route Vercel)
- Cron job Vercel pour les rappels automatiques (push, email, SMS)
- Tendances mensuelles / graphiques
- Export de données

### Phase 4 — Vision Cash Flow
- CRUD revenus multi-sources (Emploi, Business, Investissement, Autre)
- Revenus fixes (squelette mensuel) + variables (saisie manuelle)
- MonthlyIncome : suivi mensuel des revenus (attendu vs reçu)
- Vue "Mon mois" enrichie : bloc Entrées + bloc Sorties + Solde
- Vue cash flow : où va chaque dollar (répartition par section)
- Section "Épargne & Investissements" pour les allocations (courtage, REER, CELI)
- Dépenses variables/adhoc : ajout rapide de dépenses ponctuelles en cours de mois

## 8. Hors scope

- Authentification / multi-utilisateur
- Connexion bancaire / import de relevés
- Paiements depuis l'app
- Mode sombre (V2 éventuellement)

## 9. Contraintes

- **Coût** : 0$ (Vercel free + Supabase free). SMS Twilio : ~0.01$/SMS
- **iPhone** : iOS 16.4+ requis pour les push PWA
- **Usage** : App mono-utilisateur, pas de login

## 10. Critères de succès

1. Je vois en un coup d'œil combien il me reste ce mois-ci après toutes mes dépenses
2. Je sais exactement combien chaque "sphère de vie" me coûte par mois
3. Je sais où j'en suis dans le mois : ce qui est payé, ce qui reste, ce qui est en retard
4. Je reçois un rappel avant chaque dépense non automatique
5. Je peux planifier un gros achat et savoir combien épargner par mois
6. Ajout d'une dépense en moins de 30 secondes
