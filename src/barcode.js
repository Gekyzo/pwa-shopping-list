// The product codes that the scan reads: the codes of a shop, not QR codes.
export const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

// UPC-E has 6 or 8 digits, a GTIN 14 at most.
export const isBarcode = (code) => typeof code === 'string' && /^\d{6,14}$/.test(code);

// `codes` holds the name of each code that the user named: the app has no product database.
export const nameOfCode = (state, code) => (Object.hasOwn(state.codes, code) ? state.codes[code] : null);

export const learnCode = (state, code, rawName) => {
  if (!isBarcode(code)) return { state, error: { key: 'error.invalidCode' } };
  const name = String(rawName ?? '').trim();
  if (!name) return { state, error: { key: 'error.nameRequired' } };
  if (nameOfCode(state, code) === name) return { state };
  return { state: { ...state, codes: { ...state.codes, [code]: name } } };
};
