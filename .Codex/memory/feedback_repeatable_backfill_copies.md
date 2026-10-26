# Copies dérivées dans un backfill rejouable

**What happened** — La revue a trouvé que les copies de réglages/guide restaient figées à la première passe alors que les anciens writers pouvaient encore les modifier. Les empreintes des lignes d’origine restaient vertes.

**Why it happened** — ON CONFLICT DO NOTHING prouvait seulement absence de doublon, sans reprendre la dernière vérité source.

**How to prevent** — Jusqu’à la bascule, recopier aussi les états dérivés à chaque passe sous verrou, dates/NULL/absence inclus. Tester modifications et apparitions entre première passe et transaction finale. Après activation partagée, interdire cette réattribution legacy. Comparer autant les copies exposées que les originaux conservés.
