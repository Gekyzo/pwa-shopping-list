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
    Then the key "shopping.tripEnd" holds the text "save"
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

  @STORE-1
  Scenario: With no stored state the app starts with the empty state
    When the app loads the state
    Then the state is empty
    And the key "shopping.v1.corrupt" is not stored

  @STORE-2
  Scenario: A save writes the full state at once
    Given the list has "Milk"
    When the app saves the state
    Then the save succeeded
    And the key "shopping.v1" holds the current state

  @STORE-5
  Scenario: A stored state that is not valid is kept aside, and the app starts empty
    Given the key "shopping.v1" holds "{not json"
    When the app loads the state
    Then the state is empty
    And the load lost the stored state
    And the key "shopping.v1.corrupt" holds the text "{not json"

  @STORE-6 @DATA-2 @DATA-3
  Scenario Outline: A stored state is not valid when <case>
    Given the key "shopping.v1" holds:
      """
      <json>
      """
    When the app loads the state
    Then the state is empty
    And the load lost the stored state

    Examples:
      | case                         | json |
      | it is a list                 | [] |
      | its version is unknown       | {"version": 11, "items": []} |
      | its items are not a list     | {"version": 10, "items": {}} |
      | its recipes are not a list   | {"version": 2, "items": [], "recipes": null} |
      | an item has no id            | {"version": 10, "items": [{"name": "Milk", "list": "active", "recurrent": false, "bought": false}], "recipes": []} |
      | an item has an empty name    | {"version": 10, "items": [{"id": "a", "name": " ", "list": "active", "recurrent": false, "bought": false}], "recipes": []} |
      | an item has an unknown list  | {"version": 10, "items": [{"id": "a", "name": "Milk", "list": "later", "recurrent": false, "bought": false}], "recipes": []} |
      | a flag is not a boolean      | {"version": 10, "items": [{"id": "a", "name": "Milk", "list": "active", "recurrent": "no", "bought": false}], "recipes": []} |
      | again is not a boolean       | {"version": 7, "items": [{"id": "a", "name": "Milk", "list": "active", "recurrent": false, "bought": false, "again": 1}], "recipes": []} |
      | a recipe has an empty product | {"version": 10, "items": [], "recipes": [{"id": "r", "name": "Soup", "products": [""]}]} |
      | a recipe repeats a product   | {"version": 10, "items": [], "recipes": [{"id": "r", "name": "Soup", "products": ["Leek", "leek"]}]} |
      | two items share an id        | {"version": 10, "items": [{"id": "a", "name": "Milk", "list": "active", "recurrent": false, "bought": false}, {"id": "a", "name": "Eggs", "list": "active", "recurrent": false, "bought": false}], "recipes": []} |
      | two items share a name       | {"version": 10, "items": [{"id": "a", "name": "Milk", "list": "active", "recurrent": false, "bought": false}, {"id": "b", "name": "MILK", "list": "active", "recurrent": false, "bought": false}], "recipes": []} |
      | two recipes share a name     | {"version": 10, "items": [], "recipes": [{"id": "r", "name": "Soup", "products": []}, {"id": "s", "name": "soup", "products": []}]} |

  @STORE-7 @DATA-6
  Scenario: A valid state is cleaned when it is read
    Given the key "shopping.v1" holds:
      """
      {
        "version": 10,
        "items": [
          {"id": "a", "name": " Milk ", "list": "saved", "recurrent": false, "bought": true, "quantity": 2, "shops": "Lidl", "aisle": "dairy", "extra": 1},
          {"id": "b", "name": "Eggs", "list": "active", "recurrent": false, "bought": false, "quantity": " 6 ", "shops": [" lidl ", "", 3, "LIDL", "Aldi"], "aisle": "Fresh"},
          {"id": "c", "name": "Ham", "list": "active", "recurrent": false, "bought": false, "shops": ["LIDL"], "aisle": "nowhere"}
        ],
        "recipes": [{"id": "r", "name": " Soup ", "products": [" Leek "], "url": "javascript:alert(1)"}],
        "sent": ["r", "r", "x", 4],
        "group": "aisle",
        "sort": "random",
        "menu": "none",
        "aisles": [" fresh ", "", "FRESH", 7, "Dairy"],
        "colour": "red"
      }
      """
    When the app loads the state
    Then the items are:
      | name | list   | bought | quantity | shops      | aisle |
      | Milk | saved  | no     |          |            | Dairy |
      | Eggs | active | no     | 6        | lidl, Aldi | fresh |
      | Ham  | active | no     |          | lidl       |       |
    And the state field "recipes" is:
      """
      [{"id": "r", "name": "Soup", "products": ["Leek"], "url": ""}]
      """
    And the state field "sent" is:
      """
      ["r"]
      """
    And the state field "aisles" is:
      """
      ["fresh", "Dairy"]
      """
    And the state field "sort" is:
      """
      "custom"
      """
    And the state field "menu" is:
      """
      []
      """
    And the state has the fields "version, items, recipes, sent, group, sort, menu, aisles"

  @STORE-8
  Scenario: A state of version 1 gets each later field
    Given the key "shopping.v1" holds:
      """
      {"version": 1, "grouped": false, "items": [{"id": "a", "name": "Milk", "list": "active", "recurrent": true, "bought": false}]}
      """
    When the app loads the state
    Then the state field "version" is:
      """
      10
      """
    And the state field "group" is:
      """
      "none"
      """
    And the state field "items" is:
      """
      [{"id": "a", "name": "Milk", "recurrent": true, "list": "active", "bought": false, "shops": [], "quantity": "", "aisle": ""}]
      """
    And the state field "recipes" is:
      """
      []
      """
    And the state has the fields "version, items, recipes, sent, group, sort, menu, aisles"

  @STORE-8
  Scenario Outline: Version <version> takes <group> for grouped <grouped>
    Given the key "shopping.v1" holds:
      """
      {"version": <version>, "grouped": <grouped>, "items": [], "recipes": []}
      """
    When the app loads the state
    Then the state field "group" is:
      """
      "<group>"
      """

    Examples:
      | version | grouped | group  |
      | 2       | true    | recipe |
      | 2       | false   | none   |
      | 1       | true    | recipe |

  @STORE-8
  Scenario Outline: Version <version> brings back the items of next, and a ticked item with again
    Given the key "shopping.v1" holds:
      """
      {"version": <version>, "items": [
        {"id": "a", "name": "Milk", "list": "next", "recurrent": false, "bought": true},
        {"id": "b", "name": "Eggs", "list": "active", "recurrent": false, "bought": true, "again": true},
        {"id": "c", "name": "Ham", "list": "active", "recurrent": false, "bought": true, "again": false}
      ], "recipes": []}
      """
    When the app loads the state
    Then the items are:
      | name | list   | bought |
      | Milk | active | no     |
      | Eggs | active | no     |
      | Ham  | active | yes    |

    Examples:
      | version |
      | 7       |
      | 10      |

  @STORE-8
  Scenario: A postponed item of an older app goes to Compra, not ticked
    Given the key "shopping.v1" holds:
      """
      {"version": 10, "items": [
        {"id": "a", "name": "Tea", "list": "postponed", "recurrent": false, "bought": false, "shops": ["Lidl"], "quantity": "2"},
        {"id": "b", "name": "Salt", "list": "postponed", "recurrent": true, "bought": true}
      ], "recipes": []}
      """
    When the app loads the state
    Then the items are:
      | name | list   | recurrent | bought | shops | quantity |
      | Tea  | active | no        | no     | Lidl  | 2        |
      | Salt | active | yes       | no     |       |          |

  @STORE-8
  Scenario: A meal of version 9 gets the week of the load; a meal with a bad week is dropped
    Given the key "shopping.v1" holds:
      """
      {"version": 9, "items": [], "recipes": [{"id": "r", "name": "Soup", "products": []}],
       "menu": [{"day": 0, "meal": "lunch", "recipe": "r"}, {"week": "2026-11-04", "day": 1, "meal": "lunch", "recipe": "r"}]}
      """
    When the app loads the state
    Then the menu has 1 meal, in the week of today

  @STORE-9 @ENG-5
  Scenario: A write that fails tells the caller
    Given the list has "Milk"
    And the browser storage fails
    When the app saves the state
    Then the save failed

  @STORE-10
  Scenario: With no storage the app starts with the empty state, in memory
    Given the browser storage fails
    When the app loads the state
    Then the state is empty

  @NAV-12 @NAV-17 @NAV-21
  Scenario Outline: The <preference> <value> is stored under <key> as "<stored>"
    Then the <preference> is <default>
    When I choose the <preference> <value>
    Then the <preference> is <value>
    And the key "<key>" holds the text "<stored>"
    When I choose the <preference> <default>
    Then the key "<key>" is not stored

    Examples:
      | preference | default | value   | key              | stored  |
      | hand       | right   | left    | shopping.hand    | left    |
      | theme      | system  | dark    | shopping.theme   | dark    |
      | theme      | system  | light   | shopping.theme   | light   |
      | density    | normal  | compact | shopping.density | compact |

  @NAV-12 @NAV-17 @NAV-21
  Scenario Outline: An unknown stored <preference> reads as <default>
    Given the key "<key>" holds "other"
    Then the <preference> is <default>

    Examples:
      | preference | key              | default |
      | hand       | shopping.hand    | right   |
      | theme      | shopping.theme   | system  |
      | density    | shopping.density | normal  |
