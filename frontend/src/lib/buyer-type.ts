import { validTaxId } from "./tax-id";
export type BuyerType = "Registered" | "Unregistered";

/** Suggest a buyer type from the department's saved registration type only (never from a blank tax number). */
export function suggestBuyerType(registrationType?: string | null): BuyerType | "" {
  const r = (registrationType ?? "").trim().toLowerCase();
  if (r === "registered") return "Registered";
  if (r === "unregistered") return "Unregistered";
  return "";
}

/**
 * FBR DI API: buyerRegistrationType is "Registered" or "Unregistered"; a Registered buyer needs a
 * buyerNTNCNIC of seven characters (NTN, alphabets supported) or 13 digits (CNIC).
 * Returns a plain-language problem or null.
 */
export function buyerTypeProblem(type: string, taxNumber?: string | null): string | null {
  if (!type) return "Choose a buyer type (Registered or Unregistered).";
  if (type !== "Registered" && type !== "Unregistered") return "Buyer type must be Registered or Unregistered.";
  if ((type === "Registered" || taxNumber?.trim()) && !validTaxId(taxNumber))
    return "Enter a valid buyer NTN or 13-digit CNIC in Departments / Buyers. NTN letters and dashes are supported (for example C01245-5).";
  return null;
}
