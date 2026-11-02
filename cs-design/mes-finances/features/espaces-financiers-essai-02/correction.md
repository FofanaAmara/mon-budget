# Correction du finding Medium — cible invitation mobile

2026-10-22. Source du finding : review.md (conservé sans modification).

- src/App.jsx : chiffre déplacé dans un span visuel aria-hidden ; le nom accessible reste « 1 invitation en attente ».
- src/preview.css : bouton44×44px, flex non rétractable, badge interne26×26px. Le trait inférieur de la barre devient une ombre intérieure : le bord ne réduit plus son espace intérieur et les cibles ne dépassent pas de0,5px dans le header.
- Chrome CUA375×812 : bouton mesuré44×44 àx312/y48 ; badge26×26 ; barre y48→92 ; bouton espace284×44 ; séparation horizontale12px. Nom long testé visuellement sans collision. Données brutes : proofs/invite-hitbox-measurements.json.
- Capture après : proofs/after-invite-hitbox-long-name-375.png. Ouverture du bouton puis acceptation rejouées ; badge retiré immédiatement et sidebar « Invitations0 » (proofs/after-invite-hitbox-accepted-counter0-375.png).
- Coup d’œil desktop1280×900 : sidebar et confirmation conservées, preuve proofs/after-invite-hitbox-1280.png. Règles nouvelles du badge limitées au mobile.
- Build Vite final : sortie0, aucun changement applicatif ni package, serveur87161 actif. Onglet propre fermé et viewport restauré ; démo réinitialisée sur Couple + personnel.
