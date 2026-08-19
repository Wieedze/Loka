# Leçon 07 — La sortie d'un outil n'est pas le résultat

Un scaffold s'est terminé « avec succès » en laissant 78 fichiers appartenant à
`root`, inaccessibles depuis l'éditeur de l'utilisateur, avec un dépôt git que
`git status` refusait d'ouvrir (`dubious ownership`).

Toutes les commandes avaient réussi. Le travail, lui, n'était pas livré.

**En pratique.** Le résultat d'une tâche, ce n'est pas le code de retour des
commandes : c'est l'état dans lequel on laisse l'environnement de la personne qui
va reprendre. Ici, un `chown -R max:max` après chaque vague d'écriture — y
compris celles des sous-agents, qui héritent du même problème.

Voir [postmortem 04](../03-postmortems/04-fichiers-ecrits-en-root.md).
