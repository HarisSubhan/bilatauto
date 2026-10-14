import { createFileRoute } from "@tanstack/react-router";
import { MasterPage, type FieldDef } from "@/components/data/MasterPage";

const FIELDS: FieldDef[] = [
  { key: "name", label: "Supplier Name", required: true },
  { key: "supplier_code", label: "Code" },
  { key: "contact_person", label: "Contact Person" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", type: "email" },
  { key: "city", label: "City" },
  { key: "country", label: "Country", inList: false },
  { key: "tax_number", label: "NTN / Tax No.", inList: false },
  { key: "address", label: "Address", type: "textarea", inList: false },
  { key: "notes", label: "Notes", type: "textarea", inList: false },
  { key: "status", label: "Status", type: "select", options: ["active", "inactive", "suspended"], inList: false },
];

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — Spare Parts System" },
      { name: "description", content: "Manage spare parts suppliers, contacts and tax details." },
      { property: "og:title", content: "Suppliers — Spare Parts System" },
      { property: "og:description", content: "Manage spare parts suppliers, contacts and tax details." },
    ],
  }),
  component: () => (
    <MasterPage
      table="suppliers"
      title="Suppliers"
      description="Companies you purchase spare parts from"
      fields={FIELDS}
      searchFields={["name", "supplier_code", "phone", "email", "city"]}
    />
  ),
});
