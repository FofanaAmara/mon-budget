# Session — 26 octobre 2026 — Recette réelle des comptes invités

**Plan :** `.Codex/plans/espaces-financiers-implementation.md` et extensionResend de session-and-delivery.

## Objectif
Vérifier dans la vraie app les deux parcours invité nouveau/existant, contributions communes et isolation, sans modifier la sourceDB ni fabriquerAuth.

## Journal

### Nouveau compte, vérification et contribution réelle
Runner22684 relancé après constat about:blank et aucunlistener. Inscription réelle via MCPPlaywright ; vrai OTPNeon reçuGmail (lectureChrome/CUA), vérificationUI puis acceptationdistincte. Avantacceptation accèsdirect404, après accèsau couple sanspersonnelimposé. B23.45 créée/rechargéeMCP, A12.34vueparB, AChrome voitB et2membres. SQLREADONLY16:48:11UTC confirmeauteurs/membres/isolation. DroitsBrenommageexercés et nomoriginalrestauré ; nouveau lienaccepté nepermetpas nouvelleadhésion. CapturesMCPdesktop/mobile inspectées, preuveNEW-ACCOUNT-REAL etAC1/2/4/5deESP005misàjour. 11deliveryverts ; aucun nouveaucodeproduit. Credential0600ignoréGit, aucunOTP/PW/token/adresseréelle dans documentscommités.

La consigne de cua_repl avait été généralisée à tort àPlaywright : correctiondocumentée et mémoire ajoutée. L’APIunsafeMCP ne supporte pasimportdynamique ; génération ducredential parNode local privé, puis vraie saisieUI MCP sansimpressionduPW.

### Compte déjà existant — en cours
Depuis Réglages/liste, AChrome crée «RecetteResend—Compteexistant» (735d15ed-7d14-49a3-b170-2e7b4af62eae), partagéOui, invitationinitiale laisséevide. Puis fiche → invitation de l’adresse déjà inscrite/vérifiée ; UIannonceenvoiconfirmé et1membreavantacceptation. B n’a pasencorejointcenouvelespace. Prochaineétape : recevoircourriel, retrouverinvitationdanscompteMCP, adhésiondistincte puisisolationentredeuxespaces. Pasdepush ; pleinobjectifresteouvert.

### Compte existant, isolation, brouillon et reconnexion acquis
Resend reçuInbox12:58 ; lien et listeprivée MCP,404avantacceptation puis2membres. B crée45.67danssecond, reload etAChromevoit. Bswitch conserve23.45premier/45.67second sansmélange. DialogueMCP : annulerconservebrouillon/espace, accepterabandonne ; nomSQLinchangé. Signout/signin réels reprennent735d, SQLREADONLY17:18:01UTCconfirme5/1expenses/préférence. PreuveEXISTING-ACCOUNT-REAL. Aucun scriptCLI substitué au MCP.

CSS perdu en navigation, captures avant inspectées ; ressource200avecCAprojet maisERRRETRYnavigateur. Reloadnormal rétablitstyles, capturesfinalesinspectées. MacOS nefaitpasconfiancecertificat ; installSSLlocalhost utilisateur19589pending, processussecurity/SecurityAgent observés ; outilrefuselectureUIcom.apple.SecurityAgent. Pasdeconfianceinstallée revendiquée niTLSdésactivé. Continuer autres contrôles.

### Sessions, mobile et revue indépendante
Preuve SESSION-MCP-REAL : vraies finances B sur desktop/mobile, drawer clavier et bascule, panne POST de bascule/retry, offline masque/online attend reload, autre onglet masqué après signout ; vraie RSC200 retenue puis livrée après intention de bascule, nouveau contexte conservé. Pas de BFCache ni SW prétendus. Trust19589 termine exit1, autorisation annulée côté OS ; pas de confiance installée. Revue indépendante e7b1cd6 favorable et265unit verts/0skip, rapport distinct à conserver.

### Premier onboarding réel personnel et partagé
Deux comptes Auth réellement créés avec adresses fictives réservées example.com, credentials privés. Solo Non : aucun email, perte réponse après création serveur200 puis retry ; SQL un espace/un réglage/sixcatégories/zéroinvitation. Shared Oui : invitation facultative proposée et email Resend réellement reçu Inbox13:38. Simulation de perte de réponse de l’envoi aboutit à /espaces, pas à l’erreur attendue : pas de preuve de panne fournisseur. Créateur configure32.10 pendant pending ; B suit email→signin→retour→acceptation distincte, retrouve données/guide, ajoute4.56 ; créateur reconnecté voit B. SQL avant/après confirme configuration non doublée, une invitation/tentative, auteurs distincts,total36.66. Captures effectivement inspectées et limites dans FIRST-ONBOARDING-REAL. Aucun produit/env/DBsource/push modifié. Prochaine tranche : panne SMTP locale en vraie app puis restauration du runnerResend.

### Panne SMTP réelle, découverte017 et correction validée
Mailpit loopback1 indisponible via runner privé gardé : invitationfailed mais garde/onboarding redirige /espaces et masque reprise. Source corrigée avec garde d’entrée React stable durant montage, sous frontière d’identité ; nouvelle visite reste orientée correctement. Même panne MCP aprèsfix sur compte F : erreur visible et choixréessayer/continuer. Continuer seul permet d’ajouter7.89 et de recharger ; /onboarding à froid redirige /espaces. SMTP rétabli, fiche→réessayer→message réellement reçu Mailpit ; SQL18:03:26 : un espace/uneinvitation, tentativesfailed/sent,7.89 conservés. Captures avant/après375/1200 inspectées. Mode Resend20384 rétabli ensuite, app3443/copieDBwork17, .env.local inchangé.

Qualité isolée58790 build/types/lint/11delivery0 ;266unit/20fichiers24555 exit0,0échec/skip. Revue distincte du diff favorable,5tests ciblés supplémentaires exécutés parreviewer ; SHA final à rattacher. Aucun nouveau testPG requis pour un garde de présentation, preuves existantes gardent leur portée. DISC017 et mémoire du pattern enregistrées. Goal complet toujours nonatteint ; CI distante/TLS durables et AC restants ouverts.

### Accès, gestion sans bascule et égalité de droits complétés
Correctif commité3b71827 et revue rattachée au SHA exact, empreintes identiques à copie qualité. Fmauvaisdestinataire→refus/changercompte/signout/retourlien→Bsignin/acceptation ; avantadhésionBficheF404, après deuxmembres. DepuisF, ficheC42 ne change ni sélecteur ni navigation ; retourdépensesF7.89, pasC42B23.45. Csolo reconnecté retrouve formulaireinvitation dans safiche. Captures inspectées, preuve ACCOUNT-CHANGE-DETAIL-REAL.

Retour historique après changementC→B : HTTP404/back_forward, aucuneancienneficheC. BFCache effectivement désactivé parconfigurationlancement selonCDP, donc pas de preuvepersisted=true. Bnoncréateur envoie invitationàC viaMailpit local, reçue et lue, SQLaucuneappartenanceC ; modeResend16831rétabli. Enfin deux ongletsB acceptentconcurremment invitationEpending : deuxPOSTeffectifs/deuxconfirmationsmêmeid, SQLdeuxmembresuniques/unréglage/sixcatégories. Preuves privées noncreator-invitation-proof.json etdouble-ui-acceptance-proof.json ; aucunproduitmodifié après3b71827. Audit final des écarts demandé au reviewer, sans nouvelle suite identique ni migration/sourceDB/push.

### 14:34 — Historique migré retrouvé et audit de couverture

Chrome A retrouvé vivant par inventaire ; capture masque de session puis reload normal rétablit l’identité. Sélecteur « Mes finances », tableau de bord et historique mars :15dépenses/2revenus, trois captures privées prises/inspectées. SQLREADONLY18:34:33UTC confirme vraie legacy_user_space_map et compteurs. Pas de nouvelle connexion revendiquée. Revue distincte confirme29/30AC et17exigences littérales vérifiables, ESP002/AC1 partiel. Matrice actualisée, anciens gates de réception/MCP/adhésion remplacés par états courants. Source inchangée depuis3b71827 ; pas de répétition gratuite des tests déjà verts. TLS durable/SW/BFCache/CI restent ouverts. Coût exact indisponible, aucun nouveau service payant. Tour précédent de statut classé sans progrès ; ce tour produit preuves navigateur/SQL et mise à jour persistante.

## BFCACHE-PREFLIGHT-MCP — 26 octobre

Le vrai MCP Playwright expose browserType().launchPersistentContext. Navigateur Chrome isolé lancé avec profil privé durable .local/resend-recipe/bfcache-browser-profile, sandbox Chromium activé, seul drapeau par défaut retiré : --disable-back-forward-cache. Aucun --ignore-certificate-errors ni option ignoreHTTPSErrors. Vérification CDP Browser.getBrowserCommandLine : drapeau BFCache absent ; navigation réelle vers https://localhost:3443/ refusée net::ERR_CERT_AUTHORITY_INVALID. Le contexte isolé a été fermé dans finally, navigateur de recette principal inchangé. Pas de session/cookie copié, aucune finance restituée dans ce navigateur et aucune preuve BFCache effectif revendiquée.

Premier essai : navigateur bien lancé mais lecture de ligne de commande CDP refusée faute de --enable-automation ; le résultat initial isolatetBrowserLaunched=false était trop large (échec de l’étape CDP, pas du lancement). Reprise ciblée avec ce drapeau de diagnostic, résultat ci-dessus réussi ; aucun drapeau de sécurité affaibli. Source officielle locale Playwright chromiumSwitches.js confirme le drapeau qui désactive BFCache par défaut. Aucune configuration globale MCP modifiée ni relance de session humaine nécessaire pour ce moyen de test.

Confiance réévaluée sur l’hôte : /usr/bin/curl sans exception échoue exit60 unable to get local issuer certificate ; security verify-cert en accès hôte donne CSSMERR_TP_NOT_TRUSTED, exit1. Le même appel security sous sandbox indiquait No error tout en sortant1/CTnonvérifié : résultat insuffisant, non utilisé comme confiance acquise. MCP du navigateur principal : contexte sécurisé mais zéro enregistrement service worker et aucun contrôleur. Aucune nouvelle tentative d’installation de confiance après l’annulation OS précédente ; aucun contournement d’avertissement.

Conclusion : l’enabler de lancement BFCache est acquis, mais sa recette réelle et le service worker attendent la confiance localhost effective. Nouvelle connexion historique et CI distante restent également ouvertes. Préparation de cette tranche estimée10–15min, coût précis indisponible, aucun nouveau service payant.

### 14:53 — HTTPS local désactivé sur demande explicite

UserdemandeHTTP, décisionprioritaire suranciennepistetrust. RunnerHTTP3002direct/APP_ORIGINHTTP ; docsactualisées, commentaireHSTSclarifié, pasAuth/prod/env/DBsource.16831arrêt0,58028démarrégardeDBvalidée. HTTP200sansredirect/HSTS,3443plusécouté ; renduMCPcapturé/inspecté, SWactivated/controllertrue,console0erreur. nodecheck/11deliveryverts. SafariHTTPnonvalidé, SecureNeoninchangé ; cette limite annoncée avant/aprèsmodification. Aucunservicepayantnouveau, coûtprécisindisponible ; aucuneémissionau démarrage. Commit local de cette tâche nécessaire, pasdepush.
