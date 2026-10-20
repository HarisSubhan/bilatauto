import { createFileRoute } from "@tanstack/react-router";
import { MasterPage, type FieldDef } from "@/components/data/MasterPage";

const FIELDS: FieldDef[] = [
  { key: "serial_number", label: "Serial No." },
  { key: "hs_code", label: "HS Code", required: true },
  { key: "description", label: "Description", required: true, type: "textarea" },
];

export const Route = createFileRoute("/_authenticated/fbr-hs-codes")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "FBR HS Codes — Spare Parts System" },
      { name: "description", content: "Official FBR HS codes with their descriptions." },
      { property: "og:title", content: "FBR HS Codes — Spare Parts System" },
      { property: "og:description", content: "Official FBR HS codes with their descriptions." },
    ],
  }),
  component: () => (
    <MasterPage
      table="fbr_hs_codes"
      title="FBR HS Codes"
      description="Official FBR code list used on quotations and invoices"
      fields={FIELDS}
      searchFields={["hs_code", "description", "serial_number"]}
      autoSerial="serial_number"
    />
  ),
});
