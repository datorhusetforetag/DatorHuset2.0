import cs2 from "../../images/cs2.jpg";
import cyberpunk from "../../images/Cyberpunk 2077.jfif";
import fortnite from "../../images/fortnite.jpg";
import ghostOfTsushima from "../../images/Ghost Of Tsushima.jpg";
import gta5 from "../../images/Gta 5.jpg";
import minecraft from "../../images/minecraft.jpg";

/**
 * Omslagsbild per spel.
 *
 * Nycklarna är samma namn som står i FPS-profilerna
 * (ADMIN_FPS_GAME_OPTIONS i shared/adminListingContract.js). Läggs ett
 * spel till där utan att få en bild här visas rutan med sitt namn i
 * stället, vilket är avsiktligt: en saknad bild ska inte kunna ta bort
 * en siffra kunden ska se.
 *
 * Uppslaget är okänsligt för versaler och skiljetecken, eftersom
 * namnen skrivs för hand i adminläget och "CS2" och "cs 2" ska hitta
 * samma bild.
 */

const BY_KEY: Record<string, string> = {
  fortnite,
  cyberpunk2077: cyberpunk,
  ghostoftsushima: ghostOfTsushima,
  gta5,
  minecraft,
  cs2,
};

const normalize = (name: string) =>
  String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** Omslaget för ett spel, eller null när vi inte har något. */
export const gameArtFor = (game: string): string | null => BY_KEY[normalize(game)] ?? null;
