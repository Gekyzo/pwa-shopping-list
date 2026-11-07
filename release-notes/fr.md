# Notes de version

Ce qui change pour vous dans chaque version de l’app. La version la plus récente vient en premier.

## Unreleased

- Sur les grands écrans d’environ 1024 px, le titre de l’en-tête n’est plus coupé : le champ de recherche se rétrécit et, si besoin, n’affiche que la loupe.
- Sur les grands écrans, la liste et les panneaux de **Courses** suivent le design : plus d’espace autour de la liste et entre les groupes, des panneaux plus larges, des étiquettes et des quantités plus claires, et une barre verte plus épaisse pour chaque recette.
- Chaque section a sa propre adresse : `#/compra`, `#/recetas`, `#/menu` et `#/ajustes`. Après un rechargement, tu restes dans la même section. Le bouton Retour du téléphone revient d’abord à **Courses**, puis quitte l’app.
- Sur les grands écrans, la barre latérale suit le design : un peu plus large, la section actuelle sur un fond plus marqué avec une barre verte, le nombre d’articles dans une pastille et l’état de la synchronisation sous une ligne.
- Avec un clavier : 1 à 4 ouvrent les sections, N ajoute et / recherche. Sur un article sélectionné, la touche de menu ou Maj+F10 affiche ses actions et Suppr le supprime.
- Avec une souris, faites un clic droit sur un article ou utilisez son bouton ⋮ pour voir ses actions. Faire glisser l’en-tête avec la souris ne change plus de section.
- Dans **Recettes**, chaque produit ajouté commence par une majuscule : « riz » est enregistré comme « Riz ».
- Sur grand écran, **Courses** occupe toute la largeur. La barre latérale a un fond doux, une ligne d’état sous **Bodega**, le bouton pour ajouter et en bas une carte avec l’état de la synchronisation.
- Sur grand écran, les lignes de **Courses** suivent la maquette : un nom plus compact, « à chaque course » à côté du nom et la quantité en police à chasse fixe. Chaque groupe indique combien d’articles il lui reste (« 3 art. »). Le crayon de chaque ligne est maintenant une poignée à six points ; un appui ouvre **Modifier**.
- L’en-tête de **Courses** indique en vert ce qu’il reste à acheter, sans barre. Sur grand écran, il a un champ de recherche (s’ouvre avec Ctrl+K ou ⌘K), le bouton **Terminer les courses** et les magasins sous le titre.
- Dans **Courses**, tu peux reporter un article aux prochaines courses : fais glisser la ligne ou utilise **Reporter** dans **Modifier**. Sur grand écran, **Prochaines courses** les liste avec un + pour les remettre, et **Recettes dans la liste** montre combien d’ingrédients de chaque recette tu as déjà.
- Dans **Courses**, le nom de chaque article a plus de place : il est moins coupé et prend moins de lignes.
- Nouvelles couleurs : un fond papier chaud avec des lignes gris-vert douces, en thème clair et en thème sombre.
- Dans **Courses**, le nom de chaque produit tient sur une ligne, et sa quantité est une étiquette discrète.
- Dans **Courses**, les produits achetés sont dans une carte à part, sous une coche.
- Les boutons en bas de **Courses** flottent sur la liste, et le message après une coche est sombre.
- **Modifier** affiche chaque champ comme une boîte avec son nom dedans, l'interrupteur de répétition comme une carte, et les magasins comme des étiquettes à ajouter avec + et à retirer avec ×.
- Dans **Recettes**, les boutons d'une recette sont à côté de son nom, et ses produits prennent toute la largeur de la carte.
- **Menu** montre combien de repas de la semaine sont prévus et combien sont libres, une icône sur chaque repas pour une recette ou un plat, et un calendrier sur la semaine.
- **Réglages** montre une icône sur chaque groupe, marque **Supprimer toutes les données** comme irréversible et explique **Installer l’application**.
- Sur un grand écran, la section actuelle ressort avec une barre verte, et chaque groupe de **Courses** a son titre dans sa carte.

## 1.13.0 - 2026-11-05

- L’app déménage vers `bodega.artisandevs.duckdns.org`. Sur l’ancienne adresse, **Déplacer mes données** copie ta liste vers la nouvelle ; avec un compte, il envoie d’abord tes modifications, puis tu te connectes là-bas.

## 1.12.1 - 2026-11-03

- Un nouveau look : un fond papier chaud, la police Hanken Grotesk plus grande, des cases rondes et un vert émeraude pour les articles achetés et l'action principale.
- `Recettes`, `Menu` et `Réglages` suivent le nouveau look : un bouton vert envoie une recette dans la liste, les repas sont des cartes plus hautes et les flèches de `Réglages` se voient mieux.
- La barre montre des couverts pour `Recettes` et un livre ouvert pour `Menu`, et les actions qui effacent des données sont en rouge.
- Chaque ligne de `Réglages` commence par une icône, et l’en-tête de chaque rayon du magasin montre une icône de son type : fruits, produits laitiers, pain, entretien et autres.
- Dans `Menu`, la barre de la semaine montre ses jours et chaque jour sa date. Chaque repas dit s’il s’agit d’une recette ou d’une note rapide, et un repas libre montre un ⊕.
- Dans `Recettes`, chaque recette montre ses produits et le badge « dans la liste », et des puces filtrent les recettes : `Toutes`, `Dans la liste` et `Avec un lien`.

## 1.12.0 - 2026-11-03

- Dans une semaine passée de **Menu**, **Répéter cette semaine** copie ses repas dans la semaine en cours. Pour revenir en arrière, touche **Annuler**.

## 1.11.0 - 2026-11-03

- **Menu** repart vide chaque lundi. Les flèches du haut montrent le menu des semaines passées, jusqu’à 26 semaines en arrière.

## 1.10.2 - 2026-10-31

- Dans Nouveautés, les noms des boutons s'affichent en gras, sans astérisques.

## 1.10.1 - 2026-10-30

- Sur une tablette ou un ordinateur, les marges de l'écran sont les mêmes que dans les autres apps : la liste, les panneaux et les volets sont à la même distance du menu latéral.

## 1.10.0 - 2026-10-30

- Une recette avec un lien affiche un bouton ▶ à côté de « Ajouter à Courses » qui ouvre la vidéo tout de suite. Dans la fiche de la recette, une carte au-dessus du champ Lien affiche « Voir la vidéo » et le site du lien, comme youtube.com.

## 1.9.1 - 2026-10-27

- L'app s'ouvre de nouveau après la mise à jour 1.9.0 quand tu la lances depuis un raccourci. Les mises à jour arrivent aussi par les raccourcis.

## 1.9.0 - 2026-10-27

- Si tu partages une liste, un article qui est dans ta liste et dans la liste partagée s’affiche maintenant sur une seule ligne dans Toutes, avec les deux étiquettes. Chaque liste a sa couleur. Un nouveau réglage choisit si cocher ou supprimer cette ligne change seulement ta liste ou les deux.

## 1.8.0 - 2026-10-26

- Sur les grands écrans, les Réglages n'affichent plus deux barres de défilement.
- Sur une tablette, un pliable ou un ordinateur, les sections sont toujours à gauche. Sur un ordinateur, Bodega tient dans un cadre centré avec une barre latérale qui montre le nom des sections et ce qu'il te reste à acheter.
- Sur les grands écrans, Courses montre ce qui reste dans chaque magasin et ce qui revient aux prochaines courses, et Menu ce qu’ajoute « Remplir panier ».
- Le titre de l'onglet et de l'app installée est maintenant « Liste de courses - Bodega ».
- Sur une tablette ou un ordinateur, une recette s'ouvre dans un panneau à côté de la liste des recettes, et tu peux passer de l'une à l'autre sans le fermer.
- Sur une tablette, un pliable ou un ordinateur, le bouton pour ajouter est dans l'en-tête, et les volets comme Ajouter s'ouvrent à côté de la liste sans la cacher.
- Sur les grands écrans, les Réglages montrent chaque groupe avec son explication à côté.

## 1.7.1 - 2026-10-26

- Quand tu cherches dans Courses, la liste reste en haut et ne descend plus jusqu'au champ de recherche.
- Si quelqu'un t'invite à partager sa liste alors que tu partages la tienne, tu peux maintenant retirer ces personnes dans l'invitation même, puis l'accepter.

## 1.7.0 - 2026-10-25

- Tu peux utiliser l'app sans compte : touche **Utiliser sans compte** sur Se connecter. Tes listes restent sur cet appareil. Connecte-toi plus tard depuis les Réglages pour les synchroniser.
- La connexion par e-mail et mot de passe disparaît. Si tu l'utilisais, connecte-toi avec Google avec le même e-mail : tu gardes ton compte et tes listes.

## 1.6.0 - 2026-10-25

- Quand vous acceptez une liste partagée, votre propre liste reste. `Courses` montre les deux côte à côte : `Toutes`, `Ma liste` et la liste de l’autre personne sont des puces en haut, chacune avec ce qui reste à acheter. Dans `Toutes`, chaque article indique sa liste, et ce que vous ajoutez va dans votre liste. Si les recettes et le menu sont partagés aussi, `Recettes` et `Menu` montrent ceux des deux listes, chacun avec sa liste : une recette partagée envoie ses produits dans la liste partagée.
- Quand vous invitez quelqu’un dans `Compartir lista`, vous choisissez ce que vous partagez : `Courses seulement` ou `Courses, Recettes et Menu`. Vous pouvez le changer ensuite d’un appui sur la personne. Si quelqu’un refuse l’invitation ou arrête de partager, vous voyez `Annulée` et pouvez `Inviter à nouveau`.

## 1.5.0 - 2026-10-25

- Vous pouvez partager votre liste avec d’autres personnes : dans `Ajustes` › `Cuenta` › `Compartir lista`, saisissez leur e-mail. Après acceptation, elles voient et modifient la même liste, les recettes et le menu sur leurs appareils.

## 1.4.1 - 2026-10-24

- Quand le serveur demande d’attendre quelques secondes pendant l’envoi d’une longue liste, l’app n’affiche plus « Hors ligne » et réessaie toute seule.
- Dans `Réglages` › `Compte`, l’e-mail et l’heure de la dernière synchronisation ne se chevauchent plus sur un téléphone : l’heure est sous l’e-mail, et un long e-mail passe à la ligne.
- La note « Hors ligne » disparaît maintenant d’elle-même quand une synchronisation atteint le serveur, même si le téléphone ne signale pas le retour du réseau, et quand vous revenez dans l’app.

## 1.4.0 - 2026-10-24

- Connectez-vous pour retrouver vos listes sur tous vos appareils. Demandez l’accès avec votre e-mail ou avec Google ; l’administrateur approuve chaque compte. Une modification sur un appareil arrive sur les autres en quelques secondes, et hors ligne vos modifications sont enregistrées puis envoyées plus tard. Si vous avez déjà une liste, elle reste sur l’appareil, et l’avis `Connectez-vous pour synchroniser` vous mène à la connexion.
- `Réglages` › `Aide` › `Nouveautés` montre ce qui change dans chaque version. Après une mise à jour, la page s’ouvre une fois toute seule.
