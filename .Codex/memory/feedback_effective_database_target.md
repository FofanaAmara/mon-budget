# Valider la destination PostgreSQL effective

What happened : la revue a détecté qu’une URL loopback validée pouvait encore contenir des paramètres pg surchargeant host, port ou database.
Why it happened : la validation portait sur l’autorité URL, alors que le pilote interprète aussi sa query string.
How to prevent : refuser paramètres/fragments pour la fixture et construire le pool depuis les composants autorisés, jamais depuis l’URL brute.
Tester explicitement une URL locale avec host distant en paramètre et vérifier le refus avant connexion.
L’identité du cluster est une seconde garde ; elle ne remplace pas la validation avant connexion.
