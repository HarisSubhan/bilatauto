/**
 * Extra FBR fields each Type of Goods (FBR "sale type") needs on a sales line.
 * Mirrors src/lib/goods-rules.ts in the app — keep both lists identical.
 */
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Sale types where FBR needs the Fixed / Notified Value or Retail Price, and sales tax is charged on it. */
export const RETAIL_PRICE_TYPES = ['3rd Schedule Goods'];
/** Sale types where FBR needs an SRO / Schedule number and the item serial number within it. */
export const SRO_REQUIRED_TYPES = ['Goods at Reduced Rate', 'Goods at zero-rate', 'Exempt goods', 'Goods as per SRO.297(I)/2023', 'Non-Adjustable Supplies'];

export const needsRetailPrice = (type) => RETAIL_PRICE_TYPES.some((t) => norm(t) === norm(type));
export const needsSro = (type) => SRO_REQUIRED_TYPES.some((t) => norm(t) === norm(type));
