# The add sheet, docs/spec/03-lists.md: the rows above the input and the effect of an add.

Feature: Add sheet
  While the user types, the sheet lists the matching items, and an add never makes a duplicate.

  Background:
    Given the list has items:
      | name          | list      | bought |
      | Pan           | active    | yes    |
      | Pan de molde  | active    | no     |
      | Empanada      | saved     | no     |
      | Panela        | postponed | no     |

  @ADD-2 @ADD-4
  Scenario: Create first, then the exact match, the names that start with the text, then the others
    When I type "pan" in the add sheet
    Then the add sheet rows are:
      | kind | name         | in list |
      | item | Pan          | no      |
      | item | Pan de molde | yes     |
      | item | Panela       | no      |
      | item | Empanada     | no      |

  @ADD-2 @ADD-4
  Scenario: With no item of the typed name the first row creates it
    When I type "  an " in the add sheet
    Then the add sheet rows are:
      | kind   | name         | in list |
      | create |              | no      |
      | item   | Pan          | no      |
      | item   | Pan de molde | yes     |
      | item   | Empanada     | no      |
      | item   | Panela       | no      |

  @ADD-2
  Scenario: The sheet lists 6 rows at most
    Given the list has "Manzana"
    And the list has "Banana"
    And the list has "Ananá"
    When I type "an" in the add sheet
    Then the add sheet has 6 rows

  @ADD-2
  Scenario: An empty field lists no row
    When I type "   " in the add sheet
    Then the add sheet has 0 rows

  @ADD-3 @ADD-5
  Scenario Outline: An add of the name of a <case> item does the effect of its row
    When I add "<typed>" from the add sheet
    Then the list has 4 items
    And the items are:
      | name         | list            | bought       |
      | Pan          | active          | <pan bought> |
      | Pan de molde | active          | no           |
      | Empanada     | <empanada list> | no           |
      | Panela       | <panela list>   | no           |

    Examples:
      | case      | typed    | pan bought | empanada list | panela list |
      | ticked    | PAN      | no         | saved         | postponed   |
      | saved     | empanada | yes        | active        | postponed   |
      | postponed | Panela   | yes        | saved         | active      |

  @ADD-3 @ADD-5 @ENG-3
  Scenario: An add of the name of an item to buy in Compra changes nothing
    When I add "pan de molde" from the add sheet
    Then the bring back changed nothing
    And the state did not change

  @ADD-5
  Scenario: An add of a new name creates the item
    When I add "Arroz" from the add sheet
    Then the list has 5 items
