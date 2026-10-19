# Data model

## State

The app has one state object. Each operation returns a new object and never changes its input.

```js
{
  version: 9,
  items: [Item],      // insertion order, changed only by a manual move
  recipes: [Recipe],  // insertion order
  sent: [string],     // ids of the recipes sent to Compra in this trip, in send order
  group: 'recipe',    // 'recipe' | 'shop' | 'aisle' | 'none'
  sort: 'custom',     // 'custom' | 'name'
  menu: [Meal],       // the planned meals of the week, in day and meal order
  aisles: [string],   // the sections of the store, in the order of the walk
}
```

The empty state is `{ version: 9, items: [], recipes: [], sent: [], group: 'recipe', sort: 'custom', menu: [], aisles: [] }`.

## Item

```js
{
  id: string,         // crypto.randomUUID()
  name: string,       // trimmed, not empty
  recurrent: boolean, // comes back at each trip
  list: 'active' | 'saved', // 'saved': kept after a trip, out of Compra
  bought: boolean,    // ticked
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
  recipe: string,     // the id of a recipe, or absent with a dish
  dish: string,       // a name with no recipe, trimmed, 1 to 80 characters; absent with a recipe
}
```

A meal has a `recipe` or a `dish`, never both. A meal with no recipe and no dish has no record. See [13-menu.md](13-menu.md).

## Invariants

- **DATA-1** An item is one record. It is never copied; a view computes where it shows.
- **DATA-2** Item ids are unique. Recipe ids are unique.
- **DATA-3** Item names are unique with no case distinction, in `Compra` and saved. `Leche` and
  `leche` are one name; `Cafe` and `Café` are two.
- **DATA-4** Recipe names are unique with no case distinction.
- **DATA-5** The products of one recipe are unique with no case distinction.
- **DATA-6** `bought` is true only for an item of `list: 'active'`. A saved item is never ticked.
- **DATA-7** Removed: an item has no `again` field (STORE-8).
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
| `Compra` | `activeItems` | The items of `list: 'active'`, those to buy first, then those ticked |
| Trip figures | `tripSummary` | `total`, `left`, `back`, `saved` |
| Trip outcome | `tripOutcome` | `recurrent`, `kept`, `open`, `bought` |
| Recipe groups | `recipeGroups` | `Compra` by recipe |
| Shop groups | `shopGroups` | `Compra` by shop |
| Shops in use | `shopNames` | Each shop of an item, in name order |
| Aisle groups | `aisleGroups` | `Compra` by aisle, in the order of `aisles` |

`tripSummary` gives: `total`, the items of `Compra`; `left`, those not ticked; `back`, the
recurrent items, ticked or not, and the open items kept with `Aplazar` (TRIP-6); `saved`, the
other one-time items of `Compra`, ticked or not. `tripOutcome` splits the items of `Compra` by
where each one goes (TRIP-4): `recurrent` come back; `kept`, open items kept with `Aplazar`;
`open`, the other open items, saved; `bought`, ticked one-time items, saved. The four add up to
`total`.

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
  A start of the app shows `Compra` with all rows closed.
- The state before the last change, which `Deshacer` uses. It lives only while its message shows.
