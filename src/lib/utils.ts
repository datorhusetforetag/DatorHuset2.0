import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/*
 * Meddelandet ur ett fel som kan vara vad som helst.
 *
 * catch fångar allt - ett Error, ett kastat objekt från ett
 * bibliotek, en sträng. Tidigare skrevs det ut som `err: any` och
 * `err?.message`, vilket funkar men släpper igenom vad som helst
 * längre ned. Här frågar vi i stället om det är ett Error, och
 * faller tillbaka på en text vi själva skrivit när det inte är det.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
