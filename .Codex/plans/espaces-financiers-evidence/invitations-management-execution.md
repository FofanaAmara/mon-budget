# Création, gestion et invitations — preuve de tranche

2026-10-23. Plan approuvé : ../espaces-financiers-implementation.md. Méthode directe, aucun AWM. Feature globale IN_PROGRESS.

## Résultat
Vraies routes /onboarding, /espaces, réglages liste/création/détail ciblé, invitation publique et liste reçue, confirmation persistante. Nom et question partagé Oui/Non ; Non crée directement, Oui propose une adresse facultative. Reprise de création idempotente, erreurs d’envoi sans nouvelle création. Sidebar garde uniquement son sélecteur. Gérer B sous le contexte A utilise B pour renommer/inviter et conserve A pour les finances.
Migration006 ajoute adresse vérifiée, invitation/jeton haché, livraison/lease/historique. Accepter/refuser est atomique et limité au compte destinataire vérifié, sans espace personnel ni bascule implicite. Les membres ont tous les droits. Résultats publics sans adresse destinataire ni finances. AuthView existant réutilisé avec redirect/callback interne borné. Routes publiques explicitement exemptées du proxy, no-store/no-referrer ; logs de requêtes auth/invitation ignorés pour préserver les jetons.
SMTP Mailpit local et REST Resend, jamais EMAIL_TO. Payload/version/expéditeur figés, jeton signé vérifié, clé fournisseur stable, fenêtre23h puis uncertain visible. DEC-001 expose les limites.

## Vérification exécutée
- 193/193 unitaires (5 nouveaux contrats sécurité/mail, payload v1 figé et EMAIL_TO ignoré).
- 95/95 services sur PostgreSQL réel (14 invitations). Auth/transport simulés dans ces tests : compte erroné/non vérifié, double acceptation concurrente, droits communs, rollback d’adhésion, expiration/refus, déduplication inter-membres, lease tardive, même payload après changement de config, rotation de secret, incertitude25h, confirmation privée persistante.
- 21/21 migrations natives :006 rollback complet, conservation et replay.
- 6/6 scénarios Chrome sur vrais composants, services/router simulés : réponses tardives, brouillons, préférence et fermeture de formulaire pendant création. Ni E2E intégrale ni Playwright MCP.
- Types sans erreur ; lint0erreur/15avertissements préexistants. Build final exécuté : sortie0, routes nouvelles compilées ; journal privé invitations-build.log.
- Revue indépendante : findings mail/P1confirmation fermés ; dernier contrôle UI/auth/navigation fermé sans nouveau finding ; revue en lecture seule, sans réexécution personnelle des tests.

## Recette réelle locale
Script prepare-recipe.mjs --activate exécuté une fois : ancien work archivé, nouvelle copie migrée depuis baseline, certificat strict703lignes/18tables/175colonnes avant UI. Rapports privés recipe-activation/ avec anciens certificats conservés ; source et baseline non modifiées.
Vraie app http://localhost:3002, session Neon Auth existante du compte de recette. Création personnelle sans invitation puis couple avec invitation Mailpit ; nouveaux espaces vides ; détail couple consulté et renommé sous espace personnel actif. Captures desktop de création et mobile de détail/envoi/mauvaiscompte, inspection visuelle entière sans chevauchement/troncature observés. Une erreur d’hydratation de l’id généré du sélecteur a été reproduite puis corrigée par association native label/select ; rechargement sans badge d’erreur. Screenshot avant/après conservés.
Un courriel SMTP synthétique direct et l’invitation issue de l’interface ont été retrouvés dans Mailpit par destinataire exact. Lien issu de l’interface : GET anonyme200, texte explicite, boutons connexion/inscription, no-store/no-referrer. La session d’un autre destinataire voit le refus explicite, aucun bouton d’acceptation. Aucun courriel externe envoyé.
Artefacts privés : .local/financial-spaces/{ui-mailpit-proof.json,ui-mailpit-message.json,mailpit-receipt.json,invitations-visual/,invitations-tests.log,invitations-migrations.log,invitations-navigation.log,invitations-types.log,invitations-lint.log,invitations-build.log}. Ne pas versionner liens porteurs, adresses ou contenus privés.

## Limites et suite obligatoire
- Réception externe Resend et coût/quota non prouvés. Ne pas déduire un destinataire autorisé de EMAIL_TO. Mailpit ne satisfait pas le goal.
- Deux sessions/auth réelles, nouvel invité avec vérification/retour, acceptation navigateur et ouverture explicite encore à tester. Les tests PostgreSQL ne remplacent pas ces parcours.
- Playwright MCP absent du catalogue ; Chrome DevTools MCP vérifié mais profil occupé. Aucun arrêt de l’autre navigateur ni modification globale. CUA utilisée et signalée comme telle, sans substitution du critère MCP.
- 31 alertes npm dont4critiques identiques à HEAD avant ajout de nodemailer ; discovery dédiée. Corriger/valider le socle avant livraison finale.
- CI portable, cache/offline/lateRSC réels, matrice17exigences/30AC, revue finale globale restent requis.

Tranche estimée20–35kjetons ; effort environ35min, coût monétaire non disponible. Aucun push, aucune migration source, aucun service payant engagé. Runtime3002 reste actif pour la poursuite ;3001 ne constitue pas la recette de la feature.
