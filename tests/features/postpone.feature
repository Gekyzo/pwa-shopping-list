# Postponed items, docs/spec/03-lists.md.

Feature: Postponed items
  Posponer takes an item that is still to buy out of Compra for the next trip.

  Background:
    Given the list has items:
      | name  | list   | recurrent | bought | shops | quantity |
      | Milk  | active | yes       | no     | Lidl  | 2        |
      | Bread | active | no        | yes    |       |          |
      | Pilas | saved  | no        | no     |       |          |

  @LIST-40
  Scenario: Posponer keeps recurrent, the shops and the quantity
    When I postpone "Milk"
    Then there is no error
    And the items are:
      | name  | list      | recurrent | bought | shops | quantity |
      | Milk  | postponed | yes       | no     | Lidl  | 2        |
      | Bread | active    | no        | yes    |       |          |
      | Pilas | saved     | no        | no     |       |          |
    And the input state did not change

  @LIST-40
  Scenario Outline: A <case> item cannot be postponed
    When I postpone "<name>"
    Then the error is "error.onlyOpenPostpone"
    And the state did not change

    Examples:
      | case   | name  |
      | ticked | Bread |
      | saved  | Pilas |

  @LIST-41
  Scenario: A postponed item has no row in Compra and counts in no header figure
    When I postpone "Milk"
    Then the items shown are "Bread"
    And the trip figures are:
      | total | left | back | saved |
      | 1     | 0    | 0    | 1     |

  @LIST-41 @LIST-42
  Scenario: A bring back puts a postponed item in Compra, not ticked
    Given the list has items:
      | name | list      | bought |
      | Tea  | postponed | yes    |
    When I bring back "Tea"
    Then the bring back changed the list
    And the items are:
      | name  | list   | bought |
      | Milk  | active | no     |
      | Bread | active | yes    |
      | Pilas | saved  | no     |
      | Tea   | active | no     |

  @LIST-42
  Scenario: Mover todos a la compra actual brings back the postponed items of the list in view
    Given the list has items:
      | name   | list      |
      | Tea    | postponed |
      | Coffee | postponed |
      | Rice   | postponed |
    When I bring back the postponed items "Tea, Rice, Milk"
    Then 2 items came back
    And the items are:
      | name   | list      |
      | Milk   | active    |
      | Bread  | active    |
      | Pilas  | saved     |
      | Tea    | active    |
      | Coffee | postponed |
      | Rice   | active    |

  @LIST-42
  Scenario: With no list in view every postponed item comes back
    Given the list has items:
      | name   | list      |
      | Tea    | postponed |
      | Coffee | postponed |
    When I bring back all postponed items
    Then 2 items came back
    And the postponed items are ""

  @LIST-42
  Scenario: With no postponed item nothing comes back
    When I bring back all postponed items
    Then 0 items came back
    And the state did not change
