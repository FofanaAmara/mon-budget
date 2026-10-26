# Arrêter réellement sur un contrôle qui échoue

What happened : git diff --cached --check a signalé une ligne vide en fin de nouveau fichier SQL, mais le bloc shell a poursuivi jusqu’au commit. Le contrôle précédent git diff --check ne voyait pas encore ce fichier non suivi.
Why it happened : plusieurs commandes dépendantes partageaient un shell sans propagation de l’échec ; le résultat final du commit masquait le code non nul du contrôle.
How to prevent : inspecter le contrôle après staging avant d’appeler commit dans une opération distincte, ou utiliser un bloc explicitement fail-fast. Vérifier aussi les nouveaux fichiers. Conserver les certificats de fixtures si un nettoyage modifie leurs inputs, au lieu de les revalider silencieusement.
