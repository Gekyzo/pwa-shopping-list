# The move from the old address to the new one, docs/spec/20-address.md, as src/move.js gives it.

Feature: Address move

  @ADDR-1
  Scenario Outline: The host <host> is the old address: <old>
    Then the host "<host>" is the old address: <old>

    Examples:
      | host                           | old |
      | polaris-works.github.io               | yes |
      | bodega.artisandevs.duckdns.org | no  |
      | localhost                      | no  |

  @ADDR-2
  Scenario Outline: The button of a user <case> does <mode>
    Then the move of a user <signed>, <online>, after <sync> does <mode>

    Examples:
      | case                         | signed     | online  | sync                                 | mode  |
      | with no session              | signed out | online  | no sync                              | carry |
      | with no session, offline     | signed out | offline | no sync                              | carry |
      | signed in, before a sync     | signed in  | online  | no sync                              | sync  |
      | signed in, offline           | signed in  | offline | no sync                              | wait  |
      | after a clean sync           | signed in  | online  | a sync ok, 0 pending, approved       | go    |
      | with changes not sent        | signed in  | online  | a sync ok, 2 pending, approved       | carry |
      | waiting for approval         | signed in  | online  | a sync ok, 0 pending, not approved   | carry |
      | after a failed sync          | signed in  | online  | a sync failed, 0 pending, approved   | carry |

  @ADDR-3 @ADDR-5 @ADDR-7
  Scenario: The backup goes in the fragment and comes back as the same state
    Given the list has items:
      | name  | shops | quantity |
      | Leche | Lidl  | 2        |
      | Pan   |       |          |
    When I pack the backup for the move
    Then the fragment starts with "#import=" and holds only base64url
    And the move opens "https://bodega.artisandevs.duckdns.org/?lang=es" plus the fragment from the query "?lang=es"
    When the new address reads the fragment
    Then the fragment was removed before the read
    And the move brings the state of before
    And the old address keeps its state

  @ADDR-4
  Scenario: A fragment longer than 1 000 000 characters opens no address
    Then a fragment of 1000000 characters opens an address: yes
    And a fragment of 1000001 characters opens an address: no

  @ADDR-4
  Scenario: With no CompressionStream the button packs nothing
    Given the browser has no CompressionStream
    When I pack the backup for the move
    Then the move packs nothing

  @ADDR-5
  Scenario Outline: A fragment <case> gives <result>
    When the new address reads the fragment "<hash>"
    Then the move gives <result>

    Examples:
      | case               | hash                  | result          |
      | of no move         | #/compra              | nothing         |
      | not base64url      | #import=a+b/c         | error.notBackup |
      | not compressed     | #import=aGVsbG8       | error.notBackup |
