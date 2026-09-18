/**
 * Ordmärket "DatorHuset".
 *
 * Enligt BRAND.md: alltid ett ord, alltid stort D och stort H, "Dator" i
 * cyan och "Huset" i plommon. Färgerna är låsta hex och inte tokens -
 * ordmärket ska se likadant ut i ljust som mörkt läge, precis som en
 * tryckt logotyp gör.
 *
 * Namnet kommer från inställningarna och kan ändras i adminvyn. Står det
 * något annat än DatorHuset renderas det som det är, i ärvd färg -
 * tvåfärgningen gäller just det här ordet och inget annat.
 */

const CYAN = "#3FD9F5";
const PLUM = "#B26BDE";

type WordmarkProps = {
  name: string;
  className?: string;
};

export const Wordmark = ({ name, className = "" }: WordmarkProps) => {
  const trimmed = String(name ?? "").trim();

  // Dela vid "huset" oavsett skiftläge, men behåll skrivningen som den är.
  const splitAt = trimmed.toLowerCase().lastIndexOf("huset");
  const canSplit = splitAt > 0 && splitAt + "huset".length === trimmed.length;

  if (!canSplit) {
    return <span className={className}>{trimmed}</span>;
  }

  return (
    <span className={className}>
      <span style={{ color: CYAN }}>{trimmed.slice(0, splitAt)}</span>
      <span style={{ color: PLUM }}>{trimmed.slice(splitAt)}</span>
    </span>
  );
};

export default Wordmark;
