# Diagnostic des dialogues Chrome

What happened : après window.confirm, dismiss signalait un délai sur Emulation.setFocusEmulationEnabled ; getJsDialog constatait pourtant le dialogue fermé. Deux onglets distincts ont reproduit la perte de lecture DOM. Un onglet principal avait été récupéré entre les deux tentatives.
Why it happened : cause interne du pilote inconnue ; l’absence d’un onglet temporaire et la panne d’un dialogue ne prouvent pas une indisponibilité globale de Chrome.
How to prevent : inspecter les handles et reprendre un onglet réel accessible avant de conclure ; distinguer fermeture du dialogue, réponse du pilote et état du formulaire. Garder le test incomplet si le DOM/capture ne permet pas de vérifier l’annulation. Ne pas modifier le produit ni extraire des cookies pour contourner cette panne d’outil.
