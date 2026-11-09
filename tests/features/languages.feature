# Languages, docs/spec/09-languages.md, as src/i18n.js and src/storage.js give them.

Feature: Languages

  @LANG-1
  Scenario: The screen is in one of seven languages
    Then the languages are "ca, de, en, es, fr, it, pt"

  @LANG-2
  Scenario Outline: With no stored choice the phone languages <phone> give <lang>
    Then the phone languages "<phone>" with the stored choice "<stored>" give <lang>

    Examples:
      | phone         | stored | lang |
      | es-MX         |        | es   |
      | nl, de-AT     |        | de   |
      | pt-BR         |        | pt   |
      | nl, ja        |        | en   |
      |               |        | en   |
      | es            | fr     | fr   |
      | es            | xx     | es   |
      | pseudo        |        | en   |
      | es            | pseudo | es   |

  @LANG-4
  Scenario: The choice is stored in shopping.lang; Automático removes the key
    When I choose the language "fr"
    Then the key "shopping.lang" holds the text "fr"
    And the stored language is "fr"
    When I choose the language Automático
    Then the key "shopping.lang" is not stored
    And the stored language is none

  @LANG-4
  Scenario: A stored value that is not one of the seven is ignored
    Given the key "shopping.lang" holds "xx"
    Then the stored language is none

  @LANG-9
  Scenario: A parameter goes in as typed, in one pass
    Then in es the text "menu.addDish" with the name "{list} $& x" reads "Añadir «{list} $& x» sin receta"

  @LANG-10
  Scenario Outline: The plural of <count> in <lang> is the form <form>
    Then in <lang> the plural of <count> is <form>

    Examples:
      | lang | count | form  |
      | es   | 1     | one   |
      | es   | 0     | other |
      | pt   | 0     | other |
      | pt   | 1     | one   |
      | fr   | 0     | one   |

  @LANG-11
  Scenario: A key that a catalog has not takes the English text; a key no catalog has shows as the key
    Then in es with a catalog that lacks "x.only" the text "x.only" reads "English only"
    And in es the text "no.such.key" reads "no.such.key"

  @LANG-18
  Scenario: The pseudo language shows the Spanish text with accents, in brackets, padded with ~
    Then in pseudo the text "nav.menu" reads "[Ménú]"
    And in pseudo the text "menu.addDish" with the name "Pan" reads "[Äñädîr «Pan» sîn récétä~~~~~~~~~]"
