# Distinguer une page interne refusee et la recette HTTP

What happened : apres arret du serveur, l'ancien onglet etait une page d'erreur data:. Sa lecture a ete refusee et le suivi a presente trop largement le navigateur comme indisponible.
Why it happened : le refus concernait le protocole de cette page interne, alors qu'un nouvel onglet HTTP pouvait etre ouvert normalement apres relance et autorisation humaine.
How to prevent : lire le motif exact, ne jamais contourner la page refusee. Verifier l'inventaire sans lire son contenu ; utiliser uniquement une page HTTP autorisee reellement presente. Ne pas changer de navigateur pour contourner un refus. Distinguer l'autorisation humaine, l'accessibilite du runtime et l'outil PlaywrightMCP effectivement expose. Ne pas redemander l'autorisation deja donnee. Mailpit local et reception externe Resend sont deux preuves distinctes ; terminer les tests locaux independants avant de bloquer la livraison externe.
