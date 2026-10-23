# Sélection d’entité et rafraîchissement serveur

What happened : après ajout d’une charge, la carte de dette affichait525.50 mais la modale ouverte pendant le refresh restait500.
Why it happened : l’état React stockait une copie complète de l’entité sélectionnée ; les nouvelles props ne remplaçaient pas cette copie.
How to prevent : stocker l’identifiant sélectionné et dériver l’entité des données courantes, en préservant séparément le brouillon utilisateur. Masquer une modale si sa cible disparaît. Tester un vrai rerender de props pendant une modale ouverte, la conservation du montant saisi et le retrait de la cible. Une recharge qui ferme la modale masquerait le défaut, sans le corriger.
