# The quantity rules of docs/spec/03-lists.md.

Feature: Quantity
  An item has a quantity: free text, such as 2, 1 kg or 3 latas, or none.

  Background:
    Given the list has "Milk"

  @LIST-27
  Scenario Outline: The quantity is trimmed, and an empty text clears it (<case>)
    Given the list has items:
      | name  | quantity |
      | Bread | 1 kg     |
    When I set the quantity of "Bread" to <text>
    Then the items are:
      | name  | quantity |
      | Milk  |          |
      | Bread | <result> |

    Examples:
      | case   | text      | result  |
      | text   | " 3 latas " | 3 latas |
      | empty  | ""        |         |
      | spaces | "   "     |         |

  @LIST-27
  Scenario: The same quantity changes nothing
    Given the list has items:
      | name  | quantity |
      | Bread | 2        |
    When I set the quantity of "Bread" to " 2 "
    Then the state did not change

  @LIST-28
  Scenario: A tick, Terminar compra and a bring back keep the quantity
    Given the list has items:
      | name  | quantity | recurrent |
      | Bread | 2        | no        |
    When I tick "Bread"
    And I finish the trip
    Then the items are:
      | name  | list   | quantity |
      | Milk  | saved  |          |
      | Bread | saved  | 2        |
    When I bring back "Bread"
    Then the items are:
      | name  | list   | quantity |
      | Milk  | saved  |          |
      | Bread | active | 2        |

  @LIST-29
  Scenario: The search of a list does not match the quantity
    Given the list has items:
      | name  | quantity |
      | Bread | 3 latas  |
    Then the list search for "latas" finds ""
