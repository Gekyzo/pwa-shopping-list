# Data model

## State

The app has one state object. Each operation returns a new object and never changes its input.

```js
{
  version: 7,
  items: [Item],      // insertion order, changed only by a manual move
  recipes: [Recipe],  // insertion order
  sent: [string],     // ids of the recipes sent to Actual in this trip, in send order
  group: 'recipe',    // 'recipe' | 'shop' | 'aisle' | 'none'
  sort: 'custom',     // 'custom' | 'name'
  menu: [Meal],       // the planned meals of the week, in day and meal order
  aisles: [string],   // the sections of the store, in the order of the walk
}
```

The empty state is `{ version: 7, items: [], recipes: [], sent: [], group: 'recipe', sort: 'custom', menu: [], aisles: [] }`.

## Item

```js
{
  id: string,         // crypto.randomUUID()
  name: string,       // trimmed, not empty
  recurrent: boolean, // comes back at each trip
  list: 'active' | 'next' | 'saved', // 'saved': kept after a trip, in no list
  bought: boolean,    // ticked
  again: boolean,     // a ticked one-time item that the user wants at the next trip
  shops: [string],    // shop names
  quantity: string,   // free text, such as '2' or '1 kg'; trimmed; '' for none
  aisle: string,      // one name of `aisles`, or '' for none
}
```

## Recipe

```js
{
  id: string,
  name: string,       // trimmed, not empty
  products: [string], // product names, trimmed, not empty
  url: string,        // an http or https address, or ''
}
```

## Meal

```js
{
  day: number,        // 0 (Monday) to 6
  meal: 'lunch' | 'dinner',
  recipe: string,     // the id of a recipe
}
```

A meal with no recipe has no record. See [13-menu.md](13-menu.md).

## Invariants

- **DATA-1** An item is one record. It is never copied between the lists; a view computes where it
  shows.
- **DATA-2** Item ids are unique. Recipe ids are unique.
- **DATA-3** Item names are unique with no case distinction, across the two lists. `Leche` and
  `leche` are one name; `Cafe` and `Café` are two.
- **DATA-4** Recipe names are unique with no case distinction.
- **DATA-5** The products of one recipe are unique with no case distinction.
- **DATA-6** `bought` is true only for an item of `list: 'active'`. A saved item is never ticked.
- **DATA-7** `again` is true only for an item that is ticked and not recurrent.
- **DATA-8** The shops of one item are unique with no case distinction, trimmed and not empty.
- **DATA-9** One shop has one spelling in the full state: the spelling of its first use.
- **DATA-10** `sent` holds only ids of recipes that exist, each one time.
- **DATA-11** A recipe and an item have no link. A product matches an item by name, with no case
  distinction, at the time of use. A rename of one does not change the other.
- **DATA-12** A shop has no record. It exists while an item has it.
- **DATA-13** `menu` has one record for each meal at most, in day and meal order. Its `recipe` is
  the id of a recipe that exists.
- **DATA-14** The names of `aisles` are trimmed, not empty and unique with no case distinction.
- **DATA-15** `item.aisle` is `''` or a name of `aisles`, in the spelling of `aisles`. An item has
  one aisle at most. See [17-aisles.md](17-aisles.md).

## Derived views

No view is stored.

| View | Function | Content |
|---|---|---|
| `Actual` | `activeItems` | The items of `list: 'active'`, those to buy first, then those ticked |
| `Próxima` | `nextItems` | The items of `list: 'next'`, then the ticked items of `Actual` that are recurrent or have `again` |
| `Volver a comprar` | `savedItems` | The items of `list: 'saved'`, in name order |
| Trip figures | `tripSummary` | `total`, `left`, `back`, `saved`, `incoming` |
| Recipe groups | `recipeGroups` | `Actual` by recipe |
| Shop groups | `shopGroups` | `Actual` or `Próxima` by shop |
| Shops in use | `shopNames` | Each shop of an item, in name order |
| Aisle groups | `aisleGroups` | `Actual` or `Próxima` by aisle, in the order of `aisles` |

`tripSummary` gives: `total`, the items of `Actual`; `left`, those not ticked; `back`, the ticked
ones that are recurrent or have `again`; `saved`, the one-time items of `Actual` with no `again`,
ticked or not; `incoming`, the items of
`list: 'next'`.

## Name rules

| Use | Rule |
|---|---|
| Identity of an item, a recipe, a product, a shop, an aisle | `toLowerCase()`: no case distinction, accents count |
| Search of items and of recipes | `fold`: trimmed, lower case, accents removed |
| Order by name | `localeCompare(…, 'es', { sensitivity: 'base' })`: no case and no accent distinction, in each language of the screen |

## Not in the state

- The language that the user chose. It is a preference of the device, with its own key. See
  [09-languages.md](09-languages.md).
- The section that is open, an open row, the text of a search and each other state of the screen.
  A start of the app shows `Actual` with all rows closed.
- The state before the last change, which `Deshacer` uses. It lives only while its message shows.
