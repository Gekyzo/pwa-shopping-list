# The trip rules of docs/spec/03-lists.md, run against startNewShopping of src/store.js.

Feature: Terminar compra
  Terminar compra ends a trip: each item of Compra goes where TRIP-2 says.

  @TRIP-1
  Scenario Outline: Terminar compra is offered when an item is ticked, open or postponed (<case>)
    Given the list has items:
      | name  | list   | recurrent | bought |
      | Salt  | active | yes       | no     |
      | Bread | <list> | <recurrent> | <bought> |
    Then Terminar compra is offered: <offered>

    Examples:
      | case             | list      | recurrent | bought | offered |
      | ticked           | active    | yes       | yes    | yes     |
      | open             | active    | no        | no     | yes     |
      | postponed        | postponed | no        | no     | yes     |
      | saved            | saved     | no        | no     | no      |
      | recurrent to buy | active    | yes       | no     | no      |

  @TRIP-1
  Scenario: Nothing to finish when no item is ticked, open or postponed
    Given the list has items:
      | name      | list   | recurrent |
      | Batteries | saved  | no        |
      | Salt      | active | yes       |
    When I finish the trip
    Then the error is "error.nothingToStart"
    And the state did not change

  @TRIP-2 @TRIP-3 @LIST-30 @LIST-42
  Scenario: Each item goes where TRIP-2 says, in the same order
    Given the list has items:
      | name      | list      | recurrent | bought |
      | Milk      | active    | yes       | yes    |
      | Bread     | active    | no        | yes    |
      | Batteries | saved     | no        | no     |
      | Tea       | postponed | no        | no     |
      | Salt      | active    | yes       | no     |
      | Eggs      | active    | no        | no     |
    And the list is grouped by shop in name order
    When I finish the trip
    Then there is no error
    And the list is still grouped by shop in name order
    And the items are:
      | name      | list   | recurrent | bought |
      | Milk      | active | yes       | no     |
      | Bread     | saved  | no        | no     |
      | Batteries | saved  | no        | no     |
      | Tea       | active | no        | no     |
      | Salt      | active | yes       | no     |
      | Eggs      | saved  | no        | no     |
    And the sent recipes are empty
    And the input state did not change

  @TRIP-6
  Scenario Outline: An open item is kept with Aplazar and saved with Descartar
    Given the list has items:
      | name  | list   | bought |
      | Bread | active | yes    |
      | Eggs  | active | no     |
    When I finish the trip <choice>
    Then the items are:
      | name  | list   | bought |
      | Bread | saved  | no     |
      | Eggs  | <eggs> | no     |

    Examples:
      | choice          | eggs   |
      | keeping "Eggs"  | active |
      |                 | saved  |

  @TRIP-4 @LIST-33
  Scenario: The trip sheet counts where each item goes; a saved item counts nowhere
    Given the list has items:
      | name      | list      | recurrent | bought |
      | Milk      | active    | yes       | yes    |
      | Salt      | active    | yes       | no     |
      | Bread     | active    | no        | yes    |
      | Eggs      | active    | no        | no     |
      | Jam       | active    | no        | no     |
      | Tea       | postponed | no        | no     |
      | Batteries | saved     | no        | yes    |
    Then the trip outcome keeping "Eggs" is:
      | recurrent | kept | open | bought | postponed |
      | 2         | 1    | 1    | 1      | 1         |
    And the trip figures keeping "Eggs" are:
      | total | left | back | saved |
      | 5     | 3    | 3    | 2     |
