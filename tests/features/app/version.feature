# The version of a deploy and the release notes, docs/spec/10-offline-version.md, as src/version.js
# and src/whatsnew.js give them.

Feature: Version and release notes

  @VER-3
  Scenario Outline: <case> is <result>
    Then the version file '<json>' is <result>

    Examples:
      | case               | json                                              | result     |
      | a version          | {"version": "1.13.0", "date": "2026-11-09"}       | 1.13.0     |
      | a full date        | {"version": "0.0.1", "date": "2026-11-09T10:00:00Z"} | 0.0.1   |
      | two parts          | {"version": "1.13", "date": "2026-11-09"}         | no version |
      | a leading zero     | {"version": "01.2.3", "date": "2026-11-09"}       | no version |
      | a bad date         | {"version": "1.2.3", "date": "soon"}              | no version |
      | no date            | {"version": "1.2.3"}                              | no version |
      | not an object      | "1.2.3"                                           | no version |

  @VER-7
  Scenario Outline: The version <a> is <order> <b>
    Then the version <a> is <order> <b>

    Examples:
      | a      | b      | order       |
      | 1.10.0 | 1.9.0  | newer than  |
      | 1.9.0  | 1.10.0 | older than  |
      | 2.0.0  | 1.99.9 | newer than  |
      | 1.2.3  | 1.2.3  | the same as |

  @VER-6
  Scenario Outline: The running version <running> with the deployed <latest> is <status>
    Then the status of the running version <running> with the deployed version <latest> is <status>

    Examples:
      | running | latest | status   |
      | 1.2.3   | 1.2.3  | current  |
      | 1.2.3   | 1.2.4  | outdated |
      | 1.3.0   | 1.2.9  | current  |
      | none    | 1.2.3  | unknown  |
      | 1.2.3   | none   | unknown  |

  @VER-2
  Scenario Outline: A <level> bump of <from> gives <to>
    Then a <level> bump of <from> gives <to>

    Examples:
      | level | from   | to     |
      | patch | 1.13.0 | 1.13.1 |
      | minor | 1.13.4 | 1.14.0 |
      | major | 1.13.4 | 2.0.0  |
      | patch | none   | 1.0.0  |

  @VER-20
  Scenario Outline: At a start with the seen version <seen> and the running <running>, Novedades shows "<show>" and stores <store>
    Given the release notes are:
      """
      ## Unreleased

      No change.

      ## 1.3.0 - 2026-11-08

      - Third

      ## 1.2.0 - 2026-11-01

      - Second

      ## 1.1.0 - 2026-10-20

      - First
      """
    Then at a start with the seen version <seen>, the running version <running>, notes <loaded> and <cover>, Novedades shows "<show>" and stores <store>

    Examples:
      | seen  | running | loaded | cover       | show          | store |
      | none  | 1.3.0   | read   | no cover    |               | 1.3.0 |
      | 1.1.0 | 1.3.0   | read   | no cover    | 1.3.0, 1.2.0  | 1.3.0 |
      | 1.1.0 | 1.2.0   | read   | no cover    | 1.2.0         | 1.2.0 |
      | 1.3.0 | 1.3.0   | read   | no cover    |               | none  |
      | 1.1.0 | 1.3.0   | lost   | no cover    |               | none  |
      | 1.1.0 | 1.3.0   | read   | a cover     |               | none  |
      | 1.1.0 | 1.4.0   | read   | no cover    | 1.3.0, 1.2.0  | 1.3.0 |

  @VER-18
  Scenario: The notes are the released versions with a note, newest first
    Given the release notes are:
      """
      ## Unreleased

      - Not yet

      ## 1.2.0 - 2026-11-01

      - Second **bold**
      - `+` adds

      ## 1.1.5 - 2026-10-25

      No change.

      ## 1.1.0 - 2026-10-20

      - First
      """
    Then the released notes are:
      | version | date       | notes                       |
      | 1.2.0   | 2026-11-01 | Second **bold** · `+` adds  |
      | 1.1.0   | 2026-10-20 | First                       |

  @VER-21
  Scenario Outline: A note "<note>" shows <parts>
    Then the note "<note>" shows <parts>

    Examples:
      | note                    | parts                                    |
      | Tap `+` to add          | text "Tap ", key "+", text " to add"     |
      | A **bold** word         | text "A ", bold "bold", text " word"     |
      | An odd ** marker        | text "An odd ** marker"                  |
      | Use `#repeat Repetir`   | text "Use ", key "Repetir" with the icon repeat |
