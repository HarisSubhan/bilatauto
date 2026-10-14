import { createFileRoute } from "@tanstack/react-router";
import { MasterPage, type FieldDef } from "@/components/data/MasterPage";

const FIELDS: FieldDef[] = [
  { key: "name", label: "Department / Buyer", required: true },
  { key: "code", label: "Code" },
  { key: "contact_person", label: "Contact Person" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", type: "email" },
  { key: "tax_number", label: "Tax / Registration No.", inList: false },
  { key: "address", label: "Address", type: "textarea", inList: false },
  { key: "notes", label: "Notes", type: "textarea", inList: false },
  { key: "status", label: "Status", type: "select", options: ["active", "inactive", "suspended"], inList: false },
];

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({
    meta: [
      { title: "Departments & Buyers — Spare Parts System" },
      { name: "description", content: "Manage departments and buyers who request and approve quotations." },
      { property: "og:title", content: "Departments & Buyers — Spare Parts System" },
      {
        property: "og:description",
        content: "Manage departments and buyers who request and approve quotations.",
      },
    ],
  }),
  component: () => (
    <MasterPage
      table="departments"
      title="Departments / Buyers"
      description="Departments and buyers that request spare parts"
      fields={FIELDS}
      searchFields={["name", "code", "contact_person", "phone", "email"]}
    />
  ),
});
