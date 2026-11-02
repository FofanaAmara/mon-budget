# Résumé de charges BIMONTHLY incohérent
Date : 2026-10-23. Découverte adhoc pendant espaces financiers, corrigée.
Le résumé /parametres/charges multipliait par2, alors que calcMonthlyCost et la génération utilisent /2. Correction /2 sur page contextualisée ; le calcul commun a déjà un test unitaire explicite. Contrôle visuel du résumé dans vraieapp à inclure dans recette finale.
