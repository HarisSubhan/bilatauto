import * as React from "react";
import { jsx } from "react/jsx-runtime";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
//#region src/lib/db.ts
/**
* Small data client for the Node.js + MySQL backend.
* Mirrors the query style used across the screens:
*   db.from("purchases").select("*, suppliers(name)").eq("id", x).single()
* Every call is sent to POST /api/rest/:table and checked on the server.
*/
var API_URL = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/",
	"VITE_API_URL": "https://bilalautos.store"
}["VITE_API_URL"] ?? "";
var TOKEN_KEY = "ba-token";
var USER_KEY = "ba-user";
function readSession() {
	if (typeof window === "undefined") return null;
	const t = localStorage.getItem(TOKEN_KEY);
	const u = localStorage.getItem(USER_KEY);
	return t && u ? {
		access_token: t,
		user: JSON.parse(u)
	} : null;
}
async function api(path, body, method = body === void 0 ? "GET" : "POST") {
	const s = readSession();
	const res = await fetch(`${API_URL}/api${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			...s ? { Authorization: `Bearer ${s.access_token}` } : {}
		},
		...body === void 0 ? {} : { body: JSON.stringify(body) }
	});
	const json = await res.json().catch(() => ({}));
	if (res.status === 401 && s) {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
		emit("SIGNED_OUT", null);
	}
	if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
	return json;
}
var Query = class {
	table;
	q = {
		op: "select",
		filters: []
	};
	constructor(table) {
		this.table = table;
	}
	select(columns = "*", opts) {
		if (this.q["op"] === "select") this.q["op"] = "select";
		this.q["select"] = columns;
		if (opts?.count) this.q["count"] = true;
		if (opts?.head) this.q["head"] = true;
		return this;
	}
	insert(values) {
		this.q["op"] = "insert";
		this.q["values"] = values;
		return this;
	}
	upsert(values, opts) {
		this.q["op"] = "upsert";
		this.q["values"] = values;
		this.q["onConflict"] = opts?.onConflict;
		return this;
	}
	update(values) {
		this.q["op"] = "update";
		this.q["values"] = values;
		return this;
	}
	delete() {
		this.q["op"] = "delete";
		return this;
	}
	f(op, col, val) {
		this.q["filters"].push({
			op,
			col,
			val
		});
		return this;
	}
	eq(c, v) {
		return this.f("eq", c, v);
	}
	neq(c, v) {
		return this.f("neq", c, v);
	}
	gt(c, v) {
		return this.f("gt", c, v);
	}
	gte(c, v) {
		return this.f("gte", c, v);
	}
	lt(c, v) {
		return this.f("lt", c, v);
	}
	lte(c, v) {
		return this.f("lte", c, v);
	}
	ilike(c, v) {
		return this.f("ilike", c, v);
	}
	like(c, v) {
		return this.f("ilike", c, v);
	}
	in(c, v) {
		return this.f("in", c, v);
	}
	is(c, v) {
		return this.f("is", c, v);
	}
	or(expr) {
		this.q["filters"].push({
			op: "or",
			val: expr
		});
		return this;
	}
	order(col, opts) {
		(this.q["order"] ??= []).push({
			col,
			asc: opts?.ascending !== false
		});
		return this;
	}
	limit(n) {
		this.q["limit"] = n;
		return this;
	}
	range(from, to) {
		this.q["offset"] = from;
		this.q["limit"] = to - from + 1;
		return this;
	}
	single() {
		this.q["single"] = true;
		return this;
	}
	maybeSingle() {
		this.q["maybe"] = true;
		return this;
	}
	async run() {
		try {
			const r = await api(`/rest/${this.table}`, this.q);
			return {
				data: r.data ?? null,
				count: r.count ?? null,
				error: null
			};
		} catch (e) {
			return {
				data: null,
				count: null,
				error: { message: e.message }
			};
		}
	}
	then(ok, bad) {
		return this.run().then(ok, bad);
	}
};
var listeners = /* @__PURE__ */ new Set();
function emit(event, s) {
	listeners.forEach((l) => l(event, s));
}
var db = {
	from: (table) => new Query(table),
	rpc: async (fn, args) => {
		try {
			return {
				data: (await api(`/rpc/${fn}`, args)).data,
				error: null
			};
		} catch (e) {
			return {
				data: null,
				error: { message: e.message }
			};
		}
	},
	auth: {
		async signInWithPassword({ email, password }) {
			try {
				const r = await api("/auth/login", {
					email,
					password
				});
				const user = {
					id: r.user.id,
					email: r.user.email
				};
				localStorage.setItem(TOKEN_KEY, r.token);
				localStorage.setItem(USER_KEY, JSON.stringify(user));
				const session = {
					access_token: r.token,
					user
				};
				emit("SIGNED_IN", session);
				return {
					data: {
						session,
						user
					},
					error: null
				};
			} catch (e) {
				return {
					data: {
						session: null,
						user: null
					},
					error: { message: e.message }
				};
			}
		},
		async getSession() {
			return {
				data: { session: readSession() },
				error: null
			};
		},
		async getUser() {
			const s = readSession();
			return s ? {
				data: { user: s.user },
				error: null
			} : {
				data: { user: null },
				error: { message: "Not signed in" }
			};
		},
		onAuthStateChange(cb) {
			listeners.add(cb);
			return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
		},
		async signOut() {
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(USER_KEY);
			emit("SIGNED_OUT", null);
			return { error: null };
		}
	}
};
//#endregion
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var bilal_logo_asset_default = {
	version: 1,
	asset_id: "a0834b97-554f-490f-b842-3d5d7d7110a4",
	project_id: "41c08519-cb0d-4dd3-9301-24c613be83e5",
	url: "/brand/logo.png",
	r2_key: "a/v1/41c08519-cb0d-4dd3-9301-24c613be83e5/a0834b97-554f-490f-b842-3d5d7d7110a4/bilal-logo.png",
	original_filename: "bilal-logo.png",
	size: 30480,
	content_type: "image/png",
	created_at: "2026-10-05T07:58:02Z"
};
//#endregion
export { db as a, api as i, Button as n, cn as r, bilal_logo_asset_default as t };
