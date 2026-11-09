# The combined list of a member, docs/spec/19-sharing.md, as src/lists.js gives it: the own list
# and the shared list in one state, Todas, the list chips and the twins.

Feature: Shared lists

  Rule: One combined state

    @SHARE-12
    Scenario: Each list may hold an item of one name, and each shared id has the prefix
      Given the list has "Leche"
      And I am a member of a shared list with scope all
      And the shared list has "Leche"
      Then the own list has the items "Leche"
      And the shared list has the items "Leche"
      And each shared entity of the combined state has the marker and an id that starts with "shared:"
      And the parts of the combined state hold no marker and no prefix

    @SHARE-12
    Scenario: An add runs in one list, so the name rule holds inside that list
      Given the list has "Leche"
      And I am a member of a shared list with scope all
      When I add "leche" to the shared list
      Then there is no error
      And the shared list has the items "leche"
      When I add "LECHE" to the own list
      Then the error is "error.duplicateItem"

    @SHARE-12
    Scenario: The shared part keeps its own group, order and aisles
      Given I am a member of a shared list with scope all
      And the shared list is grouped by shop in name order with the aisles "Frutas"
      And the shared list has "Huevos"
      When I group by none
      Then the own part groups by none in custom order with the aisles ""
      And the shared part groups by shop in name order with the aisles "Frutas"

    @SHARE-12
    Scenario: With scope list the shared recipes stay out, and the own sent is the whole sent
      Given a recipe "Tortilla" with "Huevos"
      And the recipe "Tortilla" was sent
      And I am a member of a shared list with scope list
      And the shared list has a recipe "Flan" with "Leche"
      Then the recipes in view are:
        | name     | list |
        | Tortilla | own  |
      And the sent recipes are "Tortilla"
      And the own list has sent "Tortilla"

  Rule: Todas and the list chips

    @SHARE-14
    Scenario: Todas shows twins as one row, the own item, with both tags
      Given the list has items:
        | name    | list   | bought |
        | Leche   | active | no     |
        | Pan     | active | yes    |
        | Sal     | next   | no     |
        | Arroz   | active | no     |
      And I am a member of a shared list with scope all
      And the shared list has items:
        | name    | list   | bought |
        | leche   | active | no     |
        | Pan     | active | no     |
        | Sal     | active | no     |
        | Huevos  | active | no     |
        | arroz   | active | yes    |
      Then Todas shows the rows:
        | name   | lists       |
        | Leche  | own, shared |
        | Pan    | own         |
        | Sal    | own         |
        | Arroz  | own         |
        | Pan    | shared      |
        | Sal    | shared      |
        | Huevos | shared      |
        | arroz  | shared      |
      And the own chip shows "Leche, Pan, Sal, Arroz"
      And the shared chip shows "leche, Pan, Sal, Huevos, arroz"

    @SHARE-14
    Scenario: Each chip counts the items to buy of its list, and Todas counts twins once
      Given the list has items:
        | name  | list   | bought |
        | Leche | active | no     |
        | Pan   | active | yes    |
        | Arroz | active | no     |
      And I am a member of a shared list with scope all
      And the shared list has items:
        | name   | list   | bought |
        | Leche  | active | no     |
        | Pan    | active | no     |
        | Huevos | next   | no     |
      Then the list chips count 3 in Todas, 2 in Mi lista and 2 in the shared list

  Rule: The list of an action

    @SHARE-15
    Scenario Outline: An add from the chip <chip> goes to the <list> list
      Then an add from the chip <chip> goes to the <list> list

      Examples:
        | chip   | list   |
        | all    | own    |
        | own    | own    |
        | shared | shared |

    @SHARE-15
    Scenario: A tick acts on the item in its own list
      Given the list has "Leche"
      And I am a member of a shared list with scope all
      And the shared list has "Huevos"
      When I tick "Huevos"
      Then the shared item "Huevos" is bought: yes
      And the own item "Leche" is bought: no

    @SHARE-15
    Scenario: A manual move changes the order of one list only
      Given the list has "Leche"
      And the list has "Pan"
      And I am a member of a shared list with scope all
      And the shared list has "Huevos"
      And the shared list has "Sal"
      When I move "Sal" of the shared list to the top
      Then there is no error
      And the shared list has the items "Sal, Huevos"
      And the own list has the items "Leche, Pan"

    @SHARE-15
    Scenario: A move of the shared list in the name order switches the own order to custom
      Given the list has "Pan"
      And the list has "Leche"
      And the list is grouped by none in name order
      And I am a member of a shared list with scope all
      And the shared list has "Huevos"
      And the shared list has "Sal"
      When I move "Sal" of the shared list to the top
      Then the own list has the items "Leche, Pan"
      And the own part groups by none in custom order with the aisles ""

    @SHARE-15
    Scenario: Terminar compra ends the trip of both lists in one operation
      Given the list has items:
        | name  | bought |
        | Leche | yes    |
      And I am a member of a shared list with scope all
      And the shared list has items:
        | name   | bought |
        | Huevos | yes    |
      When I finish the trip
      Then the own item "Leche" is in the list saved
      And the shared item "Huevos" is in the list saved

  Rule: The reach of a merged row

    @SHARE-16
    Scenario Outline: A tick of a merged row with the setting <reach> ticks <ticked>
      Given the list has "Leche"
      And I am a member of a shared list with scope all
      And the shared list has "Leche"
      When I tick the row "Leche" of Todas reaching <reach>
      Then the own item "Leche" is bought: yes
      And the shared item "Leche" is bought: <shared>

      Examples:
        | reach | ticked              | shared |
        | own   | the own item only   | no     |
        | both  | the item of each list | yes  |

    @SHARE-16
    Scenario Outline: A delete of a merged row with the setting <reach> says <toast>, and Deshacer puts back each item
      Given the list has "Leche"
      And I am a member of a shared list with scope all
      And the shared list has "Leche"
      When I delete the row "Leche" of Todas reaching <reach>
      Then the toast of the delete is "<toast>"
      And the own list has the items ""
      And the shared list has the items "<left>"
      When I undo the delete
      Then the own list has the items "Leche"
      And the shared list has the items "Leche"

      Examples:
        | reach | toast             | left  |
        | own   | toast.deletedOwn  | Leche |
        | both  | toast.deletedBoth |       |

    @SHARE-16
    Scenario: A row with no twin deletes its item with the plain toast
      Given the list has "Leche"
      And I am a member of a shared list with scope all
      When I delete the row "Leche" of Todas reaching both
      Then the toast of the delete is "toast.deleted"

    @SHARE-16
    Scenario: The setting is a preference of the device, stored as both for Las dos
      Then the reach of a merged row is own
      When I choose both for an item in both lists
      Then the key "shopping.twinReach" holds the text "both"
      And the reach of a merged row is both
      When I choose own for an item in both lists
      Then the key "shopping.twinReach" is not stored
      And the reach of a merged row is own
