# Mission designer — Mockups React simples, continuité de Mes Finances

Mandat corrigé de l'humain : « je ne t'ai pas demandé d'utiliser ce skill il y a une dépendance avec storybook sauf si tu vas faire fi de ça et juste produire des mockups react sans rien d'autre ».
Ce mandat remplace le précédent brief et son protocole Storybook. Ne lance aucun skill de cycle React/Storybook. Produire seulement le prototype React demandé, avec les moyens déjà présents.

Trois contraintes impératives :
- React, pas des pages HTML d'interface.
- Continuité de la vraie application observée, pas un redesign parallèle.
- Aucun Storybook, aucune bibliothèque/catalogue, aucune intégration dans l'app réelle.

Dépôt : /Users/amarafofana/Projects/Perso Workspace/Mon Budget.
Écriture : cs-design/mes-finances/features/espaces-financiers-essai-02/ seulement.
Runtime existant réutilisable : React19.2.3, ReactDOM19.2.3 et Vite7.3.1 dans node_modules racine. Pas d'installation de package nécessaire. Un index.html technique de montage Vite n'est pas le livrable d'interface ; UI en React JSX, maquettes navigables. Port4301, host127.0.0.1 ; pas de serveur Storybook. Pas de package/lock racine modifié. Aucune dépendance ajoutée par facilité.

Sources métier : .Codex/inputs/espaces-financiers/input.md et .app-factory/backlog/epics/finances-partagees/features/espaces-financiers/feature-brief.md, requirements, storiesESP001..006.
Décisions : espace financier complet indépendant ; droits égaux pour tous ; nom premier espace+invitation optionnelle onboarding ; autres espaces créables ; switch dans sidebar, même solo avec une seule option sans bascule ; invitation courriel et visible après connexion ; invité rejoint directement commun sans personnel vide imposé ; dernier espace repris ; existants Mes finances modifiable.

Base visuelle IMPÉRATIVE : vraie app http://localhost:3001 et ses composants/styles réels. La première passe HTML n'est pas une référence, elle a été rejetée malgré esthétique.
Lire cs-design/mes-finances/features/espaces-financiers/continuity-baseline.md, captures .tmp/cs-espaces-financiers/continuity/before/ (données réelles privées, local uniquement). Visite live déjà faite par designer précédent ; confirmer toi-même au minimum accueil/dépenses/réglages à375 puis1280, en lecture seule, pas de submit réel ni réglage/notification.
Source lecture autorisée : components/BottomNav.tsx, LayoutShell.tsx, AccueilClient.tsx, DepensesTrackingClient.tsx, RevenusTrackingClient.tsx, ProjetsEpargneClient.tsx, ParametresClient.tsx et leurs vrais sous-composants/styles. Réemployer par imports quand compatible au lieu de reconstruire des répliques génériques. Composants réels dépendants Next/auth/server-actions : adaptateurs locaux de preview et services simulés (jamais NeonDB/env/auth réel). Chaque impossibilité de réemploi expliquée brièvement, pas une raison pour refaire la structure. Application/styles racine restent lecture seule.
Garder header MesFinances+avatar, sidebar260, breakpoint768, maxlargeur672 desktop, bottomnav5, dashboard3onglets, hero+filtres dépenses+feuille ajout existante, Allocation DANS revenus, cartes patrimoine, hubRéglages. Ajouter uniquement switch espace/gestion/invitations et étapes onboarding. Aucun nouveau menu Allocations, aucun remplacement des pages financières ni logo. /onboarding réelle404 : carrousel overlayracine ; ne pas le réinitialiser sur compte réel, lire composant de carrousel pour prolongement.

Les mockups doivent permettre les parcours complets création premierespace → invitation facultative → finances ; créer autre et switch ; gestion/renommage/inviter ; invitationsreçues → acceptation avec compte ; inscriptionsimulée → acceptation sans espace personnel forcé. Fixtures fictives isolées, mêmes contrôles existants. Les compteurs attente passent0 dès acceptation, confirmation recharge, actif inchangé jusqu'à Ouvrir. Tous membres peuvent renommer/inviter/contribuer. Pas de droits serveur réels, envoiemail ou donnéesréelles.
Prévisualisation directe sans galerie de bibliothèque ; petit choix de scénario/reset hors écranproduit si nécessaire. SourcesReact, CSSlocal d'extension, appstyles réutilisés ; pas de longues nouvellesdocs. Un READMEcourt pour lancer et expliquer simulations/limites, un compte-rendu concis du réemploi et des comparaisons avant/après suffisent.

Browser via CUA Chrome extension, onglet neuf ; IAB indisponible/ChromeMCP conflitprofil. Réinitialiser viewport/fermer tes seules tabs. Pas de PlaywrightMCP revendiqué. Vérifier375 FIRST puis1280, comparer VISUELLEMENT à vraie app, champs/noms longs, étatvide/rempli, clavier et flux. Preuves locales dans essai02/proofs/, pas /tmp ; logs/dérivés dans essai02/.cache et logs.
Ne pas produire une machine d'état, requirements/plan/Storybookdocs ; pas appliquer le skill-new révoqué. Ton auto-revue visuelle reste requise pour mockups propres, parent fera regardneuf comparatif. Aucun agent supplémentaire ni commit/push. Aucun codeapp/.serena/next-env/packageracine à modifier. Pas de demande permission pour routine autorisée. Si blocage technique réel, informer parent en continuant indépendant.
