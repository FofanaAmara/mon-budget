# Liens Auth avant hydratation

What happened : le lien Connexion de l’inscription perdait le retour invitation dans le HTML serveur et lors d’un clic précoce.
Why it happened : le fournisseur ajoutait window.location.search seulement après hydratation. Vérifier uniquement les props redirectTo du formulaire ne prouvait pas la conservation dans les autres liens.
How to prevent : tester le rendu SSR du vrai fournisseur et les href de navigation, puis les clics et recharges dans la vraie app. Fournir un contexte local de page au Link public, issu du retour validé serveur ; ne pas lire un global navigateur ou stocker une invitation au niveau du provider. Préserver les paramètres des autres vues, refuser les retours non approuvés et tester qu’une page Auth ordinaire ne reprend pas le retour précédent.
