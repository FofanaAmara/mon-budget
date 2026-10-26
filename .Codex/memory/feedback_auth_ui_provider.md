# Fournisseurs UI Auth : contrat public et rendu réel

What happened : un refus d'accès corrigé en404 a exposé un script de thème injecté par le wrapper Neon lors du repli React. Le remplacement par le fournisseur UI de base a ensuite révélé un type twoFactor différent au build.
Why it happened : le wrapper ajoute thème/notifications/adaptation et transmet lui-même un false non proposé par le contrat public du fournisseur de base. Une ressemblance de props ne prouve pas leur équivalence typée ou leurs effets.
How to prevent : inspecter les exports et sources installés, conserver client/callbacks/options utiles/notifications/CSS, vérifier le sens des options absentes. Pour une app à palette fixe, éviter un bootstrap de thème inutile. Tester le vrai contexte SSR, exécuter types/build puis contrôler le repli et une page autorisée dans le navigateur. Ne pas masquer la console, patcher node_modules ou déclarer l'hydratation prouvée par le seul SSR.
