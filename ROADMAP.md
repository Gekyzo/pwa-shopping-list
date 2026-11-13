# Roadmap

Planned features, not in order of priority. `CHANGELOG.md` records what shipped.

## Planned

- **Optional reagents**. Make reagents optional.
- **Recipe categories.** Give each recipe one or more categories, such as
  lunch, dinner or healthy, and filter the recipes by category.
- **Buy me a coffee.** Add support link

### Deferred

Not needed yet. Each item names what makes it needed.

- **Browser database.** Store the data in the browser database instead of
  `localStorage`. Unnecessary until the app stores images, such as receipt
  photos or recipe pictures, which do not fit in `localStorage`.
- **Price estimation.** Estimate the price of a list. Unnecessary until the
  products have prices, from a price field or from **Purchase history**.
- **Send a copy.** Send a list to a contact as a link, through the Android
  share sheet. The list travels in the link fragment, with no server and no
  login. The contact gets a copy; later changes do not sync. Unnecessary until a
  second person shops from the lists.

## Pro

Candidate features for a paid version. Nothing here is committed. The free
version keeps `Compra`, `Recetas`, `Menú` and offline use.

### Cloud storage

Back up the data to a server and restore it on a new phone with a recovery
link, with no login. The features below need its server.

- **Automatic backup.** Back up the data to the server at a frequency chosen in
  `Ajustes`: never, daily, weekly or monthly. Each backup replaces the one
  before. On a phone with no data, the app offers to restore the backup. A
  backup in the phone does not survive **Clear site data** or an uninstall, and
  a PWA cannot replace or read a file in `Descargas` on its own.

- [x] **Sync between devices.** Keep the lists the same on a phone, a tablet and the
  web. Shipped with a Google account on the PocketBase server, not with a recovery
  link.
- [x] **Live shared list.** Share a list with a contact so that both edit the same
  list. Shipped as an invite by email between two accounts: the member sees the
  shared list beside the own one, and the owner chooses whether recipes and the
  menu are shared too. User feedback: a family needs the same list on several
  devices every day.

### AI integration

Add items from free text, a photo or a voice note; group them by store
section; suggest substitutes for missing products. The features below need its
model.

- **Automatic recipes and menus.** Generate recipes and a weekly menu from
  preferences, diets and the products at home, and add the missing products to
  `Compra`.
- **Receipt scan.** Read a photo of a receipt to tick the items, record the
  prices and keep the total.

### Purchase history

Record each purchase on the phone: the product, the date, the shop and the
price. It needs the **Browser database**. The features below need the history.

- **Restock.** Learn how often each product is bought and suggest it when it is
  likely to run out.
- **Price history.** Show the price trend of each product and the cheapest
  shop. Extends **Price estimation**.
- **Spend statistics.** Spend by month, by shop and by store section.

### Other

- **Barcode scanner.** Add an item from the barcode of a product, with the
  camera of the phone. Implemented on the branch `barcode-scanner`, not yet
  merged into `main`.
- **Pantry.** Track the products at home, with expiry dates and a reminder
  before a product expires. Feeds the menu generation.
- **Nutrition.** Show calories and nutrients for a recipe and for the weekly
  menu.
