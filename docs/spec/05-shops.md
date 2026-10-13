# Shops

Rules of `src/shops.js` and of the shop sheet in `src/app.js`. The list by shop is in
[04-arrange.md](04-arrange.md).

## Rules

- **SHOP-1** An item has zero, one or more shops. A shop is a name; it exists while an item has
  it (DATA-12).
- **SHOP-2** A shop name is trimmed. An empty name gives `error.shopRequired`.
- **SHOP-3** Two spellings that differ only by case are one shop. A typed name that is a shop in
  use takes the spelling of that shop.
- **SHOP-4** An add of a shop that the item has already changes nothing and gives no error.
- **SHOP-5** A removal of a shop that the item does not have changes nothing and gives no error.
- **SHOP-6** The shops in use show in name order, with no case and no accent distinction.
- **SHOP-7** A row shows the shops of its item below the name, as `A · B`, in the order of their
  add. A list by shop does not show them (GROUP-14).

## Shop sheet

- **SHOP-8** A slide of a row to the right shows the shop button, beside **Renombrar**. It opens
  the sheet `Tiendas de <name>`.
- **SHOP-9** The sheet shows each shop in use as a chip. A chip is pressed when the item has the
  shop. A tap on a chip adds or removes the shop for this item.
- **SHOP-10** The field **Nueva tienda** with **Añadir** adds a shop. The field takes 40
  characters at most.
- **SHOP-11** The field offers the shops in use that the item does not have. A pick of one adds it
  at once.
- **SHOP-12** The sheet stays open after each change, so that an item gets several shops in one
  visit. A tap out of the sheet or `Escape` closes it.
- **SHOP-13** With no shop in use, the sheet shows `Escribe la primera tienda.`
- **SHOP-14** A change of shops is saved at once and has no message and no `Deshacer`.
- **SHOP-15** The sheet closes when its item goes away, for example by `Deshacer` or by an import.

## Limits

No screen of shops. No rename and no delete of a shop for all its items at one time. No custom
order of the shops. No filter that shows one shop. No memory of the shops of a deleted item. No
shop on the products of a recipe, and no shop field in the add sheet.
