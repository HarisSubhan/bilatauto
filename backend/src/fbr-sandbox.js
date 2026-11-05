import { z } from 'zod';
import { SCENARIOS } from './fbr.js';
import { validTaxId, normalizeTaxId } from './tax-id.js';
const text = z.string().trim().max(300);
const amount = z.number().finite().min(0);
export const sellerSettingsSchema = z.object({
  fbr_seller_name: text.min(1), fbr_seller_address: text.min(1),
  fbr_seller_ntn: z.string().trim().max(20).refine(v => !v || (validTaxId(v) && normalizeTaxId(v).length === 7), 'Enter a valid IRIS NTN; letters and dash are supported'),
  fbr_seller_cnic: z.string().trim().regex(/^(\d{13})?$/, 'CNIC must be 13 digits'),
  fbr_seller_province: text.min(1),
  fbr_default_scenario: z.string().refine(s => !!SCENARIOS[s], 'Unknown scenario'),
}).refine(s => !!(s.fbr_seller_ntn || s.fbr_seller_cnic), 'Enter NTN or CNIC');
export function sellerFromSettings(s) {
  return { ntn: s.fbr_seller_ntn || s.fbr_seller_cnic, name: s.fbr_seller_name || s.company_name,
    address: s.fbr_seller_address || s.company_address, province: s.fbr_seller_province };
}
export const sandboxSchema = z.object({
  scenarioId: z.string().refine(s => !!SCENARIOS[s], 'Choose one of SN001–SN028'),
  invoiceType: z.enum(['Sale Invoice', 'Debit Note']),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), invoiceRefNo: text,
  buyerNTNCNIC: z.string().trim().max(20).refine(v => !v || validTaxId(v), 'Enter a valid IRIS NTN or CNIC'),
  buyerBusinessName: text.min(1), buyerProvince: text.min(1), buyerAddress: text.min(1),
  buyerRegistrationType: z.enum(['Registered', 'Unregistered']),
  items: z.array(z.object({
    hsCode: z.string().regex(/^\d{4}\.\d{4}$/), productDescription: text.min(1), rate: text.min(1), uoM: text.min(1),
    quantity: z.number().finite().positive(), totalValues: amount, valueSalesExcludingST: amount,
    fixedNotifiedValueOrRetailPrice: amount, salesTaxApplicable: amount, salesTaxWithheldAtSource: amount,
    extraTax: amount, furtherTax: amount, fedPayable: amount, discount: amount,
    sroScheduleNo: text, saleType: text.min(1), sroItemSerialNo: text,
  })).min(1).max(100),
});
export function sandboxPayload(input, settings) {
  const p = sandboxSchema.parse(input); const s = sellerFromSettings(settings);
  return { ...p, buyerNTNCNIC: normalizeTaxId(p.buyerNTNCNIC), sellerNTNCNIC: normalizeTaxId(s.ntn), sellerBusinessName: s.name || '', sellerAddress: s.address || '', sellerProvince: s.province || '' };
}
