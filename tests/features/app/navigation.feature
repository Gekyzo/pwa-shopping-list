# The sections, the layers and the keys, docs/spec/07-screen.md, as the pure modules
# src/sections.js, src/layers.js and src/device.js give them. The sections are active (Compra),
# recipes (Recetas), menu (Menú) and settings (Ajustes).

Feature: Navigation

  Rule: Sections

    @NAV-1
    Scenario: The bottom bar has four sections in order, and the app starts in Compra
      Then the sections are "active, recipes, menu, settings"
      And the hash "" shows active

    @NAV-3
    Scenario Outline: A slide of <dx> by <dy> px from <from> goes to <to>
      Then a slide of <dx> by <dy> px from <from> goes to <to>

      Examples:
        | dx  | dy  | from     | to       |
        | -60 | 0   | active   | recipes  |
        | -60 | 30  | active   | recipes  |
        | -60 | 31  | active   | none     |
        | -59 | 0   | active   | none     |
        | 60  | 0   | recipes  | active   |
        | 60  | 0   | active   | none     |
        | -80 | 0   | settings | none     |
        | -80 | -20 | menu     | settings |

    @NAV-3
    Scenario Outline: A <pointer> drag slides the screen: <slides>
      Then a <pointer> drag slides the screen: <slides>

      Examples:
        | pointer | slides |
        | touch   | yes    |
        | pen     | yes    |
        | mouse   | no     |
        | none    | yes    |

    @NAV-7
    Scenario Outline: The empty <view> with the search "<query>" says <title> and <text>, with <action> and <secondary>
      Then the empty section <view> with the search "<query>", recipes <recipes> and the sample <sample> shows <title>, <text>, <action> and <secondary>

      Examples:
        | view     | query | recipes | sample | title              | text              | action        | secondary  |
        | active   |       | no      | no     | empty.activeTitle  | empty.active      | add-item      | none       |
        | active   |       | yes     | yes    | empty.activeTitle  | empty.sample      | add-item      | add-sample |
        | active   | pan   | no      | no     | none               | empty.noItemMatch | add-query     | none       |
        | recipes  |       | no      | no     | empty.recipesTitle | empty.recipes     | create-recipe | none       |
        | recipes  | sopa  | yes     | no     | none               | empty.noMatch     | none          | none       |
        | recipes  | sopa  | no      | no     | empty.recipesTitle | empty.recipes     | create-recipe | none       |
        | menu     |       | no      | no     | none               | none              | none          | none       |
        | settings |       | no      | no     | none               | none              | none          | none       |

    @NAV-30
    Scenario Outline: The section <view> has the address <hash>
      Then the section <view> has the address "<hash>"
      And the hash "<hash>" shows <view>

      Examples:
        | view     | hash       |
        | active   | #/compra   |
        | recipes  | #/recetas  |
        | menu     | #/menu     |
        | settings | #/ajustes  |

    @NAV-30
    Scenario Outline: The hash "<hash>" shows <view>
      Then the hash "<hash>" shows <view>

      Examples:
        | hash         | view     |
        | #/Menú       | menu     |
        | #/RECETAS    | recipes  |
        | #/men%C3%BA  | menu     |
        | #/nada       | active   |
        | #/%E0%A4%A   | active   |
        | #other=abc   | active   |

  Rule: Layers

    @NAV-8
    Scenario: One open sheet hides the floating add, and the add of the bar stays
      Given the screen of the section active has the edit sheet open
      Then a sheet is open
      And the floating add shows: no
      And the add of the bar shows: yes

    @NAV-8 @NAV-24
    Scenario Outline: In <view> with <layer> the floating add shows: <float>, and the add of the bar: <bar>
      Given the screen of the section <view> has <layer>
      Then the floating add shows: <float>
      And the add of the bar shows: <bar>

      Examples:
        | view     | layer               | float | bar |
        | active   | nothing open        | yes   | yes |
        | recipes  | the recipe sheet open | no  | yes |
        | menu     | nothing open        | no    | no  |
        | settings | nothing open        | no    | no  |

    @NAV-8
    Scenario: Beside the recipe pane the recipe is no sheet: the floating add stays
      Given the screen of the section recipes has the recipe sheet open
      Then beside the recipe pane the floating add shows: yes

    @NAV-25
    Scenario Outline: Escape closes the <top> first when <layers> are open
      Given the screen of the section active has <layers>
      Then Escape closes the <top>

      Examples:
        | layers                            | top    |
        | the edit sheet, a row and the search open | sheet  |
        | a row and the search open         | row    |
        | the search open                   | search |
        | nothing open                      | nothing |

    @NAV-25
    Scenario Outline: The history holds <depth> entries above the first in <view> with <layer>
      Given the screen of the section <view> has <layer>
      Then the history holds <depth> entries above the first

      Examples:
        | view     | layer           | depth |
        | active   | nothing open    | 0     |
        | active   | the search open | 1     |
        | recipes  | nothing open    | 1     |
        | menu     | the edit sheet open | 2 |

    @NAV-24
    Scenario Outline: After a scroll from <from> to <to> px the add button goes from <before> to <after>
      Then after a scroll from <from> to <to> px the add button goes from <before> to <after>

      Examples:
        | from | to  | before    | after     |
        | 0    | 25  | open      | collapsed |
        | 0    | 24  | open      | open      |
        | 100  | 110 | collapsed | collapsed |
        | 100  | 99  | collapsed | open      |
        | 30   | 0   | collapsed | open      |

  Rule: Width classes and keys

    @NAV-28
    Scenario Outline: A window of <width> px is a <class>
      Then a window of <width> px is a <class> with the nav <nav>, the dock <dock>, the panels <panels>, the recipe pane <pane> and the search field <field>

      Examples:
        | width | class    | nav     | dock | panels | pane | field |
        | 390   | phone    | bar     | yes  | none   | no   | no    |
        | 599   | phone    | bar     | yes  | none   | no   | no    |
        | 600   | foldable | rail    | no   | below  | no   | no    |
        | 700   | foldable | rail    | no   | below  | no   | no    |
        | 839   | foldable | rail    | no   | below  | no   | no    |
        | 840   | tablet   | rail    | no   | beside | yes  | no    |
        | 900   | tablet   | rail    | no   | beside | yes  | no    |
        | 1023  | tablet   | rail    | no   | beside | yes  | no    |
        | 1024  | desktop  | sidebar | no   | beside | yes  | yes   |
        | 1440  | desktop  | sidebar | no   | beside | yes  | yes   |

    @NAV-29
    Scenario Outline: The key <key> <case> does <action>
      Then the key "<key>" with <modifiers> <where> does <action>

      Examples:
        | case                | key         | modifiers | where           | action          |
        | 1                   | 1           | nothing   | on the page     | view active     |
        | 4                   | 4           | nothing   | on the page     | view settings   |
        | N                   | N           | nothing   | on the page     | add             |
        | n                   | n           | nothing   | on the page     | add             |
        | slash               | /           | nothing   | on the page     | search          |
        | in a field          | 1           | nothing   | in a field      | nothing         |
        | under a sheet       | 1           | nothing   | under a sheet   | nothing         |
        | with Ctrl           | 1           | ctrl      | on the page     | nothing         |
        | with Alt            | n           | alt       | on the page     | nothing         |
        | with Meta           | /           | meta      | on the page     | nothing         |
        | menu key on a row   | ContextMenu | nothing   | on a row        | rowMenu         |
        | Shift+F10 on a row  | F10         | shift     | on a row        | rowMenu         |
        | F10 on a row        | F10         | nothing   | on a row        | nothing         |
        | Delete on a row     | Delete      | nothing   | on a row        | rowDelete       |
        | Delete on the page  | Delete      | nothing   | on the page     | nothing         |
        | 5                   | 5           | nothing   | on the page     | nothing         |

    @NAV-29
    Scenario: The recipe pane beside the list does not block the keys; the recipe sheet does
      Given the screen of the section recipes has the recipe sheet open
      Then the keys wait: yes
      And beside the recipe pane the keys wait: no
