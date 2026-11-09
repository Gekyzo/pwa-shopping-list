# The device preferences and figures that docs/spec/ keeps in the browser storage.

Feature: Browser storage

  @TRIP-8
  Scenario Outline: The stored trip end "<stored>" reads as <choice>
    Given the key "shopping.tripEnd" holds "<stored>"
    Then the trip end choice is <choice>

    Examples:
      | stored | choice |
      | save   | save   |
      | keep   | keep   |
      | other  | keep   |

  @TRIP-8
  Scenario: No stored trip end reads as Aplazar
    Then the trip end choice is keep

  @TRIP-8
  Scenario: Descartar stores save, and Aplazar removes the key
    When I choose save at the end of a trip
    Then the key "shopping.tripEnd" holds "save"
    When I choose keep at the end of a trip
    Then the key "shopping.tripEnd" is not stored

  @LIST-43
  Scenario Outline: The storage card counts the UTF-8 bytes of the shopping keys, rounded up to a KB
    Given the key "shopping.v1" holds <count> times "<char>"
    And the key "other.app" holds 5000 times "x"
    Then the storage card shows <kb> KB

    Examples:
      | count | char | kb |
      | 1013  | x    | 1  |
      | 1014  | x    | 2  |
      | 506   | é    | 1  |
      | 507   | é    | 2  |
      | 0     | x    | 1  |

  @LIST-43
  Scenario: With no storage the card does not show
    Given the browser storage fails
    Then the storage card does not show
