# Roadmap

Planned features, not in order of priority. `CHANGELOG.md` records what shipped.

## Planned

- **Browser database.** Store the data in the browser database instead of
  `localStorage`. Not before a feature needs it: history, photos or sync.
- **Price estimation.** Estimate the price of a list.
- **Send a copy.** Send a list to a contact as a link, through the Android
  share sheet. The list travels in the link fragment, with no server and no
  login. The contact gets a copy; later changes do not sync.
- **Store sections.** Add the category or section of the store to each product.
  The sections are configurable in the settings.
- **Quantities.** Add a quantity to each item.

## Pro

Candidate features for a paid version. Nothing here is committed. The free
version keeps `Actual`, `Próxima`, `Recetas`, `Menú` and offline use.

### Requested

- **Automatic recipes and menus.** Generate recipes and a weekly menu from
  preferences, diets and the products at home, and add the missing products to
  `Próxima`.
- **AI integration.** Add items from free text, a photo or a voice note; group
  them by store section; suggest substitutes for missing products.
- **Cloud storage.** Back up the data to a server and restore it on a new
  phone with a recovery link, with no login.

### Suggested

- **Sync between devices.** Keep the lists the same on a phone, a tablet and the
  web. Builds on cloud storage.
- **Live shared list.** Share a list with a contact so that both edit the same
  list. The link is the access: a random list id and an encryption key in the
  link fragment, with no login. A small server stores only encrypted changes;
  the phones merge them item by item. Uses the same server as sync.
- **Purchase history and restock.** Learn how often each product is bought and
  suggest it when it is likely to run out.
- **Price history.** Record the price of each product for each shop, show the
  trend and the cheapest shop. Extends **Price estimation**.
- **Receipt scan.** Read a photo of a receipt to tick the items, record the
  prices and keep the total.
- **Spend statistics.** Spend by month, by shop and by store section.
- **Pantry.** Track the products at home, with expiry dates and a reminder
  before a product expires. Feeds the menu generation.
- **Nutrition.** Show calories and nutrients for a recipe and for the weekly
  menu.
