# The rows of Compra, docs/spec/07-screen.md, as src/device.js and src/swipe.js give them.

Feature: Rows

  @ROW-1
  Scenario Outline: A click of a <pointer> <where> does <action>
    Then a click of a <pointer> with detail <detail> <where> does <action>

    Examples:
      | pointer | detail | where              | action |
      | mouse   | 1      | on the body        | edit   |
      | mouse   | 1      | on the check mark  | tick   |
      | touch   | 1      | on the body        | tick   |
      | pen     | 1      | on the body        | tick   |
      | mouse   | 0      | on the body        | tick   |
      | none    | 1      | on the body        | tick   |

  @ROW-5
  Scenario Outline: A drag of <dx> px with <open> open settles on <settles>
    Then a drag of <dx> px of a row with sides of <start> and <end> px and <open> open settles on <settles>

    Examples:
      | dx   | start | end | open  | settles |
      | -39  | 0     | 72  | none  | none    |
      | -41  | 0     | 72  | none  | end     |
      | -79  | 0     | 200 | none  | none    |
      | -81  | 0     | 200 | none  | end     |
      | 50   | 0     | 72  | none  | none    |
      | 30   | 0     | 72  | end   | end     |
      | 41   | 0     | 72  | end   | none    |

  @ROW-11
  Scenario Outline: A slide to the right of <dx> px on a row of <width> px runs: <runs>
    Then a slide to the right of <dx> px on a row of <width> px runs: <runs>

    Examples:
      | dx  | width | runs |
      | 79  | 200   | no   |
      | 80  | 200   | yes  |
      | 139 | 400   | no   |
      | 140 | 400   | yes  |

  @ROW-15
  Scenario Outline: A context menu of <pointer> with button <button> opens the actions: <opens>
    Then a context menu of <pointer> with button <button> opens the actions: <opens>

    Examples:
      | pointer | button | opens |
      | mouse   | 2      | yes   |
      | none    | 2      | yes   |
      | none    | 0      | no    |
      | touch   | 2      | no    |
      | pen     | 2      | no    |

  @ROW-14
  Scenario: The hint of the slide plays one time
    Then the hint of the slide has played: no
    When the hint of the slide plays
    Then the hint of the slide has played: yes
    And the key "shopping.swipeHint" holds the text "1"
