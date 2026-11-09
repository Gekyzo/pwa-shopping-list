# The backup, docs/spec/08-storage.md.

Feature: Backup
  Exportar downloads the state as a JSON file; Importar replaces the state with a valid file.

  @BACKUP-1
  Scenario Outline: The export file is named by the local date and time
    Then the export file name at "<time>" is "<name>"

    Examples:
      | time                | name                          |
      | 2026-11-09T08:05:03 | compra-2026-11-09-080503.json |
      | 2026-01-02T23:59:59 | compra-2026-01-02-235959.json |

  @BACKUP-1 @BACKUP-2
  Scenario: The export is the state as JSON with an indent of 2, and nothing else
    Given the list has "Milk"
    And the key "shopping.lang" holds "en"
    When I export the state
    Then the export is the state as JSON with an indent of 2
    And the export has the fields "version, items, recipes, sent, group, sort, menu, aisles"

  @BACKUP-3
  Scenario Outline: A file that is <case> is refused
    When I import:
      """
      <text>
      """
    Then the error is "<error>"

    Examples:
      | case             | text                           | error             |
      | not JSON         | {items:                        | error.invalidJson |
      | not a state      | {"items": []}                  | error.notBackup   |
      | an invalid state | {"version": 10, "items": [{}]} | error.notBackup   |

  @BACKUP-4
  Scenario: A backup of version 1 is cleaned and migrated as a stored state is
    When I import:
      """
      {"version": 1, "items": [{"id": "a", "name": " Milk ", "list": "active", "recurrent": false, "bought": false}]}
      """
    Then there is no error
    And the items are:
      | name | list   | quantity | shops |
      | Milk | active |          |       |
    And the state has the fields "version, items, recipes, sent, group, sort, menu, aisles"

  @BACKUP-4
  Scenario: An export imports back to the same state
    Given the list has items:
      | name  | shops | quantity | list  |
      | Milk  | Lidl  | 2        | saved |
      | Bread |       |          |       |
    When I export the state
    And I import the export
    Then there is no error
    And the state is the one before the export

  @BACKUP-7
  Scenario: Borrar todos los datos removes each key of the app and no other key
    Given the browser storage holds each key of the app
    And the key "other.app" holds "x"
    When I delete all data
    Then the delete of all data succeeded
    And the browser storage holds only "other.app"

  @BACKUP-7
  Scenario: A delete that fails tells the caller
    Given the browser storage fails
    When I delete all data
    Then the delete of all data failed
