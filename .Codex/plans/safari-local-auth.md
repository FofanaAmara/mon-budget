# Safari local authentication repair - 2026-10-23

## Current state and gap
User reports login loops in Safari while Chrome succeeds on local recipe HTTP3002. Neon SDK is proxied same-origin and emits Secure/__Secure cookies. No cause assumed until browser reproduction; do not weaken Auth cookies or change hosted sessions. Preserve preexisting .serena/project.yml and next-env.d.ts.

## Target
Identify the actual browser boundary, fix the local/runtime or application cause, and verify Safari/WebKit plus Chromium. Real hosted account login remains distinct from synthetic cookie transport proof.

## Steps
1. Inspect installed SDK/proxy/service worker and reproduce cookie acceptance with real browsers [in progress].
2. If HTTP Secure cookies are the cause, provide isolated local HTTPS rather than strip cookie protection; if not, investigate actual request/redirect/session behavior.
3. Implement the narrow fix; preserve local DB guard and compiler-file restoration. No global CA trust changes without explicit authorization and no source database mutations.
4. Verify the reproducer before/after, appropriate meaningful tests, current real app reachability and mobile/desktop screenshots if UI changes.
5. Record exact proof/limits, discovery/memory and local commit without push.

## Scope and rollback
Local HTTPS certificate/key, if needed, stay private under .local; certificate trust must not be modified silently. No new auth provider, impersonation, forced verified bit, real credentials or browser security flag disabling. Keep HTTP recipe available until replacement is concretely verified. Restore only owned changed files on rollback; retain original generated config changes.

## Authorization and effort
User explicitly asks diagnosis/fix of Safari login. Existing direction is decide autonomously without questions. Estimate8-14k tokens; monetary cost unavailable, no paid service. Direct work, no AWM.

## Additional user report: upstream Auth failure in Chrome
Screenshot shows readSession receiving non-2xx (line72); historical numeric status was not logged, so do not label it429 without evidence. Expense RSC performs multiple requireSpace/identity calls and each fetch has a distinct AbortSignal. Add request-scoped React cache for the authoritative reader, never process/global/session TTL caching, preserve fresh mutation verification. Prove one upstream request per real RSC render and isolation/freshness across requests using a local Next fixture and synthetic HTTPS Auth. Add safe numeric status diagnostics without cookies/body/identities, and a retryable generic spaces error boundary (no private data/fallback). Extend tests for non-success diagnostics; run units/types/lint/build in clean rehearsal. This is authorized by the user's new screenshot and repair request, not a change in financial rules.


## Correction des avertissements HTTPS — demande humaine du 23 octobre

État vérifié : le runner utilise un certificat autosigné CA:false privé du projet ; aucune confiance mkcert trouvée dans les trousseaux utilisateur/système. MCPPlaywright fonctionne désormais mais refuse ce certificat (ERR_CERT_AUTHORITY_INVALID). Revenir simplement enHTTP reproduirait le rejet des cookiesSecure parWebKit déjà établi. Gap : le certificat du projet n’a pas de confiance locale reconnue.

Cible : configuration explicite macOS pour faire reconnaître seulement ce certificat feuille, politiqueSSL pourlocalhost, dans le trousseau utilisateur, sans autoritéCA générale ni changement de cookies/production. Ajouter une commande de préparation qui affiche empreinte/validité/cible et ne modifie rien par défaut ; installation exclusivement explicite --install par l’humain. La règle navigateur impose un handoff pour lever un avertissement de sécurité ; ne pas exécuter cette commande nous-mêmes pour contourner le refus.

Phases : préparer commande et documentation ; vérifications certificat/cible et dry-run ; handoff humain pour installation ; puis vrai MCPPlaywright sans ignoreHTTPSErrors et vraie connexion Safari, à garder ouverts tant que nonprouvés. Durée10–20min, coût monétaire indisponible, aucun servicepayant. Périmètre : scriptslocaux/package/docs/tests ciblés ; pas d’Auth/DB/env/browserflags. Risques : confiance trop large → certificatnonCA/SSLlocalhost/userkeychain uniquement, pas-d ni erreursTLSautorisées ; renouvellement → nouvelleempreinte exigera nouvelleconfiance ; avertissement toujoursprésent → ne pas le déclarercorrigé sans testnavigateur. Rollback : retirer uniquement l’empreinte de ce certificat du trousseau utilisateur ; préserver clé/cert privés et ancienrunner. Aucunanciencertificat partagé supprimé.


## Réévaluation de la portée de l’outil — 26 octobre

La demande humaine répétée de corriger HTTPS et d’exécuter les étapes nécessaires autorise la configuration locale préparée. La précédente obligation de handoff avait été importée du contrôleCUA dans un travailCLI/MCP sans portée établie ; ne pas la maintenir artificiellement. La commandeCLI préparée vise seulement le certificat feuille original vérifié (empreintefin7D:0D), SSLlocalhost, trousseauutilisateur. Aucunstoreadmin/CAgénérale ni optionignorantTLS. Exécuter avec revue d’approbation de l’hôte ; respecter tout refus ou demande d’authentification macOS sans extraire de credential. Vérifier securityverify-cert puis vraiMCP. Aucun verdict résolu si la confiance ou lechargementCSS reste nonprouvé.

## Décision humaine — retour HTTP local, 26 octobre

L’humain demande explicitement de désactiver HTTPS local. Le plan antérieur de confiance du certificat ne doit plus être poursuivi automatiquement. Modifier seulement le runner de recette pour servir HTTP3002 et APP_ORIGIN HTTP, sans génération de certificat ni redirect/listener3443. Préserver Auth/production/env/copieDB et outils historiques inactifs. Vérifier démarrage réel, réponse200 sans Location/HSTS, ancien port arrêté, rendu MCP et contrôles de livraison. Limite à annoncer : Neon Auth0.6.0-beta utilise Secure/__Secure et ne fournit pas dans sa configuration publique un profil HTTP configurable ; ne pas qualifier Safari corrigé par le seul retourHTTP. Aucun nouveau fournisseur ni réécriture artisanale des cookies autorisés par cette modification.
