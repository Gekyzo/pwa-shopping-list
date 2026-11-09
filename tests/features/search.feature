# The search of a list, docs/spec/03-lists.md.

Feature: Search of a list
  The search shows only the items whose name, shop or aisle contains the text.

  Background:
    Given the list has items:
      | name        | shops     | aisle    | list      | bought |
      | Leche       | Mercadona | Lácteos  | active    | no     |
      | Pan de molde | Lidl     | Panadería | active   | yes    |
      | Café        |           |          | active    | no     |
      | Té verde    |           |          | postponed | no     |
      | Pilas       |           |          | saved     | no     |

  @LIST-22 @LIST-25 @AISLE-9
  Scenario Outline: The search for "<text>" ignores case and accents
    Then the list search for "<text>" finds "<found>"

    Examples:
      | text      | found                     |
      | leche     | Leche                     |
      | CAFE      | Café                      |
      | mercadona | Leche                     |
      | lidl      | Pan de molde              |
      | lacteos   | Leche                     |
      | PANADERIA | Pan de molde              |
      | e         | Leche, Café, Pan de molde |

  @LIST-22
  Scenario: An empty text shows every item of Compra
    Then the list search for "  " finds "Leche, Café, Pan de molde"

  @LIST-41
  Scenario: A postponed or a saved item is not found by the search of the list
    Then the list search for "verde" finds ""
    And the list search for "pilas" finds ""

  @LIST-23
  Scenario: A search keeps the order and the group figures, and hides a group with no match
    Given the groups of the list are:
      | group     | items                |
      | Mercadona | Leche, Café          |
      | Lidl      | Pan de molde         |
    When I search the list for "caf"
    Then the groups shown are:
      | group     | items | left |
      | Mercadona | Café  | 2    |

  @LIST-23
  Scenario: With no text every group shows
    Given the groups of the list are:
      | group     | items        |
      | Mercadona | Leche, Café  |
      | Lidl      | Pan de molde |
    When I search the list for ""
    Then the groups shown are:
      | group     | items        | left |
      | Mercadona | Leche, Café  | 2    |
      | Lidl      | Pan de molde | 1    |
