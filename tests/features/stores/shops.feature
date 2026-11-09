# Shops, docs/spec/05-shops.md: the shops of an item and the shop lists of Compra.

Feature: Shops
  An item has zero, one or more shops. A shop exists while an item has it.

  Background:
    Given the list has items:
      | name  | shops       |
      | Leche | Lidl, Aldi  |
      | Pan   |             |

  Rule: The shops of an item

    @SHOP-2 @DATA-8
    Scenario: A shop name is trimmed
      When I add the shop "  Dia " to "Pan"
      Then there is no error
      And the shops of "Pan" are "Dia"

    @SHOP-2 @ENG-2
    Scenario Outline: An empty shop name is refused (<case>)
      When I add the shop <name> to "Pan"
      Then the error is "error.shopRequired"
      And the state did not change

      Examples:
        | case   | name  |
        | empty  | ""    |
        | spaces | "   " |

    @SHOP-3 @DATA-9
    Scenario: A typed name that is a shop in use takes the spelling of that shop
      When I add the shop "LIDL" to "Pan"
      Then the shops of "Pan" are "Lidl"
      And the shops in use are "Aldi, Lidl"

    @SHOP-4 @DATA-8 @ENG-3
    Scenario: An add of a shop that the item has already changes nothing
      When I add the shop "aldi" to "Leche"
      Then there is no error
      And the state did not change

    @SHOP-5 @ENG-3
    Scenario: A removal of a shop that the item does not have changes nothing
      When I remove the shop "Dia" from "Leche"
      Then there is no error
      And the state did not change

    @SHOP-5 @ENG-1
    Scenario: A removal takes the shop off the item, with no case distinction
      When I remove the shop "LIDL" from "Leche"
      Then the shops of "Leche" are "Aldi"
      And the input state did not change

    @SHOP-7
    Scenario: The shops of an item keep the order of their add
      When I add the shop "Carrefour" to "Leche"
      Then the shops of "Leche" are "Lidl, Aldi, Carrefour"

    @SHOP-1 @DATA-12
    Scenario: A shop exists while an item has it
      When I remove the shop "Aldi" from "Leche"
      Then the shops in use are "Lidl"
      When I delete "Leche"
      Then the shops in use are ""

    @SHOP-6
    Scenario: The shops in use are in name order, with no case and no accent distinction
      When I add the shop "Árbol" to "Pan"
      And I add the shop "bonÁrea" to "Pan"
      Then the shops in use are "Aldi, Árbol, bonÁrea, Lidl"

    @SHOP-11
    Scenario: The field offers the shops in use that the item does not have
      Given the list has items:
        | name | shops |
        | Sal  | Dia   |
      Then the shops offered for "Leche" are "Dia"
      And the shops offered for "Pan" are "Aldi, Dia, Lidl"

  Rule: The shop lists of Compra

    @SHOP-16 @SHOP-17 @SHOP-18
    Scenario: The chips are Todas, each shop in name order, then Sin tienda, with the items to buy
      Given the list has items:
        | name  | shops | bought |
        | Sal   | Lidl  | yes    |
        | Agua  |       | yes    |
      Then the shop chips are:
        | chip       | count |
        | Todas      | 2     |
        | Aldi       | 1     |
        | Lidl       | 1     |
        | Sin tienda | 1     |

    @SHOP-17
    Scenario: With no shop there are no chips, and Sin tienda needs an item with no shop
      When I remove the shop "Lidl" from "Leche"
      And I remove the shop "Aldi" from "Leche"
      Then the shop chips are:
        | chip | count |
      When I add the shop "Dia" to "Leche"
      And I add the shop "Dia" to "Pan"
      Then the shop chips are:
        | chip  | count |
        | Todas | 2     |
        | Dia   | 2     |

    @SHOP-19
    Scenario: A shop list shows the items of the shop; an item of two shops is in both
      Then the shop list "Lidl" shows "Leche"
      And the shop list "Aldi" shows "Leche"
      And the shop list "Sin tienda" shows "Pan"
      And the shop list "Todas" shows "Leche, Pan"
      When I tick "Leche"
      Then the shop list "Lidl" shows "Leche"
      And the shop chips are:
        | chip       | count |
        | Todas      | 1     |
        | Aldi       | 0     |
        | Lidl       | 0     |
        | Sin tienda | 1     |

    @SHOP-22
    Scenario Outline: The list <choice> is kept as <kept>
      Then the shop list "<choice>" is kept as "<kept>"

      Examples:
        | choice     | kept  |
        | Lidl       | Lidl  |
        | lidl       | Lidl  |
        | Dia        | Todas |
        | Todas      | Todas |

    @SHOP-22
    Scenario: A list whose chip goes goes back to Todas
      When I remove the shop "Aldi" from "Leche"
      Then the shop list "Aldi" is kept as "Todas"

    @SHOP-23
    Scenario: The next list is the next chip that has an item to buy, from the start after the end
      Given the list has items:
        | name  | shops | bought |
        | Sal   | Dia   | yes    |
        | Agua  | Eroski |       |
      Then the next shop list after "Lidl" is "Sin tienda" with 1 item
      And the next shop list after "Sin tienda" is "Aldi" with 1 item
      And the next shop list after "Aldi" is "Eroski" with 1 item

    @SHOP-23
    Scenario: With no other list to buy there is no next list
      When I tick "Pan"
      And I remove the shop "Aldi" from "Leche"
      Then there is no next shop list after "Lidl"

    @SHOP-24
    Scenario Outline: An add of <typed> from the list <list> puts the shops "<shops>" on the item
      When I add "<typed>" from the shop list "<list>"
      Then the shops of "<item>" are "<shops>"

      Examples:
        | list       | typed | item  | shops           |
        | Dia        | Arroz | Arroz | Dia             |
        | Todas      | Arroz | Arroz |                 |
        | Sin tienda | Arroz | Arroz |                 |
        | Dia        | pan   | Pan   | Dia             |
        | Dia        | LECHE | Leche | Lidl, Aldi, Dia |

    @SHOP-24
    Scenario: An add that fails puts no shop
      When I add "  " from the shop list "Dia"
      Then the error is "error.nameRequired"
      And the shops in use are "Aldi, Lidl"

    @SHOP-25
    Scenario: Ocultar stores hide, and Mostrar removes the key
      Then the shop lists are shown
      When I hide the shop lists
      Then the key "shopping.shopLists" holds the text "hide"
      And the shop lists are hidden
      When I show the shop lists
      Then the key "shopping.shopLists" is not stored
      And the shop lists are shown
