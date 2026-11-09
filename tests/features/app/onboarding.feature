# The walkthrough of the first start, docs/spec/07-screen.md, as src/onboarding.js gives it.

Feature: Walkthrough

  @ONB-1
  Scenario: The walkthrough has six pages in order
    Then the pages of the walkthrough are "lists, trip, row, sections, recipes, sample"

  @ONB-3 @ONB-4
  Scenario Outline: A move <move> from page <page> shows page <to>
    Then a move <move> from page <page> of the walkthrough shows page <to>, with Atrás <back> and the last page <last>

    Examples:
      | page | move     | to | back | last |
      | 1    | forward  | 2  | yes  | no   |
      | 1    | back     | 1  | no   | no   |
      | 2    | back     | 1  | no   | no   |
      | 5    | forward  | 6  | yes  | yes  |
      | 6    | forward  | 6  | yes  | yes  |
      | 6    | nowhere  | 6  | yes  | yes  |

  @ONB-6
  Scenario: A new install shows the walkthrough
    Then the walkthrough shows at the start: yes

  @ONB-6
  Scenario Outline: A stored state, valid or not, hides the walkthrough
    Given the key "shopping.v1" holds '<state>'
    Then the walkthrough shows at the start: no

    Examples:
      | state                                  |
      | {"version": 10, "items": []}           |
      | not a state                            |

  @ONB-7
  Scenario: A close writes 1 to shopping.onboarded, and the walkthrough does not show again
    When the walkthrough closes
    Then the key "shopping.onboarded" holds the text "1"
    And the walkthrough shows at the start: no

  @ONB-8
  Scenario: With no storage the walkthrough does not show
    Given the browser storage fails
    Then the walkthrough shows at the start: no

  @ONB-13
  Scenario Outline: The last page offers the sample with <items> items and <recipes> recipes: <offered>
    Then the page <page> with <items> items and <recipes> recipes offers the sample: <offered>, with the text "<text>"

    Examples:
      | page    | items | recipes | offered | text                            |
      | sample  | 0     | 0       | yes     | onboarding.sample.text          |
      | sample  | 1     | 0       | no      | onboarding.sample.textNoSample  |
      | sample  | 0     | 2       | no      | onboarding.sample.textNoSample  |
      | recipes | 0     | 0       | no      | onboarding.recipes.text         |

  @ONB-14
  Scenario: Borrar la receta de ejemplo shows while the sample recipe exists
    Then the sample recipe exists: no
    When I add the sample recipe "Pasta con salsa de tomate" with "Pasta"
    Then the sample recipe exists: yes
    When I rename the recipe "Pasta con salsa de tomate" to "Mi pasta"
    Then the sample recipe exists: yes
    When I delete the recipe "Mi pasta"
    Then the sample recipe exists: no
