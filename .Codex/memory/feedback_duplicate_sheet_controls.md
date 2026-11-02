# Contrôles de fermeture des feuilles

What happened : la recette réelle a montré deux croix dans les modales Carte/Catégorie ; recherche source a trouvé le même motif dans cinq composants.
Why it happened : un bouton générique absolu avait été ajouté sans inventorier la fermeture déjà rendue dans l’en-tête de chaque feuille.
How to prevent : avant d’ajouter un contrôle transversal, lire tous ses consommateurs et leurs en-têtes. Chaque dialogue doit exposer une seule fermeture explicite, en conservant Escape/backdrop. Reproduire et capturer les vrais écrans mobile/desktop ; compter les boutons complète la lecture des pixels, sans la remplacer. Un hot reload absent avec certificat local peut laisser l’ancien rendu : recharger explicitement avant de nommer une capture « après ». Les formats/dimensions se lisent dans l’image, jamais dans son extension ou son nom.
