# The share of a space between people, docs/spec/19-sharing.md, as src/shares.js and the two lanes
# of src/syncer.js give it. Ana owns the space; Bea is the person she shares it with. The devices
# sync with one fake server (tests/fakes.js).

Feature: Sharing

  Background:
    Given a device "laptop" signed in as "ana"
    And "laptop" adds "Leche" and syncs
    And a device "phone" signed in as "bea"
    And "phone" adds "Pan" and syncs

  Rule: Spaces

    @SHARE-1 @SHARE-6
    Scenario: A change of the shared list goes to the space of the owner, whoever writes it
      Given "ana" shares the list with "bea"
      And "phone" syncs
      When "phone" adds "Huevos" to the shared list
      Then the shared queue of "phone" holds 1 change
      And the queue of "phone" holds 0 changes
      When "phone" syncs
      Then the space of "ana" on the server holds the items "Huevos, Leche"
      And the space of "bea" on the server holds the items "Pan"
      When "laptop" syncs
      Then "laptop" sees the items "Leche, Huevos"

    @SHARE-1 @SHARE-6
    Scenario: A member syncs the own space and the space of the owner, side by side
      Given "ana" shares the list with "bea"
      When "phone" syncs
      Then "phone" sees the items "Pan"
      And "phone" sees the shared items "Leche"
      And "phone" syncs the space of "ana" besides the own

    @SHARE-2 @SYNC-1
    Scenario: A share of scope all holds the recipes, the menu and the settings of the space
      Given the list of "laptop" is in view
      And a recipe "Tortilla" with "Huevos"
      And the lunch of Monday in the week "2026-11-09" is the recipe "Tortilla"
      And the list is grouped by shop in custom order
      And "laptop" saves the list of the scenario and syncs
      And "ana" shares the list with "bea"
      When "phone" syncs
      Then "phone" sees the shared recipes "Tortilla"
      And the shared list of "phone" has 1 meal
      And the shared list of "phone" groups by shop
      And "phone" groups the list by recipe

  Rule: Invite

    @SHARE-3
    Scenario Outline: An invite that the server refuses with <code> says <message>
      Given the server refuses the share requests of "laptop" with the code "<code>"
      When "laptop" invites "bea@example.test"
      Then the share request of "laptop" fails with "<message>"

      Examples:
        | code                  | message             |
        | share_self            | share.error.self    |
        | share_taken           | share.error.taken   |
        | share_member          | share.error.taken   |
        | validation_not_unique | share.error.taken   |
        | other                 | share.error.invalid |

    @SHARE-3
    Scenario: An invite with no network says so
      Given the share requests of "laptop" fail with network
      When "laptop" invites "bea@example.test"
      Then the share request of "laptop" fails with "share.error.network"

    @SHARE-3
    Scenario: An empty email is no invite and makes no request
      When "laptop" invites "   "
      Then the share request of "laptop" fails with "share.error.invalid"
      And "laptop" made no request

    @SHARE-3 @SHARE-9
    Scenario: The invited email is compared with no regard to case
      Given the shares are:
        | id  | owner | email            | member |
        | sh1 | ana   | bea@example.test |        |
      Then the pending invite of "bea" with the email "Bea@Example.TEST" is "sh1"
      And the pending invite of "carla" with the email "carla@example.test" is "none"
      And the pending invite of "ana" with the email "bea@example.test" is "none"

  Rule: Accept

    @SHARE-5 @SHARE-7
    Scenario: An accept keeps the own list as it is, and the list of the owner comes beside it
      Given "laptop" invites "bea@example.test"
      And "phone" syncs
      When "phone" accepts the invite
      Then the share request of "phone" succeeds
      And "phone" sees the items "Pan"
      And "phone" sees the shared items "Leche"
      And the space of "bea" on the server holds the items "Pan"
      And the space of "ana" on the server holds the items "Leche"

    @SHARE-7
    Scenario: An accept on another device of the user starts the shared lane on this one
      Given a device "tablet" signed in as "bea"
      And "tablet" syncs
      And "laptop" invites "bea@example.test"
      And "phone" syncs
      And "phone" accepts the invite
      When "tablet" adds "Sal" and syncs
      Then "tablet" sees the items "Pan, Sal"
      And "tablet" sees the shared items "Leche"
      And the space of "bea" on the server holds the items "Pan, Sal"

    @SHARE-5 @SHARE-9 @SHARE-11
    Scenario Outline: An invitee who <case> may accept: <accept>
      Given the shares are:
        | id  | owner | email              | member | cancelled |
        | sh1 | ana   | bea@example.test   |        | no        |
        | sh2 | bea   | carla@example.test | <own>  | <off>     |
      Then the sheet of "bea" shows the case invited
      And the invite of "bea" is blocked: <blocked>

      Examples:
        | case                                | own   | off | blocked |
        | owns a pending invite               | ""    | no  | yes     |
        | owns a share with a member          | carla | no  | yes     |
        | owns only a cancelled share         | carla | yes | no      |

  Rule: Two lanes

    @SHARE-6
    Scenario: A sync lists the shares, then the own lane pushes and pulls, then the shared lane
      Given "ana" shares the list with "bea"
      And "phone" syncs
      When "phone" adds "Sal"
      And "phone" adds "Huevos" to the shared list
      And "phone" syncs
      Then "phone" made the requests "shares, push, pull, push, pull"
      And "phone" pushed "item Sal to bea, item Huevos to ana"

    @SHARE-6
    Scenario: A stop of the shared lane keeps what the own lane did
      Given "ana" shares the list with "bea"
      And "phone" syncs
      And the pulls of the space of "ana" fail on "phone" with network
      When "phone" adds "Sal"
      And "phone" adds "Huevos" to the shared list
      And "phone" syncs
      Then the sync of "phone" ends with offline
      And the space of "bea" on the server holds the items "Pan, Sal"
      And the queue of "phone" holds 0 changes
      And the shared queue of "phone" holds 0 changes
      And "phone" sees the items "Pan, Sal"

  Rule: The shared lane follows the share

    @SHARE-7 @SHARE-8
    Scenario: A share that ends drops the shared queue and the shared list, and the own list stays
      Given "ana" shares the list with "bea"
      And "phone" syncs
      And "phone" adds "Huevos" to the shared list
      And "ana" removed "bea" from the share
      When "phone" syncs
      Then "phone" has no shared list
      And the shared queue of "phone" holds 0 changes
      And "phone" lost 1 change as left and 0 as narrowed
      And "phone" sees the items "Pan"
      And the space of "ana" on the server holds the items "Leche"

    @SHARE-7
    Scenario: From scope all to list the recipes and meals leave the shared lane and stay on the server
      Given the list of "laptop" is in view
      And a recipe "Tortilla" with "Huevos"
      And "laptop" saves the list of the scenario and syncs
      And "ana" shares the list with "bea"
      And "phone" syncs
      And "phone" renames the shared recipe "Tortilla" to "Tortilla de patatas"
      And "ana" set the scope of the share of "bea" to list
      When "phone" syncs
      Then "phone" sees the shared recipes ""
      And "phone" sees the shared items "Leche"
      And "phone" lost 0 changes as left and 1 as narrowed
      And the recipes of the space of "ana" on the server are "Tortilla"

    @SHARE-7
    Scenario: From scope list to all the recipes and meals come in a pull in full
      Given the list of "laptop" is in view
      And a recipe "Tortilla" with "Huevos"
      And "laptop" saves the list of the scenario and syncs
      And "ana" shares the list with "bea" with scope list
      And "laptop" adds "Sal" and syncs
      And "phone" syncs
      Then "phone" sees the shared recipes ""
      Given "ana" set the scope of the share of "bea" to all
      When "phone" syncs
      Then "phone" sees the shared recipes "Tortilla"

    @SHARE-7 @SYNC-1
    Scenario: With scope list the shared lane sends the items only, never the settings
      Given "ana" shares the list with "bea" with scope list
      And "phone" syncs
      When "phone" groups the shared list by shop
      And "phone" adds "Huevos" to the shared list
      And "phone" syncs
      Then "phone" pushed "item Huevos to ana"
      And the shared queue of "phone" holds 0 changes

    @SHARE-7
    Scenario: A share that ends between the list and the push ends the shared lane, not the session
      Given "ana" shares the list with "bea"
      And "phone" syncs
      And "phone" adds "Huevos" to the shared list
      When "phone" syncs while "ana" removes "bea" before the push
      Then the sync of "phone" ends with ok
      And the sync of "phone" needs a login: no
      And "phone" has no shared list
      And "phone" lost 1 change as left and 0 as narrowed

  Rule: Leave, decline and remove

    @SHARE-8
    Scenario: A leave first sends the shared queue, then cancels the share, and deletes no record
      Given "ana" shares the list with "bea"
      And "phone" syncs
      And "phone" adds "Huevos" to the shared list
      When "phone" leaves the share
      Then the share request of "phone" succeeds
      And the space of "ana" on the server holds the items "Huevos, Leche"
      And the share of "bea" is cancelled
      And "phone" has no shared list
      And "phone" sees the items "Pan"
      And the space of "bea" on the server holds the items "Pan"

    @SHARE-8
    Scenario: A leave whose shared queue cannot be sent stops, and the share stays
      Given "ana" shares the list with "bea"
      And "phone" syncs
      And "phone" adds "Huevos" to the shared list
      And the server refuses the pushes of "phone" with network
      When "phone" leaves the share
      Then the share request of "phone" fails with "share.error.network"
      And the share of "bea" is active

    @SHARE-8
    Scenario: A decline cancels the invite and the row stays
      Given "laptop" invites "bea@example.test"
      And "phone" syncs
      When "phone" declines the invite
      Then the share request of "phone" succeeds
      And the share of "bea" is cancelled
      And "phone" has no shared list

    @SHARE-8
    Scenario: A remove by the owner deletes the share, and the data of both stays
      Given "ana" shares the list with "bea"
      And "phone" syncs
      And "laptop" syncs
      When "laptop" removes the share of "bea"
      Then the share request of "laptop" succeeds
      And the server has no share of "bea"
      And the space of "ana" on the server holds the items "Leche"
      And the space of "bea" on the server holds the items "Pan"
      When "phone" syncs
      Then "phone" has no shared list
      And "phone" sees the items "Pan"

    @SHARE-8 @SHARE-9 @SHARE-11
    Scenario: A change of scope and Invitar de nuevo go at once
      Given "ana" shares the list with "bea" with scope list
      And "laptop" syncs
      When "laptop" sets the scope of the share of "bea" to all
      Then the share request of "laptop" succeeds
      And the share of "bea" has the scope all
      Given "bea" left the share
      And "laptop" syncs
      When "laptop" invites "bea" again
      Then the share request of "laptop" succeeds
      And the share of "bea" is pending

  Rule: The sheet Compartir lista

    @SHARE-9 @SHARE-11
    Scenario: The owner sees each person with the state and the scope
      Given the shares are:
        | id  | owner | email              | member | scope | cancelled |
        | sh1 | ana   | bea@example.test   | bea    | all   | no        |
        | sh2 | ana   | carla@example.test |        | list  | no        |
        | sh3 | ana   | dani@example.test  | dani   | list  | yes       |
      Then the sheet of "ana" shows the case owner
      And the people of the sheet of "ana" are:
        | email              | state     | scope |
        | bea@example.test   | joined    | all   |
        | carla@example.test | pending   | list  |
        | dani@example.test  | cancelled | list  |

    @SHARE-9 @SHARE-11
    Scenario: A member sees the share; a cancelled share is no membership
      Given the shares are:
        | id  | owner | email              | member | scope | cancelled |
        | sh1 | ana   | bea@example.test   | bea    | list  | no        |
        | sh2 | carla | dani@example.test  | dani   | all   | yes       |
      Then the sheet of "bea" shows the case member
      And the space that "bea" syncs besides the own is the one of "ana" with scope list
      And the sheet of "dani" shows the case owner
      And the space that "dani" syncs besides the own is none

    @SHARE-9
    Scenario Outline: A tap on the scope <from> sets <to>
      Then a tap on the scope <from> sets <to>

      Examples:
        | from | to   |
        | list | all  |
        | all  | list |

    @SHARE-11
    Scenario: A share of before the scope shares all
      Given the shares are:
        | id  | owner | email            | member |
        | sh1 | ana   | bea@example.test | bea    |
      Then the space that "bea" syncs besides the own is the one of "ana" with scope all

    @SHARE-11
    Scenario Outline: The shared list of an owner named "<name>" with the email <email> is <list>
      Then the name of the shared list of an owner named "<name>" with the email "<email>" is "<list>"

      Examples:
        | name | email                 | list     |
        | Ana  | ana.lopez@example.com | Ana      |
        |      | ana.lopez@example.com | ana.lopez |

  Rule: Limits

    @SHARE-10
    Scenario: Between people the last change to arrive wins
      Given "ana" shares the list with "bea"
      And "phone" syncs
      When "laptop" renames "Leche" to "Leche entera"
      And "phone" renames the shared item "Leche" to "Leche desnatada"
      And "laptop" syncs
      And "phone" syncs
      And "laptop" syncs
      Then "laptop" sees the items "Leche desnatada"
      And "phone" sees the shared items "Leche desnatada"

    @SHARE-10 @SYNC-7
    Scenario: Of two items with one name added by two people the newer stays
      Given "ana" shares the list with "bea"
      And "phone" syncs
      When "laptop" adds "Sal"
      And "phone" adds "sal" to the shared list
      And "laptop" syncs
      And "phone" syncs
      And the sync due on "phone" runs
      And "laptop" syncs
      Then "laptop" sees the items "Leche, sal"
      And "phone" sees the shared items "Leche, sal"

  Rule: The upgrade of v1.5.0

    @SHARE-13
    Scenario: A device that v1.5.0 left in the shared space moves it to the shared keys
      Given "ana" shares the list with "bea"
      And a device "old" of v1.5.0 that "bea" left in the space of "ana" with the list "Leche" and "Huevos" not sent
      Then the shared keys of "old" hold the items "Leche, Huevos" and 1 change
      And "old" sees the items ""
      And the cursor of the own lane of "old" is empty
      When "old" syncs
      Then "old" sees the items "Pan"
      And "old" sees the shared items "Leche, Huevos"
      And the space of "ana" on the server holds the items "Huevos, Leche"
      And the space of "bea" on the server holds the items "Pan"
