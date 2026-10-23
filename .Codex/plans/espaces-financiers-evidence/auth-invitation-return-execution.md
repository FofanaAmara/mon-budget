# Retour d’invitation entre vues Auth — 2026-10-23

## Défaut et preuve avant

DISC-ESP-009 reproduit dans ChromeDevToolsMCP nouvelle session anonyme, vraie invitation reçue Mailpit. Landing→signup contient le retour, mais lien interne Connexion initialement sans retour ; clic réel perd le query. Source fournisseur @neondatabase/auth-ui/dist/index.mjs confirme construction du href par isHydrated/window.location.search. Test RED rendu serveur de la vraie AuthPage dans les vrais AuthProviders/AuthView : footer /auth/sign-in seul, assertion échoue. Log privé isolation-current/auth-return-red.log.

## Correction

InvitationAuthNavigation fournit returnPath de la page serveur au Link public du provider. Aucune lecture window/searchParams côté client, aucun stockage global, état réseau ou useEffect ; contexte attaché à l’arbre de la page et adaptateur stable. InvitationAuthLink conserve les props Next Link, et ne réécrit que les href string internes sign-in/sign-up/forgot-password/reset-password dans ce scope. Retour accepté uniquement par validInvitationReturn existant ; Auth ordinaire supprime un redirectTo repris par le fournisseur, sans inventer un retour d’une page antérieure. Paramètres reset, autres query/hash préservés ; URL externe/autre chemin non enrichi. Aucun changement à l’autorité de session, aux contrôles d’adhésion ou au formulaire d’authentification. Aucun patch fournisseur ou nouvelle dépendance.

## Vérification

14 nouveaux tests : rendu SSR réel signup footer ; deux vrais liens signin ; page ordinaire après invitation sans fuite ; quatre retours invalides ; reset query/hash et retour dupliqué ; cinq destinations externes/horsAuth ; absence de scope inchangée. Suite complète260tests/19fichiers exit0 (69662), qualité finale buildWebpack/types/lint0warning/7gardes exit0 en copie isolée (10609). PG99 du socle inchangé non rejoué pour ce seul raccordement navigation. Revue manuelle react-best-practices : pas de nouvelle waterfall, hook conditionnel, effet de synchronisation ou composant défini dans un rendu ; aucun nouveau script inline. Revue indépendante globale toujours ouverte.

Vraie app DevTools après correction : landing→signup→Connexion conserve le retour, puis recharge signin le conserve. Le href Mot de passe oublié le conserve aussi ; clic375x812 et recharge de la vraie page forgot le conservent, champs non soumis. Retour externe example.invalid dans query signup non propagé à son lien Connexion (pas de requête à cette destination). Capture finale mobile signin et forgot affichées/scannées dans la trace : aucun chevauchement, troncature ou débordement, body top/bottom0. Le viewport doit être réémulé et un nouveau snapshot utilisé car les UID changent. Captures inline, sauvegarde disque MCP toujours indisponible.

## Limites

L’inscription ne fut pas soumise et les conditions d’utilisation ne furent pas acceptées. Aucun mail Auth/Resend envoyé, aucun compte vérifié, aucune adhésion ou contribution de deuxième membre ajoutée. Cela corrige la conservation du chemin, pas le trajet Auth intégral demandé. ChromeDevToolsMCP ne remplace pas PlaywrightMCP ; CI distante, réception externe, deux membres et recette offline/BFCache restent à prouver. Goal IN_PROGRESS.
