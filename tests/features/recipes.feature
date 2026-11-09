# Recipes, docs/spec/06-recipes.md. Today is Monday 2026-11-09: this week is "2026-11-09".

Feature: Recipes
  A recipe is a name, a list of product names and an optional link. One send puts its products in Compra.

  Rule: Name and products

    @REC-1 @REC-2 @DATA-4
    Scenario: A new recipe is a trimmed name, with no product and no link
      When I add the recipe "  Tortilla "
      Then there is no error
      And the recipes are:
        | name     | products | link |
        | Tortilla |          |      |

    @REC-2 @DATA-4
    Scenario Outline: The recipe name <name> is refused with <error>
      Given a recipe "Tortilla" with ""
      When I add the recipe <name>
      Then the error is "<error>"
      And the state did not change

      Examples:
        | name        | error                  |
        | ""          | error.nameRequired     |
        | "   "       | error.nameRequired     |
        | "TORTILLA"  | error.duplicateRecipe  |

    @REC-2
    Scenario: A rename has the rules of a new name; a recipe keeps its own name
      Given a recipe "Tortilla" with ""
      And a recipe "Flan" with ""
      When I rename the recipe "Flan" to "tortilla"
      Then the error is "error.duplicateRecipe"
      When I rename the recipe "Flan" to "FLAN"
      Then there is no error
      And the recipes are:
        | name     | products | link |
        | Tortilla |          |      |
        | FLAN     |          |      |

    @REC-8 @DATA-5
    Scenario: A product is trimmed, starts with a capital and keeps the rest as typed
      Given a recipe "Paella" with ""
      When I add the product "  arroz " to "Paella"
      And I add the product "AOVE" to "Paella"
      And I add the product "gambas rojas" to "Paella"
      Then the recipes are:
        | name   | products                   | link |
        | Paella | Arroz, AOVE, Gambas rojas  |      |

    @REC-8 @DATA-5
    Scenario Outline: The product <product> is refused with <error>
      Given a recipe "Paella" with "Arroz"
      When I add the product <product> to "Paella"
      Then the error is "<error>"
      And the state did not change

      Examples:
        | product  | error                   |
        | ""       | error.productRequired   |
        | " "      | error.productRequired   |
        | "ARROZ"  | error.duplicateProduct  |

    @REC-9
    Scenario: The removal of a product takes it off the recipe
      Given a recipe "Paella" with "Arroz, Gambas"
      When I remove the product "Arroz" from "Paella"
      Then the recipes are:
        | name   | products | link |
        | Paella | Gambas   |      |

    @REC-12 @DATA-11
    Scenario: A product is text: it creates no item, and a rename of an item does not change it
      Given the list has "Leche"
      And a recipe "Flan" with "Leche, Huevos"
      When I rename "Leche" to "Leche entera"
      Then the list has 1 item
      And the recipes are:
        | name | products      | link |
        | Flan | Leche, Huevos |      |

    @REC-7
    Scenario: The recipes keep the order of their creation
      Given a recipe "Zarzuela" with ""
      And a recipe "Arroz con leche" with ""
      Then the recipes found for "" are "Zarzuela, Arroz con leche"

    @REC-10
    Scenario: The product field offers the items, then the products of the recipes, less those of the recipe
      Given the list has items:
        | name         |
        | Pan          |
        | Pan rallado  |
        | Empanadilla  |
      And a recipe "Sopa" with "Pan, Panceta"
      And a recipe "Croquetas" with "pan rallado, Bechamel"
      Then the products offered for "Croquetas" by "pan" are "Pan, Panceta, Empanadilla"
      And the products offered for "Sopa" by "PAN" are "Pan rallado, Empanadilla"
      And the products offered for "Sopa" by "" are ""

    @REC-10
    Scenario: The product field offers 5 names at most
      Given the list has items:
        | name   |
        | Sal 1  |
        | Sal 2  |
        | Sal 3  |
        | Sal 4  |
        | Sal 5  |
        | Sal 6  |
      And a recipe "Sopa" with ""
      Then the products offered for "Sopa" by "sal" are "Sal 1, Sal 2, Sal 3, Sal 4, Sal 5"

  Rule: Link

    @REC-13 @REC-14
    Scenario Outline: The link "<typed>" is saved as "<saved>"
      Given a recipe "Tortilla" with ""
      When I set the link of "Tortilla" to "<typed>"
      Then there is no error
      And the link of "Tortilla" is "<saved>"

      Examples:
        | typed                         | saved                           |
        | https://cocina.es/tortilla    | https://cocina.es/tortilla      |
        | cocina.es/tortilla            | https://cocina.es/tortilla      |
        | http://cocina.es              | http://cocina.es                |
        |                               |                                 |

    @REC-14
    Scenario Outline: The link "<typed>" is refused
      Given a recipe "Tortilla" with ""
      When I set the link of "Tortilla" to "<typed>"
      Then the error is "error.invalidLink"
      And the state did not change

      Examples:
        | typed                 |
        | ftp://cocina.es       |
        | javascript:alert(1)   |
        | cocina                |
        | https://coc ina.es    |
        | https://localhost     |

    @REC-13
    Scenario: A text that gives the same address changes nothing
      Given a recipe "Tortilla" with ""
      And the recipe "Tortilla" has the link "https://cocina.es"
      When I set the link of "Tortilla" to " cocina.es "
      Then there is no error
      And the state has the same content as before

    @REC-15
    Scenario Outline: The link of <host> is a <kind>
      Then the link "<url>" shows the host "<host>" as a <kind>

      Examples:
        | url                                  | host            | kind  |
        | https://www.youtube.com/watch?v=x    | youtube.com     | video |
        | https://m.youtube.com/watch?v=x      | m.youtube.com   | video |
        | https://youtu.be/x                   | youtu.be        | video |
        | https://vimeo.com/1                  | vimeo.com       | video |
        | https://www.tiktok.com/@a/video/1    | tiktok.com      | video |
        | https://instagram.com/p/x            | instagram.com   | video |
        | https://dai.ly/x                     | dai.ly          | video |
        | https://fb.watch/x                   | fb.watch        | video |
        | https://www.cocina.es/tortilla       | cocina.es       | page  |
        | https://notyoutube.com/x             | notyoutube.com  | page  |

  Rule: Send

    @REC-17
    Scenario: A recipe with no product cannot be sent
      Given a recipe "Tortilla" with ""
      When I send the recipe "Tortilla"
      Then the error is "error.recipeEmpty"
      And the state did not change

    @REC-18 @REC-19 @REC-20
    Scenario: Each product becomes an item to buy in Compra, with no duplicate
      Given the list has items:
        | name   | list  | bought |
        | huevos | saved | no     |
        | Patata |       | yes    |
        | Aceite |       | no     |
      And a recipe "Tortilla" with "Huevos, Patata, Aceite, Cebolla"
      When I send the recipe "Tortilla"
      Then the send added 3 and found 1
      And the items are:
        | name    | list   | bought | recurrent |
        | huevos  | active | no     | no        |
        | Patata  | active | no     | no        |
        | Aceite  | active | no     | no        |
        | Cebolla | active | no     | no        |
      And the sent recipes are "Tortilla"

    @REC-19 @REC-21
    Scenario: A send that changes nothing adds nothing, and the recipe is in sent one time
      Given the list has "Huevos"
      And a recipe "Tortilla" with "Huevos"
      When I send the recipe "Tortilla"
      And I send the recipe "Tortilla"
      Then the send added 0 and found 1
      And the sent recipes are "Tortilla"
      And the list has 1 item

    @REC-22
    Scenario: sent lasts until Terminar compra
      Given a recipe "Tortilla" with "Huevos"
      When I send the recipe "Tortilla"
      And I tick "Huevos"
      And I finish the trip
      Then the sent recipes are ""

    @REC-42
    Scenario: The pane says how many products a send adds or brings back
      Given the list has items:
        | name   | bought |
        | Huevos | no     |
        | Patata | yes    |
      And a recipe "Tortilla" with "Huevos, Patata, Cebolla"
      And a recipe "Flan" with "Huevos"
      And a recipe "Vacía" with ""
      Then the send of "Tortilla" adds 2
      And the send of "Flan" adds 0
      And the send of "Vacía" adds 0

  Rule: In the list

    @REC-35 @REC-9
    Scenario: A recipe is in the list when all its products are items of Compra, ticked or not
      Given the list has items:
        | name   | list   | bought |
        | Huevos | active | yes    |
        | patata | active | no     |
        | Aceite | saved  | no     |
      And a recipe "Tortilla" with "Huevos, Patata"
      And a recipe "Tortilla con aceite" with "Huevos, Patata, Aceite"
      And a recipe "Vacía" with ""
      Then the recipe "Tortilla" is in the list: yes
      And the recipe "Tortilla con aceite" is in the list: no
      And the recipe "Vacía" is in the list: no
      And the products of "Tortilla con aceite" in the list are "Huevos, Patata"

    @REC-41
    Scenario: The progress counts the products in Compra; sent recipes first, then the others by name
      Given the list has items:
        | name   | list      |
        | Huevos | active    |
        | Leche  | active    |
        | Arroz  | postponed |
        | Azúcar | saved     |
      And a recipe "Tortilla" with "Huevos, Patata"
      And a recipe "Flan" with "Huevos, Leche, Azúcar"
      And a recipe "Arroz con leche" with "Arroz, Leche"
      And a recipe "Paella" with "Arroz"
      And the recipe "Tortilla" was sent
      Then the recipe progress is:
        | recipe          | in list | total |
        | Tortilla        | 1       | 2     |
        | Arroz con leche | 1       | 2     |
        | Flan            | 2       | 3     |

    @REC-40
    Scenario: The filters choose the recipes in the list or with a link, with their counts
      Given the list has "Huevos"
      And a recipe "Tortilla" with "Huevos"
      And a recipe "Flan" with "Leche"
      And the recipe "Flan" has the link "https://cocina.es/flan"
      And a recipe "Sopa" with ""
      Then the recipes with the filter all are "Tortilla, Flan, Sopa"
      And the recipes with the filter inList are "Tortilla"
      And the recipes with the filter link are "Flan"
      And the filter counts are:
        | all | inList | link |
        | 3   | 1      | 1    |

  Rule: Search and dishes

    @REC-24
    Scenario Outline: The search for "<text>" finds "<found>"
      Given a recipe "Tortilla de patatas" with "Huevos, Patata"
      And a recipe "Crème brûlée" with "Nata, Azúcar"
      Then the recipes found for "<text>" are "<found>"

      Examples:
        | text    | found                             |
        | tortill | Tortilla de patatas               |
        | CREME   | Crème brûlée                      |
        | azucar  | Crème brûlée                      |
        | a       | Tortilla de patatas, Crème brûlée |
        |         | Tortilla de patatas, Crème brûlée |

    @REC-36 @REC-24
    Scenario: The dishes of this week show one time each, with the spelling of the first meal
      Given the dinner of Tuesday in the week "2026-11-09" is the dish "Pizza"
      And the lunch of Monday in the week "2026-11-09" is the dish "Sopa de ajo"
      And the lunch of Wednesday in the week "2026-11-09" is the dish "PIZZA"
      And the lunch of Monday in the week "2026-11-02" is the dish "Lentejas"
      Then the dishes of the week "2026-11-09" are:
        | name        | meals |
        | Sopa de ajo | 1     |
        | Pizza       | 2     |
      And the dishes of the week "2026-11-09" found for "pizz" are "Pizza"
      And the dishes of the week "2026-11-16" found for "" are ""

  Rule: Delete

    @REC-6 @DATA-10
    Scenario: A delete removes the recipe, its sent id and its meals from this week on; a past meal keeps its name
      Given a recipe "Tortilla" with "Huevos"
      And a recipe "Flan" with "Leche"
      And the recipe "Tortilla" was sent
      And the lunch of Monday in the week "2026-11-02" is the recipe "Tortilla"
      And the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the lunch of Monday in the week "2026-11-16" is the recipe "Tortilla"
      And the dinner of Monday in the week "2026-11-09" is the recipe "Flan"
      When I send the recipe "Tortilla"
      And I delete the recipe "Tortilla"
      Then the recipes are:
        | name | products | link |
        | Flan | Leche    |      |
      And the sent recipes are ""
      And the menu is:
        | week       | day    | meal   | recipe | dish     |
        | 2026-11-02 | Monday | lunch  |        | Tortilla |
        | 2026-11-09 | Monday | dinner | Flan   |          |
      And the items shown are "Huevos"

    @REC-6 @DATA-10
    Scenario: A past meal of a long name keeps 80 characters of it
      Given a recipe "Guiso de garbanzos con espinacas, bacalao y huevo duro de la abuela de Rosa, receta" with "Garbanzos"
      And the lunch of Monday in the week "2026-11-02" is the recipe "Guiso de garbanzos con espinacas, bacalao y huevo duro de la abuela de Rosa, receta"
      When I delete the recipe "Guiso de garbanzos con espinacas, bacalao y huevo duro de la abuela de Rosa, receta"
      Then the menu is:
        | week       | day    | meal  | recipe | dish                                                                             |
        | 2026-11-02 | Monday | lunch |        | Guiso de garbanzos con espinacas, bacalao y huevo duro de la abuela de Rosa, rec |

  Rule: Sample recipe

    @REC-27
    Scenario: The sample recipe has a fixed id, goes last and has no link
      Given a recipe "Tortilla" with ""
      When I add the sample recipe "Pasta con salsa de tomate" with "Salsa de tomate, Pasta, Ajo, Aceite de oliva, Sal"
      Then the recipes are:
        | id           | name                      | products                                          | link |
        | id-1         | Tortilla                  |                                                   |      |
        | sample-pasta | Pasta con salsa de tomate | Salsa de tomate, Pasta, Ajo, Aceite de oliva, Sal |      |
      And the menu is:
        | week | day | meal | recipe | dish |

    @REC-27
    Scenario: The walkthrough sends the sample to Compra
      When I load the sample recipe "Pasta con salsa de tomate" with "Pasta, Sal"
      Then the items shown are "Pasta, Sal"
      And the sent recipes are "Pasta con salsa de tomate"

    @REC-28
    Scenario Outline: The add of the sample changes nothing when <case>
      Given a recipe "<name>" with ""
      When I add the sample recipe "Pasta con salsa de tomate" with "Pasta"
      And I add the sample recipe "Pasta con salsa de tomate" with "Pasta"
      Then the state did not change

      Examples:
        | case                         | name                      |
        | the sample exists            | Tortilla                  |
        | a recipe has its name        | PASTA CON SALSA DE TOMATE |

  Rule: Recipes of a shared list

    @REC-38
    Scenario: With scope all, Recetas shows the recipes of both lists, each with its list
      Given a recipe "Tortilla" with "Huevos"
      And I am a member of a shared list with scope all
      And the shared list has a recipe "Flan" with "Leche"
      Then the recipes in view are:
        | name     | list   |
        | Tortilla | own    |
        | Flan     | shared |

    @REC-38
    Scenario: With scope list, Recetas shows the own recipes only
      Given a recipe "Tortilla" with "Huevos"
      And I am a member of a shared list with scope list
      And the shared list has a recipe "Flan" with "Leche"
      Then the recipes in view are:
        | name     | list |
        | Tortilla | own  |

    @REC-38
    Scenario: A send of a shared recipe puts its products and its sent in the shared list
      Given I am a member of a shared list with scope all
      And the shared list has a recipe "Flan" with "Leche, Huevos"
      When I send the recipe "Flan" of the shared list
      Then the shared list has the items "Leche, Huevos"
      And the own list has the items ""
      And the shared list has sent "Flan"
      And the recipe "Flan" of the shared list is in the list: yes

    @REC-38
    Scenario: The name rule holds inside each list, and a new recipe goes to the own list
      Given I am a member of a shared list with scope all
      And the shared list has a recipe "Flan" with ""
      When I add the recipe "flan" to the own list
      Then there is no error
      And the recipes in view are:
        | name | list   |
        | flan | own    |
        | Flan | shared |
