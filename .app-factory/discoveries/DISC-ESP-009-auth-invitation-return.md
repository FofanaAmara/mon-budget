# DISC-ESP-009 — Retour invitation perdu entre vues Auth

État : OPEN — à corriger avant livraison.
Détection : vraie landing d’invitation → Créer un compte avec redirectTo correct → lien Connexion interne du fournisseur → /auth/sign-in sans redirectTo. Un rechargement perd donc le retour explicite.
Périmètre : FR-006/FR-007 et trajet existant/nouveau compte, pas d’élargissement de feature.
Attendu : les liens internes connexion/inscription/mot de passe oublié conservent seulement le retour d’invitation validé, sans accepter une redirection externe ou arbitraire. Auth ordinaire inchangée.
Preuve : clic DevTools réel dans trace2026-10-23 ; aucune inscription ni acceptation exécutée.
Prochaine étape : lire contrat Link fournisseur, plan ciblé, test RED du rendu et contrat, correction par API publique, contrôle liens réels après recharge.
