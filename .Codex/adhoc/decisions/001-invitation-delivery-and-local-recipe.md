# DEC-001 : Invitations durables et recette isolée

Date : 2026-10-23. Status : Active.

## Contexte
Les invitations doivent survivre à un échec réseau sans recréer l’espace ou l’invitation. Resend conserve ses clés d’idempotence 24 heures ; une réponse perdue ne prouve pas que le courriel n’a pas été envoyé. L’humain demande de décider pendant son absence, sans AWM.

## Options considérées
- Réessayer sans limite pendant sept jours : peut doubler un courriel après expiration de la clé fournisseur.
- Reprendre pendant 23 heures depuis la première tentative, puis afficher un état incertain : évite le renvoi aveugle ; exige une réconciliation opérationnelle si la réception reste inconnue.

## Décision
Invitation persistée avant transport ; lease et historique des tentatives, limites globales et par invitation. Même ID, même jeton et même payload (expéditeur, noms, origine et renderer v1 figés). Vérifier le hash régénéré avant envoi. Après 23 heures, état visible uncertain sans nouvel envoi automatique. Un lien déjà reçu conserve sa validité de sept jours et reste acceptable. Ne pas promettre un envoi exactement une fois hors fenêtre fournisseur. Aucune réconciliation manuelle automatique ni envoi externe sans destinataire contrôlé.
L’acceptation demande le compte destinataire vérifié et une action explicite. Une page de confirmation persistante précède le choix « Ouvrir cet espace » ; accepter ne change pas la préférence active.

## Recette et conservation
L’ancienne copie work avait une date de guide modifiée par une ancienne UI. Son certificat strict reste faux. La conserver intégralement sous spaces_work17_before_invitations, conserver ses rapports, puis activer un nouveau clone de spaces_baseline17 avec migrations001–006. Aucun reset de l’ancienne copie ni mutation de la source. Nouveau certificat avant toute utilisation UI : 703 lignes originales,18 tables et175 colonnes identiques. Les données synthétiques ajoutées ensuite sont des opérations de recette, distinctes du certificat de migration.

## Conséquences
Pas de doublon d’espace ou d’appartenance sous concurrence. Reprise bornée et erreurs visibles ; le cas uncertain demande encore une procédure de réconciliation avant livraison globale. APP_ORIGIN explicite en production, EMAIL_FROM/RESEND_API_KEY serveur, Mailpit limité à la fixture locale. Les 31 alertes npm préexistantes sont identiques au lockfile précédent ; leur correction est une tranche restante, sans audit fix aveugle.

Référence fournisseur : https://resend.com/changelog/idempotency-keys
