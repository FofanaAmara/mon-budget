# Gérer ses finances personnelles et communes sans les mélanger

> Statut : PLANNED — priorité produit immédiate, décision humaine du 2026-10-22.
> Champion : propriétaire du produit.

## Contexte et objectif

Le périmètre actuel par compte ne permet pas au couple de contribuer aux mêmes finances en conservant des finances personnelles séparées. Une personne doit accéder à plusieurs espaces et chaque espace doit offrir les fonctions existantes.

## Résultats vérifiables

- Un couple de deux comptes distincts consulte et modifie les mêmes finances après invitation acceptée.
- Chacun conserve l'isolation de ses autres espaces : zéro lecture/écriture croisée dans les scénarios négatifs de validation.
- Les comptes existants retrouvent leurs données sans perte, doublon ni ressaisie.

Ces critères sont des objectifs de recette, pas des mesures déjà obtenues ni des engagements d'adoption chiffrés.

## Feature

[Espaces financiers personnels et partagés](features/espaces-financiers/feature-brief.md).

## Frontière

Inclus : premier espace, reprise des données existantes, plusieurs espaces, bascule, invitations et contribution égale. Exclu : partage de frais, remboursements entre conjoints, synchronisation bancaire, rôles différenciés, audit utilisateur et temps réel. Les usages famille/colocation n'ajoutent aucune logique particulière au premier cas couple.

## Risques

Isolation financière, conservation des relations et montants, acceptation par le bon destinataire, saisies en cours à la bascule, double génération mensuelle lors de consultations simultanées. Les propositions de cycle de vie restent à arbitrer avant d'ajouter des opérations destructrices.
