# PRD — Mon Budget & Dépenses

**Auteur** : Amara  
**Date** : 26 février 2026  
**Statut** : Draft — En attente de validation  
**Type** : Application personnelle (usage familial)

---

## 1. Problème

Je n'ai pas de visibilité claire sur mon budget réel. Mes dépenses sont éparpillées entre plusieurs cartes, comptes et catégories. J'oublie des échéances, je n'ai pas de vue consolidée de ce qui sort chaque mois, et je ne peux pas facilement planifier des dépenses futures importantes (piscine, voiture, etc.).

## 2. Solution

Une Progressive Web App (PWA) qui centralise toutes mes dépenses — récurrentes, ponctuelles et planifiées — organisées par sections de vie (Maison, Perso, Famille, etc.). L'app me donne une vue budgétaire claire et me rappelle proactivement avant chaque échéance.

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
| 🎯 Projets planifiés | Piscine, nouvelle voiture, voyage, rénovations |

L'utilisateur peut créer, renommer, réordonner et supprimer des sections.

### 3.2 Types de dépenses

| Type | Description | Exemple |
|---|---|---|
| **Récurrente** | Se répète automatiquement selon une fréquence | Hypothèque (mensuel), Netflix (mensuel), assurance (annuel) |
| **Ponctuelle** | Paiement unique à une date précise | Réparation toiture, achat meuble |
| **Planifiée** | Dépense future avec objectif d'épargne | Piscine (25 000$ dans 18 mois), voiture (45 000$ dans 2 ans) |

### 3.3 Dépenses planifiées (projets futurs)

Une dépense planifiée est un objectif financier avec :
- Un montant cible (ex : 25 000$)
- Une date cible (ex : été 2027)
- Un montant épargné à ce jour (mis à jour manuellement)
- Un montant mensuel suggéré (calculé : reste ÷ mois restants)

Cela permet de répondre à : "Si je veux une piscine à 25K dans 18 mois, combien dois-je mettre de côté par mois ?"

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
- Solde du mois : Revenus − Dépenses = **Reste à vivre**
- Prochaines dépenses (7 jours)
- Répartition par section (barres visuelles simples)
- Alertes : dépenses à venir non auto-chargées (action requise)
- Progression des projets planifiés

### 4.5 Notifications et rappels

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

### 4.6 Paramètres

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
  - name (string) — ex: "Salaire", "Revenu locatif"
  - amount (decimal)
  - frequency (enum: MONTHLY, BIWEEKLY, YEARLY)
  - is_active (boolean)

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
```

## 7. Phasage recommandé

### Phase 1 — Aujourd'hui (MVP opérationnel)
- CRUD dépenses (récurrentes + ponctuelles) avec sections
- Gestion des cartes
- Dashboard : prochaines dépenses + total mensuel par section
- Notifications push locales (PWA)
- Installable sur iPhone

### Phase 2 — Cette semaine
- Revenus + vue "reste à vivre"
- Notifications email/SMS (API Route Vercel)
- Cron job Vercel pour les rappels automatiques
- Vue par carte

### Phase 3 — Plus tard
- Dépenses planifiées (projets futurs avec objectif d'épargne)
- Historique / tendances mensuelles
- Export de données

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
3. Je reçois un rappel avant chaque dépense non automatique
4. Je peux planifier un gros achat et savoir combien épargner par mois
5. Ajout d'une dépense en moins de 30 secondes
