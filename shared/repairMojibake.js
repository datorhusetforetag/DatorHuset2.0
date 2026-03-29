const MOJIBAKE_PATTERN = /(?:Ã.|Â.|â.|ð.|�)/;
const utf8Decoder = new TextDecoder("utf-8");

const decodeLatin1BytesAsUtf8 = (value) => {
  const bytes = Uint8Array.from(Array.from(value, (character) => character.charCodeAt(0) & 0xff));
  return utf8Decoder.decode(bytes);
};

export const repairMojibakeString = (value) => {
  if (typeof value !== "string" || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  let current = value;
  for (let index = 0; index < 3; index += 1) {
    if (!MOJIBAKE_PATTERN.test(current)) {
      break;
    }
    const next = decodeLatin1BytesAsUtf8(current);
    if (!next || next === current) {
      break;
    }
    current = next;
  }

  return current;
};

export const repairMojibakeValue = (value) => {
  if (typeof value === "string") {
    return repairMojibakeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => repairMojibakeValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, repairMojibakeValue(entry)])
    );
  }

  return value;
};
