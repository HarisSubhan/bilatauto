import { createFileRoute } from "@tanstack/react-router";
import { MasterPage, type FieldDef } from "@/components/data/MasterPage";

const FIELDS: FieldDef[] = [
  { key: "name", label: "Department / Buyer", required: true },
  { key: "code", label: "Code" },
  { key: "contact_person", label: "Contact Person" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", type: "email" },
  { key: "tax_number", label: "Buyer NTN / CNIC", inList: false },
  { key: "address", label: "Address", type: "textarea", inList: false },
  { key: "province", label: "Buyer province (FBR)", type: "select", options: ["PUNJAB", "SINDH", "KHYBER PAKHTUNKHWA", "BALOCHISTAN", "CAPITAL TERRITORY", "GILGIT BALTISTAN", "AZAD JAMMU AND KASHMIR"], inList: false },
  { key: "registration_type", label: "FBR registration", type: "select", options: ["Registered", "Unregistered"], inList: false },
  { key: "notes", label: "Notes", type: "textarea", inList: false },
  { key: "status", label: "Status", type: "select", options: ["active", "inactive", "suspended"], inList: false },
];

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
