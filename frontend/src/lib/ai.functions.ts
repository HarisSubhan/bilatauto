import { api } from "@/lib/db";

export type ExtractedItem = { name: string; quantity: number; unit_price: number | null };

export const extractQuotationItems = ({ data }: { data: { image?: string; text?: string } }) =>
  api("/ai/extract", data) as Promise<{ items: ExtractedItem[]; mode?: string }>;
