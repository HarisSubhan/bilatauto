import { createFileRoute } from "@tanstack/react-router";
import { MasterPage, type FieldDef } from "@/components/data/MasterPage";

const FIELDS: FieldDef[] = [
  { key: "serial_number", label: "Serial No." },
  { key: "hs_code", label: "HS Code", required: true },
  { key: "description", label: "Description", required: true, type: "textarea" },
  { key: "fbr_hs_code", label: "FBR HS Code (if different)", placeholder: "Leave blank if same as HS code" },
];

export const Route = createFileRoute("/_authenticated/custom-hs-codes")({
  head: () => ({
    meta: [
      { title: "Custom HS Codes — Spare Parts System" },
      { name: "description", content: "Your own HS code list with business descriptions and prices." },
      { property: "og:title", content: "Custom HS Codes — Spare Parts System" },
      {
        property: "og:description",
        content: "Your own HS code list with business descriptions and prices.",
      },
    ],
  }),
  component: () => (
    <MasterPage
      table="custom_hs_codes"
      title="Custom HS Codes"
      description="Your own code list with business descriptions and prices"
      fields={FIELDS}
      searchFields={["hs_code", "description", "serial_number", "fbr_hs_code"]}
      autoSerial="serial_number"
    />
  ),
});
