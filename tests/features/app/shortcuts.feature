# The shortcuts of the launcher, the arrival at the shop and the offline shell,
# docs/spec/11-integrations.md and docs/spec/10-offline-version.md.

Feature: Shortcuts, arrival and offline shell

  @SHORT-1 @SHORT-2
  Scenario Outline: A start with ?open=<name> shows <view>, with the add sheet: <add>
    Then a start with the shortcut "<name>" shows <view>, with the add sheet: <add>

    Examples:
      | name    | view    | add  |
      | add     | active  | yes  |
      | active  | active  | no   |
      | recipes | recipes | no   |
      | menu    | menu    | no   |
      | other   | none    | no   |

  @SHORT-1
  Scenario: The shortcuts are add, Compra, Recetas and Menú, in this order
    Then the shortcuts are "add, active, recipes, menu"

  @ARR-1 @ARR-3
  Scenario: An arrival counts the items of Compra that are not ticked; with none it says nothing
    Given the list has items:
      | name  | bought | list  |
      | Pan   | no     |       |
      | Leche | no     |       |
      | Sal   | yes    |       |
      | Pilas | no     | saved |
    Then the arrival says "toast.arrival" with 2 items
    When I tick "Pan"
    And I tick "Leche"
    Then the arrival says nothing

  @SW-13 @SHORT-3 @LANG-16
  Scenario: The worker puts the name, the description and the shortcut names of the language in the manifest
    Given the manifest is:
      """
      {"name": "Lista de la compra - Bodega", "short_name": "Bodega", "description": "Lista", "lang": "es",
       "shortcuts": [{"name": "Añadir artículo", "url": "./?open=add"}, {"name": "Compra", "url": "./?open=active"}]}
      """
    When the worker answers the manifest with the text:
      """
      {"lang": "en", "name": "Shopping list - Bodega", "description": "", "shortcuts": {"add": "Add item", "active": 3}}
      """
    Then the manifest has the name "Shopping list - Bodega", the short name "Bodega", the language "en" and the description "Lista"
    And the manifest shortcuts are "Add item, Compra"

  @SW-4
  Scenario: The activation deletes the old caches of the app, and keeps the current, the manifest and other apps
    Then of the caches "shopping-shell-v1, shopping-shell-v52, shopping-manifest, lists-v3, other" the activation deletes "shopping-shell-v1"

  # The cache key only; SW-6 itself, stale-while-revalidate, is the fetch path of sw.js (exempt.txt).
  Scenario Outline: The cache key of <url> is <key>
    Then the cache key of "<url>" is "<key>"

    Examples:
      | url                                  | key                          |
      | https://a.es/app/?open=add           | https://a.es/app/            |
      | https://a.es/app/src/store.js?v=2    | https://a.es/app/src/store.js |
      | https://a.es/app/index.html          | https://a.es/app/index.html  |
