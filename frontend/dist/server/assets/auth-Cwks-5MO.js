import { a as db, n as Button, t as bilal_logo_asset_default } from "./bilal-logo.asset-DVM5nCcq.js";
import { t as Input } from "./input-BdVko9wQ.js";
import { t as Label } from "./label-DwaA--ly.js";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { Cog, Eye, EyeOff, Lock, Mail, Wrench } from "lucide-react";
//#region src/routes/auth.tsx?tsr-split=component
function AuthPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [busy, setBusy] = useState(false);
	useEffect(() => {
		db.auth.getSession().then(({ data }) => {
			if (data.session) navigate({ to: "/dashboard" });
		});
	}, [navigate]);
	const submit = async (e) => {
		e.preventDefault();
		setBusy(true);
		try {
			const { error } = await db.auth.signInWithPassword({
				email,
				password
			});
			if (error) throw error;
			const { data } = await db.auth.getSession();
			if (data.session) navigate({ to: "/dashboard" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "auth-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "auth-grid",
				"aria-hidden": true
			}),
			/* @__PURE__ */ jsx("div", {
				className: "auth-road",
				"aria-hidden": true,
				children: /* @__PURE__ */ jsx("div", { className: "auth-road-lines" })
			}),
			/* @__PURE__ */ jsx("div", {
				className: "auth-glow auth-glow-a",
				"aria-hidden": true
			}),
			/* @__PURE__ */ jsx("div", {
				className: "auth-glow auth-glow-b",
				"aria-hidden": true
			}),
			/* @__PURE__ */ jsx(Cog, {
				"aria-hidden": true,
				className: "auth-gear left-[8%] top-[14%] size-24 [animation-duration:14s]"
			}),
			/* @__PURE__ */ jsx(Cog, {
				"aria-hidden": true,
				className: "auth-gear right-[10%] top-[20%] size-16 [animation-duration:10s] [animation-direction:reverse]"
			}),
			/* @__PURE__ */ jsx(Cog, {
				"aria-hidden": true,
				className: "auth-gear bottom-[16%] left-[14%] size-14 [animation-duration:18s] [animation-direction:reverse]"
			}),
			/* @__PURE__ */ jsx(Wrench, {
				"aria-hidden": true,
				className: "auth-gear bottom-[22%] right-[12%] size-12 [animation-duration:22s]"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative z-10 w-full max-w-md animate-fade-in",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-8 text-center",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl stat-orange shadow-lg shadow-primary/30",
							children: /* @__PURE__ */ jsx("img", {
								src: bilal_logo_asset_default.url,
								alt: "Bilal Autos",
								className: "h-full w-full rounded-xl bg-white object-contain"
							})
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "text-2xl font-semibold text-white",
							children: "Bilal Autos"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-white/60",
							children: "Spare parts inventory, quotations, approvals & invoicing"
						})
					]
				}), /* @__PURE__ */ jsxs("form", {
					onSubmit: submit,
					className: "space-y-4 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "email",
							className: "text-white/80",
							children: "Email"
						}), /* @__PURE__ */ jsxs("div", {
							className: "relative mt-1.5",
							children: [/* @__PURE__ */ jsx(Mail, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" }), /* @__PURE__ */ jsx(Input, {
								id: "email",
								type: "email",
								required: true,
								autoComplete: "email",
								placeholder: "you@example.com",
								value: email,
								onChange: (e) => setEmail(e.target.value),
								className: "border-white/15 bg-white/10 pl-9 text-white placeholder:text-white/35 focus-visible:ring-primary"
							})]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "password",
							className: "text-white/80",
							children: "Password"
						}), /* @__PURE__ */ jsxs("div", {
							className: "relative mt-1.5",
							children: [
								/* @__PURE__ */ jsx(Lock, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" }),
								/* @__PURE__ */ jsx(Input, {
									id: "password",
									type: showPassword ? "text" : "password",
									required: true,
									minLength: 6,
									autoComplete: "current-password",
									placeholder: "••••••••",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									className: "border-white/15 bg-white/10 pl-9 pr-10 text-white placeholder:text-white/35 focus-visible:ring-primary"
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => setShowPassword((v) => !v),
									"aria-label": showPassword ? "Hide password" : "Show password",
									className: "absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white",
									children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "size-4" }) : /* @__PURE__ */ jsx(Eye, { className: "size-4" })
								})
							]
						})] }),
						/* @__PURE__ */ jsx(Button, {
							type: "submit",
							className: "w-full",
							disabled: busy,
							children: busy ? "Signing in..." : "Sign in"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-center text-xs text-white/40",
							children: "Access is managed by the system administrator."
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { AuthPage as component };
