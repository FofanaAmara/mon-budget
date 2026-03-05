# AUDIT-007 — Add DB transactions for multi-statement financial operations

## Type
REFACTOR

## Severity
HAUTE

## Feature
audit-remediation

## Description
Plusieurs operations financieres executent 3-4 queries SQL sans transaction. Si le processus echoue a mi-chemin, les donnees sont corrompues : argent debite mais pas credite, dette decrementee mais transaction non loguee, etc. Le driver Neon serverless supporte `sql.transaction()` mais il n'est utilise nulle part.

Operations concernees :
- `transferSavings` : 4 queries (2 INSERTs + 2 UPDATEs) — un echec = argent perdu
- `markAsPaid` (avec dette) : 4-5 queries — un echec = balance de dette incorrecte
- `addDebtTransaction` : INSERT + UPDATE — un echec = transaction loguee mais balance non mise a jour
- `makeExtraPayment` : UPDATE + INSERT + auto-deactivation — un echec = paiement perdu
- `addSavingsContribution` : INSERT + UPDATE — un echec = contribution loguee mais solde non mis a jour

## Acceptance Criteria
Given `transferSavings` execute 4 operations sans transaction
When elle est wrappee dans `sql.transaction()`
Then les 4 operations sont atomiques (tout reussit ou tout echoue)

Given `markAsPaid` pour une depense liee a une dette
When l'operation echoue apres le status update mais avant le decrement de dette
Then aucun changement n'est persiste (rollback atomique)

Given `addSavingsContribution` insere une contribution et met a jour le solde
When l'operation est wrappee dans une transaction
Then les deux operations sont atomiques

Given `makeExtraPayment` decremente la dette, logue la transaction, et desactive si solde = 0
When l'operation est wrappee dans une transaction
Then toutes les etapes sont atomiques

Given `transferSavings` tente un transfert ou le projet source n'a pas assez de fonds
When `saved_amount < amount`
Then l'operation echoue avec une erreur explicite AVANT toute modification

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe et toutes les operations financieres fonctionnent identiquement

## Technical Notes
- Utiliser `sql.transaction()` du driver Neon serverless (verifier la syntaxe exacte dans la doc @neondatabase/serverless)
- Fichiers a modifier : `lib/actions/expenses.ts` (transferSavings, addSavingsContribution), `lib/actions/monthly-expenses.ts` (markAsPaid), `lib/actions/debts.ts` (makeExtraPayment), `lib/actions/debt-transactions.ts` (addDebtTransaction)
- Ajouter une validation pre-transaction : verifier `saved_amount >= amount` avant le transfert
- Audit findings addressed : Data-H4, Testing-H2, H3, Security-H5 (partiel — setAllocationSections scoping)
- Dependencies : Aucune
- Non-regression : toutes les operations de paiement, transfert, contribution doivent produire les memes resultats. Tester manuellement le flow de paiement, transfert et contribution.

## Size
S
