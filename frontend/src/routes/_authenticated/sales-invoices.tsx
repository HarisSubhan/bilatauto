import { createFileRoute } from "@tanstack/react-router";
import { InvoicesPage } from "./invoices";
export const Route = createFileRoute("/_authenticated/sales-invoices")({
  head: () => ({ meta: [{ title: "Offline Sales Tax Invoices — Bilal Autos" }] }),
  component: () => <InvoicesPage salesTax />,
});