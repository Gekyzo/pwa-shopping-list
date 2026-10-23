# Text

The text catalogs of the app and their map to Android resources. Source: `src/i18n.js`,
`src/locales/<lang>.js` (257 keys each: 241 texts, 16 plurals), `index.html` (`data-i18n`,
`data-i18n-attr`), `manifest.webmanifest`, `sw.js` (`localizeManifest`). Rules: `09-languages.md`.

## Languages and resolve rule

- Source language: Spanish (`es`). `src/locales/es.js` is the source wording (LANG-8).
- Seven languages, in this order: `ca` Català, `de` Deutsch, `en` English, `es` Español,
  `fr` Français, `it` Italiano, `pt` Português (European). Fallback: `en` (LANG-1, LANG-11).
- Resolve rule (`resolveLanguage(preferred, stored)`, `src/i18n.js:28-35`), in this order (LANG-2, LANG-4):
  1. the chosen code (`shopping.lang`) when it is exactly one of the seven codes (lower case, no region);
  2. else the first entry of the device language list (`navigator.languages`) whose base subtag
     is one of the seven. The base subtag is the text before the first `-`, lower-cased. Region and
     script subtags are ignored: `es-MX` → `es`, `EN-us` → `en`, `pt-BR` → `pt` (European
     catalog), `ca-ES-valencia` → `ca`, `zh-Hant-TW` → no match. Entries that are not text are skipped;
  3. else `en`.
- `pseudo` is never a result: only `?lang=pseudo` turns on the pseudo-locale, over the Spanish
  catalog (LANG-18).
- `Intl` tag: the code itself, except `pt` → `pt-PT` (plural rule and date form, LANG-10).

## Keys built at run time

A grep for `t('key'` misses these keys. Each value set is closed; a port must keep every key of it.

| Built as | Where | Values (full set) |
|---|---|---|
| `` `list.${id}` `` | `src/ui/context.js:89` (`say`, for each message with a `list` parameter) | `list.active`, `list.saved` (list ids of items, `src/store.js:27,35,95`) |
| `` `meal.${meal}` `` | `src/ui/menu.js:17,37` | `meal.lunch`, `meal.dinner` (`MEALS`, `src/menu.js:6`) |
| `` `outcome.${key}` `` | `src/ui/list.js:94` | `outcome.recurrent`, `outcome.kept`, `outcome.open`, `outcome.bought` (`OUTCOMES`, `src/ui/list.js:90`; a row shows only when its count > 0) |
| `` `onboarding.${page}.title` ``, `` `onboarding.${page}.text` `` | `src/ui/onboarding.js:44,46` | `page` ∈ `lists`, `trip`, `row`, `sections`, `recipes`, `sample` (`PAGES`, `src/onboarding.js:2`): 12 keys |
| `` `onboarding.icon.${name}` `` | `src/ui/onboarding.js:15` | only for a `#icon` key part with no text; in every catalog that is `#cart-add` → `onboarding.icon.cart-add`. (`#menu Menú` has text, so no key.) |
| `` `sample.${key}` `` | `src/ui/onboarding.js:23` | `sample.tomatoSauce`, `sample.pasta`, `sample.garlic`, `sample.oliveOil`, `sample.salt` (`SAMPLE_PRODUCTS`, `src/ui/onboarding.js:20`) |
| `` `aisles.usual.${key}` `` | `src/ui/aisles.js:86` | `aisles.usual.produce`, `bakery`, `meat`, `dairy`, `pantry`, `drinks`, `frozen`, `cleaning` (`USUAL`, `src/ui/aisles.js:6`) |

Keys chosen through a lookup table (they appear as literals, so the table below lists them):
`ACTION_KEYS` (`src/ui/list.js:125`), `VERSION_KEYS` (`src/ui/settings.js:46`),
`SHORTCUT_KEYS` (`src/ui/settings.js:107`), `emptyAction` (`src/sections.js:72-78`), and the
`error.*` / `toast.*` keys that pure modules return as `{ key, params }` (LANG-13).

Dead key: `recipe.inList` (`Todo está en Compra`) is in every catalog and no code or markup uses it.

## Inline markup in texts

- The six `onboarding.<page>.text` texts hold `\n` (a line break) and backtick pairs. A text
  between two backticks is a key cap (`←`, `→`, `+`, `{active}`, `Ajustes`). A key cap that starts
  with `#name` shows the icon `name` of the sprite, then the rest of its text (`#cart-add`, `#menu Menú`).
  A backtick with no pair stays as text. Parser: `textParts` of `src/onboarding.js:15-37` (core; port
  it as it is and keep the markup in the string resource).
- `↻` (recurrent item), `→`, `←`, `·`, `…`, `«»`, `¿`, `¡` are plain characters.

## Catalog (source: `es`)

Columns: the key; the Spanish text (a plural shows `one / other`); the `{name}` parameters; plural
or not; the modules that use it (`file:line`, paths under `src/`; `index.html:<line>` for a
`data-i18n` or `data-i18n-attr` use). A plural is selected by `count`.

### list.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `list.active` | Compra | — | no | `ui/onboarding.js:45`; `ui/settings.js:107`; `index.html:167`; run time: say() of `ui/context.js:89` (`list.${params.list}`) |
| `list.saved` | artículos guardados | — | no | run time: say() of `ui/context.js:89` (`list.${params.list}`) |

### nav.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `nav.label` | Secciones | — | no | `index.html:164` |
| `nav.recipes` | Recetas | — | no | `ui/list.js:117`; `ui/settings.js:107`; `index.html:171,208` |
| `nav.settings` | Ajustes | — | no | `ui/list.js:108`; `index.html:179,248` |
| `nav.menu` | Menú | — | no | `ui/list.js:112`; `ui/settings.js:107`; `index.html:175` |

### header.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `header.menuMeals` | {count} comida planificada / {count} comidas planificadas | `count` | yes | `ui/list.js:111` |
| `header.noMeals` | Sin comidas planificadas | — | no | `ui/list.js:111` |
| `header.today` | Compra de hoy | — | no | `ui/list.js:121` |
| `header.settingsSubtitle` | Bodega | — | no | `ui/list.js:108` |
| `header.empty` | La lista está vacía | — | no | `ui/list.js:101` |
| `header.allBought` | Todo comprado | — | no | `ui/list.js:102,327` |
| `header.left` | Queda {count} artículo / Quedan {count} artículos | `count` | yes | `ui/list.js:327` |
| `header.bought` | {done} de {count} comprado / {done} de {count} comprados | `done`, `count` | yes | `ui/list.js:103` |
| `header.noRecipes` | Sin recetas | — | no | `ui/list.js:116` |

### meal.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `meal.lunch` | Comida | — | no | run time: `ui/menu.js:17,37` (`meal.${meal}`) |
| `meal.dinner` | Cena | — | no | run time: `ui/menu.js:17,37` (`meal.${meal}`) |

### menu.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `menu.title` | {meal} del {day} | `meal`, `day` | no | `ui/menu.js:17` |
| `menu.choose` | Elegir receta | — | no | `ui/menu.js:36` |
| `menu.fill` | Llenar cesta | — | no | `index.html:63` |
| `menu.clear` | Vaciar menú | — | no | `index.html:64` |
| `menu.remove` | Quitar | — | no | `index.html:267` |
| `menu.noRecipe` | sin receta | — | no | `ui/menu.js:37,43` |
| `menu.typeDish` | Escribe el nombre de un plato. | — | no | `ui/menu.js:88` |
| `menu.addDish` | Añadir «{name}» sin receta | `name` | no | `ui/menu.js:93` |
| `menu.toRecipe` | Crear receta | — | no | `ui/recipes.js:145`; `index.html:266` |
| `menu.search` | Busca una receta o escribe un plato | — | no | `index.html:261` |

### toast.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `toast.menuFilled` | Menú: {summary}. | `summary` | no | `ui/menu.js:58` |
| `toast.menuNothing` | Menú: todo estaba ya en la lista. | — | no | `ui/menu.js:61` |
| `toast.menuCleared` | Menú vaciado. | — | no | `ui/menu.js:138` |
| `toast.mealCleared` | Quitada del menú: «{name}». | `name` | no | `ui/menu.js:156` |
| `toast.recipeCreated` | Receta creada: «{name}». | `name` | no | `ui/recipes.js:131` |
| `toast.undo` | Deshacer | — | no | `index.html:35` |
| `toast.finished` | Compra terminada. | — | no | `ui/list.js:18` |
| `toast.deleted` | "{name}" eliminado. | `name` | no | `ui/edit.js:90`; `ui/rows.js:36` |
| `toast.bought` | "{name}" comprado. | `name` | no | `ui/rows.js:67` |
| `toast.recipeBought` | «{name}»: {count} producto comprado. / «{name}»: {count} productos comprados. | `name`, `count` | yes | `ui/list.js:58` |
| `toast.order` | Orden cambiado. | — | no | `ui/drag.js:86` |
| `toast.orderCustom` | Orden cambiado a «Personalizado». | — | no | `ui/drag.js:86` |
| `toast.sent` | «{name}»: {summary}. | `name`, `summary` | no | `ui/recipes.js:18` |
| `toast.sentNothing` | «{name}»: todo estaba ya en la lista. | `name` | no | `ui/recipes.js:21` |
| `toast.productRemoved` | "{product}" quitado de «{name}». | `product`, `name` | no | `ui/recipes.js:33` |
| `toast.aisleDeleted` | Sección "{name}" eliminada. | `name` | no | `ui/aisles.js:37` |
| `toast.linkSaved` | Enlace guardado. | — | no | `ui/recipes.js:222` |
| `toast.linkRemoved` | Enlace quitado. | — | no | `ui/recipes.js:222` |
| `toast.recipeDeleted` | Receta «{name}» eliminada. | `name` | no | `ui/recipes.js:98,203` |
| `toast.existsNowIn` | "{name}" ya existe. Ahora está en {list}. | `name`, `list` | no | `ui/add.js:84` |
| `toast.addedTo` | "{name}" añadido a {list}. | `name`, `list` | no | `ui/add.js:128` |
| `toast.sampleDeleted` | Receta de ejemplo borrada. | — | no | `ui/settings.js:168` |
| `toast.imported` | Copia importada. | — | no | `ui/settings.js:224` |
| `toast.arrival` | {count} artículo por comprar en {list}. / {count} artículos por comprar en {list}. | `count`, `list` | yes | `store.js:224` |

### app.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `app.title` | Bodega - Lista de la compra | — | no | `ui/settings.js:112,115` |
| `app.description` | Lista de la compra que se prepara sola para la próxima vez | — | no | `ui/settings.js:115` |

### count.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `count.items` | {count} artículo / {count} artículos | `count` | yes | `ui/settings.js:220` |
| `count.recipes` | {count} receta / {count} recetas | `count` | yes | `ui/list.js:116`; `ui/settings.js:221` |
| `count.products` | {count} producto / {count} productos | `count` | yes | `ui/recipes.js:110` |
| `count.menuMeals` | En {count} comida del menú / En {count} comidas del menú | `count` | yes | `ui/recipes.js:143` |
| `count.bought` | Comprados ({count}) / Comprados ({count}) | `count` | yes | `ui/rows.js:256` |
| `count.ticked` | {done} de {count} | `done`, `count` | no | `ui/list.js:27` |

### row.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `row.delete` | Eliminar {name} | `name` | no | `ui/recipes.js:102`; `ui/rows.js:39` |
| `row.createRecipe` | Crear la receta de «{name}» | `name` | no | `ui/recipes.js:139` |
| `row.edit` | Editar | — | no | `ui/rows.js:26,50,51` |
| `row.repeat` | Repetir | — | no | `ui/rows.js:29` |
| `row.noRepeat` | No repetir | — | no | `ui/rows.js:29` |
| `row.repeats` | ↻ cada compra | — | no | `ui/rows.js:20` |
| `row.alsoIn` | También en {recipes} | `recipes` | no | `ui/rows.js:19` |

### edit.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `edit.title` | Editar | — | no | `ui/edit.js:37` |
| `edit.done` | Listo | — | no | `index.html:187,203,236,245,259,277,302,319` |
| `edit.name` | Nombre | — | no | `index.html:279,321` |
| `edit.quantity` | Cantidad | — | no | `index.html:280` |
| `edit.repeat` | Repetir en cada compra | — | no | `index.html:281` |
| `edit.shops` | Tiendas | — | no | `index.html:282` |
| `edit.aisle` | Sección | — | no | `index.html:290` |
| `edit.noAisles` | Crea las secciones en Ajustes. | — | no | `index.html:292` |

### group.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `group.others` | Otros | — | no | `ui/list.js:80` |
| `group.noShop` | Sin tienda | — | no | `ui/list.js:36,244` |
| `group.noAisle` | Sin sección | — | no | `ui/list.js:48` |

### empty.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `empty.activeTitle` | Aún no hay artículos | — | no | `sections.js:77,78` |
| `empty.active` | Añade lo que necesitas comprar y márcalo en la tienda. | — | no | `sections.js:78` |
| `empty.sample` | Añade tu primer artículo, o empieza con la receta «{recipe}». | `recipe` | no | `sections.js:77` |
| `empty.addSample` | Añadir la receta de ejemplo | — | no | `ui/list.js:125` |
| `empty.addItem` | + Añadir artículo | — | no | `ui/list.js:125` |
| `empty.recipes` | Guarda una receta y envía sus productos a Compra con un toque. | — | no | `sections.js:73` |
| `empty.recipesTitle` | Aún no hay recetas | — | no | `sections.js:73` |
| `empty.createRecipe` | + Crear receta | — | no | `ui/list.js:125` |
| `empty.addQuery` | + Añadir «{query}» | `query` | no | `ui/list.js:125` |
| `empty.noMatch` | Ninguna receta coincide con «{query}». | `query` | no | `sections.js:72`; `ui/menu.js:88` |
| `empty.noItemMatch` | Ningún artículo coincide con «{query}». | `query` | no | `sections.js:76` |

### finish.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `finish.question` | ¿Has terminado? | — | no | `index.html:69` |
| `finish.button` | Terminar compra | — | no | `index.html:71,249` |

### trip.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `trip.menu` | Opciones de la compra | — | no | `index.html:27,243` |
| `trip.discard` | Descartar | — | no | `index.html:112` |
| `trip.postpone` | Aplazar | — | no | `index.html:113` |
| `trip.hint` | Puedes cambiar qué pasa con lo no comprado en | — | no | `index.html:248` |
| `trip.question` | ¿Terminar la compra? | — | no | `index.html:245` |
| `trip.continue` | Seguir comprando | — | no | `index.html:250` |

### outcome.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `outcome.recurrent` | {count} con ↻ vuelve / {count} con ↻ vuelven | `count` | yes | run time: `ui/list.js:94` (`outcome.${key}`) |
| `outcome.kept` | {count} sin comprar se aplaza / {count} sin comprar se aplazan | `count` | yes | run time: `ui/list.js:94` (`outcome.${key}`) |
| `outcome.open` | {count} sin comprar se guarda / {count} sin comprar se guardan | `count` | yes | run time: `ui/list.js:94` (`outcome.${key}`) |
| `outcome.bought` | {count} comprado sale de la lista / {count} comprados salen de la lista | `count` | yes | run time: `ui/list.js:94` (`outcome.${key}`) |

### recipes.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `recipes.search` | Buscar receta o producto | — | no | `ui/list.js:162` |
| `recipes.dishes` | Platos sin receta | — | no | `ui/list.js:179` |

### search.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `search.label` | Buscar en la lista | — | no | `index.html:21,150` |
| `search.items` | Buscar artículo o tienda | — | no | `ui/list.js:162` |
| `search.clear` | Borrar la búsqueda | — | no | `index.html:156` |
| `search.cancel` | Cancelar | — | no | `index.html:158` |

### dock.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `dock.previous` | Tienda anterior | — | no | `index.html:143` |
| `dock.next` | Tienda siguiente | — | no | `index.html:147` |

### recipe.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `recipe.openLink` | Abrir el enlace de {name} | `name` | no | `ui/recipes.js:187,188` |
| `recipe.inList` | Todo está en Compra | — | no | **none** (dead key) |
| `recipe.send` | Añadir a Compra | — | no | `ui/recipes.js:86,87` |
| `recipe.inListShort` | en la lista | — | no | `ui/recipes.js:111` |
| `recipe.hasLink` | con enlace | — | no | `ui/recipes.js:112` |
| `recipe.products` | Productos | — | no | `index.html:323` |
| `recipe.link` | Enlace | — | no | `index.html:322` |
| `recipe.addProduct` | Añadir producto | — | no | `ui/recipes.js:50` |
| `recipe.addProductTo` | Añadir producto a {name} | `name` | no | `ui/recipes.js:54` |
| `recipe.removeProduct` | Quitar {name} | `name` | no | `ui/recipes.js:37` |

### sheet.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `sheet.delete` | Eliminar | — | no | `ui/recipes.js:95`; `ui/rows.js:35`; `index.html:294,326` |
| `sheet.saved` | Guardado | — | no | `index.html:294,326` |

### send.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `send.added` | {count} añadido / {count} añadidos | `count` | yes | `ui/recipes.js:10` |
| `send.already` | {count} ya estaba / {count} ya estaban | `count` | yes | `ui/recipes.js:11` |

### add.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `add.item` | Añadir artículo | — | no | `app.js:118`; `ui/add.js:22`; `ui/settings.js:107` |
| `add.itemLabel` | Añadir artículo a la lista | — | no | `ui/add.js:17` |
| `add.recipe` | Crear receta | — | no | `app.js:118`; `ui/add.js:22` |
| `add.recipeName` | Nombre de la receta | — | no | `ui/add.js:17` |
| `add.submit` | Añadir | — | no | `ui/add.js:19`; `ui/recipes.js:74` |
| `add.create` | Crear | — | no | `ui/add.js:19` |
| `add.createNamed` | + Crear «{name}» | `name` | no | `ui/add.js:33` |
| `add.existing` | Artículos que ya existen | — | no | `ui/recipes.js:56`; `index.html:189` |
| `add.duplicate` | «{name}» ya está en la lista | `name` | no | `ui/add.js:75,76` |

### where.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `where.boughtRepeat` | ya comprado · repetir | — | no | `ui/add.js:10` |
| `where.inList` | ya en la lista | — | no | `ui/add.js:10` |
| `where.saved` | comprado antes · añadir | — | no | `ui/add.js:9` |

### arrange.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `arrange.label` | Agrupar y ordenar | — | no | `index.html:24,201,203` |
| `arrange.groupBy` | Agrupar por | — | no | `index.html:206` |
| `arrange.none` | Nada | — | no | `index.html:211` |
| `arrange.shops` | Tiendas | — | no | `index.html:209` |
| `arrange.aisles` | Secciones | — | no | `index.html:210` |
| `arrange.sortBy` | Ordenar por | — | no | `index.html:215` |
| `arrange.name` | Nombre | — | no | `index.html:217` |
| `arrange.custom` | Personalizado | — | no | `index.html:218` |
| `arrange.show` | Mostrar | — | no | `index.html:224` |
| `arrange.hide` | Ocultar | — | no | `index.html:225` |

### shops.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `shops.add` | Añadir | — | no | `index.html:287,309` |
| `shops.placeholder` | Nueva tienda | — | no | `index.html:286` |
| `shops.empty` | Escribe la primera tienda. | — | no | `index.html:284` |
| `shops.all` | Todas | — | no | `ui/list.js:244` |
| `shops.lists` | Listas por tienda | — | no | `index.html:39,222,234,236` |
| `shops.done` | {shop}: todo comprado | `shop` | no | `ui/list.js:199` |
| `shops.next` | Siguiente: {shop} ({count}) → | `shop`, `count` | no | `ui/list.js:201` |
| `shops.seeAll` | Ver todas las tiendas | — | no | `index.html:44` |

### onboarding.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `onboarding.label` | Introducción | — | no | `index.html:330` |
| `onboarding.skip` | Saltar | — | no | `index.html:333` |
| `onboarding.back` | Atrás | — | no | `index.html:332` |
| `onboarding.next` | Siguiente | — | no | `ui/onboarding.js:53` |
| `onboarding.start` | Empezar | — | no | `ui/onboarding.js:53` |
| `onboarding.page` | Página {page} de {total} | `page`, `total` | no | `ui/onboarding.js:49` |
| `onboarding.lists.title` | Tu próxima compra, casi hecha | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.lists.text` | En `{active}` llevas la compra de hoy.\nLo que no compras hoy se queda en la lista para la próxima. | `active` | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.trip.title` | Marca lo de siempre | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.trip.text` | Desliza `←` y toca Repetir en lo que compras siempre. Al pulsar Terminar compra, vuelve a la lista sin marcar, con lo que no compraste. | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.row.title` | Desliza una fila | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.row.text` | Tócalo o desliza `→` para marcarlo como comprado.\nDesliza `←` para editarlo, repetirlo o eliminarlo. | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.sections.title` | Desliza la pantalla | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.sections.text` | Desliza a los lados o usa la barra inferior para navegar entre secciones. Con `+` añades lo que necesites. | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.recipes.title` | ¿Qué comemos esta semana? | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.recipes.text` | Apunta tus recetas una vez y envía sus ingredientes a `{active}` con `#cart-add`.\nEn `#menu Menú` organizas la semana y llenas la cesta de golpe. | `active` | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.icon.cart-add` | Enviar a la lista | — | no | run time: `ui/onboarding.js:15` (`onboarding.icon.${name}`) |
| `onboarding.sample.title` | Una receta para empezar | — | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.sample.text` | Añadimos «{name}» y sus ingredientes a `{active}` para que veas cómo funciona.\nPuedes borrarla en `Ajustes`. | `name`, `active` | no | run time: `ui/onboarding.js:44,46` (`onboarding.${page}.title|text`) |
| `onboarding.sample.switch` | Añadir la receta de ejemplo | — | no | `index.html:404` |

### settings.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `settings.backup` | Copia de seguridad | — | no | `index.html:75` |
| `settings.export` | Exportar | — | no | `index.html:77` |
| `settings.import` | Importar | — | no | `index.html:78` |
| `settings.language` | Idioma | — | no | `index.html:84,87` |
| `settings.automatic` | Automático | — | no | `ui/settings.js:128,135` |
| `settings.hand` | Mano | — | no | `index.html:90,93` |
| `settings.handRight` | Derecha | — | no | `ui/settings.js:132` |
| `settings.handLeft` | Izquierda | — | no | `ui/settings.js:132` |
| `settings.theme` | Tema | — | no | `index.html:96,99` |
| `settings.themeLight` | Claro | — | no | `ui/settings.js:136` |
| `settings.themeDark` | Oscuro | — | no | `ui/settings.js:137` |
| `settings.density` | Densidad | — | no | `index.html:102,105` |
| `settings.densityNormal` | Normal | — | no | `ui/settings.js:140` |
| `settings.densityCompact` | Compacta | — | no | `ui/settings.js:140` |
| `settings.tripEnd` | Al terminar la compra | — | no | `index.html:108,111` |
| `settings.tripEndHint` | Selecciona qué ocurre con los artículos no comprados: descartarlos o aplazarlos a la próxima compra. | — | no | `index.html:109` |
| `settings.deleteSample` | Borrar la receta de ejemplo | — | no | `index.html:129` |
| `settings.reset` | Borrar todos los datos | — | no | `index.html:79` |
| `settings.app` | Aplicación | — | no | `index.html:121` |
| `settings.aisles` | Secciones | — | no | `index.html:116` |
| `settings.install` | Instalar la aplicación | — | no | `index.html:123` |
| `settings.help` | Ayuda | — | no | `index.html:126` |
| `settings.onboarding` | Ver la introducción | — | no | `index.html:128` |
| `settings.preferences` | Preferencias | — | no | `index.html:81` |
| `settings.updateReady` | Tienes la {version}. | `version` | no | `ui/settings.js:64` |
| `settings.update` | Actualizar | — | no | `index.html:134` |

### sample.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `sample.name` | Pasta con salsa de tomate | — | no | `ui/onboarding.js:23,45`; run time: `ui/onboarding.js:23` (`sample.${key}`) |
| `sample.tomatoSauce` | Salsa de tomate | — | no | run time: `ui/onboarding.js:23` (`sample.${key}`) |
| `sample.pasta` | Pasta | — | no | run time: `ui/onboarding.js:23` (`sample.${key}`) |
| `sample.garlic` | Ajo | — | no | run time: `ui/onboarding.js:23` (`sample.${key}`) |
| `sample.oliveOil` | Aceite de oliva | — | no | run time: `ui/onboarding.js:23` (`sample.${key}`) |
| `sample.salt` | Sal | — | no | run time: `ui/onboarding.js:23` (`sample.${key}`) |

### reset.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `reset.confirm` | ¿Borrar todos los datos? Se borran las listas, las recetas, el menú, las secciones y las preferencias. Exporta una copia antes si quieres conservarlos. | — | no | `ui/settings.js:173` |

### aisles.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `aisles.title` | Secciones de la tienda | — | no | `index.html:118,300,302` |
| `aisles.empty` | Añade las secciones en el orden de tu tienda. | — | no | `index.html:304` |
| `aisles.usual` | Usar secciones habituales | — | no | `index.html:305` |
| `aisles.placeholder` | Nueva sección | — | no | `index.html:308` |
| `aisles.name` | Nombre de {name} | `name` | no | `ui/aisles.js:47` |
| `aisles.up` | Subir {name} | `name` | no | `ui/aisles.js:48` |
| `aisles.down` | Bajar {name} | `name` | no | `ui/aisles.js:49` |
| `aisles.delete` | Eliminar {name} | `name` | no | `ui/aisles.js:50` |
| `aisles.usual.produce` | Fruta y verdura | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |
| `aisles.usual.bakery` | Panadería | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |
| `aisles.usual.meat` | Carne y pescado | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |
| `aisles.usual.dairy` | Lácteos y huevos | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |
| `aisles.usual.pantry` | Despensa | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |
| `aisles.usual.drinks` | Bebidas | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |
| `aisles.usual.frozen` | Congelados | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |
| `aisles.usual.cleaning` | Limpieza e higiene | — | no | run time: `ui/aisles.js:86` (`aisles.usual.${key}`) |

### version.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `version.running` | Versión {version} · {date} | `version`, `date` | no | `ui/settings.js:53` |
| `version.none` | Versión desconocida | — | no | `ui/settings.js:53` |
| `version.checking` | Comprobando… | — | no | `ui/settings.js:55` |
| `version.available` | Versión {version} disponible | `version` | no | `ui/settings.js:56,63` |
| `version.current` | Al día | — | no | `ui/settings.js:46` |
| `version.unknown` | Sin conexión | — | no | `ui/settings.js:46` |

### import.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `import.confirm` | ¿Sustituir los datos actuales por los de la copia ({items} y {recipes})? | `items`, `recipes` | no | `ui/settings.js:223` |

### error.*

| Key | Spanish text | Parameters | Plural | Used by |
|---|---|---|---|---|
| `error.notSaved` | El cambio no se ha guardado: el almacenamiento no está disponible. | — | no | `ui/context.js:221` |
| `error.noStorage` | El almacenamiento no está disponible: los cambios no se guardan. | — | no | `app.js:306` |
| `error.updateFailed` | No se pudo actualizar. | — | no | `ui/settings.js:208` |
| `error.resetFailed` | No se pudieron borrar los datos. | — | no | `ui/settings.js:175` |
| `error.nameRequired` | Escribe un nombre. | — | no | `menu.js:36`; `recipes.js:15`; `store.js:24` |
| `error.duplicateItem` | "{name}" ya está en {list}. | `name`, `list` | no | `store.js:27` |
| `error.itemNotFound` | Artículo no encontrado. | — | no | `aisles.js:69`; `shops.js:33,42`; `store.js:40,49,56,62,68,114,186` |
| `error.onlyActiveTick` | Solo se pueden marcar los artículos de {list}. | `list` | no | `store.js:63` |
| `error.nothingToStart` | Nada que terminar: marca un artículo o añade uno. | — | no | `store.js:88` |
| `error.unknownSort` | Orden desconocido. | — | no | `store.js:101` |
| `error.unknownGroup` | Agrupación desconocida. | — | no | `store.js:104` |
| `error.invalidOrder` | Orden no válido. | — | no | `store.js:112` |
| `error.recipeNotFound` | Receta no encontrada. | — | no | `menu.js:28`; `recipes.js:3` |
| `error.duplicateRecipe` | La receta "{name}" ya existe. | `name` | no | `recipes.js:18` |
| `error.invalidLink` | El enlace no es una dirección web válida. | — | no | `recipes.js:68` |
| `error.productRequired` | Escribe un producto. | — | no | `recipes.js:75` |
| `error.duplicateProduct` | "{name}" ya está en la receta. | `name` | no | `recipes.js:78` |
| `error.productNotFound` | Producto no encontrado. | — | no | `recipes.js:85` |
| `error.shopRequired` | Escribe el nombre de la tienda. | — | no | `shops.js:35` |
| `error.aisleRequired` | Escribe el nombre de la sección. | — | no | `aisles.js:25` |
| `error.duplicateAisle` | La sección "{name}" ya existe. | `name` | no | `aisles.js:27` |
| `error.aisleNotFound` | La sección ya no existe. | — | no | `aisles.js:39,50,57,72` |
| `error.recipeEmpty` | La receta no tiene productos. | — | no | `recipes.js:95` |
| `error.menuEmpty` | El menú está vacío. Pon una receta o un plato en una comida. | — | no | `menu.js:89` |
| `error.menuNoProducts` | Ningún plato del menú tiene productos. | — | no | `menu.js:92` |
| `error.dishNotFound` | Esta comida no tiene un plato sin receta. | — | no | `menu.js:45` |
| `error.unknownMeal` | Comida desconocida. | — | no | `menu.js:27,34` |
| `error.invalidJson` | El archivo no es un JSON válido. | — | no | `storage.js:216` |
| `error.notBackup` | El archivo no es una copia de seguridad de la lista. | — | no | `storage.js:218` |


## Manifest text

`manifest.webmanifest` (Spanish): `name` `Bodega - Lista de la compra`, `short_name` `Bodega`,
`description` `Lista de la compra que se prepara sola para la próxima vez`, `lang` `es`, and the
shortcut names `Añadir artículo`, `Compra`, `Recetas`, `Menú`.

Per-language manifest (`localizeManifest`, `sw.js:64-87`; SW-13): the page sends, and the worker puts
in place, `lang` = the resolved code, `name` = `app.title`, `description` = `app.description`, and each
shortcut name by its `open` value: `add` → `add.item`, `active` → `list.active`, `recipes` →
`nav.recipes`, `menu` → `nav.menu`. `short_name` stays `Bodega`. Under the pseudo-locale the page sends
the pseudo texts, with the real `lang`.

| `lang` | `name` (`app.title`) | `description` (`app.description`) | `add` | `active` | `recipes` | `menu` |
|---|---|---|---|---|---|---|
| `ca` | Bodega - Llista de la compra | Llista de la compra que es prepara sola per a la pròxima vegada | Afegeix article | Compra | Receptes | Menú |
| `de` | Bodega - Einkaufsliste | Einkaufsliste, die sich selbst für den nächsten Einkauf vorbereitet | Artikel hinzufügen | Einkauf | Rezepte | Menü |
| `en` | Bodega - Shopping list | Shopping list that gets itself ready for the next trip | Add item | Shopping | Recipes | Menu |
| `es` | Bodega - Lista de la compra | Lista de la compra que se prepara sola para la próxima vez | Añadir artículo | Compra | Recetas | Menú |
| `fr` | Bodega - Liste de courses | Liste de courses qui se prépare seule pour la prochaine fois | Ajouter un article | Courses | Recettes | Menu |
| `it` | Bodega - Lista della spesa | Lista della spesa che si prepara da sola per la prossima volta | Aggiungi articolo | Spesa | Ricette | Menù |
| `pt` | Bodega - Lista de compras | Lista de compras que se prepara sozinha para a próxima vez | Adicionar artigo | Compras | Receitas | Menu |

Android: `android:label` = `@string/app_name` (`Bodega`, `translatable="false"`); the shortcut labels
are `@string/add_item`, `@string/list_active`, `@string/nav_recipes`, `@string/nav_menu`. `app.title`
and `app.description` have no Android use apart from the Play listing (keep them for parity).

## Map to Android resources

**Files.** One `res/values-<lang>/strings.xml` per language: `values-ca`, `values-de`, `values-es`,
`values-fr`, `values-it`, `values-pt`. English goes in `res/values/strings.xml` (default = fallback,
LANG-11) and may also be copied to `values-en`. `res/xml/locales_config.xml` lists `ca`, `de`, `en`,
`es`, `fr`, `it`, `pt-PT`; the manifest points to it with `android:localeConfig` (Android 13+ per-app
language). Set `resourceConfigurations` (AGP `androidResources.localeFilters`) to the seven, so that
library strings of other languages do not ship.

**Names.** Resource name = the key with `.` and `-` replaced by `_`: `header.menuMeals` →
`header_menuMeals`, `onboarding.icon.cart-add` → `onboarding_icon_cart_add`. No two keys collide
(checked over all 257 keys). The run-time keys of the table above become a `when` over the closed
value set, or an array resource (`<string-array>` is not possible for plurals; use a `when`).

**Texts.** `<string name="…">`. Escape in XML: a straight `'` → `\'` (in `ca` `outcome.kept`,
`sample.oliveOil` of `ca`, `fr`, `it`); `"` → `\"` (10 `es` keys: `toast.deleted`, `toast.bought`,
`toast.productRemoved`, `toast.aisleDeleted`, `toast.existsNowIn`, `toast.addedTo`,
`error.duplicateItem`, `error.duplicateRecipe`, `error.duplicateProduct`, `error.duplicateAisle`);
`&` and `<` as entities; `\n` stays `\n`. No text starts with `@` or `?`, and no text holds `%`, so no
other escape is needed. The typographic `’` of `fr` and `ca` needs no escape.

**Placeholders.** `{name}` → a positional argument `%n$s`, or `%n$d` for a number (`count`, `done`,
`page`, `total`). Position = order of first appearance in the Spanish text; every language uses the
same position for the same name, whatever its word order. A key with one parameter uses `%1$s` /
`%1$d`. Keys with two parameters:

| Key | Map |
|---|---|
| `menu.title` | `{meal}` → `%1$s`, `{day}` → `%2$s` |
| `header.bought` | `{done}` → `%1$d`, `{count}` → `%2$d` |
| `count.ticked` | `{done}` → `%1$d`, `{count}` → `%2$d` |
| `shops.next` | `{shop}` → `%1$s`, `{count}` → `%2$d` |
| `onboarding.page` | `{page}` → `%1$d`, `{total}` → `%2$d` |
| `onboarding.sample.text` | `{name}` → `%1$s`, `{active}` → `%2$s` |
| `version.running` | `{version}` → `%1$s`, `{date}` → `%2$s` |
| `import.confirm` | `{items}` → `%1$s`, `{recipes}` → `%2$s` |
| `toast.recipeBought` | `{name}` → `%1$s`, `{count}` → `%2$d` |
| `toast.sent` | `{name}` → `%1$s`, `{summary}` → `%2$s` |
| `toast.productRemoved` | `{product}` → `%1$s`, `{name}` → `%2$s` |
| `toast.existsNowIn` | `{name}` → `%1$s`, `{list}` → `%2$s` |
| `toast.addedTo` | `{name}` → `%1$s`, `{list}` → `%2$s` |
| `toast.arrival` | `{count}` → `%1$d`, `{list}` → `%2$s` |
| `error.duplicateItem` | `{name}` → `%1$s`, `{list}` → `%2$s` |

`{summary}` (`toast.sent`, `toast.menuFilled`) is a text the screen builds from `send.added` and
`send.already`, joined by a fixed `, ` that is in no catalog (`src/ui/recipes.js:8-13`; also the fixed
` · ` of `src/ui/menu.js:37`); `{items}` and `{recipes}` of `import.confirm` are the texts of `count.items` and
`count.recipes`; `{list}` is the text of `list.<id>`; `{date}` is the formatted date (VER-4); `{meal}`
is the text of `meal.<meal>`. All are `%n$s`. The text `{name}` of a user name goes in as typed
(LANG-9): `String.format` does not read `%` in an argument. Mark each `{name}` placeholder with
`<xliff:g id="name">%1$s</xliff:g>` for translators.

**Plurals.** `<plurals name="…">` with `<item quantity="one">` and `<item quantity="other">`, called
as `getQuantityString(id, count, …args)` / `pluralStringResource(id, count, …args)`. The quantity
is `count`; in `header.bought` it is the total (`{count}`), not `{done}`. The 16 plural keys:
`header.menuMeals`, `header.left`, `header.bought`, `count.items`, `count.recipes`, `count.products`,
`count.menuMeals`, `count.bought` (one = other), `outcome.recurrent`, `outcome.kept`, `outcome.open`,
`outcome.bought`, `send.added`, `send.already`, `toast.recipeBought`, `toast.arrival`.

CLDR plural categories of the seven languages (Android uses ICU, the same CLDR data as `Intl`):

| Language | Categories | 0 | 1 | 2 | 1 000 000 |
|---|---|---|---|---|---|
| `ca` | one, many, other | other | one | other | many |
| `de` | one, other | other | one | other | other |
| `en` | one, other | other | one | other | other |
| `es` | one, many, other | other | one | other | many |
| `fr` | one, many, other | **one** | one | other | many |
| `it` | one, many, other | other | one | other | many |
| `pt-PT` | one, many, other | other | one | other | many |
| `pt` (Brazil) | one, many, other | **one** | one | other | many |

- No language needs a quantity beyond `one` and `other` for a parity result: `many` applies only
  to exact multiples of 1 000 000, and Android, like the web code (LANG-19), falls back to `other`
  when a quantity has no item. Lint `MissingQuantity` may still ask for `many` (Q-platform-2).
- French: 0 takes `one` on both platforms (`0 article`), so no change.
- Portuguese: the app locale must be `pt-PT`. With a bare `pt` locale, ICU takes the Brazilian rule
  and 0 takes `one` (`0 produto`), which breaks `tests/i18n.test.js` "Portuguese uses the European
  plural rule: zero is plural".
- `zero`, `two` and `few` are never used: no language of the seven has them.

**Attributes.** `data-i18n-attr` uses only `aria-label` (24) and `placeholder` (3, plus 7 pairs that
set both from one key). `aria-label` → `contentDescription` / `Modifier.semantics`; `placeholder` →
the `placeholder` of a `TextField`. `title` (the tooltip of the version status) → the
`contentDescription` of the icon.

**Language choice.** **Ajustes → Idioma** →
`AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("<tag>"))` with the tag
`ca`, `de`, `en`, `es`, `fr`, `it` or `pt-PT`; **Automático** → `LocaleListCompat.getEmptyLocaleList()`.
Read the current choice with `AppCompatDelegate.getApplicationLocales()` (empty = Automático; the
first tag's language = the code). Below Android 13, add the `AppLocalesMetadataHolderService` with
`autoStoreLocales=true`; the activity must extend `AppCompatActivity`. The change recreates the
activity: keep the UI state (LANG-3). The stored key `shopping.lang` has no Android counterpart; a
migration from the web app is not possible (a different storage).

**Pseudo-locale.** `?lang=pseudo` → Android pseudolocales: `pseudoLocalesEnabled = true` in the debug
build type, then `en-XA` (accented, longer) in the developer options or with
`setApplicationLocales("en-XA")`. It works on the default (English) resources, not on Spanish
(Q-platform-3).

**Parity test.** A JVM test parses each `strings.xml` and checks, against `values-es`: the same names,
the same kind (`string` or `plurals`), the items `one` and `other` of each plural, no empty text, and
the same set of `%n$` positions per text (LANG-7, LANG-8).
