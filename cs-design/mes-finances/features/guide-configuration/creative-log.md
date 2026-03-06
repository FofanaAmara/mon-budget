# Creative Log — Guide de configuration

---

## @design-integrator — 2026-03-06

### Mode
Feature integration (visual shell only, mocked data)

### Fichiers modifiés/créés

| Action | Fichier | Count |
|--------|---------|-------|
| Créé | `components/setup-guide/SetupGuide.tsx` | 1 |
| Créé | `components/setup-guide/SetupGuideBar.tsx` | 1 |
| Créé | `components/setup-guide/SetupGuideSheet.tsx` | 1 |
| Créé | `components/setup-guide/SetupGuideStep.tsx` | 1 |
| Créé | `components/setup-guide/SetupGuideProgressRing.tsx` | 1 |
| Créé | `components/setup-guide/SetupGuideCelebration.tsx` | 1 |
| Modifié | `components/LayoutShell.tsx` | +4 lignes |
| Modifié | `app/globals.css` | +60 lignes (@keyframes) |
| Créé | `cs-design/mes-finances/features/guide-configuration/feature-integration-report.md` | 1 |

Total: 6 nouveaux composants, 2 modifications.

### Décisions d'intégration

| Décision | Choix | Raison |
|----------|-------|--------|
| Responsive strategy | Deux variantes dans chaque composant (`lg:hidden` / `hidden lg:*`) | Pas de JS pour la détection breakpoint — Tailwind CSS pur, SSR-safe |
| Navigation on step click | `window.location.href` (hard nav) | Boundary entre shell visuel et logique dev — documenté comme TODO |
| `SetupGuide` placement | Dans `LayoutShell.tsx`, entre `<BottomNav>` et le contenu | Apparaît sur toutes les pages authentifiées automatiquement |
| CSS animations | `@keyframes` dans `globals.css` avec préfixe `setupGuide` | Cohérent avec le pattern existant des autres animations de l'app |
| Confetti | CSS-only, 16 particles codées en dur | Pas de dépendance externe (canvas-confetti interdit par la spec) |
| Mocked data | Constantes dans `SetupGuide.tsx` avec TODO comments | Boundary claire entre shell et logique — le dev remplace les constantes par des props serveur |

### Écarts mockup → code

| Écart | Raison |
|-------|--------|
| Step click = `window.location.href` au lieu de `router.push` | À connecter par le développeur avec `useRouter` |
| Pas d'animation spring sur step completion | Nécessite orchestration JS de transition d'état — P2 gap |
| Swipe-down gesture non implémenté | Touch events à ajouter — P2 gap |

### Known gaps (pour le développeur)

1. **P0** — Remplacer `MOCK_STEPS_RAW` par données serveur (4 EXISTS SQL)
2. **P0** — Remplacer `MOCK_GUIDE_STATE` par check serveur (table `setup_guide`)
3. **P0** — Créer server action `dismissSetupGuide()` et brancher `onCelebrationCTA`
4. **P1** — Remplacer `window.location.href` par `router.push(href)`
5. **P1** — Ajouter `revalidatePath` après chaque server action qui touche les données des étapes

### Cross-reference

Voir `feature-integration-report.md` pour le détail complet : interface des données, gaps priorisés, hooks dans les server actions existantes.
