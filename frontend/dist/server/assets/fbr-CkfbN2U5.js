import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
//#region src/routes/_authenticated/fbr.tsx
var $$splitComponentImporter = () => import("./fbr-Q5dY22ZQ.js");
var Route = createFileRoute("/_authenticated/fbr")({
	validateSearch: z.object({ tab: z.enum([
		"invoices",
		"history",
		"settings",
		"sandbox"
	]).optional() }),
	head: () => ({ meta: [
		{ title: "FBR Digital Invoicing — Bilal Autos" },
		{
			name: "description",
			content: "Validate and submit sales tax invoices to FBR IRIS in Sandbox or Production."
		},
		{
			property: "og:title",
			content: "FBR Digital Invoicing — Bilal Autos"
		},
		{
			property: "og:description",
			content: "Validate and submit sales tax invoices to FBR IRIS in Sandbox or Production."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
