import { createFileRoute } from "@tanstack/react-router";
import { InvoicesPage } from "./invoices";
export const Route = createFileRoute("/_authenticated/sales-invoices")({
  head: () => ({ meta: [{ title: "Offline Sales Tax Invoices — Bilal Autos" },{name:"description",content:"View, edit and download manual sales tax invoices; no FBR submission."},{property:"og:title",content:"Offline Sales Tax Invoices — Bilal Autos"},{property:"og:description",content:"View, edit and download manual sales tax invoices; no FBR submission."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}] }),
  component: () => <InvoicesPage salesTax />,
});