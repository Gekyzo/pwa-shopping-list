# Aisles, docs/spec/17-aisles.md: the sections of the store, in the order of the walk.

Feature: Aisles
  The aisles are one list of the state. An item has one aisle at most.

  Background:
    Given the aisles are "Fruta, Lácteos, Limpieza"
    And the list has items:
      | name  | aisle   |
      | Yogur | Lácteos |
      | Sal   |         |

  @AISLE-1 @AISLE-3 @AISLE-2 @DATA-14
  Scenario: A new aisle is trimmed and goes to the end; it exists with no item
    When I add the aisle "  Panadería "
    Then there is no error
    And the aisles are now "Fruta, Lácteos, Limpieza, Panadería"

  @AISLE-2
  Scenario Outline: The aisle name <name> is refused with <error>
    When I add the aisle <name>
    Then the error is "<error>"
    And the state did not change

    Examples:
      | name       | error                |
      | ""         | error.aisleRequired  |
      | "   "      | error.aisleRequired  |
      | "LÁCTEOS"  | error.duplicateAisle |
      | " fruta "  | error.duplicateAisle |

  @AISLE-4 @DATA-15
  Scenario: A rename also renames the aisle of each item that has it
    When I rename the aisle "lácteos" to "Lácteos y huevos"
    Then the aisles are now "Fruta, Lácteos y huevos, Limpieza"
    And the items are:
      | name  | aisle            |
      | Yogur | Lácteos y huevos |
      | Sal   |                  |
    And the input state did not change

  @AISLE-4
  Scenario: A rename that changes only the case is allowed
    When I rename the aisle "Fruta" to "FRUTA"
    Then there is no error
    And the aisles are now "FRUTA, Lácteos, Limpieza"

  @AISLE-4
  Scenario: A rename to the same name changes nothing
    When I rename the aisle "Fruta" to " Fruta "
    Then there is no error
    And the state did not change

  @AISLE-4 @AISLE-2
  Scenario: A rename to the name of another aisle is refused
    When I rename the aisle "Fruta" to "limpieza"
    Then the error is "error.duplicateAisle"
    And the state did not change

  @AISLE-5
  Scenario: A delete removes the aisle, and its items get no aisle
    When I delete the aisle "Lácteos"
    Then the aisles are now "Fruta, Limpieza"
    And the items are:
      | name  | aisle |
      | Yogur |       |
      | Sal   |       |

  @AISLE-6
  Scenario Outline: A move of <aisle> <direction> gives <aisles>
    When I move the aisle "<aisle>" <direction>
    Then there is no error
    And the aisles are now "<aisles>"

    Examples:
      | aisle    | direction | aisles                   |
      | Lácteos  | up        | Lácteos, Fruta, Limpieza |
      | Lácteos  | down      | Fruta, Limpieza, Lácteos |
      | Fruta    | up        | Fruta, Lácteos, Limpieza |
      | Limpieza | down      | Fruta, Lácteos, Limpieza |

  @AISLE-6
  Scenario: A move past an end changes nothing
    When I move the aisle "Fruta" up
    Then the state did not change

  @AISLE-7 @DATA-15
  Scenario: A set of an aisle takes the spelling of the list, and an empty name clears it
    When I put "Sal" in the aisle "LIMPIEZA"
    Then the items are:
      | name  | aisle    |
      | Yogur | Lácteos  |
      | Sal   | Limpieza |
    When I put "Yogur" in the aisle ""
    Then the items are:
      | name  | aisle    |
      | Yogur |          |
      | Sal   | Limpieza |

  @AISLE-7
  Scenario: An item has one aisle: a new aisle replaces the old one
    When I put "Yogur" in the aisle "Fruta"
    Then the items are:
      | name  | aisle |
      | Yogur | Fruta |
      | Sal   |       |

  @AISLE-7
  Scenario Outline: An unknown aisle gives error.aisleNotFound to <action>
    When I <action>
    Then the error is "error.aisleNotFound"
    And the state did not change

    Examples:
      | action                                  |
      | put "Sal" in the aisle "Carnes"         |
      | rename the aisle "Carnes" to "Carne"    |
      | delete the aisle "Carnes"               |
      | move the aisle "Carnes" up              |

  @AISLE-8
  Scenario: The usual aisles add each name that is not an aisle yet, in their order
    When I add the usual aisles "Fruta, Panadería, lácteos, Bebidas"
    Then the aisles are now "Fruta, Lácteos, Limpieza, Panadería, Bebidas"

  @AISLE-8
  Scenario: The usual aisles that are all there change nothing
    When I add the usual aisles "fruta, Limpieza"
    Then the state did not change
