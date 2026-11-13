# The menu of the week, docs/spec/13-menu.md. Today is Monday 2026-11-09: this week is "2026-11-09".

Feature: Menu
  The week has 7 days and 2 meals a day. A meal holds a recipe, a dish or nothing.

  Background:
    Given a recipe "Tortilla" with "Huevos, Patata"
    And a recipe "Flan" with "Huevos, Leche"
    And a recipe "Sopa" with ""

  Rule: Weeks

    @MENU-1
    Scenario Outline: The week of <date> is the week of its Monday
      Then the week of "<date>" is "<week>"

      Examples:
        | date       | week       |
        | 2026-11-09 | 2026-11-09 |
        | 2026-11-15 | 2026-11-09 |
        | 2026-11-16 | 2026-11-16 |
        | 2027-01-01 | 2026-12-28 |
        | 2026-03-01 | 2026-02-23 |

    @MENU-1
    Scenario: On Monday a new week starts with no meal
      Given the lunch of Monday in the week "2026-11-02" is the recipe "Tortilla"
      Then the week "2026-11-09" has 0 meals
      And the week "2026-11-02" has 1 meal

    @MENU-1 @MENU-3 @ENG-2
    Scenario Outline: A put in <what> gives error.unknownMeal
      When I put the recipe "Tortilla" in the <meal> of <day> in the week "<week>"
      Then the error is "error.unknownMeal"
      And the state did not change

      Examples:
        | what              | meal   | day      | week       |
        | a week not Monday | lunch  | Monday   | 2026-11-10 |
        | an unknown day    | lunch  | Funday   | 2026-11-09 |
        | an unknown meal   | brunch | Monday   | 2026-11-09 |

    @MENU-25
    Scenario: The days of a week run from its Monday to its Sunday
      Then the days of the week "2026-12-28" run from "2026-12-28" to "2027-01-03"

  Rule: Meals

    @MENU-2 @MENU-3 @DATA-13
    Scenario: A put replaces what the meal had; one recipe can be in two meals
      Given the lunch of Monday in the week "2026-11-09" is the dish "Pizza"
      When I put the recipe "Tortilla" in the lunch of Monday in the week "2026-11-09"
      And I put the recipe "Tortilla" in the dinner of Friday in the week "2026-11-09"
      And I put the dish "  Ensalada " in the lunch of Tuesday in the week "2026-11-09"
      Then the menu is:
        | week       | day     | meal   | recipe   | dish     |
        | 2026-11-09 | Monday  | lunch  | Tortilla |          |
        | 2026-11-09 | Tuesday | lunch  |          | Ensalada |
        | 2026-11-09 | Friday  | dinner | Tortilla |          |

    @MENU-3 @DATA-13 @ENG-2
    Scenario: A recipe that does not exist is refused
      When I put the recipe "Paella" in the lunch of Monday in the week "2026-11-09"
      Then the error is "error.recipeNotFound"
      And the state did not change

    @MENU-3 @ENG-2
    Scenario: A dish with an empty name is refused
      When I put the dish "  " in the lunch of Monday in the week "2026-11-09"
      Then the error is "error.nameRequired"
      And the state did not change

    @MENU-4
    Scenario: A meal can be emptied; Vaciar menú empties the week, and other weeks stay
      Given the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the dinner of Monday in the week "2026-11-09" is the dish "Pizza"
      And the lunch of Monday in the week "2026-11-16" is the recipe "Flan"
      When I empty the dinner of Monday in the week "2026-11-09"
      Then the week "2026-11-09" has 1 meal
      When I empty the menu of the week "2026-11-09"
      Then the menu is:
        | week       | day    | meal  | recipe | dish |
        | 2026-11-16 | Monday | lunch | Flan   |      |

    @MENU-10 @MENU-26
    Scenario: The week counts its meals and its planned slots of 14
      Given the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the dinner of Monday in the week "2026-11-09" is the dish "Pizza"
      And the lunch of Monday in the week "2026-11-16" is the recipe "Flan"
      Then the week "2026-11-09" has 2 meals
      And the week "2026-11-09" has 2 planned slots of 14

    @MENU-4 @MENU-6 @MENU-10 @MENU-26
    Scenario: A meal whose recipe does not exist any more is not planned, and Vaciar menú empties it
      Given the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the dinner of Monday in the week "2026-11-09" is the recipe "Flan"
      And the lunch of Monday in the week "2026-11-16" is the recipe "Tortilla"
      And the lunch of Monday in the week "2026-11-23" is the dish "Pizza"
      When a sync removes the recipe "Tortilla" that another device deleted
      Then the week "2026-11-09" has 1 meal
      And the week "2026-11-09" has 1 planned slot of 14
      And the week "2026-11-16" has 0 meals
      And the week "2026-11-16" has 0 planned slots of 14
      When I fill the basket from the week "2026-11-16"
      Then the error is "error.menuEmpty"
      When I empty the menu of the week "2026-11-09"
      And I empty the menu of the week "2026-11-16"
      Then the menu is:
        | week       | day    | meal  | recipe | dish  |
        | 2026-11-23 | Monday | lunch |        | Pizza |

    @MENU-22
    Scenario: A put drops the meals of the weeks before the last 26
      Given the lunch of Monday in the week "2026-05-11" is the dish "Old"
      And the lunch of Monday in the week "2026-05-18" is the dish "Kept"
      When I put the dish "New" in the lunch of Monday in the week "2026-11-09"
      Then the menu is:
        | week       | day    | meal  | recipe | dish |
        | 2026-05-18 | Monday | lunch |        | Kept |
        | 2026-11-09 | Monday | lunch |        | New  |

  Rule: Llenar cesta

    @MENU-5 @MENU-7 @MENU-8
    Scenario: The fill sends each recipe one time, in the order of its first meal
      Given the list has items:
        | name  | bought |
        | Leche | yes    |
      And the dinner of Tuesday in the week "2026-11-09" is the recipe "Tortilla"
      And the lunch of Monday in the week "2026-11-09" is the recipe "Flan"
      And the lunch of Friday in the week "2026-11-09" is the recipe "Flan"
      And the lunch of Monday in the week "2026-11-16" is the recipe "Sopa"
      When I fill the basket from the week "2026-11-09"
      Then the send added 3 and found 1
      And the items shown are "Leche, Huevos, Patata"
      And the sent recipes are "Flan, Tortilla"
      And the menu is:
        | week       | day     | meal   | recipe   | dish |
        | 2026-11-09 | Monday  | lunch  | Flan     |      |
        | 2026-11-09 | Tuesday | dinner | Tortilla |      |
        | 2026-11-09 | Friday  | lunch  | Flan     |      |
        | 2026-11-16 | Monday  | lunch  | Sopa     |      |

    @MENU-6
    Scenario: A dish and a recipe with no product are skipped
      Given the lunch of Monday in the week "2026-11-09" is the dish "Pizza"
      And the dinner of Monday in the week "2026-11-09" is the recipe "Sopa"
      And the lunch of Tuesday in the week "2026-11-09" is the recipe "Tortilla"
      When I fill the basket from the week "2026-11-09"
      Then the items shown are "Huevos, Patata"

    @MENU-6 @ENG-2
    Scenario: A week with no meal gives error.menuEmpty
      Given the lunch of Monday in the week "2026-11-02" is the recipe "Tortilla"
      When I fill the basket from the week "2026-11-09"
      Then the error is "error.menuEmpty"
      And the state did not change

    @MENU-6 @ENG-2
    Scenario: A week whose meals give no product gives error.menuNoProducts
      Given the lunch of Monday in the week "2026-11-09" is the dish "Pizza"
      And the dinner of Monday in the week "2026-11-09" is the recipe "Sopa"
      When I fill the basket from the week "2026-11-09"
      Then the error is "error.menuNoProducts"
      And the state did not change

    @MENU-15
    Scenario: Terminar compra does not change the menu
      Given the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      When I fill the basket from the week "2026-11-09"
      And I tick "Huevos"
      And I finish the trip
      Then the week "2026-11-09" has 1 meal

    @MENU-21
    Scenario: The card says what Llenar cesta adds, and from how many recipes
      Given the list has items:
        | name   | bought |
        | Huevos | no     |
        | Leche  | yes    |
      And the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the dinner of Monday in the week "2026-11-09" is the recipe "Flan"
      And the lunch of Tuesday in the week "2026-11-09" is the recipe "Sopa"
      Then the basket of the week "2026-11-09" adds "Patata, Leche"
      And the week "2026-11-09" fills from 2 recipes
      And the basket of the week "2026-11-16" adds ""

  Rule: Dishes into recipes

    @MENU-17
    Scenario: A dish turns into a recipe of its name, in each meal of that dish
      Given the lunch of Monday in the week "2026-11-09" is the dish "Pizza"
      And the dinner of Friday in the week "2026-11-09" is the dish "PIZZA"
      And the lunch of Monday in the week "2026-11-16" is the dish "Pizza"
      When I turn the dish "pizza" of the week "2026-11-09" into a recipe
      Then the recipes are:
        | name     | products       | link |
        | Tortilla | Huevos, Patata |      |
        | Flan     | Huevos, Leche  |      |
        | Sopa     |                |      |
        | Pizza    |                |      |
      And the menu is:
        | week       | day    | meal   | recipe | dish  |
        | 2026-11-09 | Monday | lunch  | Pizza  |       |
        | 2026-11-09 | Friday | dinner | Pizza  |       |
        | 2026-11-16 | Monday | lunch  |        | Pizza |

    @MENU-17
    Scenario: A dish with the name of a recipe takes that recipe
      Given the lunch of Monday in the week "2026-11-09" is the dish "flan"
      When I turn the dish "Flan" of the week "2026-11-09" into a recipe
      Then the recipes found for "" are "Tortilla, Flan, Sopa"
      And the menu is:
        | week       | day    | meal  | recipe | dish |
        | 2026-11-09 | Monday | lunch | Flan   |      |

    @MENU-17 @ENG-2
    Scenario: A name that is no dish of the week gives error.dishNotFound
      Given the lunch of Monday in the week "2026-11-16" is the dish "Pizza"
      When I turn the dish "Pizza" of the week "2026-11-09" into a recipe
      Then the error is "error.dishNotFound"
      And the state did not change

  Rule: Other weeks

    @MENU-23
    Scenario Outline: From the week <shown> the week bar steps to <earlier> and <later>
      Given the lunch of Monday in the week "2026-10-05" is the dish "A"
      And the lunch of Monday in the week "2026-10-19" is the dish "B"
      Then from the week "<shown>" the week bar steps to "<earlier>" and "<later>"

      Examples:
        | shown      | earlier    | later      |
        | 2026-11-09 | 2026-10-19 | 2026-11-16 |
        | 2026-10-19 | 2026-10-05 | 2026-11-09 |
        | 2026-10-05 | none       | 2026-10-19 |
        | 2026-11-16 | 2026-11-09 | 2026-11-23 |
        | 2026-12-07 | 2026-11-30 | none       |

    @MENU-24
    Scenario: Repetir esta semana puts the meals of a past week in place of all the meals of this week
      Given the lunch of Monday in the week "2026-11-02" is the recipe "Tortilla"
      And the dinner of Friday in the week "2026-11-02" is the dish "Pizza"
      And the lunch of Tuesday in the week "2026-11-09" is the recipe "Flan"
      When I repeat the week "2026-11-02" into "2026-11-09"
      Then the repeat copied 2 meals
      And the menu is:
        | week       | day    | meal   | recipe   | dish  |
        | 2026-11-02 | Monday | lunch  | Tortilla |       |
        | 2026-11-02 | Friday | dinner |          | Pizza |
        | 2026-11-09 | Monday | lunch  | Tortilla |       |
        | 2026-11-09 | Friday | dinner |          | Pizza |

    @MENU-24 @ENG-2
    Scenario: A week with no meal cannot be repeated
      When I repeat the week "2026-11-02" into "2026-11-09"
      Then the error is "error.menuEmpty"
      And the state did not change

    @MENU-27
    Scenario: Semanas anteriores lists the 3 latest past weeks with a meal, newest first
      Given the lunch of Monday in the week "2026-10-05" is the dish "A"
      And the lunch of Monday in the week "2026-10-12" is the recipe "Tortilla"
      And the dinner of Monday in the week "2026-10-12" is the recipe "Tortilla"
      And the lunch of Tuesday in the week "2026-10-12" is the dish "tortilla"
      And the lunch of Wednesday in the week "2026-10-12" is the dish "Pizza"
      And the lunch of Monday in the week "2026-10-19" is the dish "C"
      And the lunch of Monday in the week "2026-10-26" is the dish "D"
      And the lunch of Monday in the week "2026-11-09" is the dish "Now"
      Then the past weeks shown from the week "2026-10-26" are:
        | week       | planned | names           |
        | 2026-10-19 | 1       | C               |
        | 2026-10-12 | 4       | Tortilla, Pizza |
        | 2026-10-05 | 1       | A               |

  Rule: Menus of a shared list

    @MENU-20 @MENU-26
    Scenario: Each list has its own week; a slot with a meal of each list counts once
      Given I am a member of a shared list with scope all
      And the shared list has a recipe "Lentejas" with "Lentejas"
      And the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the shared list has the lunch of Monday in the week "2026-11-09" as the recipe "Lentejas"
      Then the week "2026-11-09" has 2 meals
      And the week "2026-11-09" has 1 planned slot of 14

    @MENU-20
    Scenario: Llenar cesta fills each list from its own menu
      Given I am a member of a shared list with scope all
      And the shared list has a recipe "Lentejas" with "Lentejas, Chorizo"
      And the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the shared list has the lunch of Monday in the week "2026-11-09" as the recipe "Lentejas"
      When I fill the basket of both lists from the week "2026-11-09"
      Then the send added 4 and found 0
      And the own list has the items "Huevos, Patata"
      And the shared list has the items "Lentejas, Chorizo"

    @MENU-20
    Scenario: A list with an empty menu is skipped; both empty give error.menuEmpty
      Given I am a member of a shared list with scope all
      When I fill the basket of both lists from the week "2026-11-09"
      Then the error is "error.menuEmpty"
      Given the lunch of Monday in the week "2026-11-09" is the dish "Pizza"
      When I fill the basket of both lists from the week "2026-11-09"
      Then the error is "error.menuNoProducts"

    @MENU-20 @MENU-24
    Scenario: Repetir esta semana copies each list's own week; Vaciar menú empties the own menu only
      Given I am a member of a shared list with scope all
      And the shared list has a recipe "Lentejas" with "Lentejas"
      And the shared list has the lunch of Monday in the week "2026-11-02" as the recipe "Lentejas"
      And the lunch of Friday in the week "2026-11-02" is the recipe "Flan"
      When I repeat the week "2026-11-02" into "2026-11-09" in both lists
      Then the repeat copied 2 meals
      And the own list has 1 meal in the week "2026-11-09"
      And the shared list has 1 meal in the week "2026-11-09"
      When I empty the own menu of the week "2026-11-09"
      Then the own list has 0 meals in the week "2026-11-09"
      And the shared list has 1 meal in the week "2026-11-09"
