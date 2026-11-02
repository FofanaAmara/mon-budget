# DISC-ESP-009 — Retour invitation perdu entre vues Auth

État : CORRIGÉ pour la conservation des liens, preuve SSR et navigation réelle ; adhésion Auth complète toujours ouverte.
Détection : vraie landing d’invitation → Créer un compte avec redirectTo correct → lien Connexion interne du fournisseur → /auth/sign-in sans redirectTo. Un rechargement perd donc le retour explicite.
Périmètre : FR-006/FR-007 et trajet existant/nouveau compte, pas d’élargissement de feature.
Attendu : les liens internes connexion/inscription/mot de passe oublié conservent seulement le retour d’invitation validé, sans accepter une redirection externe ou arbitraire. Auth ordinaire inchangée.
Preuve : clic DevTools réel dans trace2026-10-23 ; aucune inscription ni acceptation exécutée.
Prochaine étape : lire contrat Link fournisseur, plan ciblé, test RED du rendu et contrat, correction par API publique, contrôle liens réels après recharge.

Résolution : Link public du fournisseur raccordé à un contexte React de page, returnPath validé côté serveur. Le footer fournisseur dépendait de isHydrated/window.location.search ; SSR rendait href sans retour. Aucun patch node_modules, effet client ou stockage. Chemins Auth allowlistés, paramètres reset/hash conservés, retour externe/arbitraire supprimé dans le scope Auth.
Validation : test RED sur vraie AuthPage+AuthProviders+AuthView, puis14nouveaux tests verts et260unitaires ; build/types/lint/7gardes verts en copie. DevTools réel : invitation→signup→Connexion conserve retour, recharge signin le conserve, lien oublié mobile et recharge le conservent ; URLexterne de retour n’est pas propagée au lien interne. Voir auth-invitation-return-execution.md. Aucun formulaire Auth soumis, aucune nouvelle adhésion revendiquée.
