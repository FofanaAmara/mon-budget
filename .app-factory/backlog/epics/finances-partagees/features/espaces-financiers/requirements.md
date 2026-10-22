# Exigences — Espaces financiers

Source primaire : `.Codex/inputs/espaces-financiers/input.md`, version avec sidebar ; priorité immédiate confirmée dans la conversation du 2026-10-22. Extraction préalable au découpage. Les propositions PM sont uniquement dans le brief et ne deviennent pas des décisions par leur présence ici.

| ID | Exigence vérifiable | Ancre de l’input |
|----|---------------------|------------------|
| FR-001 | Créer et nommer le premier espace pendant l’onboarding ; démarrage solo possible. | Décision premier espace obligatoire |
| FR-002 | Préserver toutes les données financières des comptes existants dans un premier espace. | Décision conservation |
| FR-003 | Créer des espaces supplémentaires et conserver des finances séparées. | Décision plusieurs espaces |
| FR-004 | Choisir l’espace dans la liste déroulante de la sidebar ; une seule option sans bascule si un seul espace. | Décision sidebar |
| FR-005 | Faire refléter l’espace actif par toutes les fonctions et la configuration financière existantes. | Décision même application |
| FR-006 | Inviter une personne avec un compte, lui montrer l’invitation après connexion, obtenir son acceptation. | Décision invitation compte existant |
| FR-007 | Permettre inscription puis acceptation à une personne invitée sans compte. | Décision invitation sans compte |
| FR-008 | Pouvoir lancer une invitation dès l’onboarding sans la rendre obligatoire. | Décision démarrage partagé |
| FR-009 | Donner à chaque membre les mêmes capacités de gestion des données, de l’espace et d’invitation ; aucun privilège du créateur. | Décision égalité |
| NFR-001 | Refuser toute lecture/écriture d’un non-membre et toute relation entre objets d’espaces différents, y compris par accès direct. | Garde-fou isolation |
| NFR-002 | Préserver montants, relations et unicité des instances mensuelles ; aucun accès avant acceptation, aucune double adhésion lors d’acceptations répétées. | Garde-fous données/invitations |
| NFR-003 | Ne jamais réaffecter silencieusement une saisie au mauvais espace lors d’une bascule ou d’actions simultanées. | Garde-fou saisies/concurrence |
| UXR-001 | Maintenir le sélecteur présent dans la sidebar, un nom d’espace actif identifiable et une interaction utilisable au clavier et sur mobile. | Décision sidebar + invariants accessibilité AF |
| UXR-002 | Conserver l’interface fr-CA et les conventions visuelles existantes ; noms longs lisibles et aucun débordement mobile. | Contrainte interface |
| TR-001 | Partir de la stack existante ; architecture, contexte actif et migration à concevoir, aucun service payant imposé par le PM. | Faits techniques réfutables + coût ouvert |
| TR-002 | Plan technique humain validé avant implémentation ; preuves réelles d’isolation et de conservation, validation visuelle Playwright MCP, analyse de l’échec de test connu. | Contraintes qualité de l’input |
