/** Key-free OCR. Handwriting is imperfect: always review text and item matches. */
export function parseQuotationText(text: string) {
  const vehicle_number = text.match(/(?:vehicle|veh|registration|reg|car)\s*(?:no\.?|number|#)?\s*[:=\-]?\s*([A-Z]{1,4}[- ]?\d{2,6})/i)?.[1] ?? "";
  const vehicle_type = text.match(/(?:vehicle type|model|make)\s*[:=]\s*([^\n]+)/i)?.[1]?.trim() ?? "";
  const items = text.split(/\n/).flatMap(raw => {
    const line = raw.trim();
    if (!line || /^(?:total|subtotal|grand|gst|tax|invoice|quotation|date|vehicle|qty|quantity|particulars|bill|model|make)\b/i.test(line)) return [];
    const m = line.match(/^(\d+(?:\.\d+)?)\s+(?:pcs?\s+)?(.+?)(?:\s+(\d[\d,]*(?:\.\d+)?))?$/);
    if (m && /[a-z]/i.test(m[2]!)) return [{ name: m[2]!.trim(), quantity: Number(m[1]), unit_price: m[3] ? Number(m[3].replace(/,/g,"")) : 0 }];
    const n = line.match(/^(.+?[a-z].*?)\s+[x×]\s*(\d+(?:\.\d+)?)(?:\s+[@=]\s*(\d[\d,.]*))?$/i);
    return n ? [{ name: n[1]!.trim(), quantity: Number(n[2]), unit_price: n[3] ? Number(n[3].replace(/,/g,"")) : 0 }] : [];
  });
  return { vehicle_number, vehicle_type, items: items.slice(0,200) };
}
export async function readLocalImage(image: string, onProgress: (p: number) => void) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { logger: m => { if (m.status === "recognizing text") onProgress(Math.round(m.progress * 100)); } });
  try {
    const { data } = await worker.recognize(image);
    return { text: data.text, confidence: data.confidence, ...parseQuotationText(data.text) };
  } finally { await worker.terminate(); }
}