# Session — 2026-10-23 — Dépendances et sessions Auth

**Plan :** `.Codex/plans/espaces-financiers-dependency-repair.md`

## Objectif

Réparer les vulnérabilités préexistantes avant de poursuivre la recette des espaces, sans AWM et sans nouvelle question pendant l’absence de l’humain.

## Journal

### Mise à niveau et compatibilité

Versions corrigées sélectionnées sur sources officielles. Neon 0.7 écarté après examen des peers ; version 0.6 et matrice officielle retenues. Installation propre a révélé une résolution AJV incorrecte, corrigée par le peer dev explicite. Audit production zéro ; cinq alertes lint sans patch restent visibles.

### Lecture RSC et revue

Reproduction des écritures SDK interdites dans RSC puis du second GET implicite. Lecteur HTTP dédié sans mutation, borné et sans repli cache ; SDK mutable conservé pour les actions. Tests du chemin de production ajoutés. La revue a ensuite repéré le lecteur mutable du carrousel : corrigé et couvert par un test réel de cette action. Le lecteur sans mutation est désormais le défaut partagé. Revue indépendante des P1 et P2 après corrections.

### Génération tardive et validation

Next écrit après Ready. Garde strict surveillé ajouté ; changements humains préservés, six tests. Unitaires 206/206, PG 95/95, migrations 21/21, banc navigateur isolé 6/6 ; types et lint verts. Un nouveau build a échoué faute de réseau pour Google Fonts ; relance avec accès réseau nécessaire, Turbopack a ensuite été bloqué sur un bind du processus CSS ; Webpack officiel termine avec succès (build-webpack.log), sans déclarer Turbopack vert. La recette a été redémarrée après le build ; le garde avait arrêté son processus lorsque le build concurrent a écrit une autre configuration. Séquencer les commandes génératrices. La politique navigateur a refusé l’onglet : aucune nouvelle validation visuelle revendiquée et aucun contournement.

## Résumé

Tranche technique vérifiée ; feature globale toujours en cours. Runtime de recette 3002 actif. Réception externe, Auth à deux sessions, CI et Playwright MCP restent à établir. Aucun push, mail externe ou changement de source DB.

## Fichiers modifiés

Packages/lockfile, configurations Vitest ESM/Next, serveur et routes Auth, contexte/invitations, tests de contrat/PG/config, lanceur et garde de génération, signout, horloge du calcul ProjectModal/utils, discovery et documents de preuve/plan/décision/mémoire/suivi. La liste exacte est portée par le commit ; les fichiers humains préexistants sont exclus.
