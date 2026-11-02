# Attendre le vrai listener PostgreSQL

What happened : la première CI froide échoue avec Connection terminated unexpectedly alors que pg_isready avait annoncé prêt.

Why it happened : l’image officielle démarre un PostgreSQL temporaire Unix, puis l’arrête avant le serveur TCP final. Une sonde pg_isready sans -h peut donc valider la mauvaise phase.

How to prevent : sonder explicitement le TCP127.0.0.1:5432 du conteneur avec rôle/base/timeout bornés ; garder les gardes d’identité du client SQL. Tester Unix prêt/TCP indisponible et confirmer le démarrage froid en CI ; un conteneur local déjà chaud n’en est pas la preuve.
