# Démonstration et remise à zéro — 2026-10-23

Plan : .Codex/plans/espaces-financiers-implementation.md. Exécution directe, aucun AWM.

Le jeu fictif existant est préservé :116lignes/11tables, extrait de l'ancien loader exécuté pour un acteur synthétique uniquement dans un clone jetable. Aucun export de données personnelles. Les UUID deviennent des références symboliques dans le fichier public, remappées vers de nouveaux UUID pour chaque chargement. Le pot libre reçoit son discriminateur stable, les exemples de versement leur delta explicite et l'allocation ponctuelle son état inactif. Dates et montants de démonstration restent ceux du jeu existant.

Le chargement refuse tout espace non vide, vérification protégée avec l'écriture dans la même transaction. La remise à zéro supprime toutes les contributions des membres dans le seul espace cible, ses journaux, liens et notifications financières, puis recrée les catégories et réinitialise son guide. Elle conserve autres espaces, appartenance, identité, carrousel individuel, consentements/contacts, abonnements push et configuration commune devise/rappels.

Une maintenance rare prend des verrous de tables courts pour se sérialiser aussi avec les écritures ordinaires : attente5s, instruction10s, transaction15s sur PostgreSQL17. Ces verrous peuvent brièvement faire attendre un autre espace, sans le modifier. Cela ferme la course où une donnée serait ajoutée entre le contrôle vide et l'insertion. Le provisionnement de catégories utilise FOR NO KEY UPDATE : sérialise les provisionnements sans bloquer le verrou FK des opérations de maintenance. La revue a trouvé le cycle antérieur FOR UPDATE/table ; test d'entrelacement réel ajouté, constat fermé.

Les chemins legacy de claim restent à retirer lors du raccordement. Une visite ne réattribuera plus des finances unclaimed à n'importe quel compte ; l'attribution est celle de la migration vérifiée.

## Preuves
80services PostgreSQLréels dont10maintenance : membres/tiers,116exemples,ID/liensremappés,refusnonvide,deuxchargementsconcurrents,writerordinairearrivantavantlock,échectardifdémo,échectardifreset,autresespaces/préférences/appareilsconservés,provisionnementconcurrentetreset/provisionnementchevauchés. Auth/cache simulés. Unitaires181/181,types0,lint0erreur17avertissementspréexistants,buildNext0etdiffcheck0. Revue indépendante statique, deux constats fermés.

Registre78/78 exports financiers implémentés ; leurs appelants ne sont pas raccordés. Ceci ne prouve pas une livraison produit. Aucune migration ou mutation de source/baseline/work, démo/reset uniquement sur clones jetables. Aucun email/push/déploiement. Anciennes entrées à supprimer avant activation multiespace.
