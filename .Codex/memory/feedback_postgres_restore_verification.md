# Vérification des copies PostgreSQL

**What happened** — Une copie public ne restaurait pas sans uuid-ossp ; la comparaison texte des CHECK signalait ensuite huit écarts sans changement des règles. Le premier vérificateur acceptait même deux bases vides.

**Why it happened** — Un dump limité au schéma omet les extensions ; PostgreSQL normalise les casts à la recréation. L’égalité entre deux cibles ne prouve ni sauvegarde ni restauration.

**How to prevent** — Capturer les dépendances, conserver dump+manifest+SHA et inventaire complet. Comparer les CHECK après reparsage sur TEMP dans la fixture et hasher toutes les lignes. Exiger marqueurs liés au dump. Vérifier label/port/mount ET system_identifier avant toute écriture locale. Les URLs ne sont pas interprétées comme URI par PGDATABASE : passer les paramètres PG explicites nettoyés, sans secrets dans les arguments ou Docker.

**Récidive26octobre** — Un nouveau runner a comparé directement le hash brut source au hash restauré et retrouvé les8CHECK normalisés. Réutiliser le reparsage TEMP dès le départ ; garder deux preuves distinctes : hash brut source pour fraîcheur avant apply, équivalence canonique pour restauration. Ne jamais remplacer le hash source par celui de la copie.
