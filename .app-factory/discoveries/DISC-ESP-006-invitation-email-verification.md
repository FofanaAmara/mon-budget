# DISC-ESP-006 — Vérification email du destinataire sans action de renvoi

2026-10-23. Statut : ouvert, inclus dans le chantier espaces.

Deux comptes Auth réellement connectés, invités dans les deux sens via Mailpit, ont une adresse non vérifiée. La page bloque correctement l'adhésion mais renvoie seulement à un message de confirmation sans permettre son renvoi. Le SMTP applicatif des invitations ne configure pas les emails de vérification de NeonAuth.
Raccorder le parcours géré par Neon après lecture du mode de vérification configuré (lien/OTP), préserver le retour d'invitation, afficher l'échec et permettre une reprise. Ne pas faire confiance au profil financier ni forcer emailVerified. Aucun changement du fournisseur hébergé ou mail externe sans les conditions autorisées.
Preuve actuelle : private-access-current-execution.md et captures privées session-current. Acceptation effective, nouveau compte et réception externe restent non prouvés.
