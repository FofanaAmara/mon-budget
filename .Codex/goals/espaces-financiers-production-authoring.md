# Authoring — Goal de livraison en production

Date : 26 octobre 2026. **Livrables rédigés et vérifiés, goal non activé.**

- Condition native : espaces-financiers-production.goal.txt,3405caractèresUnicode/UTF16 ; cadrestandardidentique, référencesaccessibles, test-s etgoal_template.pycheckexit0.
- Contrat complet : espaces-financiers-production.md,10critèresP1–P10 et preuves de livraison/production, sourcesproduitetsécurité/retourarrière.
- Champsreproductibles : espaces-financiers-production.fields.json ; assemblageparlehelperduSKILL.md réellementlu, version4.3.7.

## Type et challenge

Livrable substantiel et risqué : migration de finances puis publication/recette en production. Le résultat demandé n’est pas«déploiementvert»maisutilisateursréelscapablesdegérerensemblelesfinances,sanspertenifuite. Aucun changement de périmètre proposé : lacibleestcellequedemandehumain.

Risquesconcretslevésdanslaformulation : runneractuelréservéfixtures, déclenchementautoVercelmainàvérifier, ancienwriterincompatibleaprèsNOTNULLspace_id, rollbackanciencodeuser_idinterditpostcutover. Sauvegarde/restaurationrépétéesetordrepublication/migrationfontpartiedubesoinnécessaire. Pasdepréproductioninventée ; QAenproductionexplicitementretenueparl’humain. PasOTP/guideinvitéréintroduits, pasdeprofilHTTPlocalenprod.

## Lectures effectuées

SKILL.mdgoal-authoring ; knowledge/methode-et-cadres.md,regles-et-frontieres.md,condition-goal.md ; assets/goal-template.txt ; principes/README.md et7fichesenentier : pareto-valeur-perimetre,autonomie-execution,terminer-une-unite,blocages-et-reprise,validation-utilisateur,perimetre-stable-et-cloture,preuves-cout-verdict. Lecheckermécaniqueretournepreuve_de_lecturefalseparconception ; ilnecertifiepasceslecturesnilesensdubesoin.

Sourcesprojetlues : backlogrequirements/briefetreadiness,état/matriceactuels, planetanciengoalauthoring ; runbooksdeploy/rollback/email ; workflowCI ; .vercel/project.json(métadonnéesseulement) ; profilinfra ; migrate.mjs etREADME,extraitisolation003, configurationDBetnomsdesvariablesd’environnement. Aucunsecretluouaffiché,aucunecléenartefact,aucunaccèsdistantnécessairepourlarédaction.

## Revue et limites

Instance distinctefinancial_spaces_review : relecturedocumentairefavorableinitialepuisfinale3405caractères, aucuntrounécessairenicontradiction ; pasdefichiermodifié/nouveauxtests/outilsdistantsparlereviewer. ContrôleP9clarifié : testerretouravecBFCacheactivéetobserverrestauration/exclusionréelle,sansaffaiblirno-store ; jamaisuneétiquettenonvérifiépourvalider.

Restentàétablirparl’exécutant : cibleetURLréelles/accès/configurationdéployée,CIetdéploiementsdistants,étatproductionetaménagementproductiondu runner, sauvegarderestaurable/récupérationcompatible,boîteQAautoriséeetrecetteprod. CescontrôlessontprévusdansP1–P10,aucunn’estprésentécommeobtenu. Estimationd’exécutionàfiabiliseraupréflight,coûtmonétaireindisponible,budgetnonfixé,nouveauservicepayantsansaccordinterdit.

Pasdecreate_goal/update_goal, pasdepush/merge/migration/configcloud/envoimail/déploiement ; seuleladocumentationlocaleestproduite. L’humainactiveracetteconditionpourl’exécutionfuture ; nepasmodifierl’anciengoalenarrière-plan.
