# The item rules of docs/spec/03-lists.md, run against src/store.js.
# Each tag @PREFIX-N names a rule of docs/spec/; tests/features.test.js checks that it exists.

Feature: Items of the list
  An item has a name that no other item has. A new item is one-time and goes to Compra.

  Background:
    Given the list has "Milk"

  @LIST-3 @LIST-4
  Scenario: A new item is one-time and goes to the end of Compra
    When I add "  Bread  "
    Then there is no error
    And the items are:
      | name  | list   | recurrent | bought | quantity |
      | Milk  | active | no        | no     |          |
      | Bread | active | no        | no     |          |
    And the input state did not change

  @LIST-1
  Scenario Outline: A blank name is rejected (<case>)
    When I add <name>
    Then the error is "error.nameRequired"
    And the state did not change

    Examples:
      | case   | name  |
      | empty  | ""    |
      | spaces | "   " |

  @LIST-2
  Scenario Outline: A name that an item has already is rejected, with no case distinction
    When I add "<name>"
    Then the error is "error.duplicateItem" for "Milk" in active
    And the list has 1 item

    Examples:
      | name   |
      | Milk   |
      | milk   |
      | MILK   |
      |  Milk  |

  @DATA-3
  Scenario: Accents count in a name: Cafe and Café are two items
    Given the list has "Cafe"
    When I add "Café"
    Then there is no error
    And the list has 3 items

  @LIST-10
  Scenario: Only an item of Compra can be ticked
    Given the list has items:
      | name      | list  |
      | Batteries | saved |
    When I tick "Batteries"
    Then the error is "error.onlyActiveTick"
    And the state did not change

  @LIST-8
  Scenario: A delete removes the item
    When I delete "Milk"
    Then the list has 0 items
    And the input state did not change

  @LIST-7
  Scenario: Repetir makes an item recurrent, and No repetir makes it one-time again
    When I toggle Repetir on "Milk"
    Then the items are:
      | name | recurrent |
      | Milk | yes       |
    When I toggle Repetir on "Milk"
    Then the items are:
      | name | recurrent |
      | Milk | no        |

  @LIST-12
  Scenario: A ticked item stays, at the end of Compra
    Given the list has items:
      | name  | list   |
      | Bread | active |
      | Eggs  | active |
    When I tick "Milk"
    Then the list has 3 items
    And the items shown are "Bread, Eggs, Milk"

  @LIST-5
  Rule: A rename has the rules of a new name

    Background:
      Given the list has "Bread"

    Scenario: A rename to a free name trims it
      When I rename "Bread" to " Rye bread "
      Then there is no error
      And the items are:
        | name      |
        | Milk      |
        | Rye bread |

    Scenario: A rename to the name of another item is rejected
      When I rename "Bread" to "milk"
      Then the error is "error.duplicateItem" for "Milk" in active
      And the state did not change

    Scenario: An item keeps its own name without an error
      When I rename "Bread" to "BREAD"
      Then there is no error
      And the items are:
        | name  |
        | Milk  |
        | BREAD |
