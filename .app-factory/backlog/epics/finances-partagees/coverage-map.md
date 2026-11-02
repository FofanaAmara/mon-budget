# Couverture — Espaces financiers

Les critères détaillés sont dans les stories ; les invariants communs du brief s’appliquent à chacune. Une couverture documentaire ne prouve aucune implémentation. FR non couvert : 0 ; NFR/TR/UXR sans story : 0.

| Exigence | Stories |
|----------|---------|
| [FR-001](features/espaces-financiers/requirements.md) | ESP-001 |
| [FR-002](features/espaces-financiers/requirements.md) | ESP-002 |
| [FR-003](features/espaces-financiers/requirements.md) | ESP-003 |
| [FR-004](features/espaces-financiers/requirements.md) | ESP-001, ESP-002, ESP-003 |
| [FR-005](features/espaces-financiers/requirements.md) | ESP-001, ESP-002, ESP-003 |
| [FR-006](features/espaces-financiers/requirements.md) | ESP-004 |
| [FR-007](features/espaces-financiers/requirements.md) | ESP-004, ESP-005 |
| [FR-008](features/espaces-financiers/requirements.md) | ESP-006 |
| [FR-009](features/espaces-financiers/requirements.md) | ESP-003, ESP-004, ESP-005, ESP-006 |
| [FR-010](features/espaces-financiers/requirements.md) | ESP-003 |
| [NFR-001](features/espaces-financiers/requirements.md) | ESP-001, ESP-002, ESP-003, ESP-004, ESP-005, ESP-006 |
| [NFR-002](features/espaces-financiers/requirements.md) | ESP-002, ESP-003, ESP-004, ESP-005 |
| [NFR-003](features/espaces-financiers/requirements.md) | ESP-003, ESP-004 |
| [UXR-001](features/espaces-financiers/requirements.md) | ESP-001, ESP-002, ESP-003 |
| [UXR-002](features/espaces-financiers/requirements.md) | ESP-001, ESP-002, ESP-003, ESP-004, ESP-005, ESP-006 |
| [TR-001](features/espaces-financiers/requirements.md) | ESP-001, ESP-002, ESP-003, ESP-004, ESP-005, ESP-006 |
| [TR-002](features/espaces-financiers/requirements.md) | ESP-001, ESP-002, ESP-003, ESP-004, ESP-005, ESP-006 |

## Couverture de la révision UX approuvée

| Décision humaine | Critères de recette |
|------------------|---------------------|
| Question de partage ; Non sans page invitation, Oui la propose | ESP-001 AC-1/2, ESP-006 AC-1/3 |
| Page publique explicite vers connexion/inscription existantes puis acceptation | ESP-004 AC-2, ESP-005 AC-1/2 |
| Sidebar sélecteur seul, y compris option unique | ESP-001 AC-3, ESP-003 AC-2 |
| Liste et création dans réglages, détail par espace et nom ciblé | FR-010, ESP-003 AC-1/3, ESP-004 AC-1/3 |

17 exigences couvertes, 6 stories et 30 critères. Design approuvé après corrections du prototype React (`7aaec6d`) ; pas de preuve de services réels par cette couverture.
