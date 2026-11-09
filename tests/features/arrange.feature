# Agrupar y ordenar, docs/spec/04-arrange.md: the order, the groups and the move of a row.

Feature: Arrange
  Compra shows its items in the custom order or by name, flat or in groups.

  Rule: Order

    @SORT-4 @SORT-5
    Scenario: The order is custom at first: the insertion order, a new item at the end
      Given the list has "Pan"
      And the list has "arroz"
      When I add "Ñame"
      Then the items shown are "Pan, arroz, Ñame"
      And the list is still grouped by recipe in custom order

    @SORT-4
    Scenario: An unknown order is refused
      When I sort by size
      Then the error is "error.unknownSort"
      And the state did not change

    @SORT-6 @LANG-15
    Scenario: Nombre orders with no case and no accent distinction, and keeps items
      Given the list has "nata"
      And the list has "Árbol"
      And the list has "azúcar"
      And the list has "Ñame"
      And the list has "Zumo"
      When I sort by name
      Then the items shown are "Árbol, azúcar, nata, Ñame, Zumo"
      And the order of the items is "nata, Árbol, azúcar, Ñame, Zumo"

    @SORT-7
    Scenario Outline: The items to buy come before the ticked items in the <order> order
      Given the list has items:
        | name  | bought |
        | Carne | yes    |
        | Agua  | no     |
        | Bolsa | yes    |
        | Dátil | no     |
      When I sort by <order>
      Then the items shown are "<shown>"

      Examples:
        | order  | shown                    |
        | custom | Agua, Dátil, Carne, Bolsa |
        | name   | Agua, Dátil, Bolsa, Carne |

    @SORT-8 @GROUP-11
    Scenario: The order applies inside each shop group, and the shops are in name order
      Given the list has items:
        | name  | shops       |
        | Pera  | Lidl        |
        | Atún  | Lidl        |
        | Kiwi  | Aldi        |
      When I sort by name
      Then the shop groups are:
        | group | items      | total |
        | Aldi  | Kiwi       | 1     |
        | Lidl  | Atún, Pera | 2     |

  Rule: Recipe groups

    @GROUP-1
    Scenario Outline: The grouping <group> is a choice
      When I group by <group>
      Then there is no error
      And the list is still grouped by <group> in custom order

      Examples:
        | group  |
        | recipe |
        | shop   |
        | aisle  |
        | none   |

    @GROUP-1
    Scenario: An unknown grouping is refused
      When I group by colour
      Then the error is "error.unknownGroup"
      And the state did not change

    @GROUP-5 @GROUP-6 @GROUP-9
    Scenario: The sent recipes come first in send order, then each other complete recipe, in the order of recipes
      Given the list has items:
        | name    |
        | Huevos  |
        | patata  |
        | Leche   |
        | Arroz   |
        | Cebolla |
      And a recipe "Tortilla" with "huevos, Patata, Aceite"
      And a recipe "Flan" with "Huevos, Leche"
      And a recipe "Batido" with "Leche"
      And a recipe "Paella" with "Arroz, Gambas"
      And the recipe "Tortilla" was sent
      Then the recipe groups are:
        | group    | items          | total |
        | Tortilla | Huevos, patata | 2     |
        | Flan     | Huevos, Leche  | 2     |
        | Batido   | Leche          | 1     |
      And the items in no recipe group are "Arroz, Cebolla"

    @GROUP-6
    Scenario: A sent recipe with no member in Compra does not show
      Given the list has "Arroz"
      And a recipe "Gazpacho" with "Tomate"
      And the recipe "Gazpacho" was sent
      Then the recipe groups are:
        | group | items | total |
      And the items in no recipe group are "Arroz"

    @GROUP-7 @GROUP-8 @GROUP-10
    Scenario: An item of two recipes is in both groups; one tick takes it out of both
      Given the list has items:
        | name   |
        | Huevos |
        | Leche  |
      And a recipe "Flan" with "Huevos, Leche"
      And a recipe "Tortilla" with "Huevos"
      And the recipe "Flan" was sent
      And the recipe "Tortilla" was sent
      When I tick "Huevos"
      Then the recipe groups are:
        | group | items | total |
        | Flan  | Leche | 2     |
      And the items in no recipe group are ""
      And the items shown are "Leche, Huevos"

    @GROUP-8
    Scenario: A member that loses its tick shows its group again
      Given the list has items:
        | name   | bought |
        | Huevos | yes    |
      And a recipe "Tortilla" with "Huevos"
      And the recipe "Tortilla" was sent
      When I tick "Huevos"
      Then the recipe groups are:
        | group    | items  | total |
        | Tortilla | Huevos | 1     |

    @GROUP-21
    Scenario: A slide of the head of a recipe ticks each member still to buy
      Given the list has items:
        | name   | bought | shops |
        | Huevos | no     | Lidl  |
        | Patata | no     | Aldi  |
        | Aceite | yes    |       |
        | Pan    | no     |       |
      And a recipe "Tortilla" with "Huevos, Patata, Aceite"
      When I slide the head of the recipe "Tortilla"
      Then 2 items were ticked
      And the items shown are "Pan, Huevos, Patata, Aceite"

    @GROUP-21
    Scenario: In a shop list the slide ticks only the members of that list
      Given the list has items:
        | name   | shops |
        | Huevos | Lidl  |
        | Patata | Aldi  |
      And a recipe "Tortilla" with "Huevos, Patata"
      When I slide the head of the recipe "Tortilla" in the shop list "Lidl"
      Then 1 item was ticked
      And the items shown are "Patata, Huevos"

    @GROUP-21
    Scenario: A slide with nothing left to buy changes nothing
      Given the list has items:
        | name   | bought |
        | Huevos | yes    |
      And a recipe "Tortilla" with "Huevos"
      When I slide the head of the recipe "Tortilla"
      Then 0 items were ticked
      And the state did not change

  Rule: Shop and aisle groups

    @GROUP-12 @GROUP-13
    Scenario: An item of two shops is in both groups; an item with no shop is in Sin tienda
      Given the list has items:
        | name  | shops      | bought |
        | Leche | Lidl, Aldi | no     |
        | Pan   |            | no     |
        | Sal   | Lidl       | yes    |
      Then the shop groups are:
        | group | items | total |
        | Aldi  | Leche | 1     |
        | Lidl  | Leche | 2     |
      And the items in no shop group are "Pan"

    @GROUP-17 @GROUP-18
    Scenario: The aisle groups follow the walk of the aisles; an empty aisle does not show
      Given the aisles are "Fruta, Panadería, Lácteos, Limpieza"
      And the list has items:
        | name   | aisle     |
        | Yogur  | Lácteos   |
        | Barra  | Panadería |
        | Manzana| Fruta     |
        | Sal    |           |
      Then the aisle groups are:
        | group     | items   | total |
        | Fruta     | Manzana | 1     |
        | Panadería | Barra   | 1     |
        | Lácteos   | Yogur   | 1     |
      And the items in no aisle group are "Sal"

    @GROUP-22
    Scenario Outline: The aisle "<name>" has the icon of the kind <kind>
      Then the kind of the aisle "<name>" is <kind>

      Examples:
        | name                  | kind     |
        | Frutas y verduras     | produce  |
        | Pan                   | bakery   |
        | Pañales               | none     |
        | Carnicería            | meat     |
        | PESCADERÍA            | fish     |
        | Lácteos               | dairy    |
        | Despensa              | pantry   |
        | Bebidas               | drinks   |
        | Congelados            | frozen   |
        | Limpieza e higiene    | cleaning |
        | Zona de pan           | bakery   |
        | Pasillo 4             | none     |

  Rule: Move a row

    @MOVE-8
    Scenario: A release writes the new order: the moved items exchange their places
      Given the list has items:
        | name | bought |
        | A    | no     |
        | B    | yes    |
        | C    | no     |
        | D    | no     |
      When I move "D" to place 1 among "A, C, D"
      Then the order of the items is "D, B, A, C"
      And the input state did not change

    @MOVE-8
    Scenario: A release at the start place writes nothing
      Given the list has items:
        | name |
        | A    |
        | B    |
      When I move "B" to place 2 among "A, B"
      Then the state did not change

    @MOVE-9
    Scenario: A move in the name order starts the custom order from the name order
      Given the list has items:
        | name  |
        | Pera  |
        | Atún  |
        | Kiwi  |
      And the list is grouped by none in name order
      When I move "Pera" to place 1 among "Atún, Kiwi, Pera"
      Then the order of the items is "Pera, Atún, Kiwi"
      And the list is still grouped by none in custom order

    @MOVE-6
    Scenario Outline: A lifted row takes the place of a neighbour when its edge passes its centre
      Given rows of heights "50, 50, 50, 50"
      When row <row> is dragged to the top <top>
      Then it takes place <place>
      And the other rows shift by "<shifts>"

      Examples:
        | row | top | place | shifts             |
        | 1   | 0   | 1     | 0, 0, 0, 0         |
        | 1   | 24  | 1     | 0, 0, 0, 0         |
        | 1   | 26  | 2     | 0, -50, 0, 0       |
        | 1   | 200 | 4     | 0, -50, -50, -50   |
        | 4   | 124 | 3     | 0, 0, 50, 0        |
        | 4   | -40 | 1     | 50, 50, 50, 0      |
