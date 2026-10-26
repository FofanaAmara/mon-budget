# Lier une bascule au ledger, à la cible et au code réels

What happened : la revue du runner de production a trouvé qu’une phase revenue à backfilled pouvait autoriser002 malgré un ledger prouvant un cutover passé. Une preuve liée au seul host/SHA ne suffisait pas non plus à identifier la base ni les fichiers réellement exécutés.

Why it happened : un champ d’état mutable était traité comme autorité historique, et le SHA de HEAD était confondu avec le contenu présent sur disque. Les empreintes des anciennes colonnes ne détectent pas l’écrasement des copies exposées de réglages/guide.

How to prevent : vérifier le couple phase/préfixe immuable du ledger avant tout backfill ; contrôler aussi les copies exposées avant premier ready. Lier certificat et archive à host/base/rôle/projet/branche et comparer les sources exécutées au SHA. Une perte d’accusé de COMMIT reste incertaine : réconcilier en readonly, jamais présumer rollback ni réappliquer aveuglément.
