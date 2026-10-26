# Exigences — Espaces financiers

Source primaire : `.Codex/inputs/espaces-financiers/input.md`, version incluant les décisions UX après test ; priorité immédiate et maquettes corrigées approuvées par l’humain le 2026-10-22. Extraction préalable au découpage, amendée par les validations produit et UX du même jour. Les propositions PM sont uniquement dans le brief et ne deviennent pas des décisions par leur présence ici.

| ID | Exigence vérifiable | Ancre de l’input |
|----|---------------------|------------------|
| FR-001 | Créer et nommer le premier espace pendant l’onboarding ; demander explicitement s’il est partagé et permettre le démarrage solo sans page invitation. | Décision premier espace obligatoire |
| FR-002 | Préserver toutes les données financières des comptes existants dans un premier espace nommé « Mes finances », modifiable ensuite. | Décision conservation |
| FR-003 | Créer des espaces supplémentaires et conserver des finances séparées. | Décision plusieurs espaces |
| FR-004 | Limiter la section espace de la sidebar au sélecteur ; une seule option sans bascule si un seul espace ; reprendre le dernier espace utilisé à la connexion. | Décision sidebar |
| FR-005 | Faire refléter l’espace actif par toutes les fonctions et la configuration financière existantes. | Décision même application |
| FR-006 | Inviter depuis le détail de l’espace par courriel une personne avec un compte ; page explicite avant connexion vers la connexion existante, invitation également visible après connexion puis acceptation distincte. | Décision invitation compte existant |
| FR-007 | Présenter avant authentification une page disant explicitement que la personne est invitée dans un espace, avec Se connecter / Créer un compte vers les pages existantes ; conserver l’invitation après inscription puis acceptation explicite, sans espace personnel supplémentaire obligatoire. | Décision invitation sans compte |
| FR-008 | Demander si l’espace est partagé : Oui propose la page invitation facultative pendant l’onboarding ; Non termine sans afficher cette page. | Décision démarrage partagé |
| FR-009 | Donner à chaque membre les mêmes capacités de gestion des données, de l’espace et d’invitation ; aucun privilège du créateur. | Décision égalité |
| FR-010 | Dans Réglages > Espaces et membres, lister tous mes espaces accessibles et proposer leur création ; le clic ouvre une fiche pour renommer, voir les membres et inviter, sans changer implicitement l’espace actif. | Décisions UX après test |
| NFR-001 | Refuser toute lecture/écriture d’un non-membre et toute relation entre objets d’espaces différents, y compris par accès direct. | Garde-fou isolation |
| NFR-002 | Préserver montants, relations et unicité des instances mensuelles ; aucun accès avant acceptation, aucune double adhésion lors d’acceptations répétées. | Garde-fous données/invitations |
| NFR-003 | Ne jamais réaffecter silencieusement une saisie au mauvais espace lors d’une bascule ou d’actions simultanées. | Garde-fou saisies/concurrence |
| UXR-001 | Maintenir uniquement le sélecteur dans la section espace de la sidebar, sur desktop et mobile ; nom actif identifiable et interaction utilisable au clavier. Aucune action de gestion, création ou invitation à cet endroit. | Décision sidebar + invariants accessibilité AF |
| UXR-002 | Conserver l’interface fr-CA et les conventions visuelles existantes ; noms longs lisibles et aucun débordement mobile. | Contrainte interface |
| TR-001 | Partir de la stack existante ; architecture, contexte actif et migration à concevoir, aucun service payant imposé par le PM. | Faits techniques réfutables + coût ouvert |
| TR-002 | Plan technique humain validé avant implémentation ; preuves réelles d’isolation et de conservation, validation visuelle Playwright MCP, analyse de l’échec de test connu. | Contraintes qualité de l’input |
