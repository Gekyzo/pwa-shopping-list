# Barcode

Rules of `src/barcode.js` and of `renameItem` in `src/store.js`. The app has no product database:
it learns the item name of each code that the user names.

## Codes

- **CODE-1** A barcode is a text of 6 to 14 digits: EAN-13, EAN-8, UPC-A or UPC-E. Another value
  gives `error.invalidCode`.
- **CODE-2** `codes` holds one item name for each learned code. A code with no entry is unknown.
- **CODE-3** A learn of a code stores the trimmed name; an empty name gives `error.nameRequired`. A
  learn of a known code replaces its name. A learn of the name that the code has changes nothing.
- **CODE-4** A delete of an item keeps its codes: the next scan creates the item again.
- **CODE-5** A rename of an item also renames each code whose name is the old name, with no case
  distinction.

Limits: no list of the learned codes, and no forget of one code. A wrong name is corrected with a
rename of its item (CODE-5). The backup carries the codes.
