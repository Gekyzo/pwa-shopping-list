# Barcode

Rules of `src/barcode.js`, of `renameItem` in `src/store.js`, and of `src/ui/scan.js` and `src/ui/add.js`. The app has no product database:
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

## Scan

- **CODE-6** In `Compra`, the add sheet has the icon button **Escanear código de barras** between
  the name field and **Añadir**. It shows only when the phone has `BarcodeDetector` with one of
  the formats of CODE-1 and a camera API. It never shows in `Recetas`.
- **CODE-7** A tap opens the sheet **Escanear código** over the add sheet: the image of the rear
  camera, the hint `Apunta la cámara al código de barras del producto.` and **Cancelar**. The app
  reads the image each 250 ms; a value that is not a barcode is ignored.
- **CODE-8** The first barcode closes the scan sheet and stops the camera. **Cancelar**, a tap out
  of the sheet, `Escape` and a page that goes out of view also close it and stop the camera.
  `Escape` closes the scan sheet only; the add sheet stays.
- **CODE-9** A known code does what **Añadir** does with its name (ADD-5 to ADD-7), with the
  same messages.
- **CODE-10** An unknown code waits for a name: the field is empty, its placeholder is
  `Nombre del producto escaneado`, and the message `Código nuevo. Escribe su nombre.` shows. The
  next add of the sheet (**Añadir**, `+ Crear «name»` or a tap on a listed item) also learns the
  code for the name of that item. When the add shows `Deshacer` (ADD-6), it takes back both. An
  add that changes nothing but the code shows `Código guardado para "name".`. A close of the add
  sheet, or a new scan, drops the waiting code.
- **CODE-11** A refused camera permission shows `Sin permiso para la cámara.` (`error.cameraDenied`).
  Another failure of the camera shows `No se pudo abrir la cámara.` (`error.cameraFailed`).

Limits: no fallback reader for a browser with no `BarcodeDetector`, no QR code, no product
database. No list of the learned codes, and no forget of one code. A wrong name is corrected with a
rename of its item (CODE-5). The backup carries the codes.
