# Saved items, docs/spec/03-lists.md.

Feature: Saved items
  Terminar compra saves the one-time items. A saved item keeps its name, and an add brings it back.

  @LIST-30
  Scenario: A saved item keeps its name, its shops and its quantity
    Given the list has items:
      | name  | bought | shops        | quantity |
      | Bread | yes    | Lidl, Aldi   | 2        |
    When I finish the trip
    Then the items are:
      | name  | list  | shops      | quantity |
      | Bread | saved | Lidl, Aldi | 2        |

  @LIST-31 @LIST-32
  Scenario: A bring back puts a saved item in Compra, not ticked, and keeps recurrent
    Given the list has items:
      | name  | list  | recurrent | bought |
      | Pilas | saved | yes       | yes    |
    When I bring back "Pilas"
    Then the bring back changed the list
    And the items are:
      | name  | list   | recurrent | bought |
      | Pilas | active | yes       | no     |

  @LIST-31
  Scenario: A saved item keeps its name: a new item with that name is refused
    Given the list has items:
      | name  | list  |
      | Pilas | saved |
    When I add "pilas"
    Then the error is "error.duplicateItem" for "Pilas" in saved

  @LIST-33
  Scenario: A saved item counts in no header figure
    Given the list has items:
      | name  | list   | bought |
      | Pilas | saved  | no     |
      | Bread | active | no     |
    Then the trip figures are:
      | total | left | back | saved |
      | 1     | 1    | 0    | 1     |

  @LIST-44
  Scenario Outline: The subtitle of Compra counts the items to buy and the ticked ones (<case>)
    Given the list has items:
      | name  | list   | bought   |
      | Bread | active | <bread>  |
      | Eggs  | active | <eggs>   |
      | Pilas | saved  | no       |
    Then the trip figures are:
      | total | left   | back | saved |
      | 2     | <left> | 0    | 2     |

    Examples:
      | case             | bread | eggs | left |
      | N por comprar    | no    | no   | 2    |
      | one of each      | yes   | no   | 1    |
      | Todo comprado    | yes   | yes  | 0    |

  @DATA-1
  Scenario: An item is one record: a bring back moves it, it does not copy it
    Given the list has items:
      | name  | list  |
      | Pilas | saved |
    When I bring back "Pilas"
    Then the list has 1 item
    And the items are:
      | id   | name  | list   |
      | id-1 | Pilas | active |
