import { r as cn } from "./bilal-logo.asset-DRcrRZxD.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/ui/skeleton.tsx
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
//#endregion
export { Skeleton as t };
