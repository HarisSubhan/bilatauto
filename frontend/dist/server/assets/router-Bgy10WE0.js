import { a as db } from "./bilal-logo.asset-DRcrRZxD.js";
import { _ as themeInitScript, g as ThemeProvider, y as AuthProvider } from "./AppShell-Ctpjmt0k.js";
import { n as Route$18 } from "./invoices-DmhtMi43.js";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, redirect, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
//#region src/styles.css?url
var styles_default = "/assets/styles-DqJrTXi8.css";
//#endregion
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ jsx(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$17 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Spare Parts Management & Invoicing System" },
			{
				name: "description",
				content: "Automobile spare parts inventory, purchases, quotations, approvals and invoicing."
			},
			{
				name: "author",
				content: "Bilal Autos"
			},
			{
				property: "og:title",
				content: "Spare Parts Management & Invoicing System"
			},
			{
				property: "og:description",
				content: "Automobile spare parts inventory, purchases, quotations, approvals and invoicing."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsxs("head", { children: [/* @__PURE__ */ jsx("script", { dangerouslySetInnerHTML: { __html: themeInitScript } }), /* @__PURE__ */ jsx(HeadContent, {})] }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$17.useRouteContext();
	return /* @__PURE__ */ jsx(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ jsx(ThemeProvider, { children: /* @__PURE__ */ jsxs(AuthProvider, { children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(Toaster$1, {
			richColors: true,
			position: "top-right"
		})] }) })
	});
}
//#endregion
//#region src/routes/index.tsx
var Route$16 = createFileRoute("/")({ beforeLoad: () => {
	throw redirect({ to: "/dashboard" });
} });
//#endregion
//#region src/routes/_authenticated/route.tsx
var $$splitComponentImporter$15 = () => import("./route-Di7iQBCH.js");
var Route$15 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await db.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
//#endregion
//#region src/routes/auth.tsx
var $$splitComponentImporter$14 = () => import("./auth-Aq2srBHV.js");
var Route$14 = createFileRoute("/auth")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "Sign in — Bilal Autos Spare Parts System" },
		{
			name: "description",
			content: "Sign in to manage spare parts inventory, purchases, quotations and invoices."
		},
		{
			property: "og:title",
			content: "Sign in — Bilal Autos Spare Parts System"
		},
		{
			property: "og:description",
			content: "Secure access to the spare parts management and invoicing portal."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
//#endregion
//#region src/routes/_authenticated/activity-logs.tsx
var $$splitComponentImporter$13 = () => import("./activity-logs-FvKYYyQF.js");
var Route$13 = createFileRoute("/_authenticated/activity-logs")({
	head: () => ({ meta: [
		{ title: "Activity Logs — Spare Parts System" },
		{
			name: "description",
			content: "Who created, changed or deleted records, and when."
		},
		{
			property: "og:title",
			content: "Activity Logs — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Who created, changed or deleted records, and when."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
//#endregion
//#region src/routes/_authenticated/ai-quotation.tsx
var $$splitComponentImporter$12 = () => import("./ai-quotation-B7HAK74P.js");
var Route$12 = createFileRoute("/_authenticated/ai-quotation")({
	head: () => ({ meta: [
		{ title: "AI Quotation from Image — Spare Parts System" },
		{
			name: "description",
			content: "Upload a photo of a parts list and get a draft quotation with matched HS codes."
		},
		{
			property: "og:title",
			content: "AI Quotation from Image — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Upload a photo of a parts list and get a draft quotation with matched HS codes."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
//#endregion
//#region src/routes/_authenticated/custom-hs-codes.tsx
var $$splitComponentImporter$11 = () => import("./custom-hs-codes-K3RccCO_.js");
var Route$11 = createFileRoute("/_authenticated/custom-hs-codes")({
	head: () => ({ meta: [
		{ title: "Custom HS Codes — Spare Parts System" },
		{
			name: "description",
			content: "Your own HS code list with business descriptions and prices."
		},
		{
			property: "og:title",
			content: "Custom HS Codes — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Your own HS code list with business descriptions and prices."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
//#endregion
//#region src/routes/_authenticated/dashboard.tsx
var $$splitComponentImporter$10 = () => import("./dashboard-Btyo8BcT.js");
var Route$10 = createFileRoute("/_authenticated/dashboard")({
	head: () => ({ meta: [
		{ title: "Dashboard — Spare Parts System" },
		{
			name: "description",
			content: "Live overview of stock, purchases, quotations, approvals and invoices."
		},
		{
			property: "og:title",
			content: "Dashboard — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Live overview of stock, purchases, quotations, approvals and invoices."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
//#endregion
//#region src/routes/_authenticated/departments.tsx
var $$splitComponentImporter$9 = () => import("./departments-BRkTM_DM.js");
var Route$9 = createFileRoute("/_authenticated/departments")({
	head: () => ({ meta: [
		{ title: "Departments & Buyers — Spare Parts System" },
		{
			name: "description",
			content: "Manage departments and buyers who request and approve quotations."
		},
		{
			property: "og:title",
			content: "Departments & Buyers — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Manage departments and buyers who request and approve quotations."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
//#endregion
//#region src/routes/_authenticated/fbr-hs-codes.tsx
var $$splitComponentImporter$8 = () => import("./fbr-hs-codes-CSEnVnxv.js");
var Route$8 = createFileRoute("/_authenticated/fbr-hs-codes")({
	head: () => ({ meta: [
		{ title: "FBR HS Codes — Spare Parts System" },
		{
			name: "description",
			content: "Official FBR HS codes with their descriptions."
		},
		{
			property: "og:title",
			content: "FBR HS Codes — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Official FBR HS codes with their descriptions."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
//#endregion
//#region src/routes/_authenticated/purchases.tsx
var $$splitComponentImporter$7 = () => import("./purchases-CpTl71lM.js");
var Route$7 = createFileRoute("/_authenticated/purchases")({
	head: () => ({ meta: [
		{ title: "Purchases — Spare Parts System" },
		{
			name: "description",
			content: "Record supplier purchases; verified purchases add stock automatically."
		},
		{
			property: "og:title",
			content: "Purchases — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Record supplier purchases; verified purchases add stock automatically."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
//#endregion
//#region src/routes/_authenticated/quotations.tsx
var $$splitComponentImporter$6 = () => import("./quotations-Dcf8ZlOG.js");
var Route$6 = createFileRoute("/_authenticated/quotations")({
	head: () => ({ meta: [
		{ title: "Quotations — Spare Parts System" },
		{
			name: "description",
			content: "Create quotations, submit for approval, and auto-convert approved quotations to invoices."
		},
		{
			property: "og:title",
			content: "Quotations — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Create quotations, submit for approval, and auto-convert approved quotations to invoices."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
//#endregion
//#region src/routes/_authenticated/reports.tsx
var $$splitComponentImporter$5 = () => import("./reports-2I6fCvKm.js");
var Route$5 = createFileRoute("/_authenticated/reports")({
	head: () => ({ meta: [
		{ title: "Reports — Spare Parts System" },
		{
			name: "description",
			content: "Department-wise sales, supplier-wise purchases, quotation, invoice and stock reports with filters and export."
		},
		{
			property: "og:title",
			content: "Reports — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Department-wise sales, supplier-wise purchases, quotation, invoice and stock reports with filters and export."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
//#endregion
//#region src/routes/_authenticated/sales-invoices.tsx
var $$splitComponentImporter$4 = () => import("./sales-invoices-CuO5ZpTM.js");
var Route$4 = createFileRoute("/_authenticated/sales-invoices")({
	head: () => ({ meta: [{ title: "Offline Sales Tax Invoices — Bilal Autos" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
//#endregion
//#region src/routes/_authenticated/settings.tsx
var $$splitComponentImporter$3 = () => import("./settings-Bm69a48z.js");
/** Resize an uploaded image to a small PNG data URL so it can live in settings. */
var Route$3 = createFileRoute("/_authenticated/settings")({
	head: () => ({ meta: [
		{ title: "Settings — Spare Parts System" },
		{
			name: "description",
			content: "Company details, invoice footer, currency and FBR configuration."
		},
		{
			property: "og:title",
			content: "Settings — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Company details, invoice footer, currency and FBR configuration."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
//#endregion
//#region src/routes/_authenticated/stock.tsx
var $$splitComponentImporter$2 = () => import("./stock-BRXrhUvM.js");
var Route$2 = createFileRoute("/_authenticated/stock")({
	head: () => ({ meta: [
		{ title: "Inventory — Spare Parts System" },
		{
			name: "description",
			content: "Current stock by HS code and full stock in/out ledger."
		},
		{
			property: "og:title",
			content: "Inventory — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Current stock by HS code and full stock in/out ledger."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
//#endregion
//#region src/routes/_authenticated/suppliers.tsx
var $$splitComponentImporter$1 = () => import("./suppliers-l8iu2GMr.js");
var Route$1 = createFileRoute("/_authenticated/suppliers")({
	head: () => ({ meta: [
		{ title: "Suppliers — Spare Parts System" },
		{
			name: "description",
			content: "Manage spare parts suppliers, contacts and tax details."
		},
		{
			property: "og:title",
			content: "Suppliers — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Manage spare parts suppliers, contacts and tax details."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/_authenticated/users.tsx
var $$splitComponentImporter = () => import("./users-BwiINNAf.js");
var Route = createFileRoute("/_authenticated/users")({
	head: () => ({ meta: [
		{ title: "Users & Roles — Spare Parts System" },
		{
			name: "description",
			content: "Manage user accounts, roles and module permissions."
		},
		{
			property: "og:title",
			content: "Users & Roles — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Manage user accounts, roles and module permissions."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var IndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$17
});
var AuthenticatedRouteRoute = Route$15.update({
	id: "/_authenticated",
	getParentRoute: () => Route$17
});
var AuthRoute = Route$14.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$17
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedActivityLogsRoute: Route$13.update({
		id: "/activity-logs",
		path: "/activity-logs",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedAiQuotationRoute: Route$12.update({
		id: "/ai-quotation",
		path: "/ai-quotation",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedCustomHsCodesRoute: Route$11.update({
		id: "/custom-hs-codes",
		path: "/custom-hs-codes",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedDashboardRoute: Route$10.update({
		id: "/dashboard",
		path: "/dashboard",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedDepartmentsRoute: Route$9.update({
		id: "/departments",
		path: "/departments",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedFbrHsCodesRoute: Route$8.update({
		id: "/fbr-hs-codes",
		path: "/fbr-hs-codes",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedInvoicesRoute: Route$18.update({
		id: "/invoices",
		path: "/invoices",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedPurchasesRoute: Route$7.update({
		id: "/purchases",
		path: "/purchases",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedQuotationsRoute: Route$6.update({
		id: "/quotations",
		path: "/quotations",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedReportsRoute: Route$5.update({
		id: "/reports",
		path: "/reports",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedSalesInvoicesRoute: Route$4.update({
		id: "/sales-invoices",
		path: "/sales-invoices",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedSettingsRoute: Route$3.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedStockRoute: Route$2.update({
		id: "/stock",
		path: "/stock",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedSuppliersRoute: Route$1.update({
		id: "/suppliers",
		path: "/suppliers",
		getParentRoute: () => AuthenticatedRouteRoute
	}),
	AuthenticatedUsersRoute: Route.update({
		id: "/users",
		path: "/users",
		getParentRoute: () => AuthenticatedRouteRoute
	})
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute
};
var routeTree = Route$17._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
