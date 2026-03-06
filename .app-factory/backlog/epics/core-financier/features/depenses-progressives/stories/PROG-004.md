# PROG-004 — UI : suivi progressif dans la page depenses

## Description
Afficher les depenses progressives avec une barre de progression (depense/budget), remplacer le toggle PAID/UPCOMING par une action "Ajouter un achat", afficher l'historique des sous-transactions, et montrer le depassement en rouge.

## Criteres d'acceptation

**AC1 — Barre de progression**
- Given une depense progressive existe avec paid_amount=350 et amount=1000
- When l'utilisateur consulte la page /depenses
- Then la depense affiche "350 $ / 1 000 $" avec une barre de progression a 35%
- And la barre est de la couleur standard (pas rouge)

**AC2 — Action "Ajouter un achat"**
- Given une depense progressive est dans la liste
- When l'utilisateur ouvre les actions
- Then "Ajouter un achat" est disponible
- And "Marquer payee" et "Remettre a venir" ne sont PAS disponibles

**AC3 — Sheet ajout de transaction**
- Given l'utilisateur clique "Ajouter un achat"
- When la sheet s'ouvre
- Then elle contient un champ montant (obligatoire) et un champ note (optionnel)
- And un bouton "Ajouter"
- And a la soumission, paid_amount est incremente et la liste se rafraichit

**AC4 — Depassement visuel**
- Given une depense progressive a paid_amount >= amount
- When l'utilisateur consulte la page
- Then le montant et la barre sont affiches en rouge
- And la barre est a 100% (ou plus visuellement si depassement)

**AC5 — Historique des sous-transactions**
- Given une depense progressive a 3 sous-transactions ce mois
- When l'utilisateur ouvre le detail (expand ou sheet)
- Then il voit la liste : date, montant, note pour chaque transaction
- And la liste est en ordre chronologique inverse (plus recent en haut)

**AC6 — Monument correct**
- Given des depenses progressives et non-progressives existent
- When le monument depense/prevu est calcule
- Then les depenses progressives contribuent paid_amount au total "paye"
- And le total "prevu" inclut le budget (amount) des progressives

**AC7 — Groupement par statut adapte**
- Given une depense progressive avec paid_amount > 0 mais < amount
- When les depenses sont groupees par statut
- Then elle apparait dans le groupe "En cours" (ou un groupement coherent)
- And une progressive avec paid_amount=0 apparait dans "A venir"

## Dependances
- PROG-001 (migration DB)
- PROG-002 (server actions)
- PROG-003 (toggle dans le formulaire — pour avoir des donnees de test)

## Notes techniques
- La barre de progression reutilise le pattern du monument (composant Progress ou div avec width%)
- Le sheet "Ajouter un achat" suit le pattern de ExtraPaymentSheet (projets)
- Les sous-transactions sont fetchees via getExpenseTransactions
- Le monument doit etre adapte pour utiliser paid_amount au lieu de checker le status PAID pour les progressives
- Pour le groupement : les progressives avec paid_amount > 0 comptent comme "en cours", pas UPCOMING/PAID
