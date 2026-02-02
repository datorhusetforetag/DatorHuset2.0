export const decodeUnicodeEscapes = (value: string) =>
  value
    .replace(/\\u00e4/g, "ä")
    .replace(/\\u00c4/g, "Ä")
    .replace(/\\u00f6/g, "ö")
    .replace(/\\u00d6/g, "Ö")
    .replace(/\\u00e5/g, "å")
    .replace(/\\u00c5/g, "Å");
