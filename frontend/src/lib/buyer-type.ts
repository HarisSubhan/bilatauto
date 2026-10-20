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
 * buyerNTNCNIC of 7 digits (NTN) or 13 digits (CNIC). Returns a plain-language problem or null.
 */
export function buyerTypeProblem(type: string, taxNumber?: string | null): string | null {
  if (!type) return "Choose a buyer type (Registered or Unregistered).";
  if (type !== "Registered" && type !== "Unregistered") return "Buyer type must be Registered or Unregistered.";
  const digits = (taxNumber ?? "").replace(/\D/g, "");
  if (type === "Registered" && digits.length !== 7 && digits.length !== 9 && digits.length !== 13)
    return "A Registered buyer needs a valid NTN (7 or 9 digits) or CNIC (13 digits). Add it to this buyer in Departments / Buyers, or choose Unregistered.";
  return null;
}
