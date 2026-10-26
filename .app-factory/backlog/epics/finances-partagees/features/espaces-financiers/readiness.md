# État de préparation et de recette — 2026-10-26

> Statut : IN_PROGRESS — implémentation locale présente, livraison complète non démontrée.

Le précédent état du22octobre décrivait uniquement la préparation. Il est remplacé par ce relevé après exécution directe autorisée par l’humain, sans AWM. Les six stories sont en cours ; aucune n’est DONE. Ni le code présent, ni les maquettes, ni un test simulé ne suffisent à valider leur Definition of Done.

## État vérifié — 26 octobre

**17 exigences et29/30AC vérifiés ; livraison globale non démontrée.** Les6stories restent IN_PROGRESS. [Matrice courante](../../../../../../.Codex/plans/espaces-financiers-evidence/acceptance-matrix.md) et [preuves réelles](../../../../../../.Codex/plans/espaces-financiers-evidence/resend-real-execution.md) font autorité pour la recette actuelle ; anciens audits datés conservés comme historiques.

- Création initiale solo/partagée, autres espaces, gestion et bascule ; deux sessions contribuent et persistent dans leurs bons contextes.
- Emails Resend réellement reçus Gmail, nouveau compte avec OTP et compte existant, consentement distinct, droits identiques, mauvais compte et accès préalable refusés ; invitation émise par noncréateur et deux acceptations concurrentes sans doublon.
- Panne SMTP réelle corrigée dans onboarding, erreur/réessai/continuer, récupération Mailpit sans recréer espace/invitation.
- Conservation MIG/PG et historique ancien du compte réellement mappé consulté ; session A revalidée, nouvelle connexion stricte encore ouverte.
-266tests unitaires, build/types/lint/11gardes locaux verts au3b71827 ; revue indépendante favorable sur SHA et couverture ; visuel MCP desktop/mobile inspecté. PG/MIG restent bornés aux runs documentés.

Recette locale : http://localhost:3002 directement en HTTP, sans certificat ni redirection ; Mailpit http://localhost:8025. Copie locale isolée, Auth existante ; aucun push/déploiement ni modification financière de la source.

## Décisions produit et UX acquises

- Tous les membres ont tous les droits, sans privilège du créateur.
- Invitations par courriel, également visibles après connexion ; nouvel invité pouvant rejoindre directement le commun sans espace personnel supplémentaire forcé.
- Dernier espace utilisé repris ; données existantes dans « Mes finances », nom modifiable.
- Onboarding : nom et question explicite du partage. Non crée sans page invitation ; Oui la propose, sans rendre l’envoi obligatoire.
- Page d’invitation avant authentification : annonce explicite de l’espace, boutons Se connecter / Créer un compte vers les pages existantes ; acceptation distincte après authentification.
- Sidebar desktop/mobile : uniquement le sélecteur pour la section espace. Avec une seule appartenance, option unique et aucune bascule.
- Réglages > Espaces et membres : liste de mes espaces et création, clic vers fiche pour renommer, voir les membres et inviter. Consulter une fiche ne change pas l’espace actif.

Ces décisions et l’approbation du design ne doivent pas être redemandées.

## Conditions de clôture restantes

1. ESP002/AC1 : vraie nouvelle connexion du compte historique. Recharger sa session et consulter l’historique ne sont pas assimilés à une déconnexion/connexion.
2. Retour HTTP explicitement demandé : TLS désactivé, service worker réellement activé sur HTTP3002 ; purge ancien cache privé à vérifier. Connexion/reload/navigation/signout WebKit26 et ChromiumMCP vérifiés via profilHTTPloopback ; SDK/cookies production inchangés. Safari natif utilisateur à confirmer.
3. Retour avec BFCache réellement actif ; retour documentaire404 après changement d’acteur acquis, navigateur MCP BFCache désactivé donc aucune preuve persisted=true.
4. CI distante entièrement verte sur SHA livré, après autorisation de push. Qualité/revue locales ne remplacent pas la CI. Aucun push/déploiement autorisé actuellement ; origine/callback production à vérifier avant release autorisée.

Aucun rôle différencié ni parcours destructeur ajouté. Les30AC restent inchangés ; aucune story DONE tant que sa DoD manque.

## Décision produit actuelle — sans OTP

L’humain retire le26octobre touteétape de code de vérification dans l’acceptation. INVITATION-LINK-NO-OTP-REAL/DEC005supersèdent les référencesOTP historiques : connexion/inscription→retourlien→acceptationdirecte. CompteAuthnonverifiedadmissiblesi sessionmêmeemail etjetonoriginalsecret ; aucunflagAuthfabriqué, listeprivée n’exposepasdejeton.256unit/100PG/14delivery/build/types/lint etrevuefavorable, vraiMCPfalseverified→acceptation/reload acquis. Stories/goalglobalrestentencours, pasdeCI/push/déploiementnouveau.
