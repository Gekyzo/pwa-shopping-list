# The install offer, docs/spec/16-install.md, as src/install.js gives it.

Feature: Install

  @INS-1 @INS-2
  Scenario Outline: From <from>, the event <event> gives <to>, and the button shows: <button>
    Then from the install state <from> the event <event> gives <to>, and the Install button shows: <button>

    Examples:
      | from      | event     | to        | button |
      | idle      | prompt    | available | yes    |
      | available | dismissed | idle      | no     |
      | available | installed | installed | no     |
      | idle      | installed | installed | no     |
      | installed | prompt    | installed | no     |
      | installed | dismissed | installed | no     |
      | idle      | other     | idle      | no     |

  @INS-3
  Scenario Outline: An app that starts <mode> starts <state>
    Then an app that starts <mode> starts <state>

    Examples:
      | mode           | state     |
      | standalone     | installed |
      | in the browser | idle      |
