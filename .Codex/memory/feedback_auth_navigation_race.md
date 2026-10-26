# Navigation Auth et refresh concurrents

What happened : WebKit surHTTP restaitsurlogin malgréget-session200authentifié etcookiesvalides ; requêtesroot/sessionannulées, formulaire réinitialisé.
Why : onSessionChange lançaitrouter.refresh puisSDKnavigate déclenchaitrouter.replace. La concurrence a été supprimée parnavigationdocumentaire surlestransitionsAuth.
How to prevent : distinguerstockagecookies, sessionAPI etarrivéeeffectiveauxfinances. TesteravecWebKit etChromium ; onSessionChangeinvalideautresonglets, navigate/replacechargentundocumentfrais. Garderleretourinvitationvalidé. Ne jamaisdéclarerloginréussi sur le seulPOST200ouget-sessionauthtrue.
