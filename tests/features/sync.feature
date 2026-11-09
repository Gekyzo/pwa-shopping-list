# The sync between devices, docs/spec/18-account-sync.md, as src/records.js, src/sync.js and
# src/syncer.js give it. The devices sync with one fake server (tests/fakes.js).

Feature: Sync

  Rule: The records

    @SYNC-1
    Scenario: The state is one record for each item, recipe and meal, and one for the settings
      Given the list has "Leche"
      And a recipe "Tortilla" with "Huevos"
      And the lunch of Monday in the week "2026-11-02" is the recipe "Tortilla"
      Then the records of the state are:
        | kind     | key                | name     |
        | item     | id-1               | Leche    |
        | recipe   | id-2               | Tortilla |
        | meal     | 2026-11-02-0-lunch |          |
        | settings | settings           |          |
      And the settings record holds the fields "aisles, group, sent, sort"

    @SYNC-1
    Scenario: The server keeps the owner of the space on each record
      Given a device "phone" signed in as "ana"
      When "phone" adds "Leche" and syncs
      Then the records of "ana" on the server are "item, settings"

    @SYNC-1
    Scenario: A meal record of version 9 is dated, and the old key is replaced on the server
      Given a device "phone" signed in as "ana"
      And the account of "ana" on the server has the meal "0-lunch" with the dish "Lentejas"
      When "phone" syncs
      Then "phone" has the dish "Lentejas" in the lunch of Monday of the week of today
      And the queue of "phone" moves the meal "0-lunch" into the week of today
      And "phone" has a sync due in 1500 ms

  Rule: The queue

    @SYNC-2
    Scenario: A save queues the upserts and the deletes against the last state that the sync knows
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "phone" adds "Pan" and syncs
      When "phone" deletes "Leche"
      And "phone" renames "Pan" to "Pan integral"
      Then the queue of "phone" holds the changes "delete item Leche, upsert item Pan integral"
      And the key "shopping.queue" of "phone" holds the queue

    @SYNC-2
    Scenario: A device with no session keeps no queue
      Given a device "phone" with no session
      When "phone" adds "Leche"
      Then the queue of "phone" holds 0 changes
      And the key "shopping.queue" of "phone" is not stored

    @SYNC-2
    Scenario: The state that a merge puts in place queues nothing
      Given a device "phone" signed in as "ana"
      And a device "tablet" signed in as "ana"
      And "phone" adds "Leche" and syncs
      When "tablet" syncs
      Then "tablet" sees the items "Leche"
      And the queue of "tablet" holds 0 changes

    @SYNC-2
    Scenario: A start that fell back to the empty list deletes nothing, and the merge puts the account back
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "phone" adds "Pan" and syncs
      When "phone" starts again with an empty list
      And "phone" adds "Café"
      Then the queue of "phone" holds 0 changes
      When "phone" syncs
      Then the space of "ana" on the server holds the items "Leche, Pan"
      And "phone" sees the items "Leche, Pan"

    @SYNC-2
    Scenario: The user can still delete every item
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      When "phone" deletes "Leche"
      And "phone" syncs
      Then the space of "ana" on the server holds the items ""

  Rule: When a sync runs

    @SYNC-3
    Scenario: A save starts a sync 1.5 s after the last save of a burst
      Given a device "phone" signed in as "ana"
      When "phone" adds "Leche"
      And "phone" adds "Pan"
      Then "phone" has a sync due in 1500 ms
      When the sync due on "phone" runs
      Then the space of "ana" on the server holds the items "Leche, Pan"

    @SYNC-3
    Scenario: A stop at the rate limit or at a server error starts again after 5, 15, 30 and 60 s
      Given a device "phone" signed in as "ana"
      And the server refuses the pushes of "phone" with rate
      When "phone" adds "Leche" and syncs
      Then the retries due on "phone" are "5000"
      When the retry of "phone" runs
      Then the retries due on "phone" are "15000"
      Given the server refuses the pushes of "phone" with server
      When the retry of "phone" runs
      Then the retries due on "phone" are "30000"
      When the retry of "phone" runs
      Then the retries due on "phone" are "60000"
      When the retry of "phone" runs
      Then the retries due on "phone" are "60000"
      Given the server takes the pushes of "phone" again
      When the retry of "phone" runs
      Then the sync of "phone" ends with ok
      And the retries due on "phone" are ""
      And the space of "ana" on the server holds the items "Leche"

    @SYNC-3
    Scenario: A stop at the network starts no retry
      Given a device "phone" signed in as "ana"
      And "phone" loses the network
      When "phone" adds "Leche" and syncs
      Then the sync of "phone" ends with offline
      And the retries due on "phone" are ""

    @SYNC-3
    Scenario: A sync that starts while one runs is that same sync
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche"
      When "phone" starts a sync that waits at the push
      And "phone" starts one more sync
      And the waiting sync of "phone" goes on
      Then the two syncs of "phone" are one
      And "phone" made the requests "refresh, shares, push, push, pull"

  Rule: The order of a sync

    @SYNC-4
    Scenario: A sync lists the shares, sends the queue in order, then pulls
      Given a device "phone" signed in as "ana"
      When "phone" adds "Leche" and syncs
      Then "phone" made the requests "refresh, shares, push, push, pull"
      And "phone" pushed "item Leche to ana, settings to ana"

    @SYNC-4
    Scenario: A network error stops before the pull and the next sync starts at the first change not sent
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the network of "phone" fails at the push number 2
      When "phone" adds "Pan"
      And "phone" adds "Sal"
      And "phone" syncs
      Then the sync of "phone" ends with offline
      And "phone" made the requests "shares, push, push"
      And the queue of "phone" holds the changes "upsert item Sal"
      Given "phone" gets the network back
      When "phone" syncs
      Then the queue of "phone" holds 0 changes
      And the space of "ana" on the server holds the items "Leche, Pan, Sal"
      And the server holds 1 record for each item of "ana"

    @SYNC-4
    Scenario: A change that the server refuses as bad data stays local, and the next changes go on
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the server refuses the push number 2 of "phone" with bad-data
      When "phone" adds "Pan"
      And "phone" adds "Sal"
      And "phone" syncs
      Then the sync of "phone" ends with ok
      And the queue of "phone" holds 0 changes
      And "phone" sees the items "Leche, Pan, Sal"
      And the space of "ana" on the server holds the items "Leche, Pan"

    @SYNC-4 @SYNC-11
    Scenario: A rate limit stops the sync, keeps the queue and keeps the device online
      Given a device "phone" signed in as "ana"
      And the server refuses the pushes of "phone" with rate
      When "phone" adds "Leche" and syncs
      Then the sync of "phone" ends with rate
      And the queue of "phone" holds 2 changes
      And "phone" is online: yes

    @SYNC-4 @SYNC-11
    Scenario Outline: A stop at <stop> keeps the queue and the device is offline
      Given a device "phone" signed in as "ana"
      And the server refuses the pushes of "phone" with <stop>
      When "phone" adds "Leche" and syncs
      Then the sync of "phone" ends with offline
      And the queue of "phone" holds 2 changes
      And "phone" is online: no

      Examples:
        | stop    |
        | network |
        | server  |
        | bug     |

  Rule: The merge

    @SYNC-5
    Scenario: A change queued during the pull wins over the pulled record of the same item
      Given a device "phone" signed in as "ana"
      And a device "tablet" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "tablet" syncs
      And "tablet" renames "Leche" to "Leche entera"
      And "tablet" syncs
      When "phone" starts a sync that waits at the pull
      And "phone" renames "Leche" to "Leche sin lactosa"
      And the waiting sync of "phone" goes on
      Then "phone" sees the items "Leche sin lactosa"
      When the sync due on "phone" runs
      And "tablet" syncs
      Then "tablet" sees the items "Leche sin lactosa"

    @SYNC-6
    Scenario: A delete reaches the other devices as a record with deleted, and keeps its data
      Given a device "phone" signed in as "ana"
      And a device "tablet" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "phone" adds "Pan" and syncs
      And "tablet" syncs
      When "phone" deletes "Leche"
      And "phone" syncs
      Then the server record of "Leche" is deleted and keeps its data
      When "tablet" syncs
      Then "tablet" sees the items "Pan"

    @SYNC-6
    Scenario: A delete of a record that the server does not hold creates nothing
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the server loses the record of "Leche"
      When "phone" deletes "Leche"
      And "phone" syncs
      Then the sync of "phone" ends with ok
      And the server has no record of "Leche"

    @SYNC-6
    Scenario: An upsert whose record is gone from the server creates it again
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the server loses the record of "Leche"
      When "phone" renames "Leche" to "Leche entera"
      And "phone" syncs
      Then the space of "ana" on the server holds the items "Leche entera"

    @SYNC-6 @ACC-7
    Scenario: A delete that the server does not find checks the token: a refused refresh keeps it queued
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the server answers the deletes of "phone" as gone
      And the refresh of "phone" fails with auth
      When "phone" deletes "Leche"
      And "phone" syncs
      Then the sync of "phone" ends with auth
      And the queue of "phone" holds the changes "delete item Leche"

    @SYNC-6
    Scenario: A delete that the server does not find after a good refresh leaves the queue
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the server answers the deletes of "phone" as gone
      When "phone" deletes "Leche"
      And "phone" syncs
      Then the sync of "phone" ends with ok
      And "phone" made the requests "shares, push, refresh, pull"
      And the queue of "phone" holds 0 changes

    @SYNC-7 @SYNC-3
    Scenario: The same item added offline on two devices is merged into the newer one
      Given a device "phone" signed in as "ana"
      And a device "tablet" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "tablet" adds " LECHE " and syncs
      Then "tablet" sees the items "LECHE"
      And the queue of "tablet" holds the changes "delete item Leche"
      And "tablet" has a sync due in 1500 ms
      When the sync due on "tablet" runs
      And "phone" syncs
      Then "phone" sees the items "LECHE"
      And the space of "ana" on the server holds the items "LECHE"

    @SYNC-7
    Scenario: A meal of a recipe that a duplicate removes is dropped
      Given a device "phone" signed in as "ana"
      And a device "tablet" signed in as "ana"
      And a recipe "Flan" with "Leche"
      And the lunch of Monday in the week "2026-11-09" is the recipe "Flan"
      And "phone" saves the list of the scenario and syncs
      When "tablet" adds the recipe "flan" and syncs
      And the sync due on "tablet" runs
      And "phone" syncs
      Then "phone" sees the recipes "flan"
      And "phone" has 0 meals

    @SYNC-7
    Scenario: The merge drops a malformed record with no tombstone
      Given a device "phone" signed in as "ana"
      And the account of "ana" on the server has the items "Leche"
      And the account of "ana" on the server has an item record with no name
      And the account of "ana" on the server has an item record whose id is not its key
      When "phone" syncs
      Then "phone" sees the items "Leche"
      And the queue of "phone" holds no delete

    @SYNC-7
    Scenario: When the validation refuses the merged records, the state, the queue and the cursor stay
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "phone" adds "Pan"
      And the account of "ana" on the server has an item record that the validation refuses
      When "phone" syncs
      Then "phone" sees the items "Leche, Pan"
      And the cursor of "phone" did not move
      And the queue of "phone" holds 0 changes

  Rule: The first login

    @SYNC-8
    Scenario: An account with data replaces the list of the device, which stays for an export
      Given the account of "ana" on the server has the items "Leche"
      And a device "phone" with no session
      And "phone" adds "Pan"
      When "phone" logs in as "ana"
      Then the login of "phone" gives synced
      And "phone" sees the items "Leche"
      And the list kept from before the login of "phone" has the items "Pan"
      And the space of "ana" on the server holds the items "Leche"

    @SYNC-8
    Scenario: A login that cannot save the old list stops and keeps the list
      Given the account of "ana" on the server has the items "Leche"
      And a device "phone" with no session
      And "phone" adds "Pan"
      And the storage of "phone" refuses the key "shopping.v1.beforeLogin"
      When "phone" logs in as "ana"
      Then the login of "phone" failed
      And "phone" sees the items "Pan"

    @SYNC-8 @SYNC-7
    Scenario: The account goes through the merge: a duplicate gets a tombstone
      Given the account of "ana" on the server has the items "Leche, leche"
      And a device "phone" with no session
      And "phone" adds "Pan"
      When "phone" logs in as "ana"
      Then "phone" sees the items "leche"
      And the space of "ana" on the server holds the items "leche"

    @SYNC-8
    Scenario: An account that the validation refuses stops the login and keeps the list
      Given the account of "ana" on the server has an item record that the validation refuses
      And a device "phone" with no session
      And "phone" adds "Pan"
      When "phone" logs in as "ana"
      Then the login of "phone" failed
      And "phone" sees the items "Pan"
      And the key "shopping.v1.beforeLogin" of "phone" is not stored

    @SYNC-8
    Scenario: A device with no data takes the account and its settings, and sends nothing
      Given the account of "ana" on the server has the items "Leche" grouped by shop
      And a device "phone" with no session
      When "phone" logs in as "ana"
      Then "phone" sees the items "Leche"
      And "phone" groups the list by shop
      And "phone" pushed ""

    @SYNC-8
    Scenario: A sync in progress with the token of before the login cannot stop the sync of the login
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche"
      When "phone" starts a sync that waits at the push
      And the server refuses the old token of "phone"
      And "phone" logs in as "ana" again, while the sync waits
      Then the login of "phone" gives synced
      And the sync of "phone" needs a login: no
      When the server takes the pushes of "phone" again
      And "phone" syncs
      Then the queue of "phone" holds 0 changes
      And the space of "ana" on the server holds the items "Leche"

  Rule: Import and reset

    @SYNC-9
    Scenario: An import replaces the data of the account on every device
      Given a device "phone" signed in as "ana"
      And a device "tablet" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "tablet" syncs
      When "phone" starts again with an empty list
      And "phone" imports a list with "Café"
      And "phone" syncs
      Then the space of "ana" on the server holds the items "Café"
      When "tablet" syncs
      Then "tablet" sees the items "Café"

    @SYNC-10
    Scenario: Borrar todos los datos clears the device, sends nothing, and the account stays
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "phone" adds "Pan"
      When "phone" stops the sync for a reset
      Then "phone" sees the items ""
      And "phone" made no request
      And the key "shopping.session" of "phone" is not stored
      And the key "shopping.sync" of "phone" is not stored
      And the key "shopping.queue" of "phone" is not stored
      And the space of "ana" on the server holds the items "Leche"

  Rule: Online and offline

    @SYNC-11
    Scenario: A sync that reached the server counts, one that stopped at the network does not
      Given a device "phone" signed in as "ana"
      And "phone" loses the network
      When "phone" syncs
      Then "phone" is online: no
      And "phone" reached the server 0 times
      Given "phone" gets the network back
      When "phone" syncs
      Then "phone" is online: yes
      And "phone" reached the server 1 time
      Given the refresh of "phone" fails with auth
      And the token of "phone" expires
      When "phone" syncs
      Then the sync of "phone" ends with auth
      And "phone" is online: yes
      And "phone" reached the server 2 times
