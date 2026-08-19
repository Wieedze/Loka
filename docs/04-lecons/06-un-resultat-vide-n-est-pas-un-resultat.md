# Leçon 06 — Un résultat vide n'est pas un résultat

Une boucle de relecture automatique a annoncé « zéro finding, convergence
atteinte ». En réalité les relecteurs de ce tour avaient échoué et renvoyé
`null` ; le script filtrait les `null`, obtenait une liste vide, et concluait au
succès. **Douze constats réels, dont trois bugs sérieux, n'ont jamais été
appliqués.**

L'absence de problème signalé et l'absence de signal ont la même forme. Rien ne
les distingue si on ne s'en occupe pas explicitement.

**En pratique.** Distinguer toujours « l'outil a répondu : rien » de « l'outil
n'a pas répondu ». Un agent qui échoue, une commande qui plante, une requête qui
expire : chacun doit produire un état distinct de la réussite silencieuse. En
cas de doute, s'arrêter en signalant l'incertitude plutôt que conclure.
