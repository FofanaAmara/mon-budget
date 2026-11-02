# DISC-ESP-018 — Connexion Safari sur HTTP local

Statut : correctif local vérifié WebKit/MCP, confirmation Safari natif non revendiquée.

Deux causes reproduites : (1) Neon Auth0.6.0-beta émet Secure/__Secure rejetés parWebKit surHTTP ; (2) aprèsadaptationcookies, sessionAPI200authentifiée maisnavigationreste surlogin, refreshRSC etnavigationAuth concurrents.

Correction : profilcookieHTTP dans le runnerloopbackuniquement, aliasespropres/HttpOnly/SameSite/expiration/valeurspréservées etSDKcanoniqueenamont ; transitionsAuth documentaires sansrouter.refresh concurrent. SDK/providerhébergé/env/DBsource/HTTPSproduction inchangés. Déconnexionetportéehosttestées, aucunanciencookieHTTPSréutilisé.

Preuves : .Codex/plans/espaces-financiers-evidence/resend-real-execution.md sectionSAFARI-HTTP-AUTH-REAL ; 266unit/14delivery/build/types/lintverts, revuedistincte favorable. CapturesetcredentialsprivésignorésGit, aucunsecretici.
