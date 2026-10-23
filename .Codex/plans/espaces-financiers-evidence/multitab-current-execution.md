# Recette multi-onglets — 2026-10-23

Plan existant : espaces-financiers-implementation.md P7 et espaces-financiers-session-and-delivery.md. Code testé3fa2f2b, vraie app locale3443, copie PostgreSQL possédée spaces_work17. Une identité Auth réelle seulement : ce test ne prouve pas deux membres.

## Observations acquises

Deux onglets Chrome réels ouverts simultanément : personnel/depenses et coupleResend/depenses. Le second affiche43.98 consommés sur289.99, quatre dépenses dont achatprogressif3.99/200 ; le premier conserve0dépense. Bascule du second vers personnel par le sélecteur : arrivée sur sa racine, revenu125.25, dépenses0, épargne/dettes0. Le premier reste sur sa propre route personnelle.

Retour arrière SPA dans le second : couple/depenses, mêmes quatre lignes et montants. Recharge complète du premier : phase de vérification de session puis personnel0dépense, aucun élément du couple. Captures privées multitab-personal-reloaded.jpg etmultitab-couple-history.jpg sous.local/resend-recipe, enregistrées et inspectées comme pages entières du viewport ; aucun défaut visible nouveau constaté.

Navigation documentaire du second vers/landing, puis retour navigateur : routecouple, vérification de session, puis contenucouple autorisé. Le journal serveur68803 montre une nouvelle requêteGET du documentcouple et200. Il s’agit d’une preuve de retour/revalidation ; aucun pageshow.persisted ni mécanismeBFCache réel n’a été mesuré. Ne pas déclarer BFCache validé.

SQLREADONLY du23octobre21:58:37UTC, gardeDocker/cluster de localConnection : couple4dépenses/1achat, personnel0/0, les deux noms inchangés. Preuve privée multitab-readonly-proof.json. Pas d’écriture financière ou Auth par les tests ; seulrememberSpace met à jour la préférence lors de la bascule.

## Brouillon : résultat incomplet

Depuis Réglages > Espaces et membres > fichecouple, Modifier puis saisie«Brouillon de recette non enregistré», sans Enregistrer. Bascule verspersonnel déclenche bien un dialogue navigateur de typeconfirm, constaté par getJsDialog. selectOption expire pendantconfirm. Appel dismiss puis getJsDialog constate dialoguefermé, mais les lecturesDOM suivantes expirent surEmulation.setFocusEmulationEnabled. L’état visible du formulaire aprèsannulation n’est donc PAS prouvé. SQL confirme seulement que le nom n’a pas été enregistré.

Le contrôle natif a été refusé : ComputerUsepermissionsnotgranted, après une attente anormalement longue890secondes. Pas de contournement terminal, pas de cookieextrait, pas de redémarrageChrome. Une nouvelle tentativeCua au tour suivant voit l’onglet mais reste incapable d’obtenirDOM (Debuggerunattached puis même délai de focus). L’app demeure accessible côtéserveur ; la cause exacte de la panne du pilote n’est pas établie. Ne pas attribuer ce défaut à l’app sans preuve.

## Qualité et limites

9contrôles test:delivery passent sanséchec/skip. Aucun code produit modifié dans cette tranche, pas de nouveau build/types/unit/PG de services prétendu. Les tests financiers réels précédents restent leurs preuves bornées.

Incomplets : annulation/confirmation du brouillon dans la vraieUI, réponsesRSC réellement retardées, échec réseau, offline/SW(certificat local refusé), BFCache, changementAuthinteronglets et deuxmembres. InscriptionB toujours à finaliser par humain (nouveau motdepasse/soumission). PlaywrightMCP, CIexactSHA et revueglobale encore ouverts. CUA n’est pas PlaywrightMCP. Aucun push/déploiement/nouvelemail/base source touché.
