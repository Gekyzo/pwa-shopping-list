# The account: the start route, the session, the token, the login and the logout,
# docs/spec/18-account-sync.md, as src/session.js, src/syncer.js and src/config.js give them. The
# devices sync with one fake server (tests/fakes.js).

Feature: Account

  Rule: The start route

    @ACC-1 @ACC-6 @ACC-13
    Scenario Outline: A start with <case> opens <route>
      Then a start with the session <session>, local data <data> and the offline flag <flag> opens <route>

      Examples:
        | case                                  | session  | data | flag | route   |
        | an approved session                   | approved | no   | no   | list    |
        | an approved session and a list        | approved | yes  | no   | list    |
        | an approved session past its token    | expired  | no   | no   | list    |
        | a session that waits for approval     | waiting  | yes  | no   | waiting |
        | a session and the offline flag        | approved | no   | yes  | list    |
        | the offline flag                      | none     | yes  | yes  | offline |
        | the offline flag and no list          | none     | no   | yes  | offline |
        | no session, no flag and no list       | none     | no   | no   | login   |
        | no session, no flag and a list        | none     | yes  | no   | banner  |

    @ACC-6
    Scenario: The token and the user stay on the device
      Given the session of "ana" is saved
      Then the saved session is the one of "ana"

    @ACC-6
    Scenario: A stored session that is not one loads as none
      Given the key "shopping.session" holds "{not json"
      Then there is no saved session

    @ACC-1
    Scenario: A start whose stored list was lost takes the empty state as the base, pulls the account again and deletes nothing
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "phone" adds "Pan" and syncs
      When "phone" starts again after its stored list was lost
      And "phone" adds "Café"
      And "phone" syncs
      Then the space of "ana" on the server holds the items "Café, Leche, Pan"
      And "phone" sees the items "Café, Leche, Pan"

  Rule: The offline flag

    @ACC-13
    Scenario: Usar sin cuenta writes the flag, and its removal clears it
      When I use the app with no account
      Then the offline flag is on
      And the key "shopping.offline" holds the text "1"
      When I remove the offline flag
      Then the offline flag is off

    @ACC-13
    Scenario: A storage that refuses the write keeps no flag
      Given the browser storage fails
      When I use the app with no account
      Then the offline flag could not be saved
      And the offline flag is off

    @ACC-13
    Scenario: Borrar todos los datos removes the flag with the other keys
      When I use the app with no account
      And I delete all data
      Then the offline flag is off

  Rule: Approval

    @ACC-3
    Scenario Outline: A sign-in whose access row of this app is <status> is approved: <approved>
      Given the access row of "ana" for the app "shopping" is <status>
      And the access row of "ana" for the app "bodega" is approved
      When "ana" signs in to the server
      Then the session is approved: <approved>

      Examples:
        | status   | approved |
        | approved | yes      |
        | pending  | no       |
        | revoked  | no       |

    @ACC-3
    Scenario: A sign-in with no access row of this app asks for access with a pending row
      Given the access row of "ana" for the app "bodega" is approved
      When "ana" signs in to the server
      Then the session is approved: no
      And the access rows of "ana" are "bodega approved, shopping pending"

    @ACC-4 @SHARE-4
    Scenario: A login that waits for approval makes no request and keeps the list of the device
      Given a device "phone" with no session
      And "phone" adds "Leche"
      And "ana" invited "bea@example.test"
      When "phone" logs in as "bea", waiting for approval
      Then the login of "phone" gives waiting
      And "phone" made no request
      And "phone" sees the items "Leche"
      And "phone" knows of no share

    @ACC-4 @SYNC-8
    Scenario: After the approval the login sends the list of the device
      Given a device "phone" with no session
      And "phone" adds "Leche"
      And "phone" logs in as "bea", waiting for approval
      When "phone" logs in as "bea"
      Then the login of "phone" gives synced
      And the space of "bea" on the server holds the items "Leche"

    @ACC-4 @ACC-7
    Scenario: A refresh that says the account is no longer approved makes no request for data
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And "phone" adds "Pan"
      And the server says that "ana" is no longer approved
      And 11 minutes pass
      When "phone" syncs
      Then "phone" made the requests "refresh"
      And the queue of "phone" holds 1 change

  Rule: The token

    @ACC-7
    Scenario Outline: A token whose exp is <seconds> s away counts as expired: <expired>
      Then a token whose exp is <seconds> s away counts as expired: <expired>

      Examples:
        | seconds | expired |
        | 3600    | no      |
        | 61      | no      |
        | 60      | yes     |
        | 0       | yes     |
        | -30     | yes     |

    @ACC-7
    Scenario: A token that cannot be read counts as expired
      Then a token "not-a-token" counts as expired: yes

    @ACC-7
    Scenario: The first sync refreshes the token, the next one within 10 minutes does not
      Given a device "phone" signed in as "ana"
      When "phone" syncs
      Then "phone" made the requests "refresh, shares, push, pull"
      When "phone" adds "Leche" and syncs
      Then "phone" made the requests "shares, push, pull"
      When 10 minutes pass
      And "phone" syncs
      Then "phone" made the requests "shares, pull"
      When 1 minute passes
      And "phone" syncs
      Then "phone" made the requests "refresh, shares, pull"

    @ACC-7
    Scenario: A token past its expiry is refreshed even right after a refresh
      Given a device "phone" signed in as "ana"
      And "phone" syncs
      When the token of "phone" expires
      And "phone" syncs
      Then "phone" made the requests "refresh, shares, pull"

    @ACC-7
    Scenario: A push refused as a guest is an auth stop that keeps the state and the queue
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the server refuses the pushes of "phone" with rule
      When "phone" adds "Pan" and syncs
      Then the sync of "phone" ends with auth
      And the sync of "phone" needs a login: yes
      And "phone" sees the items "Leche, Pan"
      And the queue of "phone" holds 1 change

    @ACC-7
    Scenario: After an auth stop a save makes no request, and a login of the same user sends the queue
      Given a device "phone" signed in as "ana"
      And the refresh of "phone" fails with auth
      And "phone" adds "Leche" and syncs
      And the refresh of "phone" works again
      When "phone" adds "Pan" and syncs
      Then the sync of "phone" ends with auth
      And "phone" made no request
      And the queue of "phone" holds 3 changes
      When "phone" logs in as "ana"
      Then the login of "phone" gives synced
      And the sync of "phone" needs a login: no
      And the queue of "phone" holds 0 changes
      And the space of "ana" on the server holds the items "Leche, Pan"

  Rule: A login of another user

    @ACC-8
    Scenario: A login of another user clears the data of the previous one and keeps the preferences
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche" and syncs
      And the key "shopping.lang" of "phone" holds "ca"
      When "phone" logs in as "bea"
      Then the login of "phone" gives synced
      And "phone" sees the items ""
      And the key "shopping.lang" of "phone" holds the text "ca"
      And the space of "ana" on the server holds the items "Leche"
      And the space of "bea" on the server holds the items ""

    @ACC-8
    Scenario: With changes not sent the login first offers the export, then clears
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche"
      When "phone" logs in as "bea"
      Then the login of "phone" gives ask-export
      And "phone" sees the items "Leche"
      And the queue of "phone" holds 2 changes
      When "phone" logs in as "bea", discarding the changes not sent
      Then the login of "phone" gives synced
      And "phone" sees the items ""
      And the space of "bea" on the server holds the items ""

    @ACC-8
    Scenario: A queue with no owner counts as the queue of another user
      Given a device "phone" with no session and 1 change queued
      When "phone" logs in as "ana"
      Then the login of "phone" gives ask-export

    @ACC-8 @SYNC-8
    Scenario: A device with no stored owner clears nothing at the first login
      Given a device "phone" with no session
      And "phone" adds "Leche"
      When "phone" logs in as "ana"
      Then the login of "phone" gives synced
      And "phone" sees the items "Leche"
      And the space of "ana" on the server holds the items "Leche"

  Rule: Logout

    @ACC-9
    Scenario: Cerrar sesión online sends the queue, then clears the account data of the device
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche"
      When "phone" logs out online
      Then the logout of "phone" gives done
      And the space of "ana" on the server holds the items "Leche"
      And "phone" sees the items ""
      And the key "shopping.session" of "phone" is not stored
      And the key "shopping.queue" of "phone" is not stored

    @ACC-9
    Scenario: With changes that cannot be sent the logout asks first, and a no changes nothing
      Given a device "phone" signed in as "ana"
      And "phone" loses the network
      And "phone" adds "Leche"
      When "phone" logs out online
      Then the logout of "phone" gives ask-export
      And "phone" sees the items "Leche"
      And the queue of "phone" holds 2 changes
      And the saved session of "phone" is the one of "ana"
      When "phone" logs out offline, discarding the changes not sent
      Then the logout of "phone" gives done
      And "phone" sees the items ""
      And the key "shopping.session" of "phone" is not stored

    @ACC-9 @SYNC-10
    Scenario: A sync in progress at the logout saves nothing after it
      Given a device "phone" signed in as "ana"
      And "phone" adds "Leche"
      When "phone" starts a sync that waits at the push
      And "phone" logs out offline, discarding the changes not sent
      And the waiting sync of "phone" goes on
      Then "phone" sees the items ""
      And the key "shopping.sync" of "phone" is not stored
      And the key "shopping.queue" of "phone" is not stored

  Rule: The API URL

    @ACC-12
    Scenario Outline: The app served from <host> talks to <url>
      Then the API URL for the host "<host>" is "<url>"

      Examples:
        | host                            | url                                  |
        | localhost                       | http://localhost:8090                |
        | 127.0.0.1                       | http://localhost:8090                |
        | [::1]                           | http://localhost:8090                |
        | bodega.polarisworks.duckdns.org | https://api.polarisworks.duckdns.org |
        | bodega.artisandevs.duckdns.org  | https://api.polarisworks.duckdns.org |
