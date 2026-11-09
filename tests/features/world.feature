# Each scenario gets a new world: the id counter starts again at id-1.

Feature: The world of a scenario

  Scenario: The first scenario counts ids from 1
    Given an empty list
    When I add "Milk"
    Then the items are:
      | id   | name |
      | id-1 | Milk |

  Scenario: The second scenario counts ids from 1 again
    Given an empty list
    When I add "Bread"
    Then the items are:
      | id   | name  |
      | id-1 | Bread |
