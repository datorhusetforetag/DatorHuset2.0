/**
 * Felet ur ett adminanrop, i klartext.
 *
 * Varje sida hade sin egen variant på
 *
 *   payload?.error?.message || payload?.error || "Kunde inte hämta X."
 *
 * vilket ser rimligt ut ända tills svaret inte är JSON. Då blir båda
 * leden undefined och kvar står reservtexten - alltså "Kunde inte hämta
 * kunderna" oavsett om servern sa 401, 500 eller inte fanns alls.
 *
 * Det kostade tre vändor att felsöka en gång: svaret var en 404 i HTML
 * från en server som inte startats om efter att rutten lagts till, och
 * ingenting i gränssnittet antydde det.
 *
 * Nu följer statuskoden alltid med. Den är kort, den är inte känslig,
 * och den skiljer "du saknar behörighet" från "rutten finns inte" från
 * "servern kraschade" utan att man behöver öppna nätverksfliken.
 */

type ApiErrorBody = {
  error?: string | { message?: string; code?: string } | null;
};

/** Läser felet ur ett svar som redan konstaterats vara icke-ok. */
export const readApiError = async (response: Response, fallback: string): Promise<string> => {
  const raw = await response.text().catch(() => "");

  let body: ApiErrorBody | null = null;
  try {
    body = raw ? (JSON.parse(raw) as ApiErrorBody) : null;
  } catch {
    /* Inte JSON. Vanligaste orsaken är att rutten inte finns och att
       Express svarar med en HTML-sida. Texten duger inte att visa, men
       statuskoden nedan säger vad som hände. */
    body = null;
  }

  const fromBody =
    body && typeof body.error === "object" && body.error?.message
      ? body.error.message
      : typeof body?.error === "string"
        ? body.error
        : "";

  if (fromBody) return `${fromBody} (${response.status})`;

  /* Ingen begriplig text i svaret. Då är koden det enda vi vet, och den
     är mer värd än en gissning. */
  if (response.status === 401) {
    return "Du är inte inloggad, eller så har inloggningen gått ut. (401)";
  }
  if (response.status === 403) {
    return "Din behörighet räcker inte för det här. (403)";
  }
  if (response.status === 404) {
    return `${fallback} Servern känner inte till adressen - kör den senaste koden? (404)`;
  }
  if (response.status === 503) {
    return "Tjänsten är inte konfigurerad. Kontrollera serverns miljövariabler. (503)";
  }
  return `${fallback} (${response.status})`;
};
