# DISC-ESP-013 — Boutons de fermeture dupliqués

Date : 2026-10-23. Correction implémentée ; recette globale toujours en cours.

## Constat et cause
Les modales Catégorie et Carte montrent deux croix en haut à droite. Captures réelles avant conservées dans `.local/resend-recipe/`. Le helper absolu SheetCloseButton a été ajouté à des composants qui possédaient déjà un bouton dans leur en-tête. Le même motif source est présent dans SavingsHistoryModal, ExtraPaymentSheet et ChargeDebtSheet.

## Correction
Retirer les cinq instances et imports redondants. Garder les boutons d’en-tête, leurs callbacks, Escape et backdrop. Le helper reste disponible pour les autres consommateurs qui en ont besoin. Aucun état, droit ou calcul financier changé.

## Validation et limites
Cartes et catégories : une fermeture, screenshots avant/après desktop et viewport375x812, clic de fermeture carte testé, création des deux références réussie. Les images mobiles exportées sont JPEG372x806 malgré les noms.png ; viewportCSS375x812 confirmé en lecture DOM. Ne pas attribuer aux fichiers des dimensions déduites de leur nom. Les trois autres modales ont la même correction source et passent types/build ; parcours visuel réel encore à vérifier lorsqu’elles seront exercées dans la suite des tests patrimoine.265unit et build/types/lint/9delivery verts en copie isolée.

## Autre observation à reprendre avant clôture globale
Après4/4, le guide affiche brièvement « Déjà à mi-chemin ! » avant sa célébration retardée15secondes. La capture pendant animation n’est pas une preuve de layout stable ; reprise stable sans guide conservée. Le texte complet avant célébration reste à corriger/valider dans la tranche guide, sans modifier ses données de progression pour fabriquer une preuve. Le goal n’est pas déclaré livré.


## Suite de recette patrimoine
Historique d’épargne, nouvelle charge et versement dette désormais ouverts dans la vraie app avec données fictives : une seule fermeture chacun ; captures desktop/mobile et inspection visuelle réalisées. Historique fermé via son bouton, charge/versement soumis avec succès. L’ancienne limite des trois modales non exercées est levée pour ces cas ; variantes longues/listes volumineuses et gate globalMCP restent distincts.


Le texte4/4 consigné plus haut est corrigé et recetté : branchecomplète « Tout est prêt ! », captures réelles avant/aprèsdesktop/mobile. VoirDISC015 pour le faux avancement technique également corrigé. Aucune modification des délais de célébration.
