import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head:()=>({meta:[{title:"Bilal Autos — Spare Parts Portal"},{name:"description",content:"Automobile spare parts purchases, inventory and invoicing portal."},{property:"og:title",content:"Bilal Autos — Spare Parts Portal"},{property:"og:description",content:"Automobile spare parts purchases, inventory and invoicing portal."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
